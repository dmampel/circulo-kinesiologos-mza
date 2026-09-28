import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/app/bolsa-de-trabajo/actions", () => ({
  revelarContacto: vi.fn(),
}));

import { revelarContacto } from "@/app/bolsa-de-trabajo/actions";
import BotonContactar from "./BotonContactar";

const mockRevelarContacto = vi.mocked(revelarContacto);

// -----------------------------------------------------------------------------
// La red: el contacto NUNCA está en el HTML inicial (design.md — D2). Este
// componente es el único punto donde debería aparecer, y sólo tras el click.
// -----------------------------------------------------------------------------

describe("BotonContactar", () => {
  beforeEach(() => {
    mockRevelarContacto.mockReset();
  });

  it("no muestra ningún dato de contacto antes del click", () => {
    render(<BotonContactar tipo="busco-trabajo" id="aviso-1" />);
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /contactar/i })).toBeInTheDocument();
  });

  it("revela teléfono, email y CV de un aviso 'busco-trabajo' al hacer click", async () => {
    mockRevelarContacto.mockResolvedValue({
      success: true,
      contacto: { tipo: "busco-trabajo", telefono: "2610000000", email: "ana@example.com", cvUrl: "https://cv.example/firmada" },
    });

    render(<BotonContactar tipo="busco-trabajo" id="aviso-1" />);
    fireEvent.click(screen.getByRole("button", { name: /contactar/i }));

    await waitFor(() => expect(screen.getByText("2610000000")).toBeInTheDocument());
    expect(screen.getByText(/ver cv/i)).toBeInTheDocument();
    expect(mockRevelarContacto).toHaveBeenCalledWith("busco-trabajo", "aviso-1");
  });

  it("muestra el medio de contacto de un aviso 'busco-kinesiologo'", async () => {
    mockRevelarContacto.mockResolvedValue({
      success: true,
      contacto: { tipo: "busco-kinesiologo", medioContacto: "clinica@example.com" },
    });

    render(<BotonContactar tipo="busco-kinesiologo" id="aviso-2" />);
    fireEvent.click(screen.getByRole("button", { name: /contactar/i }));

    await waitFor(() => expect(screen.getByText("clinica@example.com")).toBeInTheDocument());
  });

  it("muestra el error sin filtrar contacto cuando el aviso no está publicado", async () => {
    mockRevelarContacto.mockResolvedValue({ success: false, error: "Este aviso ya no está disponible." });

    render(<BotonContactar tipo="busco-trabajo" id="aviso-pendiente" />);
    fireEvent.click(screen.getByRole("button", { name: /contactar/i }));

    await waitFor(() => expect(screen.getByText("Este aviso ya no está disponible.")).toBeInTheDocument());
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
  });
});
