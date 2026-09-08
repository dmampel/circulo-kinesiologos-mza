import { describe, it, expect } from "vitest";
import { construirAvisoInstitucional, escaparHtml, type DatosAvisoInstitucional } from "./solicitud-institucional";

function datosBase(overrides: Partial<DatosAvisoInstitucional> = {}): DatosAvisoInstitucional {
  return {
    nombre: "Ana",
    apellido: "García",
    matricula: "5678",
    email: "ana@example.com",
    dni: "12345678",
    telefono: "2614000000",
    direccion: "Calle Falsa 123",
    localidad: "Godoy Cruz",
    especialidades: "Kinesiología Deportiva",
    documentos: [
      { label: "Fotocopia DNI", url: "https://storage/firmada-dni" },
      { label: "Título Universitario", url: "https://storage/firmada-titulo" },
    ],
    whatsappUrl: "https://wa.me/5492616937588?text=hola",
    ...overrides,
  };
}

describe("escaparHtml", () => {
  it("reemplaza & < > \" ' por sus entidades, el & primero para no doble-escapar", () => {
    expect(escaparHtml(`<b>&"'`)).toBe("&lt;b&gt;&amp;&quot;&#39;");
  });
});

describe("construirAvisoInstitucional", () => {
  it("el subject es el esperado", () => {
    const { subject } = construirAvisoInstitucional(datosBase());
    expect(subject).toBe("Nueva Solicitud de Asociación: Ana García");
  });

  it("el HTML contiene los 8 campos de datos del solicitante", () => {
    const { html } = construirAvisoInstitucional(datosBase());

    expect(html).toContain("Ana García");
    expect(html).toContain("5678");
    expect(html).toContain("ana@example.com");
    expect(html).toContain("12345678");
    expect(html).toContain("2614000000");
    expect(html).toContain("Calle Falsa 123");
    expect(html).toContain("Godoy Cruz");
    expect(html).toContain("Kinesiología Deportiva");
  });

  it("contiene los labels y hrefs de los documentos con URL", () => {
    const { html } = construirAvisoInstitucional(datosBase());

    expect(html).toContain("Fotocopia DNI");
    expect(html).toContain('href="https://storage/firmada-dni"');
    expect(html).toContain("Título Universitario");
    expect(html).toContain('href="https://storage/firmada-titulo"');
  });

  it("muestra la leyenda para los documentos sin URL", () => {
    const { html } = construirAvisoInstitucional(
      datosBase({ documentos: [{ label: "Curriculum Vitae" }] })
    );

    expect(html).toContain("Curriculum Vitae");
    expect(html).toContain("no disponible — revisar en el panel");
  });

  it("contiene el href de WhatsApp y la leyenda de aprobación previa", () => {
    const { html } = construirAvisoInstitucional(datosBase());

    expect(html).toContain('href="https://wa.me/5492616937588?text=hola"');
    expect(html).toContain("Una vez aprobada la documentación, avisale a Delfina para darlo de alta en la web");
  });

  it("un nombre con <script> o <b> aparece escapado, no como markup", () => {
    const { html } = construirAvisoInstitucional(
      datosBase({ nombre: "<script>alert(1)</script>", direccion: '<b>maliciosa</b>' })
    );

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<b>maliciosa</b>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;b&gt;");
  });
});
