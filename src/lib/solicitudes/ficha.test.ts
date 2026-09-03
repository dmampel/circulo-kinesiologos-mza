import { describe, it, expect } from "vitest";
import { construirFicha, DOCUMENTOS_SOLICITUD } from "./ficha";

const base = {
  id: "c1",
  nombre: "Juan",
  apellido: "Pérez",
  email: "jperez@mail.com",
  matricula: "4821",
  status: "PENDIENTE",
  creada_en: new Date("2026-08-14T10:00:00Z"),
  revisada_en: null,
  datos: {
    dni: "20301234567",
    telefono: "2615551234",
    direccion: "San Martín 1234",
    localidadId: "loc1",
    especialidades: ["esp1"],
    archivos: {
      dni: "4821-dni-doc.pdf",
      titulo: "4821-titulo-doc.pdf",
      cuit: "4821-cuit-doc.pdf",
      seguro: "4821-seguro-doc.pdf",
      cv: "4821-cv-doc.pdf",
      matricula_file: "4821-matricula_file-doc.pdf",
    },
  },
};

describe("construirFicha", () => {
  it("mapea los datos del solicitante a la ficha", () => {
    const ficha = construirFicha(base, {
      localidad: "Godoy Cruz",
      especialidades: ["Kinesiología Deportiva"],
    });

    expect(ficha.apellidoNombre).toBe("Pérez, Juan");
    expect(ficha.matricula).toBe("4821");
    expect(ficha.dni).toBe("20301234567");
    expect(ficha.telefono).toBe("2615551234");
    expect(ficha.localidad).toBe("Godoy Cruz");
    expect(ficha.especialidades).toBe("Kinesiología Deportiva");
  });

  it("marca la documentación como completa cuando están los 6 obligatorios", () => {
    const ficha = construirFicha(base, { localidad: "Godoy Cruz", especialidades: [] });

    expect(ficha.documentacionCompleta).toBe(true);
    expect(ficha.documentos).toHaveLength(DOCUMENTOS_SOLICITUD.length);
    expect(ficha.documentos.find((d) => d.id === "dni")?.adjuntado).toBe(true);
    // Los opcionales no adjuntados no rompen la completitud.
    expect(ficha.documentos.find((d) => d.id === "super_salud")?.adjuntado).toBe(false);
  });

  it("marca la documentación como incompleta si falta un obligatorio", () => {
    const sinTitulo = {
      ...base,
      datos: { ...base.datos, archivos: { ...base.datos.archivos, titulo: undefined } },
    };

    const ficha = construirFicha(sinTitulo, { localidad: "Godoy Cruz", especialidades: [] });

    expect(ficha.documentacionCompleta).toBe(false);
    expect(ficha.documentos.find((d) => d.id === "titulo")?.adjuntado).toBe(false);
    expect(ficha.faltantes).toEqual(["Título Universitario"]);
  });

  it("usa un marcador cuando faltan datos opcionales del snapshot", () => {
    const pelado = { ...base, datos: {} };

    const ficha = construirFicha(pelado, { localidad: "", especialidades: [] });

    expect(ficha.dni).toBe("No especificado");
    expect(ficha.direccion).toBe("No especificado");
    expect(ficha.localidad).toBe("No especificado");
    expect(ficha.especialidades).toBe("Sin especialidad");
  });

  it("tolera un snapshot de datos nulo sin explotar", () => {
    const roto = { ...base, datos: null };

    const ficha = construirFicha(roto, { localidad: "", especialidades: [] });

    expect(ficha.apellidoNombre).toBe("Pérez, Juan");
    expect(ficha.documentacionCompleta).toBe(false);
  });
});
