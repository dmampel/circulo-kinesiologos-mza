import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/repositories/AvisoRepository", () => ({
  AvisoRepository: {
    crearBuscoTrabajo: vi.fn(),
    crearBuscoKinesiologo: vi.fn(),
    findContactoBuscoTrabajo: vi.fn(),
    findContactoBuscoKinesiologo: vi.fn(),
  },
}));

vi.mock("@/lib/supabase/admin", () => {
  const storageFrom = { upload: vi.fn() };
  return { supabaseAdmin: { storage: { from: vi.fn(() => storageFrom) } } };
});

vi.mock("@/lib/storage/bolsaTrabajo", () => ({
  BUCKET_BOLSA_TRABAJO_CV: "bolsa-trabajo-cv",
  firmarCv: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { AvisoRepository } from "@/lib/repositories/AvisoRepository";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { firmarCv } from "@/lib/storage/bolsaTrabajo";
import { crearAvisoBuscoTrabajo, crearAvisoBuscoKinesiologo, revelarContacto } from "./actions";
import { HONEYPOT_FIELD } from "@/lib/validations/bolsaDeTrabajo";

const mockCrearBuscoTrabajo = vi.mocked(AvisoRepository.crearBuscoTrabajo);
const mockCrearBuscoKinesiologo = vi.mocked(AvisoRepository.crearBuscoKinesiologo);
const mockFindContactoBuscoTrabajo = vi.mocked(AvisoRepository.findContactoBuscoTrabajo);
const mockFindContactoBuscoKinesiologo = vi.mocked(AvisoRepository.findContactoBuscoKinesiologo);
const mockFirmarCv = vi.mocked(firmarCv);

const storageFromResult = supabaseAdmin.storage.from("bolsa-trabajo-cv");
const mockUpload = vi.mocked(storageFromResult.upload);

beforeEach(() => {
  vi.clearAllMocks();
  mockCrearBuscoTrabajo.mockResolvedValue({ id: "aviso-1" });
  mockCrearBuscoKinesiologo.mockResolvedValue({ id: "aviso-2" });
  mockUpload.mockResolvedValue({ data: { path: "x" }, error: null } as any);
});

function campoTextoBuscoTrabajo(overrides: Record<string, string> = {}) {
  return {
    nombre: "Ana",
    apellido: "García",
    matricula: "5678",
    telefono: "2610000000",
    email: "ana@example.com",
    especialidadId: "esp-1",
    localidadId: "loc-1",
    disponibilidad: "Full time",
    presentacion: "Kinesióloga con experiencia en neuro.",
    aceptaDifusion: "true",
    ...overrides,
  };
}

function formDataDe(campos: Record<string, string>, archivo?: File) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(campos)) fd.set(key, value);
  if (archivo) fd.set("cv", archivo);
  return fd;
}

// ---------------------------------------------------------------------------
// crearAvisoBuscoTrabajo
// ---------------------------------------------------------------------------

describe("crearAvisoBuscoTrabajo — alta válida", () => {
  it("persiste el aviso y devuelve success:true", async () => {
    const resultado = await crearAvisoBuscoTrabajo(formDataDe(campoTextoBuscoTrabajo()));

    expect(resultado).toEqual({ success: true });
    expect(mockCrearBuscoTrabajo).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: "Ana", email: "ana@example.com", cvPath: null }),
    );
  });

  it("sube el CV con nombre generado (nunca el nombre original) cuando viene adjunto", async () => {
    const archivo = new File(["contenido"], "mi-cv-real.pdf", { type: "application/pdf" });

    const resultado = await crearAvisoBuscoTrabajo(formDataDe(campoTextoBuscoTrabajo(), archivo));

    expect(resultado).toEqual({ success: true });
    expect(mockUpload).toHaveBeenCalledTimes(1);
    const [pathSubido] = mockUpload.mock.calls[0]!;
    expect(pathSubido).not.toContain("mi-cv-real");
    expect(pathSubido).toMatch(/\.pdf$/);
    expect(mockCrearBuscoTrabajo).toHaveBeenCalledWith(expect.objectContaining({ cvPath: pathSubido }));
  });
});

