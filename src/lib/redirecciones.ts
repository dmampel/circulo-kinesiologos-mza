/**
 * Redirecciones de las URLs del sitio anterior (WordPress).
 *
 * Al migrar a Vercel, las URLs viejas que Google tiene indexadas empezaron a
 * dar 404. El caso grave: `/padron` es el PRIMER resultado de Google para
 * "kinesiologos mendoza" — quien hacia click caia en una pagina de error.
 *
 * Todas son permanentes (301) a proposito: un 302 no transfiere el
 * posicionamiento y Google seguiria mostrando la URL vieja.
 */

export type Redireccion = {
  source: string;
  destination: string;
  permanent: boolean;
};

export const REDIRECCIONES_LEGADO: Redireccion[] = [
  // Confirmada: aparece indexada en Google como resultado #1.
  { source: "/padron", destination: "/profesionales", permanent: true },
  { source: "/padron/:path*", destination: "/profesionales", permanent: true },

  // Rutas habituales de WordPress cuyo contenido hoy vive en /institucional.
  // Si nunca existieron, la redireccion queda inerte.
  { source: "/nosotros", destination: "/institucional", permanent: true },
  { source: "/contacto", destination: "/institucional", permanent: true },
];
