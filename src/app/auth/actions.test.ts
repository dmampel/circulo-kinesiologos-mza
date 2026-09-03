import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpdateUser = vi.fn();
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { updateUser: mockUpdateUser } })),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { redirect } from "next/navigation";
import { updatePassword } from "./actions";

const mockRedirect = vi.mocked(redirect);

function formConPassword(password: string) {
  const fd = new FormData();
  fd.set("password", password);
  return fd;
}

/** El primer redirect es el que ve el socio; después la action sigue de largo. */
const primerDestino = () => mockRedirect.mock.calls[0]?.[0];

describe("updatePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateUser.mockResolvedValue({ error: null });
  });

  it("manda al panel cuando la contraseña se guarda bien", async () => {
    await updatePassword(formConPassword("unaBuenaClave"));

    expect(mockUpdateUser).toHaveBeenCalledWith({ password: "unaBuenaClave" });
    expect(primerDestino()).toBe("/mi-panel");
  });

  it("avisa que la contraseña está repetida, no un error genérico", async () => {
    mockUpdateUser.mockResolvedValue({
      error: {
        code: "same_password",
        message: "New password should be different from the old password.",
      },
    });

    await updatePassword(formConPassword("laMisma"));

    expect(primerDestino()).toBe("/auth/set-password?error=password_repetida");
  });

  it("avisa que la contraseña es corta", async () => {
    mockUpdateUser.mockResolvedValue({
      error: { code: "weak_password", message: "Password should be at least 6 characters." },
    });

    await updatePassword(formConPassword("123"));

    expect(primerDestino()).toBe("/auth/set-password?error=password_corta");
  });

  it("avisa que el enlace venció cuando ya no hay sesión", async () => {
    mockUpdateUser.mockResolvedValue({
      error: { message: "Auth session missing!" },
    });

    await updatePassword(formConPassword("otraClave"));

    expect(primerDestino()).toBe("/auth/set-password?error=sesion_vencida");
  });

  it("ante un error desconocido usa el genérico, sin filtrar el texto de Supabase", async () => {
    mockUpdateUser.mockResolvedValue({
      error: { message: "database connection to 10.0.0.4 refused" },
    });

    await updatePassword(formConPassword("otraClave"));

    expect(primerDestino()).toBe("/auth/set-password?error=password_no_guardada");
    expect(primerDestino()).not.toMatch(/10\.0\.0\.4/);
  });
});
