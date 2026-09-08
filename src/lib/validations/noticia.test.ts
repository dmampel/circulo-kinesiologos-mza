import { describe, it, expect } from "vitest";
import {
  derivarImagenPortada,
  renumerarOrden,
  imagenesNoticiaSchema,
} from "./noticia";

describe("derivarImagenPortada", () => {
  it("devuelve la url de la primera imagen cuando la galería tiene N imágenes", () => {
    const imagenes = [
      { url: "https://cdn.example.com/a.jpg" },
      { url: "https://cdn.example.com/b.jpg" },
      { url: "https://cdn.example.com/c.jpg" },
    ];
    expect(derivarImagenPortada(imagenes)).toBe("https://cdn.example.com/a.jpg");
  });

  it("devuelve null cuando la galería está vacía", () => {
    expect(derivarImagenPortada([])).toBeNull();
  });
});

describe("renumerarOrden", () => {
  it("asigna orden secuencial 0..N-1 según la posición del array", () => {
    const imagenes = [
      { url: "https://cdn.example.com/a.jpg", alt: null },
      { url: "https://cdn.example.com/b.jpg", alt: "Segunda" },
      { url: "https://cdn.example.com/c.jpg", alt: null },
    ];
    const resultado = renumerarOrden(imagenes);
    expect(resultado.map((img) => img.orden)).toEqual([0, 1, 2]);
    expect(resultado[1].alt).toBe("Segunda");
  });

  it("ignora cualquier `orden` previo en el input: la posición manda", () => {
    const imagenes = [
      { url: "https://cdn.example.com/x.jpg", orden: 99 },
      { url: "https://cdn.example.com/y.jpg", orden: 0 },
    ] as { url: string; orden: number }[];
    const resultado = renumerarOrden(imagenes);
    expect(resultado.map((img) => img.orden)).toEqual([0, 1]);
  });

  it("devuelve un array vacío para una galería vacía", () => {
    expect(renumerarOrden([])).toEqual([]);
  });
});

describe("imagenesNoticiaSchema", () => {
  it("rechaza una URL de imagen inválida", () => {
    const result = imagenesNoticiaSchema.safeParse([{ url: "no-es-una-url", alt: null }]);
    expect(result.success).toBe(false);
  });

  it("rechaza una lista de más de 10 imágenes", () => {
    const imagenes = Array.from({ length: 11 }, (_, i) => ({
      url: `https://cdn.example.com/${i}.jpg`,
      alt: null,
    }));
    const result = imagenesNoticiaSchema.safeParse(imagenes);
    expect(result.success).toBe(false);
  });

  it("rechaza un alt de 201 caracteres", () => {
    const alt = "a".repeat(201);
    const result = imagenesNoticiaSchema.safeParse([
      { url: "https://cdn.example.com/a.jpg", alt },
    ]);
    expect(result.success).toBe(false);
  });

  it("acepta una lista válida con 10 imágenes y alt de 200 caracteres", () => {
    const alt = "a".repeat(200);
    const imagenes = Array.from({ length: 10 }, (_, i) => ({
      url: `https://cdn.example.com/${i}.jpg`,
      alt,
    }));
    const result = imagenesNoticiaSchema.safeParse(imagenes);
    expect(result.success).toBe(true);
  });

  it("acepta una lista vacía (las imágenes son opcionales)", () => {
    const result = imagenesNoticiaSchema.safeParse([]);
    expect(result.success).toBe(true);
  });
});
