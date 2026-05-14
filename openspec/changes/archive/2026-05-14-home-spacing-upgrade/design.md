# Design: Spacing upgrade del home

## Resumen técnico

Cambio puramente cosmético sobre `src/app/page.tsx`. Se ajustan las clases Tailwind de spacing vertical de cada `<section>` para igualar la cadencia visual de la página `/institucional`. No se modifica el JSX interno, ni los componentes hijos, ni la lógica de fetch del Server Component.

## Decisiones clave

### 1. Tabla de spacing por sección

| # | Sección | Padding actual | Padding nuevo | Notas |
|---|---------|----------------|---------------|-------|
| 1 | Hero | `pt-24 pb-40` | `min-h-screen` (sin `pt`/`pb`) | Contenido centrado verticalmente con `items-center` en el grid interno |
| 2 | Por qué asociarte | `pb-24` (sin `pt`) | `py-28 md:py-40` | Estandariza spacing simétrico arriba/abajo |
| 3 | Noticias + Agenda | `py-20` | `py-28 md:py-40` | Igual cadencia que las demás |
| 4 | KineClub | `py-24` | `py-28 md:py-40` | Sección con fondo `bg-blue-950`, gana respiro |
| 5 | Obras Sociales | `py-24` | `py-28 md:py-40` | Igual cadencia |
| 6 | CTA | `py-28` | `py-32 md:py-44` | Escalón superior para cierre con peso |

### 2. Hero con `min-h-screen`

- Reemplazo de `pt-24 pb-40` por `min-h-screen` en la `<section>` del hero.
- El grid interno (`grid grid-cols-1 lg:grid-cols-2 gap-16`) ya tiene `items-center` — se conserva tal cual. El `min-h-screen` empuja el contenedor `<section>` a ocupar al menos la altura del viewport y, dado que el contenido vive dentro de un wrapper con `relative z-10`, queda visualmente centrado.
- Si el `mx-auto max-w-7xl` interno no centra solo, se agrega `flex items-center` en la `<section>` o se envuelve el wrapper en un contenedor flex. Decisión preferente: agregar `flex items-center` directamente a la `<section>` para no tocar la estructura interna.
- El `<WaveTransition position="bottom">` se mantiene: queda anclado al borde inferior de la section (es `absolute bottom-0` por contrato del componente), por lo que sigue funcionando correctamente con `min-h-screen`.
- El grid pattern y `<HeroGlows />` mantienen sus posicionamientos absolutos sin cambios.

### 3. Patrón `py-28 md:py-40` para secciones intermedias

- Se aplica a las cuatro secciones intermedias (2, 3, 4, 5) sin excepciones, para garantizar cadencia regular al hacer scroll.
- `py-28` en mobile (7rem ≈ 112px) sigue siendo generoso pero proporcional al viewport mobile.
- `md:py-40` en desktop (10rem ≈ 160px) iguala el patrón ya validado en `/institucional`.

### 4. CTA con `py-32 md:py-44` (un escalón arriba)

- El cierre del home (sección CTA) recibe un padding levemente superior al resto (`py-32 md:py-44` en vez de `py-28 md:py-40`).
- Razón: el CTA es la última pieza antes del footer y se beneficia de un colchón final más amplio que reafirme el final de la página. Mismo criterio que en piezas largas tipo landing.
- `py-32` ≈ 8rem; `md:py-44` ≈ 11rem.

### 5. No se toca `max-w-7xl`

- El home tiene contenido más denso que `/institucional`: cards de noticias en grid de 2 cols, agenda con cards detalladas, grid de 3 cols en KineClub, lista de obras sociales en flex-wrap. El ancho `max-w-7xl` (80rem) está justificado y no debe estrecharse a `max-w-6xl` ni a `max-w-5xl` como en algunas secciones de institucional.
- Padding horizontal (`px-4 sm:px-6 lg:px-8`) se conserva idéntico.

### 6. No se tocan grids ni gaps internos

- `gap-16` del hero, `gap-12` de noticias+agenda, `gap-6` de KineClub, `gap-16` de obras sociales: todos quedan iguales.
- `mb-*` interno (`mb-8`, `mb-10`, `mb-12`, `mb-16`) de los headers de cada sección: queda igual. El cambio es solo de **padding de la `<section>`**, no de spacing interno.

### 7. Wave transition y fondos

- La `<WaveTransition>` entre hero (`bg-slate-900`) y "Por qué asociarte" (`bg-slate-50`) sigue siendo necesaria y queda como está. El `min-h-screen` no rompe su posicionamiento.
- Los fondos de cada sección (`bg-slate-900`, `bg-slate-50`, `bg-white`, `bg-blue-950`, `bg-white`) se mantienen idénticos. La alternancia de colores ya da ritmo visual; el spacing nuevo lo refuerza.

## Constraints respetados

- Sin px fijos: todos los tokens son escalas Tailwind (`min-h-screen`, `py-28`, `md:py-40`, `py-32`, `md:py-44`).
- Sin tocar componentes hijos ni layouts globales.
- Sin tocar lógica de fetch, repositorios ni props.
- Sin `console.log`, sin `"use client"` agregado.
- Default export `async function Home()` intacto.
- Responsive: prefijos `md:` en todos los paddings nuevos.

## Riesgos y mitigaciones

- **Riesgo**: `min-h-screen` en el hero puede dejar demasiado espacio vacío en viewports muy altos (monitores verticales, ultra-wides).
  **Mitigación**: El contenido centrado con `items-center` queda visualmente correcto independientemente de la altura. El `<WaveTransition>` siempre cierra el borde inferior.

- **Riesgo**: En mobile (viewport corto), `min-h-screen` puede empujar contenido hacia abajo de forma incómoda si la barra de URL del navegador ocupa altura variable.
  **Mitigación**: `min-h-screen` (no `h-screen`) permite que el contenido fluya naturalmente si crece más allá del viewport. El comportamiento es estándar y aceptado en hero sections.

- **Riesgo**: `py-40` en cuatro secciones consecutivas puede percibirse como excesivo si el contenido de cada sección es corto.
  **Mitigación**: Las secciones del home tienen contenido sustantivo (grids de cards, listas, headers grandes). El padding refuerza la jerarquía sin generar páginas vacías. Si en revisión se detecta exceso puntual, el ajuste futuro queda acotado a tocar una sola clase.

- **Riesgo**: Inconsistencia entre el padding del CTA (`py-32 md:py-44`) y el del resto (`py-28 md:py-40`).
  **Mitigación**: La diferencia es intencional y mínima (un step de Tailwind: 28→32, 40→44). Refuerza el cierre sin romper la cadencia.
