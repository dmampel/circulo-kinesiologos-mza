import { describe, it, expect } from "vitest";
import {
  codigoDeErrorDeContrasena,
  mensajeDeErrorDeContrasena,
} from "./auth-errores";

describe("codigoDeErrorDeContrasena", () => {
  it("reconoce la contraseña repetida por el code de Supabase", () => {
    expect(
      codigoDeErrorDeContrasena({
        code: "same_password",
        message: "New password should be different from the old password.",
      })
    ).toBe("password_repetida");
  });

  it("reconoce la contraseña repetida aunque no venga el code", () => {
    expect(
      codigoDeErrorDeContrasena({
        message: "New password should be different from the old password.",
      })
    ).toBe("password_repetida");
  });

  it("reconoce la contraseña corta", () => {
    expect(
      codigoDeErrorDeContrasena({
        code: "weak_password",
        message: "Password should be at least 6 characters.",
      })
    ).toBe("password_corta");
  });

  it("reconoce la sesión vencida cuando el link ya no vale", () => {
    expect(
      codigoDeErrorDeContrasena({ message: "Auth session missing!" })
    ).toBe("sesion_vencida");
  });

  it("cae en el genérico ante un error que no conoce", () => {
    expect(
      codigoDeErrorDeContrasena({ message: "unexpected_failure" })
    ).toBe("password_no_guardada");
  });

  it("no explota si el error viene sin message", () => {
    expect(codigoDeErrorDeContrasena({})).toBe("password_no_guardada");
  });
});

describe("mensajeDeErrorDeContrasena", () => {
  it("devuelve null cuando no hay error, para no pintar el cartel", () => {
    expect(mensajeDeErrorDeContrasena(undefined)).toBeNull();
  });

  it("explica en castellano que la contraseña está repetida", () => {
    const mensaje = mensajeDeErrorDeContrasena("password_repetida");
    expect(mensaje).toMatch(/distinta/i);
  });

  it("explica en castellano el mínimo de caracteres", () => {
    expect(mensajeDeErrorDeContrasena("password_corta")).toMatch(/6/);
  });

  it("ante sesión vencida manda a pedir un enlace nuevo", () => {
    expect(mensajeDeErrorDeContrasena("sesion_vencida")).toMatch(/enlace/i);
  });

  /**
   * El `error` sale de la query string: si se pintara tal cual, cualquiera
   * podría mandarle a un socio un link con el texto que se le antoje.
   */
  it("NO refleja texto arbitrario de la URL: cae al mensaje genérico", () => {
    const mensaje = mensajeDeErrorDeContrasena(
      "Tu cuenta fue suspendida, llamá al 0800-FALSO"
    );
    expect(mensaje).not.toMatch(/0800-FALSO/);
    expect(mensaje).toMatch(/contraseña/i);
  });
});
