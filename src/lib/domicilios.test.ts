import { describe, it, expect } from "vitest";
import { parseDomiciliosAdicionales } from "./domicilios";

const validas = new Set(["loc-1", "loc-2"]);

describe("parseDomiciliosAdicionales", () => {
  it("devuelve lista vacía con entrada vacía o undefined", () => {
    expect(parseDomiciliosAdicionales(undefined, validas)).toEqual({ ok: true, items: [] });
    expect(parseDomiciliosAdicionales("", validas)).toEqual({ ok: true, items: [] });
  });

  it("parsea, recorta espacios y descarta filas totalmente vacías", () => {
    const raw = JSON.stringify([
      { direccion: "  Av. Colón 123 ", localidadId: "loc-1" },
      { direccion: "", localidadId: "" },
      { direccion: "San Martín 45", localidadId: "loc-2" },
    ]);
    expect(parseDomiciliosAdicionales(raw, validas)).toEqual({
      ok: true,
      items: [
        { direccion: "Av. Colón 123", localidadId: "loc-1" },
        { direccion: "San Martín 45", localidadId: "loc-2" },
      ],
    });
  });

  it("rechaza una localidad que no existe en el catálogo", () => {
    const raw = JSON.stringify([{ direccion: "X 1", localidadId: "inventada" }]);
    expect(parseDomiciliosAdicionales(raw, validas).ok).toBe(false);
  });

  it("rechaza una fila con localidad pero sin dirección", () => {
    const raw = JSON.stringify([{ direccion: " ", localidadId: "loc-1" }]);
    expect(parseDomiciliosAdicionales(raw, validas).ok).toBe(false);
  });

  it("rechaza JSON inválido", () => {
    expect(parseDomiciliosAdicionales("{no", validas).ok).toBe(false);
  });
});
