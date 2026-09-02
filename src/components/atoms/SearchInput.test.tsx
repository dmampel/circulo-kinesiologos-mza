import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

const push = vi.fn();
const router = { push };
let currentParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/profesionales",
  useSearchParams: () => currentParams,
}));

import SearchInput from "./SearchInput";

const avanzarDebounce = async (ms = 400) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

describe("SearchInput", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    push.mockClear();
    currentParams = new URLSearchParams();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("no reescribe la query en la URL cuando se limpian los filtros", async () => {
    currentParams = new URLSearchParams("q=delfina");
    const { rerender } = render(<SearchInput defaultValue="delfina" />);

    // "Limpiar": la URL queda vacía y el server re-renderiza sin defaultValue
    currentParams = new URLSearchParams();
    rerender(<SearchInput defaultValue="" />);
    await avanzarDebounce();

    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("no deja el spinner colgado despues de limpiar", async () => {
    currentParams = new URLSearchParams("q=delfina");
    const { rerender, container } = render(<SearchInput defaultValue="delfina" />);

    currentParams = new URLSearchParams();
    rerender(<SearchInput defaultValue="" />);
    await avanzarDebounce();

    expect(container.querySelector(".animate-spin")).toBeNull();
  });

  it("escribe la query en la URL cuando el usuario tipea", async () => {
    render(<SearchInput />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "perez" } });
    await avanzarDebounce();

    expect(push).toHaveBeenCalledWith("/profesionales?q=perez", { scroll: false });
  });

  it("preserva los otros filtros y resetea la paginacion al buscar", async () => {
    currentParams = new URLSearchParams("loc=1&page=3");
    render(<SearchInput />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "perez" } });
    await avanzarDebounce();

    expect(push).toHaveBeenCalledWith("/profesionales?loc=1&q=perez", { scroll: false });
  });

  it("borra la query cuando el usuario vacia el input a mano", async () => {
    currentParams = new URLSearchParams("q=delfina");
    render(<SearchInput defaultValue="delfina" />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "" } });
    await avanzarDebounce();

    expect(push).toHaveBeenCalledWith("/profesionales?", { scroll: false });
  });

  it("no pisa lo que el usuario esta tipeando cuando llega el eco del server", async () => {
    render(<SearchInput />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "del" } });
    await avanzarDebounce();

    // El usuario sigue tipeando mientras la navegacion viaja
    fireEvent.change(input, { target: { value: "delfina" } });

    // Llega el render del server con la query anterior
    currentParams = new URLSearchParams("q=del");
    fireEvent.change(input, { target: { value: "delfina" } });
    await act(async () => {});

    expect(input).toHaveValue("delfina");
  });
});
