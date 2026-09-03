import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/app/auth/actions", () => ({ login: vi.fn() }));

import LoginPage from "./page";

const renderConParams = async (params: { error?: string; message?: string }) =>
  render(await LoginPage({ searchParams: Promise.resolve(params) }));

describe("LoginPage", () => {
  it("sin parámetros no muestra carteles", async () => {
    await renderConParams({});
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("traduce el error de credenciales", async () => {
    await renderConParams({ error: "credenciales_invalidas" });
    expect(screen.getByRole("alert")).toHaveTextContent(/email o la contraseña/i);
  });

  it("traduce el enlace vencido que manda el callback", async () => {
    await renderConParams({ error: "enlace_invalido" });
    expect(screen.getByRole("alert")).toHaveTextContent(/venc/i);
  });

  it("muestra el aviso de revisar el correo", async () => {
    await renderConParams({ message: "revisar_email" });
    expect(screen.getByRole("status")).toHaveTextContent(/correo|email/i);
  });

  /** El agujero real: un link armado a mano con la cara del sitio del Círculo. */
  it("NO pinta el texto que venga en ?error=", async () => {
    await renderConParams({
      error: "Tu matrícula fue suspendida. Regularizá en bit.ly/falso",
    });

    expect(screen.queryByText(/bit\.ly/)).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("NO pinta el texto que venga en ?message=", async () => {
    await renderConParams({
      message: "Tu cuenta fue verificada, ingresá tu clave en otrositio.com",
    });

    expect(screen.queryByText(/otrositio\.com/)).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("sigue mostrando el formulario para reintentar", async () => {
    await renderConParams({ error: "credenciales_invalidas" });
    expect(screen.getByLabelText(/correo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
  });
});
