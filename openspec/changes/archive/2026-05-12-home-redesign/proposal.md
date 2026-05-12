## Why

El home actual tiene stats hardcodeadas (+250 profesionales, +40 obras sociales) y no refleja la base de datos real. Además, muestra sólo tres servicios genéricos y no da al visitante un panorama real de todo lo que ofrece el Círculo — noticias, capacitaciones, beneficios KineClub, convenios. La página necesita convertirse en un recorrido guiado que genere conversión.

## What Changes

- Convertir `src/app/page.tsx` de Client Component a Server Component (eliminar `"use client"` y framer-motion).
- Reemplazar stats hardcodeadas por conteos reales desde la DB: profesionales activos, obras sociales activas, beneficios KineClub activos.
- Agregar sección **Últimas Noticias**: últimas 3 publicadas desde `NoticiaRepository`.
- Agregar sección **Próximas Capacitaciones**: próximas 3 desde `CapacitacionRepository.findPublicadas()` filtradas por fecha futura.
- Agregar sección **KineClub**: 3 beneficios destacados desde `BeneficioRepository.findFeatured()` + contador total.
- Rediseñar sección **Obras Sociales** como vitrina institucional con lista de nombres + contador real.
- Mejorar CTA final con lista de beneficios específicos usando datos reales (cantidad de convenios, cantidad de beneficios).
- Rediseño visual general: premium, guiado, sin "depósito de información".

## Capabilities

### New Capabilities

_Ninguna — cambio puramente de presentación/UI. No se introducen nuevos modelos ni endpoints._

### Modified Capabilities

_Ninguna — no cambian requisitos funcionales existentes. Los repositories se usan como ya están._

## Impact

- `src/app/page.tsx` — reescritura completa.
- No hay cambios en schema Prisma ni migraciones Supabase.
- No hay cambios en repositories (se usan los métodos existentes).
- Se elimina la dependencia de `framer-motion` en esta página.
