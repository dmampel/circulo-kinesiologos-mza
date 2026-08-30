import { describe, it, expect } from "vitest";
import { MAX_FILE_SIZE, MAX_TOTAL_SIZE } from "./solicitud";
import {
  validarArchivoCliente,
  calcularTamanoTotal,
  validarTamanoTotal,
  construirManifiesto,
  mapearPathsDesdeUploads,
} from "./archivoCliente";

// ---------------------------------------------------------------------------
// validarArchivoCliente — validación de tamaño y MIME al seleccionar
// ---------------------------------------------------------------------------

describe("validarArchivoCliente — tamaño", () => {
  it("rechaza un archivo que supera MAX_FILE_SIZE", () => {
    const resultado = validarArchivoCliente({
      name: "foto.jpg",
      size: MAX_FILE_SIZE + 1,
      type: "image/jpeg",
    });
    expect(resultado).not.toBeNull();
  });

  it("acepta un archivo justo en el límite de MAX_FILE_SIZE (triangulación)", () => {
    const resultado = validarArchivoCliente({
      name: "foto.jpg",
      size: MAX_FILE_SIZE,
      type: "image/jpeg",
    });
    expect(resultado).toBeNull();
  });
});

describe("validarArchivoCliente — MIME", () => {
  it("rechaza un tipo MIME no permitido", () => {
    const resultado = validarArchivoCliente({
      name: "archivo.zip",
      size: 1000,
      type: "application/zip",
    });
    expect(resultado).not.toBeNull();
  });

  it("acepta un tipo MIME permitido (triangulación)", () => {
    const resultado = validarArchivoCliente({
      name: "archivo.pdf",
      size: 1000,
      type: "application/pdf",
    });
    expect(resultado).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// calcularTamanoTotal / validarTamanoTotal
// ---------------------------------------------------------------------------

describe("calcularTamanoTotal", () => {
  it("suma sólo los archivos presentes, ignorando los null", () => {
    const total = calcularTamanoTotal({
      dni: { name: "a.pdf", size: 1000, type: "application/pdf" },
      titulo: null,
      cuit: { name: "b.pdf", size: 2000, type: "application/pdf" },
    });
    expect(total).toBe(3000);
  });

  it("devuelve 0 cuando no hay archivos (triangulación)", () => {
    expect(calcularTamanoTotal({ dni: null })).toBe(0);
  });
});

describe("validarTamanoTotal", () => {
  it("rechaza cuando la suma supera MAX_TOTAL_SIZE", () => {
    const resultado = validarTamanoTotal({
      dni: { name: "a.pdf", size: MAX_TOTAL_SIZE, type: "application/pdf" },
      titulo: { name: "b.pdf", size: 1, type: "application/pdf" },
    });
    expect(resultado).not.toBeNull();
  });

  it("acepta cuando la suma está justo en el límite (triangulación)", () => {
    const resultado = validarTamanoTotal({
      dni: { name: "a.pdf", size: MAX_TOTAL_SIZE, type: "application/pdf" },
    });
    expect(resultado).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// construirManifiesto — de estado de archivos a manifiesto para el servidor
// ---------------------------------------------------------------------------

describe("construirManifiesto", () => {
  it("incluye sólo los archivos no nulos, con key/nombre/tamano/tipo", () => {
    const manifiesto = construirManifiesto({
      dni: { name: "dni.pdf", size: 1000, type: "application/pdf" },
      titulo: null,
    });

    expect(manifiesto).toEqual([{ key: "dni", nombre: "dni.pdf", tamano: 1000, tipo: "application/pdf" }]);
  });

  it("devuelve un array vacío cuando todos los archivos son null (triangulación)", () => {
    expect(construirManifiesto({ dni: null, titulo: null })).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// mapearPathsDesdeUploads — de uploads del servidor a Record<key, path>
// ---------------------------------------------------------------------------

describe("mapearPathsDesdeUploads", () => {
  it("construye un Record<key, path> a partir del array de uploads", () => {
    const resultado = mapearPathsDesdeUploads([
      { key: "dni", path: "5678-dni-123.pdf", token: "t1" },
      { key: "titulo", path: "5678-titulo-124.pdf", token: "t2" },
    ]);

    expect(resultado).toEqual({
      dni: "5678-dni-123.pdf",
      titulo: "5678-titulo-124.pdf",
    });
  });

  it("devuelve un objeto vacío cuando no hay uploads (triangulación)", () => {
    expect(mapearPathsDesdeUploads([])).toEqual({});
  });
});
