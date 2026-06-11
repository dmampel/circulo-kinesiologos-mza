# Auditoría de Seguridad — Círculo de Kinesiólogos (Next.js / Supabase)

## Resumen Ejecutivo

El proyecto frontend `ckm-web` tiene vulnerabilidades **extremadamente graves** en su capa de autorización y manejo de Server Actions. Si esto se despliega en producción tal como está, cualquier usuario autenticado (o incluso anónimo mediante requests HTTP directos) puede tomar control del panel de administración, aprobar solicitudes y modificar la base de datos de profesionales.

---

## Hallazgos Críticos — Ronda 1 🚨

### 1. Server Actions Públicos y sin Autorización (Broken Access Control)

**Severidad: CRÍTICA** | **Estado: ✅ CORREGIDO**

- **Problema:** En archivos como `src/app/admin/solicitudes/actions.ts` y todos los demás `actions.ts`, se usaba `"use server";` pero **nunca se verificaba quién estaba llamando a la función**.
- **Concepto:** Las Server Actions en Next.js no son mágicas. Son simplemente endpoints HTTP POST expuestos al público. Si no validás la sesión (`createServerClient().auth.getUser()`) **y el rol del usuario** adentro de la misma Server Action, literalmente cualquiera puede hacer un fetch a esa URL y borrar tu base de datos o aprobar solicitudes.
- **Solución aplicada:** Se creó `src/utils/supabase/require-admin.ts` y se agregó `await requireAdmin()` al inicio de cada Server Action en los 8 archivos `src/app/admin/**/actions.ts`.

### 2. Middleware Incompleto (Escalada de Privilegios)

**Severidad: ALTA** | **Estado: ✅ CORREGIDO**

- **Problema:** En `src/utils/supabase/middleware.ts`, se protegía la ruta `/admin` chequeando solo `if (!user)`. Esto verificaba que el visitante tuviera una cuenta, pero no que fuera **administrador**. Un profesional normal podía cambiar la URL a `/admin` y el middleware lo dejaba pasar.
- **Solución aplicada:** El middleware ahora lee `user.app_metadata?.role` y redirige a `/mi-panel` si el rol no es explícitamente `admin`.

> **Importante:** El rol admin debe setearse en `app_metadata` (controlado por el servidor, no editable por el usuario) desde el Dashboard de Supabase → Authentication → Users → editar usuario → campo **App Metadata**: `{"role": "admin"}`.

### 3. Vulnerabilidad a Denegación de Servicio (DoS) en next.config.ts

**Severidad: MEDIA** | **Estado: ✅ CORREGIDO**

- **Problema:** `bodySizeLimit: '50mb'` globalmente permitía que un atacante enviara payloads gigantescos de forma concurrente, agotando la memoria del servidor.
- **Solución aplicada:** Reducido a `4mb` en `next.config.ts`.

### 4. Ausencia de Security Headers

**Severidad: MEDIA** | **Estado: ✅ CORREGIDO**

