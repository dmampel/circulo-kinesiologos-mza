## Context

El home usa Server Components puros. `framer-motion@12` ya está instalado. Las secciones actualmente no tienen ningún tipo de animación de entrada — todo aparece ya visible al cargar. `FloatingStatPills` ya es un Client Component con CSS animations.

## Goals / Non-Goals

**Goals:**
- Fade-in + slide-up al hacer scroll en cada sección del home
- Stagger (aparición secuencial) en grillas de cards (noticias, KineClub, obras sociales, pillars)
- Parallax sutil en los glow blobs del hero
- Contador animado en `FloatingStatPills` al entrar en viewport

**Non-Goals:**
- Animaciones en páginas distintas al home
- Animaciones en componentes del portal del socio
- Rediseño visual de ninguna sección

## Decisions

### 1. `ScrollReveal` con framer-motion + `useInView`

Crear un componente Client `ScrollReveal` que usa `motion.div` + `useInView` de framer-motion. Cada sección del home se envuelve en un `ScrollReveal` que dispara la animación una sola vez al entrar en el viewport (`once: true`).

**Alternativa descartada**: CSS puro con `@keyframes` + Intersection Observer manual — más verboso y menos flexible para stagger.

### 2. Variantes predefinidas: `fadeUp`, `fadeIn`, `staggerContainer` + `staggerItem`

Definir variantes reutilizables en un archivo `src/lib/animations.ts`:
- `fadeUp`: translateY(32px → 0) + opacity(0 → 1)
- `fadeIn`: solo opacity(0 → 1)
- `staggerContainer`: `staggerChildren: 0.1`
- `staggerItem`: `fadeUp` aplicado a cada hijo

Esto permite que `page.tsx` sea declarativo: solo wrappea secciones, no define animaciones inline.

### 3. Contador animado en `FloatingStatPills`

Usar `useMotionValue` + `useTransform` + `animate` de framer-motion para contar desde 0 hasta el valor real cuando el pill entra en viewport. Trigger con `useInView`.

### 4. `page.tsx` sigue siendo Server Component

`ScrollReveal` es Client. `page.tsx` importa `ScrollReveal` y lo usa como wrapper — esto es válido en Next.js App Router (Server Components pueden tener Client Components como hijos).

## Risks / Trade-offs

- [Hydration mismatch en SSR] → `ScrollReveal` usa `initial={{ opacity: 0 }}` lo que puede causar flash invisible en SSR. Mitigación: agregar `suppressHydrationWarning` o usar `LazyMotion` con `domAnimation`.
- [CLS por opacity:0 inicial] → El contenido está en el DOM pero invisible, lo que no afecta CLS (Cumulative Layout Shift) ya que los elementos ocupan espacio. Sin riesgo para Core Web Vitals.
- [Reduced motion] → Respetar `prefers-reduced-motion`: framer-motion lo maneja automáticamente si se usan las variantes correctas o si se agrega un check con `useReducedMotion`.
