# Tasks: Portal del Socio — Perfil Editable

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~250–320 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | single-pr |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Implementación completa de portal-socio-perfil | PR único | Repository + Actions + UI |

---

## Phase 1: Foundation — Repository y Storage

- [x] 1.1 Agregar método `static async update(userId: string, data: UpdateProfesionalData)` en `src/lib/repositories/ProfesionalRepository.ts`. Usar `prisma.profesional.update({ where: { userId }, data })`.
- [x] 1.2 Exportar el tipo `UpdateProfesionalData` desde el mismo archivo (`telefono?`, `whatsapp?`, `direccion?`, `horarios?`, `foto_url?` — todos opcionales).
- [ ] 1.3 Crear el bucket `profesionales-fotos` en Supabase Storage con acceso **público** (manual desde el dashboard de Supabase).

## Phase 2: Core — Server Actions

- [x] 2.1 Crear `src/app/mi-panel/perfil/actions.ts` con `"use server"` al inicio.
- [x] 2.2 Implementar `updateDatosContacto(formData: FormData): Promise<ActionResult>`:
  - Obtener sesión con `createClient()` → `getUser()` → redirigir si no hay sesión.
  - Extraer `telefono`, `whatsapp`, `direccion`, `horarios` del FormData.
  - Llamar a `ProfesionalRepository.update(user.id, data)`.
  - Llamar a `revalidatePath('/mi-panel')` y `revalidatePath('/mi-panel/perfil')`.
  - Retornar `{ success: true }` o `{ success: false, error: string }`.
- [x] 2.3 Implementar `updateFotoPerfil(formData: FormData): Promise<ActionResult>`:
  - Obtener sesión con `createClient()` → `getUser()`.
  - Extraer `File` del FormData; validar tamaño ≤ 2MB y tipo (`image/jpeg`, `image/png`, `image/webp`).
  - Buscar `foto_url` actual del profesional con `ProfesionalRepository.findByUserId(user.id)`.
  - Si existe `foto_url` anterior: extraer la ruta del archivo de la URL y eliminarlo con `supabaseAdmin.storage.from('profesionales-fotos').remove([path])`.
  - Subir nuevo archivo con `supabaseAdmin.storage.from('profesionales-fotos').upload(\`${user.id}/${Date.now()}.{ext}\`, buffer)`.
  - Obtener URL pública con `supabaseAdmin.storage.from('profesionales-fotos').getPublicUrl(path)`.
  - Llamar a `ProfesionalRepository.update(user.id, { foto_url })`.
  - Llamar a `revalidatePath('/mi-panel')` y `revalidatePath('/mi-panel/perfil')`.

## Phase 3: UI — Página y Formulario

- [x] 3.1 Crear `src/app/mi-panel/perfil/page.tsx` como Server Component:
  - Autenticar con `createClient()` → redirigir a `/login` si no hay sesión.
  - Obtener datos con `ProfesionalRepository.findByUserId(user.id)`.
  - Renderizar `<PerfilForm profesional={profesional} />`.
- [x] 3.2 Crear `src/components/socio/PerfilForm.tsx` como Client Component (`"use client"`):
  - Sección de datos de solo lectura: nombre, apellido, matrícula.
  - Formulario de datos de contacto: inputs para `telefono`, `whatsapp`, `direccion`, `horarios` con valores pre-completados.
  - Submit llama a `updateDatosContacto`; mostrar mensaje de éxito/error según `ActionResult`.
  - Sección separada de foto: input `type="file"` con preview de imagen actual (`foto_url`).
  - Submit de foto llama a `updateFotoPerfil`; mostrar feedback de carga y resultado.
  - Diseño consistente con el resto del panel (tipografía, colores, `rounded-2xl`, estilo institucional).

## Phase 4: Verificación Manual

- [ ] 4.1 Escenario: Acceso al perfil — navegar a `/mi-panel/perfil` como socio logueado; verificar que los datos actuales se muestran pre-completados.
- [ ] 4.2 Escenario: Actualizar datos de contacto — editar teléfono, guardar; verificar mensaje de éxito y persistencia en DB.
- [ ] 4.3 Escenario: Upload de foto — subir imagen válida; verificar que el Carnet Digital en `/mi-panel` muestra la nueva foto.
- [ ] 4.4 Escenario: Reemplazo de foto — subir segunda imagen; verificar que la primera fue eliminada de Supabase Storage.
- [ ] 4.5 Escenario: Archivo inválido — subir PNG de 3MB; verificar mensaje "La imagen no puede superar los 2MB".
- [ ] 4.6 Escenario: Reflejo en Padrón — luego de actualizar foto, navegar a `/profesionales/{slug}`; verificar que la nueva foto aparece.
- [ ] 4.7 Escenario: Acceso no autenticado — abrir `/mi-panel/perfil` sin sesión; verificar redirect a `/login`.
