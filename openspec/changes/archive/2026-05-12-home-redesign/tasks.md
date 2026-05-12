## 1. Conversión a Server Component

- [x] 1.1 Eliminar `"use client"` y todos los imports de `framer-motion` de `src/app/page.tsx`
- [x] 1.2 Agregar imports de todos los repositories necesarios (`ProfesionalRepository`, `ObraSocialRepository`, `BeneficioRepository`, `NoticiaRepository`, `CapacitacionRepository`)
- [x] 1.3 Implementar `Promise.all` con los 5 queries en paralelo al inicio de la función `Home`
- [x] 1.4 Derivar variables locales: `activeBeneficios`, `beneficiosFeatured`, `ultimasNoticias`, `proximasCapacitaciones`

## 2. Sección Hero

- [x] 2.1 Mantener estructura de dos columnas (left: copy, right: panel)
- [x] 2.2 Reemplazar el placeholder derecho con panel de stats oscuro (slate-900) mostrando los 3 conteos reales
- [x] 2.3 Reemplazar animaciones framer-motion con CSS transitions de Tailwind

## 3. Sección Noticias

- [x] 3.1 Agregar sección `Últimas Noticias` (condicional: solo si `ultimasNoticias.length > 0`)
- [x] 3.2 Implementar grid de 3 cards con imagen (o placeholder), título, resumen y fecha
- [x] 3.3 Linkear cada card a `/noticias/[slug]`

## 4. Sección Capacitaciones

- [x] 4.1 Agregar sección `Próximas Capacitaciones` (condicional: solo si `proximasCapacitaciones.length > 0`)
- [x] 4.2 Implementar lista de items con badge de fecha, tipo (color por enum), modalidad e ícono, título, ubicación y costo

## 5. Sección KineClub

- [x] 5.1 Agregar sección KineClub con fondo oscuro (blue-950) (condicional: solo si `beneficiosFeatured.length > 0`)
- [x] 5.2 Mostrar 3 beneficios en grid con empresa, categoría, descripción y descuento
- [x] 5.3 Mostrar contador total de beneficios activos en el subtítulo
- [x] 5.4 Agregar link "Explorar beneficios" → `/kineclub`

## 6. Sección Obras Sociales (Vitrina)

- [x] 6.1 Reemplazar sección actual con vitrina institucional
- [x] 6.2 Mostrar nombres de obras sociales como pills/badges (máximo 12, con "+N más" si hay más)
- [x] 6.3 Mostrar conteo real en el subtítulo
- [x] 6.4 Agregar link "Ver todos los convenios" → `/obras-sociales`

## 7. CTA Final

- [x] 7.1 Rediseñar CTA con lista de beneficios específicos que incluya datos reales (cantidad de obras sociales y beneficios)
- [x] 7.2 Mantener link "Solicitar Admisión" → `/registro`

## 8. Verificación

- [x] 8.1 Confirmar que TypeScript no tiene errores (`npx tsc --noEmit`)
- [x] 8.2 Verificar visualmente en el navegador que las 5 secciones dinámicas renderizan datos reales
- [x] 8.3 Verificar que las secciones se ocultan correctamente cuando no hay data
