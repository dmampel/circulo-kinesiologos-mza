# Proposal: Portal del Socio — Perfil Editable

## Intent

El socio actualmente no puede editar su información pública desde el portal.
Los datos de contacto (teléfono, dirección, horarios) y la foto de perfil que aparecen
en el Padrón Público son los ingresados en admin y no tienen forma de actualizarse.
Este change cierra esa brecha y le da autonomía real al profesional colegiado.

## Scope

### In Scope
- Nueva ruta `/mi-panel/perfil` con formulario de autogestión
- Edición de datos de contacto: `telefono`, `whatsapp`, `direccion`, `horarios`
- Actualización de foto de perfil vía Supabase Storage (bucket `profesionales-fotos`)
- Método `update()` en `ProfesionalRepository`
- Reflejo automático en el Padrón Público al guardar cambios

### Out of Scope
- Edición de datos institucionales (nombre, apellido, matrícula, especialidades) — solo admin
- Cambio de email o contraseña — flujo Supabase Auth separado
- Notificaciones por email al actualizar perfil

## Capabilities

### New Capabilities
- `socio-perfil-autogestion`: Permite al socio editar sus datos de contacto y foto desde el portal privado

### Modified Capabilities
- `socio-portal`: Agregar R5 — Mi Perfil (nueva sección con edición de datos)
- `profesional-data-access`: Agregar requisito de escritura (update por userId)

## Approach

Dos Server Actions independientes:
1. `updateDatosContacto(formData)` — actualiza campos de texto vía `ProfesionalRepository.update()`
2. `updateFotoPerfil(formData)` — sube imagen a Supabase Storage, obtiene URL pública, llama a `update()`

La página `/mi-panel/perfil/page.tsx` es un Server Component que carga los datos actuales.
El formulario es un Client Component (`PerfilForm.tsx`) que muestra feedback optimista.
Al guardar, se llama `revalidatePath('/mi-panel')` y `revalidatePath('/mi-panel/perfil')`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/repositories/ProfesionalRepository.ts` | Modified | Agregar `update(userId, data)` |
| `src/app/mi-panel/perfil/page.tsx` | New | Server Component — carga datos y muestra el form |
| `src/app/mi-panel/perfil/actions.ts` | New | Dos Server Actions: datos + foto |
| `src/components/socio/PerfilForm.tsx` | New | Client Component — formulario con feedback |
| Supabase Storage | New | Bucket `profesionales-fotos` con policy para usuarios autenticados |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| RLS en Supabase Storage permite uploads de cualquier usuario autenticado (no solo el dueño) | Med | Usar admin client para el upload y validar userId en la Server Action |
| Cache stale del Carnet Digital después de actualizar foto | Low | `revalidatePath` en ambas rutas después de cada acción |
| Foto muy pesada genera lentitud | Low | Validar max 2MB en la Server Action antes de subir |

## Rollback Plan

Las Server Actions solo modifican campos opcionales del profesional. Un rollback consiste en
no exponer la ruta `/mi-panel/perfil` (quitar el link del sidebar). Los datos en DB no son
destructivos: los campos de contacto eran editables desde admin igualmente.

## Dependencies

- Supabase Storage activo en el proyecto (ya configurado)
- `ProfesionalRepository.findByUserId` (ya existe)
- Autenticación por Supabase Auth (ya implementada)

## Success Criteria

- [ ] Un socio logueado puede navegar a `/mi-panel/perfil` y ver sus datos actuales
- [ ] Puede editar teléfono, whatsapp, dirección y horarios y guardar exitosamente
- [ ] Puede subir una nueva foto y verla reflejada en su Carnet Digital inmediatamente
- [ ] Los cambios se reflejan en el Padrón Público (`/profesionales`) sin acción adicional
- [ ] Un usuario no autenticado es redirigido a `/login` si intenta acceder a la ruta
