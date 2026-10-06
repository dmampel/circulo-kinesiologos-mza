import { describe, it, expect } from "vitest";
import { extraerPathDelBucket } from "./bucketPath";

const URL_BUCKET = "https://proj.supabase.co/storage/v1/object/public/beneficios-logos/1780-abc.png";

describe("extraerPathDelBucket", () => {
  it("extrae el path de una URL propia", () => {
    expect(extraerPathDelBucket(URL_BUCKET, "beneficios-logos")).toBe("1780-abc.png");
  });
  it("devuelve null para una URL externa", () => {
    expect(extraerPathDelBucket("https://scontent.cdninstagram.com/x.jpg", "beneficios-logos")).toBeNull();
  });
  it("devuelve null para una URL inválida", () => {
    expect(extraerPathDelBucket("no-es-una-url", "beneficios-logos")).toBeNull();
  });
  it("devuelve null si la URL es de otro bucket", () => {
    expect(extraerPathDelBucket(URL_BUCKET, "noticias-imagenes")).toBeNull();
  });
});
