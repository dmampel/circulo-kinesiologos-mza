import { describe, it, expect } from "vitest";
import { beneficioSchema, validarLogo, MAX_LOGO_SIZE_BYTES } from "./beneficio";

describe("validarLogo", () => {
  it("acepta un PNG chico", () => {
    expect(validarLogo({ name: "a.png", size: 500_000, type: "image/png" })).toBeNull();
  });
  it("rechaza más de 2 MB", () => {
    expect(validarLogo({ name: "a.png", size: MAX_LOGO_SIZE_BYTES + 1, type: "image/png" })).toMatch(/2 MB/);
  });
  it("rechaza SVG", () => {
    expect(validarLogo({ name: "a.svg", size: 100, type: "image/svg+xml" })).toMatch(/PNG, JPEG, WEBP o AVIF/);
  });
});

const base = { empresa: "ACME", descripcion: "desc", descuento: "20%", categoriaId: "c1", enlace: "", logo_url_externa: "" };

describe("beneficioSchema", () => {
  it("acepta datos válidos y normaliza vacíos a null", () => {
    const r = beneficioSchema.safeParse(base);
    expect(r.success && r.data.enlace).toBeNull();
    expect(r.success && r.data.logo_url_externa).toBeNull();
  });
  it("rechaza empresa vacía", () => {
    expect(beneficioSchema.safeParse({ ...base, empresa: "" }).success).toBe(false);
  });
  it("rechaza enlace inválido", () => {
    expect(beneficioSchema.safeParse({ ...base, enlace: "hola" }).success).toBe(false);
  });
  it("acepta logo_url_externa https", () => {
    expect(beneficioSchema.safeParse({ ...base, logo_url_externa: "https://x.com/l.png" }).success).toBe(true);
  });
  it("rechaza logo_url_externa http", () => {
    expect(beneficioSchema.safeParse({ ...base, logo_url_externa: "http://x.com/l.png" }).success).toBe(false);
  });
  it("rechaza logo_url_externa que no es URL", () => {
    expect(beneficioSchema.safeParse({ ...base, logo_url_externa: "texto" }).success).toBe(false);
  });
});
