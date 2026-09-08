import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    solicitud: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    especialidad: {
      findMany: vi.fn(),
    },
    localidad: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/supabase/admin", () => {
  const storageFrom = {
    createSignedUploadUrl: vi.fn(),
    createSignedUrls: vi.fn(),
    list: vi.fn(),
    remove: vi.fn(),
  };
  return {
    supabaseAdmin: {
      storage: {
        from: vi.fn(() => storageFrom),
      },
    },
  };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockSend = vi.fn();

vi.mock("@/lib/resend", () => ({
  getResend: vi.fn(() => ({ emails: { send: mockSend } })),
  canSendEmails: vi.fn(() => false),
  FROM_EMAIL: "noreply@test.com",
  INSTITUTIONAL_EMAIL: "institucional@test.com",
}));

import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { canSendEmails } from "@/lib/resend";
import {
  crearSolicitud,
  cancelarSubidaSolicitud,
  prepararSubidaSolicitud,
  verificarDuplicados,
} from "./actions";
import {
  ARCHIVOS_REQUERIDOS,
  MAX_FILE_SIZE,
  construirPathArchivo,
  manifiestoArchivoSchema,
  prepararSubidaSchema,
} from "@/lib/validations/solicitud";
import { SIGNED_URL_TTL_SEGUNDOS, SIGNED_URL_TTL_EMAIL_SEGUNDOS } from "@/lib/storage/solicitudes";

const mockSolicitudFindFirst = vi.mocked(prisma.solicitud.findFirst);
const mockSolicitudCreate = vi.mocked(prisma.solicitud.create);
const mockEspecialidadFindMany = vi.mocked(prisma.especialidad.findMany);
const mockLocalidadFindUnique = vi.mocked(prisma.localidad.findUnique);
const mockCanSendEmails = vi.mocked(canSendEmails);

const storageFromResult = supabaseAdmin.storage.from("solicitudes");
const mockCreateSignedUploadUrl = vi.mocked(storageFromResult.createSignedUploadUrl);
const mockCreateSignedUrls = vi.mocked(storageFromResult.createSignedUrls);
const mockList = vi.mocked(storageFromResult.list);
const mockRemove = vi.mocked(storageFromResult.remove);

beforeEach(() => {
  vi.clearAllMocks();
  mockLocalidadFindUnique.mockResolvedValue(null);
  mockCreateSignedUrls.mockResolvedValue({ data: [], error: null });
  mockCanSendEmails.mockReturnValue(false);
});

const campoTextoBase = {
  nombre: "Ana",
  apellido: "García",
  email: "ana@example.com",
  matricula: "5678",
  dni: "12345678",
  telefono: "2614000000",
};

function manifiestoValido() {
  return ARCHIVOS_REQUERIDOS.map((key) => ({
    key,
    nombre: `${key}.pdf`,
    tamano: 1000,
    tipo: "application/pdf" as const,
  }));
}

// ---------------------------------------------------------------------------
// Validación de manifiesto (Zod)
// ---------------------------------------------------------------------------

describe("manifiestoArchivoSchema — validación de tamaño", () => {
  it("rechaza un archivo que supera MAX_FILE_SIZE", () => {
    const resultado = manifiestoArchivoSchema.safeParse({
      key: "dni",
      nombre: "foto.jpg",
      tamano: MAX_FILE_SIZE + 1,
      tipo: "image/jpeg",
    });
    expect(resultado.success).toBe(false);
  });

  it("acepta un archivo justo en el límite de MAX_FILE_SIZE (triangulación)", () => {
    const resultado = manifiestoArchivoSchema.safeParse({
      key: "dni",
      nombre: "foto.jpg",
      tamano: MAX_FILE_SIZE,
      tipo: "image/jpeg",
    });
    expect(resultado.success).toBe(true);
  });
});

