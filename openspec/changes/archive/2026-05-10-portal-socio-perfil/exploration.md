# Exploration: portal-socio-perfil

## Current State

El portal del socio (`/mi-panel`) ya existe con layout, carnet digital y dashboard.
El link "Mi Perfil → `/mi-panel/perfil`" está en el dashboard pero la ruta no existe.

El modelo `Profesional` en Prisma ya tiene todos los campos editables:
- `telefono`, `whatsapp`, `direccion`, `horarios` (texto libre)
- `foto_url` (URL de imagen en Supabase Storage)

El `ProfesionalRepository` tiene `findByUserId(userId)` pero NO tiene método `update`.
La autenticación se resuelve con `createClient()` de Supabase + `user.id`.

Supabase Storage ya se usa en el proyecto (`src/lib/supabase/admin.ts` existe).
No existe un bucket dedicado para fotos de perfil todavía (al menos no visto en código).

El Padrón público (`/profesionales`) usa `findPaginated` y `findBySlug`, ambos incluyen
`foto_url` y todos los campos — por lo que cualquier actualización se refleja automáticamente.

## Affected Areas

- `src/lib/repositories/ProfesionalRepository.ts` — agregar método `update`
- `src/app/mi-panel/perfil/` — nueva ruta (page.tsx + actions.ts)
- `src/components/socio/` — nuevo componente `PerfilForm.tsx` (Client Component)
- Supabase Storage — bucket `profesionales-fotos` para subida de fotos
- `openspec/specs/profesional-data-access/spec.md` — extender con req. de update

## Approaches

1. **Server Actions + `revalidatePath`** (recomendado)
   - Form HTML → Server Action → `ProfesionalRepository.update()` → `revalidatePath`
   - Pros: consistente con el patrón ya establecido en el proyecto; sin estado del cliente para los datos
   - Cons: la subida de imagen requiere manejo especial (FormData + Supabase Storage)
   - Effort: Medium

2. **API Route + fetch desde el cliente**
   - Client Component hace fetch a `/api/profesional/update`
   - Pros: más flexible para el upload de imagen
   - Cons: rompe el patrón del proyecto (usa Server Actions en todos lados); más boilerplate
   - Effort: High

## Recommendation

**Approach 1**: Server Actions. El form tendrá dos partes:
- **Datos de texto** (teléfono, whatsapp, dirección, horarios) → `updatePerfil` action
- **Foto** → `updateFoto` action separada (FormData → upload a Supabase Storage → guardar URL en DB)

Separar en dos actions evita mezclar lógica de upload con lógica de datos.

## Risks

- Supabase Storage: hay que verificar que el bucket tenga RLS correcta para uploads de usuarios autenticados (o usar el admin client)
- El campo `foto_url` en `CarnetDigital` se renderiza en SSR, por lo que después de actualizar la foto hay que invalidar la cache de `/mi-panel` y `/mi-panel/perfil`
- `horarios` es un campo de texto libre; hay que definir qué formato se acepta (texto plano por ahora)

## Ready for Proposal

Sí — suficiente contexto para proponer el change.