describe("crearAvisoBuscoTrabajo — checkbox de aceptación", () => {
  it("rechaza en el servidor cuando aceptaDifusion no viene (checkbox destildado)", async () => {
    const { aceptaDifusion, ...sinCheckbox } = campoTextoBuscoTrabajo();
    void aceptaDifusion;

    const resultado = await crearAvisoBuscoTrabajo(formDataDe(sinCheckbox));

    expect(resultado.success).toBe(false);
    expect(mockCrearBuscoTrabajo).not.toHaveBeenCalled();
  });

  it("rechaza cuando aceptaDifusion viene en false (triangulación)", async () => {
    const resultado = await crearAvisoBuscoTrabajo(formDataDe(campoTextoBuscoTrabajo({ aceptaDifusion: "false" })));

    expect(resultado.success).toBe(false);
    expect(mockCrearBuscoTrabajo).not.toHaveBeenCalled();
  });
});

describe("crearAvisoBuscoTrabajo — honeypot", () => {
  it("si el campo honeypot viene lleno, responde success:true y no persiste nada", async () => {
    const resultado = await crearAvisoBuscoTrabajo(
      formDataDe(campoTextoBuscoTrabajo({ [HONEYPOT_FIELD]: "soy un bot" })),
    );

    expect(resultado).toEqual({ success: true });
    expect(mockCrearBuscoTrabajo).not.toHaveBeenCalled();
    expect(mockUpload).not.toHaveBeenCalled();
  });
});

