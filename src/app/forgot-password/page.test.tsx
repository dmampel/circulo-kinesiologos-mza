import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/app/auth/actions", () => ({ requestPasswordReset: vi.fn() }));

import ForgotPasswordPage from "./page";

const renderConParams = async (params: { error?: string; message?: string }) =>
  render(await ForgotPasswordPage({ searchParams: Promise.resolve(params) }));

describe("ForgotPasswordPage", () => {
  it("traduce el error de correo no enviado", async () => {
    await renderConParams({ error: "mail_no_enviado" });
    expect(screen.getByRole("alert")).toHaveTextContent(/correo/i);
  });

  it("NO pinta el texto que venga en ?error=", async () => {
    await renderConParams({ error: "Llamá al 0800-FALSO para reactivar" });

    expect(screen.queryByText(/0800-FALSO/)).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("sigue reconociendo el aviso de enviado", async () => {
    await renderConParams({ message: "sent" });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
