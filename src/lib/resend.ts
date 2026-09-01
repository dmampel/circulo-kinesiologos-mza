import { Resend } from "resend";
import { SITE_URL } from "./site";

/**
 * Configuracion de mail transaccional.
 *
 * Este modulo tenia fallbacks hardcodeados a dominios inexistentes
 * (`admin@circulokinesiologos.com`) y al remitente sandbox de Resend. Con eso,
 * una variable mal cargada no daba error: el mail simplemente no llegaba, y el
 * Circulo se enteraba meses despues. Ahora falta de configuracion = no se
 * manda, y queda avisado en los logs.
 */

type EnvMail = {
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  INSTITUTIONAL_EMAIL?: string;
};

/** Valor de ejemplo que traen los `.env`: cuenta como no configurado. */
const PLACEHOLDER_API_KEY = "re_...";

/** Dominio del sitio, sin `www.`: es contra este que se validan las casillas. */
function dominioDelSitio(base: string): string {
  try {
    return new URL(base).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

/** `true` si la casilla pertenece al dominio del sitio o a un subdominio suyo. */
function esDelDominio(email: string, dominio: string): boolean {
  const propio = email.trim().toLowerCase().split("@")[1];
  if (!propio || !dominio) return false;
  return propio === dominio || propio.endsWith(`.${dominio}`);
}

/**
 * Devuelve los nombres de las variables mal configuradas, en orden.
 * Array vacio = se puede mandar mail.
 */
export function problemasDeConfigMail(
  env: EnvMail,
  base: string = SITE_URL,
): string[] {
  const problemas: string[] = [];
  const dominio = dominioDelSitio(base);

  const apiKey = env.RESEND_API_KEY?.trim();
  if (!apiKey || apiKey === PLACEHOLDER_API_KEY) {
    problemas.push("RESEND_API_KEY");
  }

  for (const clave of ["RESEND_FROM_EMAIL", "INSTITUTIONAL_EMAIL"] as const) {
    const valor = env[clave]?.trim();
    if (!valor || !valor.includes("@") || !esDelDominio(valor, dominio)) {
      problemas.push(clave);
    }
  }

  return problemas;
}

let avisado = false;

export function canSendEmails(): boolean {
  const problemas = problemasDeConfigMail(process.env as EnvMail);
  if (problemas.length > 0 && !avisado) {
    avisado = true;
    console.warn(
      `[mail] no se envian mails: revisar ${problemas.join(", ")} en las variables de entorno`,
    );
  }
  return problemas.length === 0;
}

let cliente: Resend | null = null;

/** El cliente se crea recien al usarlo: instanciarlo en el import rompia el modulo sin API key. */
export function getResend(): Resend {
  cliente ??= new Resend(process.env.RESEND_API_KEY);
  return cliente;
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "";

export const INSTITUTIONAL_EMAIL = process.env.INSTITUTIONAL_EMAIL ?? "";