describe("crearAvisoBuscoTrabajo — validación del CV", () => {
  it("rechaza un CV que supera el tamaño máximo (5 MB)", async () => {
    const contenidoGrande = new Uint8Array(5 * 1024 * 1024 + 1);
    const archivo = new File([contenidoGrande], "cv.pdf", { type: "application/pdf" });

    const resultado = await crearAvisoBuscoTrabajo(formDataDe(campoTextoBuscoTrabajo(), archivo));

    expect(resultado.success).toBe(false);
    expect(mockCrearBuscoTrabajo).not.toHaveBeenCalled();
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("rechaza un tipo de archivo no permitido (.exe)", async () => {
    const archivo = new File(["MZ..."], "cv.exe", { type: "application/x-msdownload" });

    const resultado = await crearAvisoBuscoTrabajo(formDataDe(campoTextoBuscoTrabajo(), archivo));

    expect(resultado.success).toBe(false);
    expect(mockCrearBuscoTrabajo).not.toHaveBeenCalled();
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("acepta .doc y .docx además de PDF (triangulación)", async () => {
    const archivo = new File(["contenido"], "cv.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const resultado = await crearAvisoBuscoTrabajo(formDataDe(campoTextoBuscoTrabajo(), archivo));

    expect(resultado).toEqual({ success: true });
    expect(mockUpload).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// crearAvisoBuscoKinesiologo
// ---------------------------------------------------------------------------

function campoTextoBuscoKinesiologo(overrides: Record<string, string> = {}) {
  return {
    institucion: "Clínica X",
    localidadId: "loc-1",
    area: "Traumatología",
    tipoPuesto: "Planta",
    diasHorarios: "Lunes a viernes",
    requisitos: "Matrícula vigente",
    modalidad: "Relación de dependencia",
    propuesta: "Buen ambiente de trabajo",
    medioContacto: "clinica@example.com",
    aceptaDifusion: "true",
    ...overrides,
  };
}

describe("crearAvisoBuscoKinesiologo", () => {
  it("persiste el aviso y devuelve success:true", async () => {
    const resultado = await crearAvisoBuscoKinesiologo(formDataDe(campoTextoBuscoKinesiologo()));

    expect(resultado).toEqual({ success: true });
    expect(mockCrearBuscoKinesiologo).toHaveBeenCalledWith(
      expect.objectContaining({ institucion: "Clínica X", fechaLimite: null }),
    );
  });

  it("rechaza sin el checkbox de consentimiento (simetría con el formulario de kinesiólogos)", async () => {
    const { aceptaDifusion, ...sinCheckbox } = campoTextoBuscoKinesiologo();
    void aceptaDifusion;

    const resultado = await crearAvisoBuscoKinesiologo(formDataDe(sinCheckbox));

    expect(resultado.success).toBe(false);
    expect(mockCrearBuscoKinesiologo).not.toHaveBeenCalled();
  });

  it("honeypot lleno responde success:true sin persistir", async () => {
    const resultado = await crearAvisoBuscoKinesiologo(
      formDataDe(campoTextoBuscoKinesiologo({ [HONEYPOT_FIELD]: "relleno de bot" })),
    );

    expect(resultado).toEqual({ success: true });
    expect(mockCrearBuscoKinesiologo).not.toHaveBeenCalled();
  });

  it("convierte fechaLimite a Date cuando viene informada", async () => {
    const resultado = await crearAvisoBuscoKinesiologo(
      formDataDe(campoTextoBuscoKinesiologo({ fechaLimite: "2026-12-31" })),
    );

    expect(resultado).toEqual({ success: true });
    expect(mockCrearBuscoKinesiologo).toHaveBeenCalledWith(
      expect.objectContaining({ fechaLimite: new Date("2026-12-31") }),
    );
  });
});

// ---------------------------------------------------------------------------
// revelarContacto
// ---------------------------------------------------------------------------

describe("revelarContacto — busco-trabajo", () => {
  it("devuelve el contacto con la URL firmada del CV cuando el aviso está PUBLICADO", async () => {
    mockFindContactoBuscoTrabajo.mockResolvedValue({
      telefono: "2610000000",
      email: "ana@example.com",
      cvPath: "cv-1.pdf",
    });
    mockFirmarCv.mockResolvedValue("https://storage/firmada-cv-1.pdf");

    const resultado = await revelarContacto("busco-trabajo", "aviso-1");

    expect(resultado).toEqual({
      success: true,
      contacto: {
        tipo: "busco-trabajo",
        telefono: "2610000000",
        email: "ana@example.com",
        cvUrl: "https://storage/firmada-cv-1.pdf",
      },
    });
  });

  it("no revela contacto de un aviso no publicado ni conociendo su id (repositorio devuelve null)", async () => {
    mockFindContactoBuscoTrabajo.mockResolvedValue(null);

    const resultado = await revelarContacto("busco-trabajo", "aviso-pendiente");

    expect(resultado.success).toBe(false);
    expect(mockFirmarCv).not.toHaveBeenCalled();
  });

  it("si la firma del CV falla (firmarCv devuelve null), revela igual el resto del contacto", async () => {
    mockFindContactoBuscoTrabajo.mockResolvedValue({
      telefono: "2610000000",
      email: "ana@example.com",
      cvPath: "cv-1.pdf",
    });
    mockFirmarCv.mockResolvedValue(null);

    const resultado = await revelarContacto("busco-trabajo", "aviso-1");

    expect(resultado).toEqual({
      success: true,
      contacto: { tipo: "busco-trabajo", telefono: "2610000000", email: "ana@example.com", cvUrl: null },
    });
  });

  it("no revela nada si el aviso no tiene CV (cvPath null) — no llama a firmarCv", async () => {
    mockFindContactoBuscoTrabajo.mockResolvedValue({ telefono: "2610000000", email: "ana@example.com", cvPath: null });

    const resultado = await revelarContacto("busco-trabajo", "aviso-1");

    expect(mockFirmarCv).not.toHaveBeenCalled();
    expect(resultado).toEqual({
      success: true,
      contacto: { tipo: "busco-trabajo", telefono: "2610000000", email: "ana@example.com", cvUrl: null },
    });
  });
});

describe("revelarContacto — busco-kinesiologo", () => {
  it("devuelve el medio de contacto cuando el aviso está PUBLICADO", async () => {
    mockFindContactoBuscoKinesiologo.mockResolvedValue({ medioContacto: "clinica@example.com" });

    const resultado = await revelarContacto("busco-kinesiologo", "aviso-2");

    expect(resultado).toEqual({
      success: true,
      contacto: { tipo: "busco-kinesiologo", medioContacto: "clinica@example.com" },
    });
  });

  it("no revela contacto de un aviso no publicado", async () => {
    mockFindContactoBuscoKinesiologo.mockResolvedValue(null);

    const resultado = await revelarContacto("busco-kinesiologo", "aviso-pendiente");

    expect(resultado.success).toBe(false);
  });
});
