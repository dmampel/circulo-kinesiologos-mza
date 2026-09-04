import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpdateUser = vi.fn();
const mockGetUser = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockResetPasswordForEmail = vi.fn();
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      updateUser: mockUpdateUser,
      getUser: mockGetUser,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  })),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
/**
 * En Next el `redirect` real corta el flujo tirando una excepcion. Un mock que
 * devuelve undefined deja seguir la funcion y la hace explotar en la linea de
 * abajo por razones que en produccion no pasan. Se replica el corte.
 */
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

import { redirect } from "next/navigation";
import { updatePassword, login, signup, requestPasswordReset } from "./actions";

const mockRedirect = vi.mocked(redirect);

function formConPassword(password: string) {
  const fd = new FormData();
  fd.set("password", password);
  return fd;
}

/** Corre la action dejando que el redirect corte, como hace Next. */
async function correr(accion: Promise<unknown>) {
  await accion.catch((e: Error) => {
    if (!e.message.startsWith("NEXT_REDIRECT:")) throw e;
  });
}

/** El destino del redirect que corto el flujo: lo que ve el socio. */
const destino = () => mockRedirect.mock.calls[0]?.[0];

/** Cuenta sin marca: el socio que recién abre su link de invitación. */
const sinMarca = { data: { user: { id: "auth-1", user_metadata: {} } }, error: null };

/** Cuenta que ya activó: vuelve por el flujo de recuperación a cambiar la clave. */
const yaActivado = (cuando: string) => ({
  data: {
    user: {
      id: "auth-1",
      user_metadata: {
        activacion_completada_en: cuando,
        activacion_origen: "usuario",
      },
    },
  },
  error: null,
});

/** Los `data` que recibió `updateUser`, o undefined si no le mandaron ninguno. */
const dataEscrita = () =>
  (mockUpdateUser.mock.calls[0]?.[0] as { data?: Record<string, string> } | undefined)?.data;