describe("manifiestoArchivoSchema — validación de MIME", () => {
  it("rechaza un tipo MIME no permitido", () => {
    const resultado = manifiestoArchivoSchema.safeParse({
      key: "dni",
      nombre: "archivo.zip",
      tamano: 1000,
      tipo: "application/zip",
    });
    expect(resultado.success).toBe(false);
  });

  it("acepta un tipo MIME permitido (triangulación)", () => {
    const resultado = manifiestoArchivoSchema.safeParse({
      key: "dni",
      nombre: "archivo.pdf",
      tamano: 1000,
      tipo: "application/pdf",
    });
    expect(resultado.success).toBe(true);
  });
});

describe("prepararSubidaSchema — documentos obligatorios", () => {
  it("rechaza si falta un documento obligatorio (cv)", () => {
    const manifiesto = manifiestoValido().filter((item) => item.key !== "cv");
    const resultado = prepararSubidaSchema.safeParse({ ...campoTextoBase, manifiesto });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues.some((issue) => issue.message.includes("cv"))).toBe(true);
    }
  });

  it("acepta cuando están los 6 documentos obligatorios (triangulación)", () => {
    const resultado = prepararSubidaSchema.safeParse({ ...campoTextoBase, manifiesto: manifiestoValido() });
    expect(resultado.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// construirPathArchivo — construcción y saneo de path
// ---------------------------------------------------------------------------

describe("construirPathArchivo", () => {
  it("construye el path con la forma ${matricula}-${key}-${timestamp}.${ext}", () => {
    const path = construirPathArchivo("5678", "dni", "foto.jpg");
    expect(path).toMatch(/^5678-dni-\d+\.jpg$/);
  });

  it("respeta una extensión distinta en mayúsculas normalizándola a minúsculas (triangulación)", () => {
    const path = construirPathArchivo("5678", "titulo", "escaneo.PDF");
    expect(path).toMatch(/^5678-titulo-\d+\.pdf$/);
  });

  it("rechaza una extensión desconocida", () => {
    expect(() => construirPathArchivo("5678", "dni", "virus.exe")).toThrow();
  });

  it("no deja que un nombre de archivo malicioso inyecte path traversal en el resultado", () => {
    const path = construirPathArchivo("5678", "dni", "../../etc/passwd.png");
    // La extensión sobrevive (png es válida), pero el path resultante nunca
    // contiene el nombre original: no hay "/" ni ".." en el resultado.
    expect(path).toMatch(/^5678-dni-\d+\.png$/);
    expect(path).not.toContain("/");
    expect(path).not.toContain("..");
  });

  it("rechaza un intento de path traversal en la matrícula", () => {
    expect(() => construirPathArchivo("../../etc", "dni", "foto.jpg")).toThrow();
  });

  it("rechaza un intento de path traversal en la key del documento", () => {
    expect(() => construirPathArchivo("5678", "../etc", "foto.jpg")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// verificarDuplicados / prepararSubidaSolicitud — duplicados sin emitir URLs
// ---------------------------------------------------------------------------

describe("verificarDuplicados", () => {
  it("devuelve un mensaje cuando el email ya existe", async () => {
    mockSolicitudFindFirst.mockImplementation((async ({ where }: any) => {
      if (where.email) return { id: "sol-1" };
      return null;
    }) as any);

    const resultado = await verificarDuplicados({ email: "ana@example.com", matricula: "5678" });
    expect(resultado).toContain("email");
  });

  it("devuelve null cuando no hay duplicados (triangulación)", async () => {
    mockSolicitudFindFirst.mockResolvedValue(null);

    const resultado = await verificarDuplicados({ email: "nueva@example.com", matricula: "9999" });
    expect(resultado).toBeNull();
  });
});

describe("prepararSubidaSolicitud — detección de duplicados sin emisión de URLs", () => {
  it("retorna success:false y no llama a createSignedUploadUrl si el email ya existe", async () => {
    mockSolicitudFindFirst.mockImplementation((async ({ where }: any) => {
      if (where.email) return { id: "sol-1" };
      return null;
    }) as any);

    const resultado = await prepararSubidaSolicitud({ ...campoTextoBase, manifiesto: manifiestoValido() });

    expect(resultado.success).toBe(false);
    expect(mockCreateSignedUploadUrl).not.toHaveBeenCalled();
  });

  it("retorna success:false y no llama a createSignedUploadUrl si la matrícula ya existe (triangulación)", async () => {
    mockSolicitudFindFirst.mockImplementation((async ({ where }: any) => {
      if (where.matricula) return { id: "sol-1" };
      return null;
    }) as any);

    const resultado = await prepararSubidaSolicitud({ ...campoTextoBase, manifiesto: manifiestoValido() });

    expect(resultado.success).toBe(false);
    expect(mockCreateSignedUploadUrl).not.toHaveBeenCalled();
  });

  it("emite una signed upload URL por documento cuando no hay duplicados ni errores de validación", async () => {
    mockSolicitudFindFirst.mockResolvedValue(null);
    mockCreateSignedUploadUrl.mockImplementation(async (path: string) => ({
      data: { path, token: `token-${path}`, signedUrl: `https://x/${path}` },
      error: null,
    }));

    const resultado = await prepararSubidaSolicitud({ ...campoTextoBase, manifiesto: manifiestoValido() });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.uploads).toHaveLength(ARCHIVOS_REQUERIDOS.length);
      expect(mockCreateSignedUploadUrl).toHaveBeenCalledTimes(ARCHIVOS_REQUERIDOS.length);
    }
  });

  it("retorna success:false sin lanzar cuando falla la validación del manifiesto", async () => {
    const manifiestoIncompleto = manifiestoValido().filter((item) => item.key !== "cv");

    const resultado = await prepararSubidaSolicitud({ ...campoTextoBase, manifiesto: manifiestoIncompleto });

    expect(resultado.success).toBe(false);
    expect(mockCreateSignedUploadUrl).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// crearSolicitud
// ---------------------------------------------------------------------------

const crearSolicitudInputBase = {
  ...campoTextoBase,
  direccion: "Calle 1",
  localidadId: "loc-1",
  especialidades: ["esp-1", "esp-2"],
  archivos: Object.fromEntries(
    ARCHIVOS_REQUERIDOS.map((key) => [key, `${campoTextoBase.matricula}-${key}-1234567890.pdf`])
  ),
};

describe("crearSolicitud", () => {
  it("persiste datos.archivos con la misma forma (Record<key, path>) recibida del cliente", async () => {
    mockSolicitudFindFirst.mockResolvedValue(null);
    mockList.mockResolvedValue({
      data: Object.values(crearSolicitudInputBase.archivos).map((name) => ({ name })),
      error: null,
    } as any);
    mockEspecialidadFindMany.mockResolvedValue([{ nombre: "NEURO" }] as any);
    mockSolicitudCreate.mockResolvedValue({ id: "sol-1" } as any);

    const resultado = await crearSolicitud(crearSolicitudInputBase);

    expect(resultado).toEqual({ success: true });
    expect(mockSolicitudCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          datos: expect.objectContaining({ archivos: crearSolicitudInputBase.archivos }),
        }),
      })
    );
  });

  it("rechaza sin crear la Solicitud si un path declarado no respeta el prefijo esperado (path falsificado)", async () => {
    mockSolicitudFindFirst.mockResolvedValue(null);

    const archivosFalsificados = {
      ...crearSolicitudInputBase.archivos,
      dni: "otra-matricula-dni-999.pdf",
    };

    const resultado = await crearSolicitud({ ...crearSolicitudInputBase, archivos: archivosFalsificados });

    expect(resultado.success).toBe(false);
    expect(mockSolicitudCreate).not.toHaveBeenCalled();
  });

  it("rechaza sin crear la Solicitud si el path declarado no existe en Storage", async () => {
    mockSolicitudFindFirst.mockResolvedValue(null);
    mockList.mockResolvedValue({ data: [], error: null });

    const resultado = await crearSolicitud(crearSolicitudInputBase);

    expect(resultado.success).toBe(false);
    expect(mockSolicitudCreate).not.toHaveBeenCalled();
  });

  it("re-chequea duplicados y rechaza si hay carrera con otra solicitud (protección de carrera)", async () => {
    mockSolicitudFindFirst.mockImplementation((async ({ where }: any) => {
      if (where.matricula) return { id: "sol-carrera" };
      return null;
    }) as any);

    const resultado = await crearSolicitud(crearSolicitudInputBase);

    expect(resultado.success).toBe(false);
    expect(mockSolicitudCreate).not.toHaveBeenCalled();
  });

  it("rechaza si falta un documento obligatorio en el mapa de archivos", async () => {
    mockSolicitudFindFirst.mockResolvedValue(null);
    const { cv, ...archivosSinCv } = crearSolicitudInputBase.archivos;
    void cv;

    const resultado = await crearSolicitud({ ...crearSolicitudInputBase, archivos: archivosSinCv });

    expect(resultado.success).toBe(false);
    expect(mockSolicitudCreate).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// cancelarSubidaSolicitud — limpieza best-effort, nunca lanza
// ---------------------------------------------------------------------------

describe("cancelarSubidaSolicitud", () => {
  it("no lanza cuando Storage.remove falla", async () => {
    mockRemove.mockRejectedValue(new Error("network down"));

    await expect(cancelarSubidaSolicitud(["5678-dni-123.pdf"])).resolves.toBeUndefined();
  });

  it("no llama a Storage.remove si la lista de paths está vacía (triangulación)", async () => {
    await cancelarSubidaSolicitud([]);
    expect(mockRemove).not.toHaveBeenCalled();
  });
});

describe("crearSolicitud — especialidades múltiples", () => {
  function prepararStorageOk() {
    mockSolicitudFindFirst.mockResolvedValue(null);
    mockList.mockResolvedValue({
      data: Object.values(crearSolicitudInputBase.archivos).map((name) => ({ name })),
      error: null,
    } as any);
    mockEspecialidadFindMany.mockResolvedValue([{ nombre: "NEURO" }, { nombre: "TRAUMATO" }] as any);
    mockSolicitudCreate.mockResolvedValue({ id: "sol-1" } as any);
  }

  it("persiste todas las especialidades elegidas como array de IDs", async () => {
    prepararStorageOk();

    const resultado = await crearSolicitud(crearSolicitudInputBase);

    expect(resultado).toEqual({ success: true });
    expect(mockSolicitudCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          datos: expect.objectContaining({ especialidades: ["esp-1", "esp-2"] }),
        }),
      })
    );
  });

  it("acepta una sola especialidad (el caso más común sigue funcionando)", async () => {
    prepararStorageOk();

    const resultado = await crearSolicitud({ ...crearSolicitudInputBase, especialidades: ["esp-1"] });

    expect(resultado).toEqual({ success: true });
    expect(mockSolicitudCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          datos: expect.objectContaining({ especialidades: ["esp-1"] }),
        }),
      })
    );
  });

  it("rechaza la solicitud si no se eligió ninguna especialidad", async () => {
    prepararStorageOk();

    const resultado = await crearSolicitud({ ...crearSolicitudInputBase, especialidades: [] });

    expect(resultado.success).toBe(false);
    expect(mockSolicitudCreate).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// crearSolicitud — aviso institucional (mail completo, enlaces firmados, WhatsApp)
// ---------------------------------------------------------------------------

describe("crearSolicitud — aviso institucional", () => {
  function prepararStorageOk() {
    mockSolicitudFindFirst.mockResolvedValue(null);
    mockList.mockResolvedValue({
      data: Object.values(crearSolicitudInputBase.archivos).map((name) => ({ name })),
      error: null,
    } as any);
    mockEspecialidadFindMany.mockResolvedValue([{ nombre: "NEURO" }] as any);
    mockLocalidadFindUnique.mockResolvedValue({ nombre: "Godoy Cruz" } as any);
    mockSolicitudCreate.mockResolvedValue({ id: "sol-1" } as any);
    mockCreateSignedUrls.mockResolvedValue({
      data: Object.values(crearSolicitudInputBase.archivos).map((path) => ({
        path,
        signedUrl: `https://storage/firmada-${path}`,
        error: null,
      })),
      error: null,
    } as any);
  }

  it("con canSendEmails() en true, envía dos mails y el primero va a INSTITUTIONAL_EMAIL con matrícula, DNI, teléfono, dirección y localidad", async () => {
    prepararStorageOk();
    mockCanSendEmails.mockReturnValue(true);

    const resultado = await crearSolicitud(crearSolicitudInputBase);

    expect(resultado).toEqual({ success: true });
    expect(mockSend).toHaveBeenCalledTimes(2);

    const primerEnvio = mockSend.mock.calls[0][0];
    expect(primerEnvio.to).toEqual(["institucional@test.com"]);
    expect(primerEnvio.html).toContain(crearSolicitudInputBase.matricula);
    expect(primerEnvio.html).toContain(crearSolicitudInputBase.dni);
    expect(primerEnvio.html).toContain(crearSolicitudInputBase.telefono);
    expect(primerEnvio.html).toContain(crearSolicitudInputBase.direccion);
    expect(primerEnvio.html).toContain("Godoy Cruz");
  });

  it("el HTML institucional contiene el href de wa.me con el número correcto", async () => {
    prepararStorageOk();
    mockCanSendEmails.mockReturnValue(true);

    await crearSolicitud(crearSolicitudInputBase);

    const primerEnvio = mockSend.mock.calls[0][0];
    expect(primerEnvio.html).toContain("https://wa.me/5492616937588?text=");
  });

  it("firmarUrlsDocumentos se invoca con la vigencia de mail (604800), no con la de 1 hora", async () => {
    prepararStorageOk();
    mockCanSendEmails.mockReturnValue(true);

    await crearSolicitud(crearSolicitudInputBase);

    expect(SIGNED_URL_TTL_EMAIL_SEGUNDOS).toBe(604800);
    expect(mockCreateSignedUrls).toHaveBeenCalledWith(
      expect.any(Array),
      SIGNED_URL_TTL_EMAIL_SEGUNDOS
    );
    expect(mockCreateSignedUrls).not.toHaveBeenCalledWith(expect.any(Array), SIGNED_URL_TTL_SEGUNDOS);
  });

  it("si createSignedUrls falla, crearSolicitud igual devuelve { success: true } y el mail al solicitante se manda igual", async () => {
    prepararStorageOk();
    mockCanSendEmails.mockReturnValue(true);
    mockCreateSignedUrls.mockResolvedValue({ data: null, error: { message: "boom" } } as any);

    const resultado = await crearSolicitud(crearSolicitudInputBase);

    expect(resultado).toEqual({ success: true });
    expect(mockSend).toHaveBeenCalledTimes(2);
    const segundoEnvio = mockSend.mock.calls[1][0];
    expect(segundoEnvio.to).toEqual([crearSolicitudInputBase.email]);
  });

  it("si prisma.localidad.findUnique rechaza, el mail se manda con la localidad como no especificada y la solicitud se crea igual", async () => {
    prepararStorageOk();
    mockCanSendEmails.mockReturnValue(true);
    mockLocalidadFindUnique.mockRejectedValue(new Error("boom"));

    const resultado = await crearSolicitud(crearSolicitudInputBase);

    expect(resultado).toEqual({ success: true });
    const primerEnvio = mockSend.mock.calls[0][0];
    expect(primerEnvio.html).toContain("No especificada");
  });

  it("con canSendEmails() en false no se envía ningún mail y la solicitud se crea igual (regresión)", async () => {
    prepararStorageOk();
    mockCanSendEmails.mockReturnValue(false);

    const resultado = await crearSolicitud(crearSolicitudInputBase);

    expect(resultado).toEqual({ success: true });
    expect(mockSend).not.toHaveBeenCalled();
  });
});
