import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpdateUser = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockResetPasswordForEmail = vi.fn();
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      updateUser: mockUpdateUser,
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

describe("updatePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateUser.mockResolvedValue({ error: null });
  });

  it("manda al panel cuando la contraseña se guarda bien", async () => {
    await correr(updatePassword(formConPassword("unaBuenaClave")));

    expect(mockUpdateUser).toHaveBeenCalledWith({ password: "unaBuenaClave" });
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