- **Problema:** No se inyectaban cabeceras de seguridad en las respuestas HTTP.
- **Solución aplicada:** Se agregó la función `async headers()` en `next.config.ts` con: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy` y `Permissions-Policy`.

---

## Hallazgos Críticos — Ronda 2 🚨

### 5. Broken Access Control — Actions de Categorías de Beneficios

**Severidad: CRÍTICA** | **Estado: ❌ PENDIENTE**

- **Archivo:** `src/app/admin/beneficios/categoria-actions.ts` — funciones `crearCategoria` (L6), `actualizarCategoria` (L37), `eliminarCategoria` (L69)
- **Problema:** Estas tres Server Actions fueron omitidas en el fix anterior. Cualquier usuario autenticado puede crear, modificar o eliminar categorías de beneficios.
- **Escenario de explotación:** Un kinesiólogo con acceso al portal socio hace un HTTP POST directo al endpoint de `eliminarCategoria`. La categoría desaparece del sistema, dejando beneficios sin categoría y rompiendo la UI pública de `/kineclub`.
- **Solución:** Agregar `await requireAdmin()` al inicio de las tres funciones.

### 6. Broken Access Control — Actions de Categorías de Noticias

**Severidad: CRÍTICA** | **Estado: ❌ PENDIENTE**

- **Archivo:** `src/app/admin/noticias/categoria-actions.ts` — funciones `crearCategoria` (L6), `actualizarCategoria` (L22), `eliminarCategoria` (L38)
- **Problema:** Mismo problema que el punto anterior, en el módulo de noticias.
- **Escenario de explotación:** Cualquier profesional autenticado puede crear categorías con nombres arbitrarios, o eliminar categorías existentes afectando la clasificación de todas las noticias publicadas.
- **Solución:** Agregar `await requireAdmin()` al inicio de las tres funciones.

### 7. Broken Access Control — Actions de Especialidades

**Severidad: CRÍTICA** | **Estado: ❌ PENDIENTE**

- **Archivo:** `src/app/admin/profesionales/especialidad-actions.ts` — funciones `crearEspecialidad` (L6), `actualizarEspecialidad` (L19), `eliminarEspecialidad` (L32)
- **Problema:** Cualquier profesional autenticado puede manipular el catálogo de especialidades que aparece en el padrón público y en los perfiles de todos los colegas.
- **Escenario de explotación:** Un profesional autenticado llama `eliminarEspecialidad("id-kinesiologia-deportiva")`. La especialidad desaparece del sistema afectando los perfiles de decenas de colegas.
- **Solución:** Agregar `await requireAdmin()` al inicio de las tres funciones.

### 8. IDOR — Inscripción a Capacitaciones sin Verificación de Ownership

**Severidad: CRÍTICA** | **Estado: ❌ PENDIENTE**

- **Archivo:** `src/app/mi-panel/capacitaciones/actions.ts:6`
- **Problema:** `inscribirseACapacitacion(profesionalId, capacitacionId)` acepta el `profesionalId` directamente del cliente **sin ningún chequeo de sesión**. El parámetro no está vinculado al usuario autenticado.

```typescript
// ❌ VULNERABLE — profesionalId viene del cliente
export async function inscribirseACapacitacion(profesionalId: string, capacitacionId: string) {
  await CapacitacionRepository.inscribir(profesionalId, capacitacionId);
}
```

Contrastalo con el **patrón correcto** usado en `turnos/actions.ts`:

```typescript
// ✅ CORRECTO — profesionalId derivado del token de sesión, nunca del input
async function getProfesionalId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const profesional = await ProfesionalRepository.findByUserId(user.id);
  if (!profesional) redirect("/login");
  return profesional.id;
}
```

- **Escenario de explotación:** El profesional A conoce el ID del profesional B (visible en URLs públicas del padrón). A envía un POST con `profesionalId = B.id` y `capacitacionId = X`. B queda inscripto en una capacitación paga sin saberlo. Repetido masivamente, genera registros de deuda falsos para todos los colegas del sistema.
- **Solución:**

```typescript
export async function inscribirseACapacitacion(capacitacionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const profesional = await ProfesionalRepository.findByUserId(user.id);
  if (!profesional) throw new Error("Profesional not found");
  await CapacitacionRepository.inscribir(profesional.id, capacitacionId);
  revalidatePath("/mi-panel/capacitaciones", "layout");
}
```

### 9. IDOR — Cancelación de Inscripciones sin Verificación de Ownership

**Severidad: CRÍTICA** | **Estado: ❌ PENDIENTE**

- **Archivo:** `src/app/mi-panel/capacitaciones/actions.ts:11`
- **Problema:** `cancelarInscripcionSocio(inscripcionId, profesionalId)` acepta `profesionalId` del cliente. Un atacante puede cancelar la inscripción de otro profesional si conoce su ID y el ID de la inscripción.

```typescript
// ❌ VULNERABLE — profesionalId viene del cliente sin verificar sesión
export async function cancelarInscripcionSocio(inscripcionId: string, profesionalId: string) {
  await CapacitacionRepository.cancelarInscripcion(inscripcionId, profesionalId);
}
```

- **Escenario de explotación:** Usuario A conoce el `inscripcionId` de B y el `profesionalId` de B. A llama `cancelarInscripcionSocio(B.inscripcionId, B.profesionalId)` y le cancela la inscripción en una capacitación, posiblemente haciéndole perder el cupo.
- **Solución:** Igual que el punto 8 — derivar `profesionalId` de la sesión del servidor.

---

## Tabla de Estado General

| # | Archivo | Funciones | Tipo | Severidad | Estado |
|---|---------|-----------|------|-----------|--------|
| 1 | `admin/**/actions.ts` (8 archivos) | todas las mutaciones | auth_bypass | CRÍTICA | ✅ Corregido |
| 2 | `utils/supabase/middleware.ts` | updateSession | privilege_escalation | ALTA | ✅ Corregido |
| 3 | `next.config.ts` | — | DoS | MEDIA | ✅ Corregido |
| 4 | `next.config.ts` | — | missing_headers | MEDIA | ✅ Corregido |
| 5 | `admin/beneficios/categoria-actions.ts` | crearCategoria, actualizarCategoria, eliminarCategoria | auth_bypass | CRÍTICA | ✅ Corregido |
| 6 | `admin/noticias/categoria-actions.ts` | crearCategoria, actualizarCategoria, eliminarCategoria | auth_bypass | CRÍTICA | ✅ Corregido |
| 7 | `admin/profesionales/especialidad-actions.ts` | crearEspecialidad, actualizarEspecialidad, eliminarEspecialidad | auth_bypass | CRÍTICA | ✅ Corregido |
| 8 | `mi-panel/capacitaciones/actions.ts:6` | inscribirseACapacitacion | IDOR | CRÍTICA | ✅ Corregido |
| 9 | `mi-panel/capacitaciones/actions.ts:11` | cancelarInscripcionSocio | IDOR | CRÍTICA | ✅ Corregido |

---

> **Nota del Arquitecto:** "Construir con Next.js App Router es peligroso si no entendés el paradigma. Las Server Actions no son funciones privadas de backend, son **endpoints públicos disfrazados de funciones**. Cuando hacés un fix de seguridad, tenés que ser sistemático — buscar **todos** los archivos con el mismo patrón, no solo los que están en el radar inmediato. Arreglá los puntos 5-9 YA mismo antes de que te destrocen la base de datos."
