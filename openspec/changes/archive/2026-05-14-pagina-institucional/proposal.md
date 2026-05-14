# Proposal: Rediseño de la página institucional

## Intent

### Qué
Rediseñar completamente la página `/institucional` (`src/app/institucional/page.tsx`) reemplazando el contenido placeholder por una pieza institucional completa que comunique la identidad, misión, historia, autoridades, documentos públicos y datos de contacto del Círculo de Kinesiólogos y Fisioterapeutas de Mendoza.

### Por qué
La página actual presenta texto genérico y secciones placeholder ("Nuestra Historia", "Ejes de Gestión") sin contenido sustantivo, y deriva la información concreta (autoridades, estatuto) a otras rutas. Esto:

- Diluye la página institucional como pieza de presentación oficial del Círculo.
- Obliga al visitante (socios, autoridades sanitarias, periodistas, profesionales que evalúan asociarse) a navegar entre rutas para armarse una imagen institucional completa.
- No expone canales de contacto ni ubicación física, datos clave para una organización gremial.

El rediseño consolida la página como el lugar único y autorizado para conocer al Círculo: quiénes somos, qué hacemos, quién lo conduce, qué documentos nos rigen y cómo contactarnos.

## Scope

### In Scope
- Reemplazo completo del JSX de `src/app/institucional/page.tsx`.
- Actualización del copy institucional con los textos oficiales provistos para descripción, misión y visión.
- Sección **Timeline / Historia** con hitos institucionales (datos placeholder, marcados como tales para iteración futura del cliente).
- Sección **Comisión Directiva** con layout "featured + grid":
  - Card destacada del Presidente, visualmente más prominente.
  - Grilla con el resto de los cargos.
  - Avatares con iniciales sobre fondo de color (sin fotos reales).
  - Datos hardcodeados como placeholder.
- Sección **Documentos Institucionales** con links a estatuto, código de ética, aranceles y actas (URLs o anchors placeholder).
- Sección **Contacto + Mapa**:
  - Dirección: Eusebio Blanco 148, Capital, Mendoza.
  - Email: presidencia@kinesiologosmza.com.
  - Teléfono: +54 9 261 3619468.
  - Mapa embebido de Google Maps apuntando a la dirección.

### Out of Scope
- Persistencia en base de datos: todo el contenido queda hardcodeado en el componente. No se crean tablas, repositorios ni Server Actions.
- CMS o panel de administración para editar comisión directiva, hitos o documentos desde el front.
- Subida real de PDFs (estatuto, código de ética, actas): se dejan como links placeholder. La carga efectiva de archivos es un change posterior.
- Fotos reales de la comisión directiva: se usan avatares con iniciales.
- Cambios a las rutas vecinas `/autoridades` y `/estatuto` (se evaluará en archive si quedan obsoletas).
- SEO avanzado (metadata, JSON-LD): no se incluye en este change para mantener el alcance acotado.
- Internacionalización / multi-idioma.

## Approach

### Estrategia general
Reescribir el archivo `src/app/institucional/page.tsx` como un **Server Component** plano (no requiere interactividad ni estado), respetando los pilares de arquitectura y los principios de UI/UX premium definidos en `AGENTS.md`.

### Estructura de secciones (de arriba hacia abajo)
1. **Hero** — Título institucional + descripción larga oficial.
2. **Misión y Visión** — Dos cards lado a lado (grid de 2 columnas en md+), con tratamiento visual diferenciado (light/dark) para jerarquizar.
3. **Historia / Timeline** — Lista vertical de hitos con año + título + descripción breve. Línea vertical conectora estilo timeline.
4. **Comisión Directiva** — Card featured del Presidente (full width, layout horizontal con avatar grande) + grilla de 2-3 columnas para el resto de los cargos.
5. **Documentos Institucionales** — Grid de tarjetas con icono, título y descripción breve, cada una funcionando como link.
6. **Contacto + Mapa** — Layout de 2 columnas: columna izquierda con datos de contacto (dirección, email, tel), columna derecha con `<iframe>` de Google Maps embebido. En mobile, se apilan.

### Convenciones técnicas
- **Server-First**: componente sin `"use client"`. Toda la data va inline como constantes tipadas.
- **Datos como constantes**: definir arrays/objetos tipados (`hitos`, `comisionDirectiva`, `documentos`) al inicio del archivo para que sean trivialmente editables más adelante.
- **Iconos**: continuar con `lucide-react` (ya usado en el archivo actual).
- **Maps**: `<iframe>` directo a Google Maps embed URL. Sin librerías adicionales.
- **Avatares con iniciales**: derivar iniciales del nombre en tiempo de render; color de fondo por hash determinista o por cargo (lista cerrada de paletas Tailwind).
- **Links a documentos**: usar `<Link>` de Next o `<a target="_blank" rel="noopener">` según destino, con `href="#"` placeholder donde aún no exista el recurso.

### Tailwind / estética
- Mantener la paleta y el sistema del archivo actual: `bg-slate-50`, blancos, azules CKM (`text-blue-600`, `bg-blue-50`), negros profundos (`bg-slate-900`).
- Rounded corners grandes (`rounded-[3rem]`, `rounded-[2rem]`).
- Sombras sutiles (`shadow-sm`, `shadow-xl` puntual).
- Tipografía: `font-black` + `tracking-tighter` para títulos grandes (consistente con el resto del sitio).
- Glassmorphism opcional en la card featured del Presidente si encaja sin sobrecargar.
- Responsive con prefijos (`md:`, `lg:`); no se usan px fijos salvo bordes de 1px.

## Constraints

- **Sin backend**: no hay base de datos, ni Prisma, ni Server Actions, ni RLS involucrados. Todo el contenido vive en el archivo del componente.
- **Datos placeholder identificables**: las secciones con datos hardcodeados que serán reemplazados por el cliente (hitos del timeline, miembros de la comisión directiva, links a documentos) deben quedar agrupados como constantes al tope del archivo, fácilmente localizables para edición futura, idealmente con un comentario marcador (`// TODO: replace with real data`).
- **Sin fotos reales**: el rediseño no debe asumir disponibilidad de imágenes; los avatares se construyen con CSS + iniciales.
- **Mapa embebido sin API key**: usar la URL pública de embed de Google Maps (no Maps JavaScript API) para no introducir variables de entorno ni dependencias.
- **Compatibilidad con el resto del sitio**: respetar la convención de Next 15 App Router de este repo (ver advertencia en `AGENTS.md` sobre breaking changes). El componente debe seguir siendo el default export de `page.tsx`.
- **Responsive obligatorio**: cumplir las reglas de `AGENTS.md` — usar `rem`/escalas Tailwind, nada de px fijos en spacing/typography, tipografía fluida en titulares.
- **Sin console.log** en el archivo final.
- **Alcance del change cerrado**: aunque el rediseño expone links a documentos y referencias a autoridades, este change NO modifica ni elimina las páginas `/autoridades` ni `/estatuto`. Esa limpieza, si corresponde, se decide al archivar.
