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
  { source: "/padron-de-profesionales", destination: "/profesionales", permanent: true },

  // Rutas habituales de WordPress cuyo contenido hoy vive en /institucional.
  // Si nunca existieron, la redireccion queda inerte.
  { source: "/nosotros", destination: "/institucional", permanent: true },
  { source: "/contacto", destination: "/institucional", permanent: true },

  // WooCommerce del sitio anterior (tienda de categorias de especialidad/zona
  // que hacia de padron). Son la mayoria de los 404 reportados en Search
  // Console: URLs de "agregar al carrito" que nunca debieron indexarse.
  { source: "/categoria-producto/:path*", destination: "/profesionales", permanent: true },

  // Archivo de autor de WordPress (perfil de un profesional que era usuario del blog).
  { source: "/author/:path*", destination: "/profesionales", permanent: true },
  { source: "/category/uncategorized", destination: "/noticias", permanent: true },

  // Paginas .html del sitio pre-WooCommerce.
  { source: "/index.html", destination: "/", permanent: true },
  { source: "/kineclub.html", destination: "/kineclub", permanent: true },
  { source: "/asociate_kineclub.html", destination: "/kineclub", permanent: true },
  { source: "/asociate.html", destination: "/registro", permanent: true },
  { source: "/obras_sociales.html", destination: "/obras-sociales", permanent: true },
  // Articulo puntual por ID que ya no existe; no hay forma de mapear a una
  // noticia nueva especifica, va al listado.
  { source: "/not.html", destination: "/noticias", permanent: true },

  { source: "/beneficios/coberturas", destination: "/obras-sociales", permanent: true },
  { source: "/beneficios/coberturas-assure", destination: "/obras-sociales", permanent: true },
];
