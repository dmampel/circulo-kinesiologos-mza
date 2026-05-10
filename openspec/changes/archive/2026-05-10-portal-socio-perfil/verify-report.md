# Verify Report: portal-socio-perfil

**Change**: portal-socio-perfil
**Version**: N/A
**Mode**: Standard (Strict TDD: disabled — no test runner)

---

## Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 15 |
| Tasks complete | 8 (Phases 1-3) |
| Tasks incomplete | 7 (1.3 manual bucket + Phase 4 verificación manual) |

**Incomplete tasks:**
- `[ ] 1.3` — Crear bucket `profesionales-fotos` en Supabase (acción manual del operador)
- `[ ] 4.1–4.7` — Verificación manual en entorno de desarrollo (no automatizable sin test runner)

> ⚠️ WARNING: 1.3 es prerequisito de runtime para la funcionalidad de fotos. No bloquea el código, pero el feature no funcionará sin el bucket.

---

## Build & Type Check

**Build**: ✅ Passed (`npx tsc --noEmit` — 0 errores en archivos nuevos)

```
$ npx tsc --noEmit 2>&1 | grep -E "perfil|PerfilForm|ProfesionalRepository"
(sin salida — 0 errores)
```

**Tests**: ➖ No hay test runner configurado en el proyecto.

**Coverage**: ➖ No disponible.

---

## Spec Compliance Matrix

No hay test runner → los escenarios se validan por evidencia estática (estructura del código).

| Requirement | Scenario | Evidencia estática | Status |
|-------------|----------|--------------------|--------|
| Visualización de datos actuales | Acceso exitoso al perfil | `page.tsx` carga `findByUserId` y pasa datos a `PerfilForm`; inputs usan `defaultValue` | ⚠️ PARTIAL (sin ejecución real) |
| Visualización de datos actuales | Acceso sin datos opcionales | `defaultValue={profesional.telefono ?? ""}` en todos los campos opcionales | ⚠️ PARTIAL |
| Actualización de datos de contacto | Actualización exitosa | `updateDatosContacto` → `ProfesionalRepository.update` → `revalidatePath` | ⚠️ PARTIAL |
| Actualización de datos de contacto | Submit sin cambios | `|| undefined` en extracción de FormData — idempotente | ⚠️ PARTIAL |
| Actualización de datos de contacto | Intento de actualización no autorizada | `getUser()` en Server Action; `update(user.id, ...)` usa el userId del JWT, no del cliente | ⚠️ PARTIAL |
| Actualización de foto | Upload exitoso de foto | `updateFotoPerfil` sube a Storage → guarda URL → `revalidatePath` | ⚠️ PARTIAL |
| Actualización de foto | Archivo demasiado grande | `file.size > MAX_SIZE_BYTES` → retorna error "La imagen no puede superar los 2MB." | ⚠️ PARTIAL |
| Actualización de foto | Formato no permitido | `!ALLOWED_TYPES.includes(file.type)` → retorna error | ⚠️ PARTIAL |
| Invalidación de caché | Datos actualizados reflejados en dashboard | `revalidatePath('/mi-panel')` y `revalidatePath('/mi-panel/perfil')` en ambas actions | ⚠️ PARTIAL |

**Compliance**: 0/9 COMPLIANT (sin test runner), 9/9 ⚠️ PARTIAL por evidencia estática.

> Sin test runner, PARTIAL es el máximo alcanzable. La verificación real queda en Phase 4 (manual).

---

## Correctness (Static — Structural Evidence)

| Requirement | Status | Notes |
|-------------|--------|-------|
| `ProfesionalRepository.update(userId, data)` | ✅ Implemented | Usa `prisma.profesional.update({ where: { userId }, data })` |
| `UpdateProfesionalData` tipo exportado | ✅ Implemented | 5 campos opcionales: `telefono`, `whatsapp`, `direccion`, `horarios`, `foto_url` |
| `updateDatosContacto` Server Action | ✅ Implemented | Valida sesión, extrae FormData, llama repository, revalida |
| `updateFotoPerfil` Server Action | ✅ Implemented | Valida tamaño (2MB), tipo (JPG/PNG/WebP), borra anterior, sube, guarda URL |
| Borrado de foto anterior | ✅ Implemented | Parsea URL pública para extraer path, llama `storage.remove([oldPath])` |
| Página `/mi-panel/perfil` (Server Component) | ✅ Implemented | Auth guard + `findByUserId` + renderiza `PerfilForm` |
| `PerfilForm` (Client Component) | ✅ Implemented | `useActionState`, preview de foto, feedback de éxito/error |
| Datos institucionales de solo lectura | ✅ Implemented | Nombre, apellido, matrícula mostrados sin inputs editables |
| Redirect a `/login` sin sesión | ✅ Implemented | En `page.tsx` y en ambas Server Actions |

---

## Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| Dos Server Actions separadas (datos + foto) | ✅ Yes | `updateDatosContacto` y `updateFotoPerfil` son funciones independientes |
| Admin Client para upload | ✅ Yes | `supabaseAdmin.storage.from('profesionales-fotos').upload(...)` |
| Nombre de archivo: `{userId}/{timestamp}.{ext}` | ✅ Yes | `${user.id}/${Date.now()}.${ext}` |
| `revalidatePath` en `/mi-panel` y `/mi-panel/perfil` | ✅ Yes | Presente en ambas actions tras éxito |
| `useActionState` para feedback | ✅ Yes | `contactPending`, `fotoPending`, `Feedback` component |

---

## Issues Found

**CRITICAL:**
- ⚠️ Bucket `profesionales-fotos` en Supabase Storage no creado (tarea 1.3 manual pendiente). La funcionalidad de fotos fallará en runtime sin esto.

**WARNING:**
- `foto_url` del preview en `PerfilForm` usa `URL.createObjectURL(file)` — memoria del navegador no liberada explícitamente. No es bloqueante, pero idealmente se agrega `URL.revokeObjectURL` en cleanup. Impacto mínimo en UX.
- Supabase `next/image` con `unoptimized` para el preview de foto. Para la foto almacenada en Storage debería usarse `next/image` con dominio configurado en `next.config.ts`. No afecta el MVP.

**SUGGESTION:**
- Agregar validación de tamaño del lado del cliente antes del submit (mejora UX — evitar esperar el round-trip al servidor para saber que el archivo es muy grande).
- El campo `horarios` es texto libre. En el futuro podría estructurarse con un componente de horarios por día.

---

## Verdict

**PASS WITH WARNINGS**

Implementación correcta y completa en términos de código (TypeScript limpio, diseño seguido fielmente). Los WARNINGs son mejoras de UX/performance no bloqueantes. El único CRITICAL es operacional (bucket de Storage) y está documentado. Phase 4 (verificación manual) queda pendiente para el operador.
