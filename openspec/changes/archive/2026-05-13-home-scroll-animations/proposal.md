## Why

El home público se siente estático: todas las secciones aparecen ya renderizadas sin movimiento, lo que reduce el impacto visual y la percepción de calidad del sitio. Agregar animaciones de scroll (fade-in, slide-up, stagger) da vida a la página sin sacrificar performance.

## What Changes

- Animaciones de entrada al hacer scroll en todas las secciones del home (`src/app/page.tsx`)
- Componente reutilizable `ScrollReveal` para envolver elementos con animación de aparición
- Animación stagger en grillas (pillars, noticias, beneficios KineClub, obras sociales)
- Efecto parallax sutil en el hero (glow blobs)
- Contador animado en los stats del hero (FloatingStatPills)

## Capabilities

### New Capabilities
- `home-scroll-animations`: Animaciones de scroll para el home público — fade-in, slide-up, stagger y parallax.

### Modified Capabilities
- `home-presentation`: La presentación del home incorpora animaciones progresivas al hacer scroll.

## Impact

- `src/app/page.tsx` — wrapping de secciones con `ScrollReveal`
- `src/components/ScrollReveal.tsx` — nuevo componente client con Intersection Observer
- `src/components/FloatingStatPills.tsx` — contador animado al entrar en viewport
- No hay cambios de base de datos ni migraciones
- Dependencia: `framer-motion` (ya en el stack definido en AGENTS.md)
