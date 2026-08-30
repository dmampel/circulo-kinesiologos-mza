import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/mi-panel/", "/api/", "/auth/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
