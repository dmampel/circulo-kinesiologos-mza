import { describe, it, expect } from "vitest";
import type { User } from "@supabase/supabase-js";
import {
  CLAVE_ACTIVACION,
  CLAVE_ORIGEN_ACTIVACION,
  activacionCompletada,
  esAdmin,
  requiereActivacion,
} from "./activacion";

/**
 * `User` trae dos docenas de campos que no hacen a la decisión. Se arma sólo lo
 * que la función mira y se castea, igual que hace la suite de InvitacionRepository.
 */
const usuario = (
  user_metadata: Record<string, unknown> = {},
  app_metadata: Record<string, unknown> = {}
): User =>
  ({
    id: "auth-1",
    aud: "authenticated",
    created_at: "2026-09-02T14:00:00.000Z",
    app_metadata,
    user_metadata,
  }) as unknown as User;

const activado = (cuando = "2026-09-02T18:00:00.000Z") =>
  usuario({ [CLAVE_ACTIVACION]: cuando, [CLAVE_ORIGEN_ACTIVACION]: "usuario" });

describe("activacionCompletada", () => {
  it("reconoce a quien ya definió su contraseña", () => {
    expect(activacionCompletada(activado())).toBe(true);
  });

  it("no da por activado a quien abrió el link pero nunca guardó contraseña", () => {
    expect(activacionCompletada(usuario())).toBe(false);
  });

  it("sin usuario no hay activación que evaluar", () => {
    expect(activacionCompletada(null)).toBe(false);
  });

  /**
   * `user_metadata` lo escribe el propio usuario: no se puede confiar en que lo
   * que hay adentro sea una fecha. Basura no cuenta como activación.
   */
  it("una marca vacía no cuenta como activación", () => {
    expect(activacionCompletada(usuario({ [CLAVE_ACTIVACION]: "" }))).toBe(false);
    expect(activacionCompletada(usuario({ [CLAVE_ACTIVACION]: "   " }))).toBe(false);
  });

  it("una marca que no es una fecha no cuenta como activación", () => {
    expect(activacionCompletada(usuario({ [CLAVE_ACTIVACION]: "sí" }))).toBe(false);
  });

  it("una marca que no es un string no cuenta como activación", () => {
    expect(activacionCompletada(usuario({ [CLAVE_ACTIVACION]: true }))).toBe(false);
    expect(activacionCompletada(usuario({ [CLAVE_ACTIVACION]: 0 }))).toBe(false);
    expect(activacionCompletada(usuario({ [CLAVE_ACTIVACION]: null }))).toBe(false);
  });

  it("acepta la marca escrita por el backfill", () => {
    const cuenta = usuario({
      [CLAVE_ACTIVACION]: "2026-08-11T12:30:00.000Z",
      [CLAVE_ORIGEN_ACTIVACION]: "backfill",
    });
    expect(activacionCompletada(cuenta)).toBe(true);
  });
});

describe("esAdmin", () => {
  it("lee el rol de app_metadata, que el socio no puede escribir", () => {
    expect(esAdmin(usuario({}, { role: "admin" }))).toBe(true);
  });

  it("un rol en user_metadata NO convierte a nadie en admin", () => {
    expect(esAdmin(usuario({ role: "admin" }))).toBe(false);
  });

  it("sin usuario no hay admin", () => {
    expect(esAdmin(null)).toBe(false);
  });
});

describe("requiereActivacion", () => {
  it("manda a definir contraseña al socio sin marca", () => {
    expect(requiereActivacion(usuario())).toBe(true);
  });

  it("deja pasar al socio que ya activó", () => {
    expect(requiereActivacion(activado())).toBe(false);
  });

  /**
   * D4: un admin jamás pasa por el flujo de invitación de socio, así que su
   * cuenta nunca recibe la marca por vía natural. Someterlo al guard es
   * arriesgar el bloqueo de la cuenta de mayor privilegio a cambio de nada.
   */
  it("exime al administrador aunque no tenga marca", () => {
    expect(requiereActivacion(usuario({}, { role: "admin" }))).toBe(false);
  });

  /**
   * D3: sin sesión no hay cuenta que evaluar. La regla que corresponde es
   * "sin sesión → /login"; mandar a un anónimo a /auth/set-password lo deja
   * en una pantalla sin sesión que actualizar.
   */
  it("sin usuario NO pide activación: eso lo resuelve la regla de sesión", () => {
    expect(requiereActivacion(null)).toBe(false);
  });

  it("una marca basura no alcanza para saltear el guard", () => {
    expect(requiereActivacion(usuario({ [CLAVE_ACTIVACION]: "ya está" }))).toBe(true);
  });
});
