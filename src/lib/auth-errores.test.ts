import { describe, it, expect } from "vitest";
import {
  codigoDeErrorDeContrasena,
  mensajeDeErrorDeContrasena,
  mensajeDeErrorDeAuth,
  mensajeInformativoDeAuth,
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

describe("mensajeDeErrorDeAuth", () => {
  it("devuelve null cuando no hay error", () => {
    expect(mensajeDeErrorDeAuth(undefined)).toBeNull();
  });

  it("explica que las credenciales no son correctas", () => {
    expect(mensajeDeErrorDeAuth("credenciales_invalidas")).toMatch(
      /email o la contraseña/i
    );
  });

  it("explica que el enlace no sirve y qué hacer", () => {
    expect(mensajeDeErrorDeAuth("enlace_invalido")).toMatch(/venc/i);
  });

  it("explica que no se pudo mandar el correo", () => {
    expect(mensajeDeErrorDeAuth("mail_no_enviado")).toMatch(/correo/i);
  });

  /**
   * El caso que motivó todo esto: /login pintaba `params.error` crudo, así que
   * un link armado a mano mostraba el texto que quisiera el que lo armó, con
   * la cara del sitio del Círculo.
   */
  it("NO refleja texto arbitrario de la URL", () => {
    const mensaje = mensajeDeErrorDeAuth(
      "Tu matrícula fue suspendida. Regularizá en bit.ly/falso"
    );
    expect(mensaje).not.toMatch(/bit\.ly/);
    expect(mensaje).not.toMatch(/suspendida/i);
    expect(mensaje).toBeTruthy();
  });
});

describe("mensajeInformativoDeAuth", () => {
  it("devuelve null cuando no hay aviso", () => {
    expect(mensajeInformativoDeAuth(undefined)).toBeNull();
  });

  it("avisa que hay que revisar el email", () => {
    expect(mensajeInformativoDeAuth("revisar_email")).toMatch(/correo|email/i);
  });

  it("NO refleja texto arbitrario de la URL: un aviso falso es peor que un error falso", () => {
    expect(
      mensajeInformativoDeAuth("Tu cuenta fue verificada, ingresá tu clave acá")
    ).toBeNull();
  });
});
