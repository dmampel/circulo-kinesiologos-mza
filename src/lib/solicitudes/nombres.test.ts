import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    especialidad: {
      findMany: vi.fn(),
    },
    localidad: {
      findUnique: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { resolverNombresSolicitud, SIN_LOCALIDAD } from "./nombres";

const mockEspecialidadFindMany = vi.mocked(prisma.especialidad.findMany);
const mockLocalidadFindUnique = vi.mocked(prisma.localidad.findUnique);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resolverNombresSolicitud", () => {
  it("resuelve localidad y varias especialidades a nombres", async () => {
    mockEspecialidadFindMany.mockResolvedValue([
      { nombre: "NEURO" },
      { nombre: "TRAUMATO" },
    ] as any);
    mockLocalidadFindUnique.mockResolvedValue({ nombre: "Godoy Cruz" } as any);

    const resultado = await resolverNombresSolicitud({
      localidadId: "loc-1",
      especialidades: ["esp-1", "esp-2"],
    });

    expect(resultado).toEqual({ localidad: "Godoy Cruz", especialidades: "NEURO, TRAUMATO" });
  });

  it("formato viejo especialidad: 'id' resuelve igual", async () => {
    mockEspecialidadFindMany.mockResolvedValue([{ nombre: "NEURO" }] as any);
    mockLocalidadFindUnique.mockResolvedValue({ nombre: "Godoy Cruz" } as any);

    const resultado = await resolverNombresSolicitud({
      localidadId: "loc-1",
      especialidad: "esp-1",
    });

    expect(resultado.especialidades).toBe("NEURO");
    expect(mockEspecialidadFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ id: { in: ["esp-1"] } }, { nombre: { in: ["esp-1"] } }] },
      })
    );
  });

  it("especialidades guardadas como nombre resuelven por nombre", async () => {
    mockEspecialidadFindMany.mockResolvedValue([{ nombre: "Kinesiología Deportiva" }] as any);
    mockLocalidadFindUnique.mockResolvedValue({ nombre: "Godoy Cruz" } as any);

    const resultado = await resolverNombresSolicitud({
      localidadId: "loc-1",
      especialidades: ["Kinesiología Deportiva"],
    });

    expect(resultado.especialidades).toBe("Kinesiología Deportiva");
  });

  it("localidad inexistente devuelve SIN_LOCALIDAD y el ID no aparece en el resultado", async () => {
    mockEspecialidadFindMany.mockResolvedValue([] as any);
    mockLocalidadFindUnique.mockResolvedValue(null);

    const resultado = await resolverNombresSolicitud({ localidadId: "loc-inexistente", especialidades: [] });

    expect(resultado.localidad).toBe(SIN_LOCALIDAD);
    expect(resultado.localidad).toBe("No especificada");
    expect(JSON.stringify(resultado)).not.toContain("loc-inexistente");
  });

  it("si Prisma rechaza, devuelve los defaults sin lanzar", async () => {
    mockEspecialidadFindMany.mockRejectedValue(new Error("boom"));
    mockLocalidadFindUnique.mockRejectedValue(new Error("boom"));

    const resultado = await resolverNombresSolicitud({
      localidadId: "loc-1",
      especialidades: ["esp-1"],
    });

    expect(resultado).toEqual({ localidad: SIN_LOCALIDAD, especialidades: "esp-1" });
  });

  it("datos nulo o sin campos no rompe", async () => {
    const resultadoNulo = await resolverNombresSolicitud(null);
    expect(resultadoNulo).toEqual({ localidad: SIN_LOCALIDAD, especialidades: "" });
    expect(mockEspecialidadFindMany).not.toHaveBeenCalled();
    expect(mockLocalidadFindUnique).not.toHaveBeenCalled();

    const resultadoVacio = await resolverNombresSolicitud({});
    expect(resultadoVacio).toEqual({ localidad: SIN_LOCALIDAD, especialidades: "" });
  });
});
