# Tasks: Spacing upgrade del home

Ajuste mecánico de paddings verticales en cada `<section>` de `src/app/page.tsx`. Marcar con `[x]` a medida que se completan.

## Implementación

- [x] **Hero**: reemplazar `pt-24 pb-40` por `min-h-screen flex items-center` en la `<section>` del hero (línea ~77). Verificar que el grid interno con `items-center` siga centrando contenido correctamente y que `<WaveTransition position="bottom">` siga anclado al borde inferior.
- [x] **Por qué asociarte**: reemplazar `pb-24` por `py-28 md:py-40` en la `<section>` con `bg-slate-50` (línea ~134).
- [x] **Noticias + Agenda**: reemplazar `py-20` por `py-28 md:py-40` en la `<section>` condicional (línea ~183).
- [x] **KineClub**: reemplazar `py-24` por `py-28 md:py-40` en la `<section>` con `bg-blue-950` (línea ~284).
- [x] **Obras Sociales**: reemplazar `py-24` por `py-28 md:py-40` en la `<section>` con `bg-white` (línea ~348).
- [x] **CTA**: reemplazar `py-28` por `py-32 md:py-44` en la `<section>` con `border-t border-slate-100` (línea ~391).
- [x] **Verificación final**: correr el dev server, recorrer el home en desktop y mobile, confirmar que el hero ocupa la altura del viewport, las secciones intermedias tienen cadencia uniforme, el CTA cierra con peso, no hay regresiones visuales en componentes hijos (`HeroGlows`, `FloatingStatPills`, `WaveTransition`, `ScrollReveal`, `TextReveal`, `ParallaxLayer`, `CtaPills`), no quedan `console.log` y el archivo no introdujo `"use client"`.
