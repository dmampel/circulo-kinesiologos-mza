import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: { storage: { from: vi.fn() } },
}));

import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolverCambioLogo, borrarLogoDeStorage } from "./beneficios";

const mockRemove = vi.fn();
const mockFrom = vi.mocked(supabaseAdmin.storage.from);

const PROPIA = "https://proj.supabase.co/storage/v1/object/public/beneficios-logos/1-a.png";
const INSTA = "https://scontent.cdninstagram.com/v/x.jpg";
const NUEVA = "https://proj.supabase.co/storage/v1/object/public/beneficios-logos/2-b.png";

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockReturnValue({ remove: mockRemove } as unknown as ReturnType<typeof supabaseAdmin.storage.from>);
});

describe("resolverCambioLogo", () => {
  it("el archivo gana sobre la URL pegada", () => {
    expect(resolverCambioLogo({ actual: PROPIA, subida: NUEVA, urlPegada: "https://x.com/l.png", quitar: false }))
      .toEqual({ logo_url: NUEVA, aBorrar: PROPIA });
  });
  it("quitar deja null y borra el actual", () => {
    expect(resolverCambioLogo({ actual: PROPIA, subida: null, urlPegada: null, quitar: true }))
      .toEqual({ logo_url: null, aBorrar: PROPIA });
  });
  it("URL nueva reemplaza al actual", () => {
    expect(resolverCambioLogo({ actual: PROPIA, subida: null, urlPegada: "https://x.com/l.png", quitar: false }))
      .toEqual({ logo_url: "https://x.com/l.png", aBorrar: PROPIA });
  });
  it("URL igual a la actual no borra", () => {
    expect(resolverCambioLogo({ actual: INSTA, subida: null, urlPegada: INSTA, quitar: false }))
      .toEqual({ logo_url: INSTA, aBorrar: null });
  });
  it("nada cambia", () => {
    expect(resolverCambioLogo({ actual: INSTA, subida: null, urlPegada: null, quitar: false }))
      .toEqual({ logo_url: INSTA, aBorrar: null });
  });
});

describe("borrarLogoDeStorage", () => {
  it("borra un logo del bucket", async () => {
    mockRemove.mockResolvedValue({ error: null });
    await borrarLogoDeStorage(PROPIA);
    expect(mockFrom).toHaveBeenCalledWith("beneficios-logos");
    expect(mockRemove).toHaveBeenCalledWith(["1-a.png"]);
  });
  it("ignora URLs de Instagram y null", async () => {
    await borrarLogoDeStorage(INSTA);
    await borrarLogoDeStorage(null);
    expect(mockRemove).not.toHaveBeenCalled();
  });
  it("traga el error de Storage", async () => {
    mockRemove.mockRejectedValue(new Error("boom"));
    await expect(borrarLogoDeStorage(PROPIA)).resolves.toBeUndefined();
  });
});
