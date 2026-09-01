import type { Metadata } from "next";
import { SITE_URL } from "./site";

/**
 * Metadata raiz del sitio.
 *
 * Vive en su propio modulo (y no dentro de `layout.tsx`) por dos razones:
 * es una funcion pura testeable, y deja el dominio en un solo lugar — la base
 * llega desde `site.ts`, nunca hardcodeada.
 */

const TITULO = "Círculo de Kinesiólogos de Mendoza | Institución Profesional";

const DESCRIPCION =
  "Entidad que agrupa y representa a los profesionales de la kinesiología en la provincia de Mendoza, Argentina.";

/** Tarjeta 1200x630 que se muestra al compartir el link. */
export const OG_IMAGE = "/og-image.png";

export function construirMetadataRaiz(base: string = SITE_URL): Metadata {
  return {
    metadataBase: new URL(base),
    title: TITULO,
    description: DESCRIPCION,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: "es_AR",
      url: base,
      siteName: "Círculo de Kinesiólogos de Mendoza",
      title: TITULO,
      description: DESCRIPCION,
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: "Círculo de Kinesiólogos y Fisioterapeutas de Mendoza",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: TITULO,
      description: DESCRIPCION,
      images: [OG_IMAGE],
    },
    icons: {
      icon: "/icon.png",
    },
  };
}
