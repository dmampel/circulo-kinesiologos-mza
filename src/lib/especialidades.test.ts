import { describe, it, expect } from "vitest";
import { normalizarEspecialidadesSolicitud, esIdGenerado } from "./especialidades";

describe("normalizarEspecialidadesSolicitud", () => {
  it("devuelve el array `especialidades` cuando la solicitud usa el formato nuevo", () => {
    expect(normalizarEspecialidadesSolicitud({ especialidades: ["esp-1", "esp-2"] })).toEqual([
      "esp-1",
      "esp-2",
    ]);
  });

  it("cae al campo legacy `especialidad` (string único) de las solicitudes viejas", () => {
    expect(normalizarEspecialidadesSolicitud({ especialidad: "esp-1" })).toEqual(["esp-1"]);
  });

  it("prioriza el formato nuevo cuando conviven los dos campos", () => {
    expect(
      normalizarEspecialidadesSolicitud({ especialidades: ["esp-2"], especialidad: "esp-1" })
    ).toEqual(["esp-2"]);
  });

  it("descarta duplicados, vacíos y valores no string", () => {
    expect(
      normalizarEspecialidadesSolicitud({ especialidades: ["esp-1", "esp-1", "", "  ", 42, null] })
    ).toEqual(["esp-1"]);
  });

  it("devuelve [] cuando no hay ninguno de los dos campos", () => {
    expect(normalizarEspecialidadesSolicitud({})).toEqual([]);
    expect(normalizarEspecialidadesSolicitud(null)).toEqual([]);
    expect(normalizarEspecialidadesSolicitud({ especialidad: "" })).toEqual([]);
  });
});

describe("esIdGenerado", () => {
  it("reconoce un cuid como identificador generado", () => {
    expect(esIdGenerado("cmk3x9f2a0001l804h7zq8w2n")).toBe(true);
  });

  it("no confunde un nombre de especialidad con un identificador", () => {
    expect(esIdGenerado("Kinesiología General")).toBe(false);
    expect(esIdGenerado("Deportologia")).toBe(false);
    expect(esIdGenerado("esp-1")).toBe(false);
  });
});
