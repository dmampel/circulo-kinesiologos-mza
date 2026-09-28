import { describe, it, expect, vi, beforeEach } from "vitest";
import { AvisoRepository } from "./AvisoRepository";

vi.mock("@/lib/prisma", () => ({
  default: {
    $queryRaw: vi.fn(),
    avisoBuscoTrabajo: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    avisoBuscoKinesiologo: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const mockQueryRaw = vi.mocked(prisma.$queryRaw);
const mockTrabajoFindFirst = vi.mocked(prisma.avisoBuscoTrabajo.findFirst);
const mockTrabajoCreate = vi.mocked(prisma.avisoBuscoTrabajo.create);
const mockKineFindFirst = vi.mocked(prisma.avisoBuscoKinesiologo.findFirst);
const mockKineCreate = vi.mocked(prisma.avisoBuscoKinesiologo.create);

beforeEach(() => {
  vi.clearAllMocks();
  mockQueryRaw.mockResolvedValue([]);
});

/** Texto SQL de la última llamada a $queryRaw (Prisma.Sql expone `.text`/`.sql`). */
function sqlDeLaUltimaLlamada(): string {
  const arg = mockQueryRaw.mock.calls.at(-1)?.[0] as unknown as Prisma.Sql;
  return arg.sql;
}

// -----------------------------------------------------------------------------
// La red: la query raw pública NUNCA puede tocar una columna de contacto.
// Si esto falla, un teléfono o un email se está sirviendo en el HTML (design.md — D2).
// -----------------------------------------------------------------------------

const COLUMNAS_DE_CONTACTO = ["telefono", "email", "cvPath", "medioContacto"];

describe("AvisoRepository — la query pública no toca columnas de contacto", () => {
  it("findBuscoTrabajoPublicados no menciona telefono, email ni cvPath en el SQL", async () => {
    await AvisoRepository.findBuscoTrabajoPublicados({}, 1, 12);

    const sql = sqlDeLaUltimaLlamada();
    for (const columna of COLUMNAS_DE_CONTACTO) {
      expect(sql).not.toContain(columna);
    }
  });

  it("findBuscoKinesiologoPublicados no menciona medioContacto en el SQL", async () => {
    await AvisoRepository.findBuscoKinesiologoPublicados({}, 1, 12);

    const sql = sqlDeLaUltimaLlamada();
    for (const columna of COLUMNAS_DE_CONTACTO) {
      expect(sql).not.toContain(columna);
    }
  });

  it("ambos listados siempre filtran por estado PUBLICADO", async () => {
    await AvisoRepository.findBuscoTrabajoPublicados({}, 1, 12);
    expect(sqlDeLaUltimaLlamada()).toContain("PUBLICADO");

    await AvisoRepository.findBuscoKinesiologoPublicados({}, 1, 12);
    expect(sqlDeLaUltimaLlamada()).toContain("PUBLICADO");
  });
});

describe("AvisoRepository.findBuscoKinesiologoPublicados — vencimiento (design.md — D7)", () => {
  it("filtra con fechaLimite null o >= hoy, sin cron", async () => {
    await AvisoRepository.findBuscoKinesiologoPublicados({}, 1, 12);

    const sql = sqlDeLaUltimaLlamada();
    expect(sql).toContain('"fechaLimite" IS NULL');
    expect(sql).toContain('"fechaLimite" >=');
  });

  it("aplica el filtro de localidad y tipoPuesto cuando vienen en los filtros", async () => {
    await AvisoRepository.findBuscoKinesiologoPublicados({ localidadId: "loc-1", tipoPuesto: "planta" }, 1, 12);

    const sql = sqlDeLaUltimaLlamada();
    expect(sql).toContain('"localidadId"');
    expect(sql).toContain('"tipoPuesto" ILIKE');
  });
});

describe("AvisoRepository — filtros del listado de kinesiólogos", () => {
  it("findBuscoTrabajoPublicados filtra por localidad y especialidad", async () => {
    await AvisoRepository.findBuscoTrabajoPublicados({ localidadId: "loc-1", especialidadId: "esp-1" }, 1, 12);

    const sql = sqlDeLaUltimaLlamada();
    expect(sql).toContain('"localidadId"');
    expect(sql).toContain('"especialidadId"');
  });

  it("pagina con LIMIT/OFFSET según page y pageSize", async () => {
    await AvisoRepository.findBuscoTrabajoPublicados({}, 3, 10);

    const arg = mockQueryRaw.mock.calls[0]![0] as unknown as Prisma.Sql;
    expect(arg.values).toContain(10); // pageSize -> LIMIT
    expect(arg.values).toContain(20); // (page - 1) * pageSize -> OFFSET
  });

  it("total sale de la fila de COUNT(*) OVER(), 0 si no hay filas", async () => {
    mockQueryRaw.mockResolvedValueOnce([
      { id: "a1", totalCount: 7 } as never,
      { id: "a2", totalCount: 7 } as never,
    ]);
    const conResultados = await AvisoRepository.findBuscoTrabajoPublicados({}, 1, 12);
    expect(conResultados.total).toBe(7);

    mockQueryRaw.mockResolvedValueOnce([]);
    const sinResultados = await AvisoRepository.findBuscoTrabajoPublicados({}, 1, 12);
    expect(sinResultados.total).toBe(0);
  });
});

// -----------------------------------------------------------------------------
// Contacto: sólo se revela de avisos PUBLICADO (design.md — D3)
// -----------------------------------------------------------------------------

describe("AvisoRepository.findContactoBuscoTrabajo", () => {
  it("devuelve null si el aviso no está PUBLICADO (no filtra datos ni conociendo el id)", async () => {
    mockTrabajoFindFirst.mockResolvedValue(null);

    const resultado = await AvisoRepository.findContactoBuscoTrabajo("aviso-pendiente");

    expect(resultado).toBeNull();
    expect(mockTrabajoFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "aviso-pendiente", estado: "PUBLICADO" } }),
    );
  });

  it("devuelve el contacto cuando el aviso está PUBLICADO", async () => {
    mockTrabajoFindFirst.mockResolvedValue({
      telefono: "2610000000",
      email: "ana@example.com",
      cvPath: "cv123.pdf",
    } as any);

    const resultado = await AvisoRepository.findContactoBuscoTrabajo("aviso-publicado");

    expect(resultado).toEqual({ telefono: "2610000000", email: "ana@example.com", cvPath: "cv123.pdf" });
  });
});

describe("AvisoRepository.findContactoBuscoKinesiologo", () => {
  it("devuelve null si el aviso no está PUBLICADO", async () => {
    mockKineFindFirst.mockResolvedValue(null);

    const resultado = await AvisoRepository.findContactoBuscoKinesiologo("aviso-rechazado");

    expect(resultado).toBeNull();
    expect(mockKineFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "aviso-rechazado", estado: "PUBLICADO" } }),
    );
  });

  it("devuelve el medio de contacto cuando el aviso está PUBLICADO", async () => {
    mockKineFindFirst.mockResolvedValue({ medioContacto: "consultorio@example.com" } as any);

    const resultado = await AvisoRepository.findContactoBuscoKinesiologo("aviso-publicado");

    expect(resultado).toEqual({ medioContacto: "consultorio@example.com" });
  });
});

