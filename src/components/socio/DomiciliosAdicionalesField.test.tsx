import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import DomiciliosAdicionalesField from "./DomiciliosAdicionalesField";

const localidades = [
  { id: "loc-1", nombre: "Ciudad" },
  { id: "loc-2", nombre: "Godoy Cruz" },
];

const json = (c: HTMLElement) =>
  JSON.parse((c.querySelector('input[name="domiciliosAdicionales"]') as HTMLInputElement).value);

describe("DomiciliosAdicionalesField", () => {
  it("agrega una fila y serializa dirección + localidad elegida", () => {
    const { container } = render(<DomiciliosAdicionalesField localidades={localidades} />);
    fireEvent.click(screen.getByRole("button", { name: /agregar otro domicilio/i }));

    fireEvent.change(screen.getByLabelText(/^dirección/i), { target: { value: "San Lorenzo 354" } });
    fireEvent.change(screen.getByLabelText(/^localidad/i), { target: { value: "loc-2" } });

    expect(json(container)).toEqual([{ direccion: "San Lorenzo 354", localidadId: "loc-2" }]);
    expect((screen.getByLabelText(/^localidad/i) as HTMLSelectElement).value).toBe("loc-2");
  });

  it("al quitar una fila del medio conserva los valores de las demás", () => {
    const { container } = render(
      <DomiciliosAdicionalesField
        localidades={localidades}
        defaultValue={[
          { direccion: "A 1", localidadId: "loc-1" },
          { direccion: "B 2", localidadId: "loc-2" },
          { direccion: "C 3", localidadId: "loc-1" },
        ]}
      />
    );
    fireEvent.click(screen.getAllByRole("button", { name: /quitar/i })[1]);

    expect(json(container)).toEqual([
      { direccion: "A 1", localidadId: "loc-1" },
      { direccion: "C 3", localidadId: "loc-1" },
    ]);
    const selects = screen.getAllByLabelText(/^localidad/i) as HTMLSelectElement[];
    expect(selects.map((s) => s.value)).toEqual(["loc-1", "loc-1"]);
    const inputs = screen.getAllByLabelText(/^dirección/i) as HTMLInputElement[];
    expect(inputs.map((i) => i.value)).toEqual(["A 1", "C 3"]);
  });

  it("avisa al padre en cada cambio sin exponer ids internos", () => {
    const calls: unknown[] = [];
    render(<DomiciliosAdicionalesField localidades={localidades} onChange={(r) => calls.push(r)} />);
    fireEvent.click(screen.getByRole("button", { name: /agregar otro domicilio/i }));
    expect(calls.at(-1)).toEqual([{ direccion: "", localidadId: "" }]);
  });
});
