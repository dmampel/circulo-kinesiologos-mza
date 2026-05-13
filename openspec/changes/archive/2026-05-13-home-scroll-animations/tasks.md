## 1. Foundation — variantes y componente ScrollReveal

- [x] 1.1 Crear `src/lib/animations.ts` con variantes reutilizables: `fadeUp`, `fadeIn`, `staggerContainer`, `staggerItem`
- [x] 1.2 Crear `src/components/ScrollReveal.tsx` — Client Component con `motion.div` + `useInView`, props: `variant`, `delay`, `className`, `children`
- [x] 1.3 Verificar que `framer-motion` esté importable y sin errores de tipos

## 2. Animaciones de secciones en page.tsx

- [x] 2.1 Wrappear sección "Por qué asociarte" (header + pillars) con `ScrollReveal`
- [x] 2.2 Aplicar stagger a los 4 pillars (Respaldo gremial, Red de pacientes, Formación, Beneficios)
- [x] 2.3 Wrappear sección Noticias con `ScrollReveal` + stagger en las cards
- [x] 2.4 Wrappear sección Agenda (capacitaciones) con `ScrollReveal` + stagger en los items
- [x] 2.5 Wrappear sección KineClub con `ScrollReveal` + stagger en los 3 beneficios
- [x] 2.6 Wrappear sección Obras Sociales con `ScrollReveal` + stagger en los tags
- [x] 2.7 Wrappear sección CTA con `ScrollReveal fadeIn`

## 3. Contador animado en FloatingStatPills

- [x] 3.1 Agregar `useInView` en `FloatingStatPills` para detectar entrada en viewport
- [x] 3.2 Implementar contador animado con `useMotionValue` + `animate` de framer-motion
- [x] 3.3 Mostrar el número formateado (+N) mientras anima desde 0 hasta el valor real

## 4. Accesibilidad

- [x] 4.1 Agregar `useReducedMotion()` en `ScrollReveal` — si está activo, aplicar `duration: 0` en las variantes
- [x] 4.2 Agregar `useReducedMotion()` en `FloatingStatPills` para saltar el contador