// -----------------------------------------------------------------------------
// Alta: arranca en PENDIENTE por default de schema (no se fuerza acá)
// -----------------------------------------------------------------------------

describe("AvisoRepository.crearBuscoTrabajo / crearBuscoKinesiologo", () => {
  it("crea el aviso de kinesiólogo con aceptaDifusion true y devuelve el id", async () => {
    mockTrabajoCreate.mockResolvedValue({ id: "aviso-1" } as any);

    const resultado = await AvisoRepository.crearBuscoTrabajo({
      nombre: "Ana",
      apellido: "García",
      matricula: "5678",
      telefono: "2610000000",
      email: "ana@example.com",
      especialidadId: "esp-1",
      localidadId: "loc-1",
      disponibilidad: "Full time",
      presentacion: "Kinesióloga con experiencia en neuro.",
      aceptadoEn: new Date("2026-01-01"),
    });

    expect(resultado).toEqual({ id: "aviso-1" });
    expect(mockTrabajoCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ aceptaDifusion: true }) }),
    );
  });

  it("crea el aviso de institución con aceptaDifusion true y devuelve el id", async () => {
    mockKineCreate.mockResolvedValue({ id: "aviso-2" } as any);

    const resultado = await AvisoRepository.crearBuscoKinesiologo({
      institucion: "Clínica X",
      localidadId: "loc-1",
      area: "Traumatología",
      tipoPuesto: "Planta",
      diasHorarios: "Lunes a viernes",
      requisitos: "Matrícula vigente",
      modalidad: "Relación de dependencia",
      propuesta: "Buen ambiente",
      medioContacto: "clinica@example.com",
      aceptadoEn: new Date("2026-01-01"),
    });

    expect(resultado).toEqual({ id: "aviso-2" });
    expect(mockKineCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ aceptaDifusion: true }) }),
    );
  });
});
