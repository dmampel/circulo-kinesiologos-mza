import { describe, it, expect } from "vitest";
import { limpiarTelefonos, MAX_TELEFONOS_ADICIONALES } from "./telefonos";

describe("limpiarTelefonos", () => {
  it("recorta espacios y descarta vacíos", () => {
    expect(limpiarTelefonos([" 261 4000000 ", "", "   "])).toEqual(["261 4000000"]);
  });

  it("elimina duplicados conservando el orden", () => {
    expect(limpiarTelefonos(["261 1", "261 2", "261 1"])).toEqual(["261 1", "261 2"]);
  });

  it("ignora lo que no es string y entradas no-array", () => {
    expect(limpiarTelefonos([1, null, "261 3"])).toEqual(["261 3"]);
    expect(limpiarTelefonos(undefined)).toEqual([]);
  });

  it("limita la cantidad y el largo", () => {
    const muchos = Array.from({ length: 10 }, (_, i) => `261 ${i}`);
    expect(limpiarTelefonos(muchos)).toHaveLength(MAX_TELEFONOS_ADICIONALES);
    expect(limpiarTelefonos(["1".repeat(50)])[0]).toHaveLength(30);
  });
});
