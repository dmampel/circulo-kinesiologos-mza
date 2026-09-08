/**
 * Aviso manual por WhatsApp a la dueña del producto cuando llega una
 * solicitud de asociación nueva. No hay integración con WhatsApp Business ni
 * envío automático: es un enlace `wa.me` de click-to-chat que administración
 * dispara con un toque desde el mail institucional.
 */

/**
 * Número de la dueña del producto, en formato E.164 sin `+` (lo que exige
 * `wa.me`). Va como constante y no como variable de entorno: es un dato
 * estable y no secreto, y una env var vacía en producción rompería el enlace
 * en silencio — el mismo problema que documenta `src/lib/resend.ts` para los
 * mails. Cambiarlo es una línea acá.
 */
export const WHATSAPP_ADMINISTRACION = "5492616937588";

/**
 * Arma un enlace de WhatsApp click-to-chat. `mensaje` se codifica para URL
 * completo, así acentos, eñes, espacios y signos de puntuación llegan
 * intactos al cliente de WhatsApp.
 */
export function construirLinkWhatsApp(numero: string, mensaje: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

/** Mensaje pre-cargado del aviso de solicitud nueva a la dueña del producto. */
export function mensajeNuevaSolicitud(nombre: string, apellido: string, matricula: string): string {
  return `Hola Delfina, llegó una solicitud nueva de ${nombre} ${apellido} (matrícula ${matricula}), ¿la aprobamos?`;
}
