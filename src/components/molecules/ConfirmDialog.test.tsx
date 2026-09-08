import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmDialog from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("no renderiza nada cuando open es false", () => {
    render(
      <ConfirmDialog open={false} title="¿Confirmar?" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.queryByText("¿Confirmar?")).not.toBeInTheDocument();
  });

  it("muestra título y descripción cuando open es true", () => {
    render(
      <ConfirmDialog
        open
        title="¿Rechazar esta solicitud?"
        description="Se le va a avisar al solicitante."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText("¿Rechazar esta solicitud?")).toBeInTheDocument();
    expect(screen.getByText("Se le va a avisar al solicitante.")).toBeInTheDocument();
  });

  it("llama onConfirm al tocar el botón de confirmar", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog open title="¿Confirmar?" confirmLabel="Rechazar" onConfirm={onConfirm} onCancel={vi.fn()} />
    );
    fireEvent.click(screen.getByText("Rechazar"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("llama onCancel al tocar el botón de cancelar y al tocar el fondo", () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog open title="¿Confirmar?" onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Cancelar"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("deshabilita ambos botones mientras pending es true", () => {
    render(<ConfirmDialog open title="¿Confirmar?" pending onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("Cancelar").closest("button")).toBeDisabled();
    expect(screen.getByText("Confirmar").closest("button")).toBeDisabled();
  });
});
