/**
 * Estado de activación de la cuenta de un socio.
 *
 * El flujo de invitación no distinguía "hizo click en el link del mail" de
 * "definió su contraseña". Quien abandonaba entre un paso y el otro quedaba
 * con la cuenta viva, con sesión, sin contraseña propia y figurando ACTIVO en
 * el panel; cuando esa sesión se le vencía no podía volver a entrar y nadie se
 * enteraba hasta que llamaba. Acá vive el predicado que separa los dos casos.
 *
 * La marca se graba en `user_metadata` en la MISMA llamada que la contraseña
 * (`updateUser({ password, data })`), que es lo único que garantiza que no
 * pueda quedar una sin la otra. Ver design.md D1.
 *
 * OJO — esto NO es un control de autorización. `user_metadata` es escribible
 * por el propio usuario con su token: un socio podría marcarse activado sin
 * definir contraseña. No gana nada con eso (sin contraseña sigue sin poder
 * autenticarse en /login, que es lo único que da acceso duradero); lo único
 * que se saltea es su propia pantalla de activación. La frontera de seguridad
 * sigue siendo tener contraseña. Esta marca es guía de experiencia y métrica.
 *
 * Funciones puras: sin I/O, sin Next, sin cliente de Supabase. Se testean con
 * un objeto literal, igual que `auth-errores.ts`.
 */

import type { User } from "@supabase/supabase-js";

/** Clave dentro de `user_metadata` con el instante de la activación (ISO-8601 UTC). */
export const CLAVE_ACTIVACION = "activacion_completada_en";

/** Clave que separa lo medido ("usuario") de lo inferido por el backfill. */
export const CLAVE_ORIGEN_ACTIVACION = "activacion_origen";

/**
 * `"usuario"`: el socio guardó su contraseña y lo vimos pasar.
 * `"backfill"`: se dedujo de que la cuenta ya tenía contraseña antes del change.
 */
export type OrigenActivacion = "usuario" | "backfill";

/** Rol administrativo, declarado en `app_metadata` (no lo escribe el usuario). */
const ROL_ADMIN = "admin";

/**
 * Es un timestamp, no un booleano, porque además de "sí/no" responde "cuándo",
 * que es la métrica de activación que el Círculo no tenía. Una marca vacía,
 * de otro tipo o con una fecha impostable NO cuenta como activación: preferimos
 * mandar a alguien a definir su contraseña de nuevo antes que dar por activada
 * una cuenta por un dato basura.
 */
function marcaValida(valor: unknown): boolean {
  if (typeof valor !== "string" || valor.trim() === "") return false;
  return !Number.isNaN(new Date(valor).getTime());
}

/** ¿Esta cuenta tiene contraseña propia definida por su dueño? */
export function activacionCompletada(user: User | null): boolean {
  if (!user) return false;
  return marcaValida(user.user_metadata?.[CLAVE_ACTIVACION]);
}

/** Rol administrativo declarado en `app_metadata` (service role, no editable por el socio). */
export function esAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.app_metadata?.role === ROL_ADMIN;
}

/**
 * ¿Hay que mandar a esta persona a `/auth/set-password` antes de dejarla entrar?
 *
 * Los administradores quedan exentos (design D4): un admin nunca atraviesa el
 * flujo de invitación de socio, así que su cuenta jamás recibe la marca por vía
 * natural, y someterlo al guard es arriesgar el bloqueo de la cuenta de mayor
 * privilegio del sistema a cambio de nada.
 *
 * `null` devuelve `false` A PROPÓSITO: sin sesión no hay cuenta que evaluar, y
 * la regla que corresponde es "sin sesión → /login". Mandar a un visitante
 * anónimo a /auth/set-password lo deja en una pantalla sin sesión que
 * actualizar, donde lo único que puede cosechar es `sesion_vencida`. Quien
 * llame a esta función debe resolver la falta de sesión ANTES (design D3).
 */
export function requiereActivacion(user: User | null): boolean {
  if (!user) return false;
  return !esAdmin(user) && !activacionCompletada(user);
}
