import type { NextConfig } from "next";
import { REDIRECCIONES_LEGADO } from "./src/lib/redirecciones";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 6mb: el máximo declarado para un CV en la bolsa de trabajo es 5 MB
      // (openspec/changes/bolsa-de-trabajo — design.md D4 / tasks.md 2.5), y el
      // multipart de la Server Action agrega overhead de encoding + los demás
      // campos de texto del formulario. 4mb se quedaba corto para ese caso.
      bodySizeLimit: "6mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async redirects() {
    return REDIRECCIONES_LEGADO;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
