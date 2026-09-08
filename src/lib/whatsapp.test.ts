import { describe, it, expect } from "vitest";
import { WHATSAPP_ADMINISTRACION, construirLinkWhatsApp, mensajeNuevaSolicitud } from "./whatsapp";

describe("construirLinkWhatsApp", () => {
  it("el link empieza con https://wa.me/5492616937588?text=", () => {
    const link = construirLinkWhatsApp(WHATSAPP_ADMINISTRACION, "hola");
    expect(link.startsWith("https://wa.me/5492616937588?text=")).toBe(true);
  });

  it("un nombre con acentos/eñe/espacios produce un URL válido que decodifica al mensaje original", () => {
    const mensaje = mensajeNuevaSolicitud("José María", "Peña Núñez", "1234");
    const link = construirLinkWhatsApp(WHATSAPP_ADMINISTRACION, mensaje);

    const texto = link.split("?text=")[1];
    expect(decodeURIComponent(texto)).toBe(mensaje);
  });

  it("el ? y la coma del mensaje quedan codificados", () => {
    const mensaje = mensajeNuevaSolicitud("Ana", "García", "5678");
    const link = construirLinkWhatsApp(WHATSAPP_ADMINISTRACION, mensaje);
    const texto = link.split("?text=")[1];

    expect(texto).not.toContain("?");
    expect(texto).not.toContain(",");
    expect(texto).toContain("%3F");
    expect(texto).toContain("%2C");
  });
});

describe("mensajeNuevaSolicitud", () => {
  it("arma el mensaje acordado con nombre, apellido y matrícula", () => {
    expect(mensajeNuevaSolicitud("Ana", "García", "5678")).toBe(
      "Hola Delfina, llegó una solicitud nueva de Ana García (matrícula 5678), ¿la aprobamos?"
    );
  });
});
