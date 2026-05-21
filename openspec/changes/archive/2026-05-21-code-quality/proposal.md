## Why

El relevamiento del 21/05/2026 identificó deuda técnica acumulada: `console.error()` en catch blocks de Server Actions (viola el estándar del proyecto), un `data: any` en `saveProfesional` que rompe el type-safety, un TODO sin resolver en `institucional/page.tsx`, y la ausencia de `.env.example` que dificulta el onboarding. Son fixes de calidad pura que no agregan features pero reducen ruido y mejoran mantenibilidad.

## What Changes

- Eliminar todos los `console.error()` y `console.warn()` de Server Actions (salvo los que son explícitamente debugging de errores de infraestructura)
- Reemplazar `data: any` y `conditions: any[]` en `admin/profesionales/actions.ts` por tipos Prisma concretos
- Eliminar el comentario TODO en `src/app/institucional/page.tsx:6`
- Crear `.env.example` en `ckm-web/` documentando todas las variables de entorno requeridas

## Capabilities

### New Capabilities
- `environment-config`: Documentación de variables de entorno requeridas mediante `.env.example`

### Modified Capabilities
- `architecture-standardization`: Ajuste menor — se refuerza la convención de no usar console.log/error en actions

## Impact

- `src/app/admin/profesionales/actions.ts` — tipado + remoción de console.error
- `src/app/admin/noticias/actions.ts` — remoción de console.error
- `src/app/admin/solicitudes/actions.ts` — remoción de console.error
- `src/app/admin/beneficios/actions.ts` — remoción de console.error
- `src/app/admin/autoridades/actions.ts` — remoción de console.error
- `src/app/admin/obras-sociales/actions.ts` — remoción de console.error
- `src/app/registro/actions.ts` — remoción de console.error
- `src/app/mi-panel/perfil/actions.ts` — remoción de console.error/warn
- `src/app/mi-panel/circulares/actions.ts` — remoción de console.error
- `src/components/socio/BotonInscripcion.tsx` — remoción de console.error
- `src/app/institucional/page.tsx` — remoción de TODO comment
- `ckm-web/.env.example` — archivo nuevo
- Sin cambios de DB ni Supabase migrations
