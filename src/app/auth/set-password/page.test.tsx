import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// La action es "use server" y arrastra next/headers: en jsdom no se puede
// importar de verdad. Acá sólo se prueba lo que la pantalla RENDERIZA.
vi.mock("@/app/auth/actions", () => ({ updatePassword: vi.fn() }));

import SetPasswordPage from "./page";

const renderConParams = async (params: { error?: string }) =>
  render(await SetPasswordPage({ searchParams: Promise.resolve(params) }));

describe("SetPasswordPage", () => {
  it("sin error no muestra ningún cartel de alerta", async () => {
    await renderConParams({});
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("muestra el motivo cuando la contraseña está repetida", async () => {
    await renderConParams({ error: "password_repetida" });

    const alerta = screen.getByRole("alert");
    expect(alerta).toBeInTheDocument();
    expect(alerta).toHaveTextContent(/distinta/i);
  });

  it("muestra el motivo cuando la contraseña es corta", async () => {
    await renderConParams({ error: "password_corta" });
    expect(screen.getByRole("alert")).toHaveTextContent(/6/);
  });

  it("ante sesión vencida ofrece el link para pedir uno nuevo", async () => {
    await renderConParams({ error: "sesion_vencida" });

    expect(screen.getByRole("alert")).toHaveTextContent(/enlace/i);
    expect(
      screen.getByRole("link", { name: /pedir un enlace nuevo/i })
    ).toHaveAttribute("href", "/forgot-password");
  });

  it("sigue mostrando el formulario para reintentar aunque haya error", async () => {
    await renderConParams({ error: "password_repetida" });

    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /activar mi cuenta/i })
    ).toBeInTheDocument();
  });
});
