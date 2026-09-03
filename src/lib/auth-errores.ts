/**
 * Traducción de los errores de contraseña de Supabase a algo que un socio
 * pueda leer y resolver solo.
 *
 * Existe porque `updatePassword` redirigía SIEMPRE con el mismo texto
 * ("Could not update password") y la pantalla de /auth/set-password ni
 * siquiera lo pintaba: el socio apretaba "Activar mi cuenta", la página se
 * recargaba idéntica y parecía que el sistema lo rechazaba porque sí. Con 136
 * socios en limbo, cada uno de esos casos es un llamado al Círculo.
 *
 * El flujo es: el error de Supabase se reduce a un CÓDIGO corto (que viaja por
 * la query string) y la pantalla traduce ese código a texto. El texto no viaja
 * por la URL a propósito — ver `mensajeDeErrorDeContrasena`.
 */

export type CodigoErrorContrasena =
  | "password_repetida"
  | "password_corta"
  | "sesion_vencida"
  | "password_no_guardada";

type ErrorDeSupabase = { code?: string | null; message?: string | null };

/**
 * Los `code` de Supabase son lo estable; el `message` cambia entre versiones.
 * Se mira primero el code y se cae al texto sólo si no vino, porque en varias
 * respuestas de la API el code llega vacío.
 */
export function codigoDeErrorDeContrasena(
  error: ErrorDeSupabase
): CodigoErrorContrasena {
  const code = error.code?.toLowerCase() ?? "";
  const message = error.message?.toLowerCase() ?? "";

  if (code === "same_password" || message.includes("should be different")) {
    return "password_repetida";
  }

  if (code === "weak_password" || message.includes("at least")) {
    return "password_corta";
  }

  // El link de invitación o de reset ya se usó, venció, o se abrió en otro
  // navegador: no hay sesión que actualizar.
  if (
    code === "session_not_found" ||
    message.includes("session missing") ||
    message.includes("session_not_found")
  ) {
    return "sesion_vencida";
  }

  return "password_no_guardada";
}

const MENSAJES: Record<CodigoErrorContrasena, string> = {
  password_repetida:
    "Esa es la contraseña que ya tenías. Elegí una distinta para poder continuar.",
  password_corta: "La contraseña tiene que tener al menos 6 caracteres.",
  sesion_vencida:
    "El enlace ya venció o se usó antes. Pedí uno nuevo y abrilo en este mismo navegador.",
  password_no_guardada:
    "No pudimos guardar la contraseña. Probá de nuevo o pedí un enlace nuevo.",
};

function esCodigoConocido(valor: string): valor is CodigoErrorContrasena {
  return valor in MENSAJES;
}

/**
 * `codigo` sale de la query string, o sea del usuario. Si se pintara tal cual
 * (como hace /login con su `error`), cualquiera podría mandarle a un socio un
 * link con el texto que se le antoje y hacerlo pasar por un aviso del Círculo.
 * Por eso un código desconocido cae al mensaje genérico en vez de reflejarse.
 */
export function mensajeDeErrorDeContrasena(
  codigo: string | undefined
): string | null {
  if (!codigo) return null;
  return esCodigoConocido(codigo)
    ? MENSAJES[codigo]
    : MENSAJES.password_no_guardada;
}
