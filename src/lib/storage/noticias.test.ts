import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: { storage: { from: vi.fn() } },
}));

import { supabaseAdmin } from "@/lib/supabase/admin";
import { borrarImagenesDeStorage, extraerPathDelBucket } from "./noticias";

const mockRemove = vi.fn();
const mockFrom = vi.mocked(supabaseAdmin.storage.from);

const URL_BUCKET = "https://proj.supabase.co/storage/v1/object/public/noticias-imagenes/1780-abc.jpg";
const URL_EXTERNA = "https://images.unsplash.com/photo-123";

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockReturnValue({ remove: mockRemove } as any);
});

describe("extraerPathDelBucket", () => {
  it("extrae el path relativo al bucket de una URL propia", () => {
    expect(extraerPathDelBucket(URL_BUCKET)).toBe("1780-abc.jpg");
  });

  it("devuelve null para una URL externa que no pertenece al bucket", () => {
    expect(extraerPathDelBucket(URL_EXTERNA)).toBeNull();
  });

  it("devuelve null para una URL inválida", () => {
    expect(extraerPathDelBucket("no-es-una-url")).toBeNull();
  });
});

describe("borrarImagenesDeStorage", () => {
  it("no llama a remove cuando todas las URLs son externas", async () => {
    mockRemove.mockResolvedValue({ error: null });

    await borrarImagenesDeStorage([URL_EXTERNA]);

    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it("extrae bien el path y llama a remove solo con las URLs del bucket propio", async () => {
    mockRemove.mockResolvedValue({ error: null });

    await borrarImagenesDeStorage([URL_EXTERNA, URL_BUCKET]);

    expect(mockFrom).toHaveBeenCalledWith("noticias-imagenes");
    expect(mockRemove).toHaveBeenCalledWith(["1780-abc.jpg"]);
  });

  it("no lanza si Storage falla (best-effort)", async () => {
    mockRemove.mockRejectedValue(new Error("boom"));

    await expect(borrarImagenesDeStorage([URL_BUCKET])).resolves.toBeUndefined();
  });

  it("no hace nada con una lista vacía", async () => {
    await borrarImagenesDeStorage([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
