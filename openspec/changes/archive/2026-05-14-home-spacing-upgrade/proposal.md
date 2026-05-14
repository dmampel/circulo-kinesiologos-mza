# Proposal: Spacing upgrade del home

## Intent

### Qué
Aplicar al home (`src/app/page.tsx`) el mismo tratamiento de espaciado vertical generoso que ya tiene la página `/institucional`. Cada sección debe ganar peso visual propio y aproximarse a la sensación de "llenar la pantalla" al hacer scroll, sin tocar el contenido ni la estructura interna de las secciones.

### Por qué
El home actual usa paddings verticales acotados (`py-20`, `py-24`, `pt-24 pb-40`) que comprimen las secciones unas contra otras. La página `/institucional` se rediseñó con secciones de alto impacto (`min-h-screen` en hero, `py-24 md:py-40` en el resto, tipografía masiva, layout que respira) y quedó claramente más premium. Hoy el home rompe esa consistencia: tiene el mismo contenido valioso pero apretado.

Este change iguala la cadencia visual entre ambas piezas — sin rediseñar el home, solo dándole aire — para que el scroll del home transmita el mismo sentido de jerarquía y peso institucional.

## Scope

### In Scope
- Ajuste de paddings verticales en cada `<section>` de `src/app/page.tsx`:
  - **Hero**: pasar de `pt-24 pb-40` a `min-h-screen` con contenido centrado verticalmente.
  - **Por qué asociarte**: pasar de `pb-24` (sin `pt`) a `py-28 md:py-40`.
  - **Noticias + Agenda**: pasar de `py-20` a `py-28 md:py-40`.
  - **KineClub**: pasar de `py-24` a `py-28 md:py-40`.
  - **Obras Sociales**: pasar de `py-24` a `py-28 md:py-40`.
  - **CTA**: pasar de `py-28` a `py-32 md:py-44` (cierre con más peso).
- Activar `items-center` en el grid del hero para que el contenido respire dentro del `min-h-screen`.

### Out of Scope
- Rediseño de contenido: copy, tipografía, jerarquía interna y data del home no cambian.
- Cambios a componentes hijos (`HeroGlows`, `FloatingStatPills`, `ScrollReveal`, `TextReveal`, `ParallaxLayer`, `WaveTransition`, `CtaPills`).
- Cambios a `max-w-7xl` o a paddings horizontales (`px-4 sm:px-6 lg:px-8`). El home tiene contenido más denso que el institucional y el ancho mayor está justificado.
- Cambios a grids internos, gaps entre tarjetas, o `mb-*` dentro de cada sección.
- Cambios a otras páginas (`/institucional`, `/profesionales`, etc.).
- Cambios a layouts globales (`layout.tsx`), navbar o footer.

## Approach

### Estrategia general
Ajuste mecánico de clases Tailwind sobre cada elemento `<section>` de `src/app/page.tsx`. No se introducen variables nuevas, no se refactoriza JSX, no se mueven elementos. Solo se reemplazan tokens de spacing en el atributo `className` de cada `<section>`.

### Patrón de spacing aplicado
- **Hero**: `min-h-screen` + `flex items-center` (o `items-center` en el grid interno) para anclar el contenido al centro vertical del viewport.
- **Secciones intermedias**: `py-28 md:py-40` — mismo patrón que `/institucional`.
- **CTA final**: `py-32 md:py-44` — un escalón por encima para que el cierre tenga más peso que las secciones intermedias.

### Convenciones técnicas
- Tailwind CSS 4 (ya configurado en el repo).
- Sin px fijos: solo escalas de Tailwind (`py-28`, `md:py-40`, `min-h-screen`).
- Responsive con prefijo `md:` — el `py-28` base sirve en mobile, el `md:py-40` da el respiro completo en desktop.
- Sin tocar imports, sin tocar lógica de fetch, sin tocar repositorios.

## Constraints

- **Sin cambios de contenido**: copy, datos, props y children de cada sección quedan idénticos.
- **Sin tocar componentes hijos**: el cambio vive exclusivamente en `src/app/page.tsx`.
- **Wave transition**: el `<WaveTransition>` del hero debe seguir funcionando correctamente con el nuevo `min-h-screen` (ya está posicionado absoluto en bottom, no requiere cambios).
- **Responsive obligatorio**: la versión mobile no debe quedar con un padding excesivo. El patrón `py-28 md:py-40` ya respeta esto (28 es razonable en mobile, 40 expande en desktop).
- **Sin px fijos** en spacing/typography, según `AGENTS.md`.
- **Sin `console.log`** en el archivo final.
- **Default export intacto**: `Home` sigue siendo el default export `async` de `src/app/page.tsx`.