describe("updatePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateUser.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue(sinMarca);
  });

  it("manda al panel cuando la contraseña se guarda bien", async () => {
    await correr(updatePassword(formConPassword("unaBuenaClave")));

    expect(destino()).toBe("/mi-panel");
  });

  /**
   * El corazón del change: la contraseña y la marca de activación viajan en la
   * MISMA llamada. Partirlo en dos escrituras reintroduce el estado a medio
   * camino — cuenta con sesión, sin contraseña y figurando activa — que es
   * justamente lo que este flujo viene a eliminar.
   */
  it("escribe la contraseña y la marca de activación en UNA sola llamada", async () => {
    await correr(updatePassword(formConPassword("unaBuenaClave")));

    expect(mockUpdateUser).toHaveBeenCalledTimes(1);
    expect(mockUpdateUser).toHaveBeenCalledWith({
      password: "unaBuenaClave",
      data: {
        activacion_completada_en: expect.any(String),
        activacion_origen: "usuario",
      },
    });
  });

  it("la marca es un instante ISO-8601 UTC, no un booleano", async () => {
    await correr(updatePassword(formConPassword("unaBuenaClave")));

    const marca = dataEscrita()?.activacion_completada_en;
    expect(marca).toMatch(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/);
    expect(Number.isNaN(new Date(marca as string).getTime())).toBe(false);
  });

  /**
   * Un socio que ya activó y vuelve a cambiar su contraseña no puede perder la
   * fecha original: es la única métrica de cuándo se activó de verdad.
   */
  it("una cuenta ya marcada conserva su fecha original", async () => {
    mockGetUser.mockResolvedValue(yaActivado("2026-08-11T12:30:00.000Z"));

    await correr(updatePassword(formConPassword("otraClaveNueva")));

    expect(mockUpdateUser).toHaveBeenCalledTimes(1);
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: "otraClaveNueva" });
    expect(dataEscrita()).toBeUndefined();
    expect(destino()).toBe("/mi-panel");
  });

  /**
   * Si no se puede leer el usuario se marca igual: perder fidelidad en la
   * métrica es preferible a dejar al socio afuera del portal por una lectura
   * que falló.
   */
  it("si no puede leer el usuario escribe la marca igual", async () => {
    mockGetUser.mockRejectedValue(new Error("auth no responde"));

    await correr(updatePassword(formConPassword("unaBuenaClave")));

    expect(dataEscrita()?.activacion_completada_en).toEqual(expect.any(String));
    expect(destino()).toBe("/mi-panel");
  });

  it("avisa que la contraseña está repetida, no un error genérico", async () => {
    mockUpdateUser.mockResolvedValue({
      error: {
        code: "same_password",
        message: "New password should be different from the old password.",
      },
    });

    await correr(updatePassword(formConPassword("laMisma")));

    expect(destino()).toBe("/auth/set-password?error=password_repetida");
  });

  it("avisa que la contraseña es corta", async () => {
    mockUpdateUser.mockResolvedValue({
      error: { code: "weak_password", message: "Password should be at least 6 characters." },
    });

    await correr(updatePassword(formConPassword("123")));

    expect(destino()).toBe("/auth/set-password?error=password_corta");
  });

  it("avisa que el enlace venció cuando ya no hay sesión", async () => {
    mockUpdateUser.mockResolvedValue({
      error: { message: "Auth session missing!" },
    });

    await correr(updatePassword(formConPassword("otraClave")));

    expect(destino()).toBe("/auth/set-password?error=sesion_vencida");
  });

  it("ante un error desconocido usa el genérico, sin filtrar el texto de Supabase", async () => {
    mockUpdateUser.mockResolvedValue({
      error: { message: "database connection to 10.0.0.4 refused" },
    });

    await correr(updatePassword(formConPassword("otraClave")));

    expect(destino()).toBe("/auth/set-password?error=password_no_guardada");
    expect(destino()).not.toMatch(/10\.0\.0\.4/);
  });

  /**
   * Ante un fallo no puede quedar la marca escrita sin la contraseña: eso es
   * exactamente el limbo que el change elimina. Como son la misma operación,
   * basta con que no haya NINGUNA segunda escritura de rescate y con que el
   * destino siga siendo la pantalla de activación con su código de error.
   */
  it.each([
    ["same_password", "New password should be different.", "password_repetida"],
    ["weak_password", "Password should be at least 6 characters.", "password_corta"],
    ["session_not_found", "Auth session missing!", "sesion_vencida"],
  ])("ante %s no queda ninguna escritura extra y el destino no cambia", async (code, message, codigo) => {
    mockUpdateUser.mockResolvedValue({ error: { code, message } });

    await correr(updatePassword(formConPassword("loQueSea")));

    expect(mockUpdateUser).toHaveBeenCalledTimes(1);
    expect(destino()).toBe(`/auth/set-password?error=${codigo}`);
  });
});

describe("códigos de aviso que viajan por la URL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: "Invalid login credentials" } });
    mockSignUp.mockResolvedValue({ error: null });
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
  });

  it("login fallido manda un código, no el texto de Supabase", async () => {
    const fd = new FormData();
    fd.set("email", "socio@ejemplo.com");
    fd.set("password", "mal");

    await correr(login(fd));

    expect(destino()).toBe("/login?error=credenciales_invalidas");
  });

  it("registro fallido NO se confunde con credenciales incorrectas", async () => {
    mockSignUp.mockResolvedValue({ error: { message: "User already registered" } });
    const fd = new FormData();
    fd.set("email", "socio@ejemplo.com");
    fd.set("password", "unaClave123");

    await correr(signup(fd));

    expect(destino()).toBe("/login?error=registro_fallido");
  });

  it("registro exitoso avisa por código que hay que revisar el email", async () => {
    const fd = new FormData();
    fd.set("email", "socio@ejemplo.com");
    fd.set("password", "unaClave123");

    await correr(signup(fd));

    expect(mockRedirect).toHaveBeenCalledWith("/login?message=revisar_email");
  });

  it("si falla el envío del reset manda un código", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: { message: "rate limit exceeded" } });
    const fd = new FormData();
    fd.set("email", "socio@ejemplo.com");

    await correr(requestPasswordReset(fd));

    expect(destino()).toBe("/forgot-password?error=mail_no_enviado");
  });
});
