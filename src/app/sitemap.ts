import { MetadataRoute } from "next";
import { ProfesionalRepository } from "@/lib/repositories/ProfesionalRepository";
import { NoticiaRepository } from "@/lib/repositories/NoticiaRepository";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.circulokinesiologos.com.ar";

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: BASE_URL, priority: 1.0, changeFrequency: "weekly" },
  { url: `${BASE_URL}/institucional`, priority: 0.8, changeFrequency: "monthly" },
  { url: `${BASE_URL}/profesionales`, priority: 0.9, changeFrequency: "weekly" },
  { url: `${BASE_URL}/noticias`, priority: 0.8, changeFrequency: "daily" },
  { url: `${BASE_URL}/kineclub`, priority: 0.7, changeFrequency: "monthly" },
  { url: `${BASE_URL}/obras-sociales`, priority: 0.7, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [profesionales, noticias] = await Promise.all([
    ProfesionalRepository.findAllSlugsForSitemap(),
    NoticiaRepository.findAllSlugsForSitemap(),
  ]);

  const profesionalesRoutes: MetadataRoute.Sitemap = profesionales.map((p) => ({
    url: `${BASE_URL}/profesionales/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const noticiasRoutes: MetadataRoute.Sitemap = noticias.map((n) => ({
    url: `${BASE_URL}/noticias/${n.slug}`,
    lastModified: n.publicada_en ?? undefined,
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...STATIC_ROUTES, ...profesionalesRoutes, ...noticiasRoutes];
}
