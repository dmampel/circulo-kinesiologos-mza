import { describe, it, expect } from "vitest";
import { coincide } from "./coincide";

const mariam = {
  apellido: "Taichure",
  nombre: "Marta Mariam",
  matricula: "L-1389",
  email: "mtaichure@yahoo.com.ar",
};

describe("coincide", () => {
  it("sin búsqueda deja pasar a todos", () => {
    expect(coincide(mariam, "")).toBe(true);
  });
  it("encuentra por nombre + apellido en cualquier orden", () => {
    expect(coincide(mariam, "Mariam Taichure")).toBe(true);
    expect(coincide(mariam, "taichure marta")).toBe(true);
  });
  it("encuentra por un solo campo, matrícula o email", () => {
    expect(coincide(mariam, "L-1389")).toBe(true);
    expect(coincide(mariam, "mtaichure@yahoo")).toBe(true);
  });
  it("ignora tildes y mayúsculas", () => {
    expect(coincide({ ...mariam, apellido: "Núñez" }, "nunez")).toBe(true);
  });
  it("no coincide si alguna palabra no está", () => {
    expect(coincide(mariam, "Mariam Perez")).toBe(false);
  });
  it("tolera email nulo", () => {
    expect(coincide({ ...mariam, email: null }, "Taichure")).toBe(true);
  });
});
