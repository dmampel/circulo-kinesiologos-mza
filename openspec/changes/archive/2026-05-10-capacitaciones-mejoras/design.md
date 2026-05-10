## Context

El módulo de capacitaciones fue implementado correctamente en estructura y flujo, pero quedaron cuatro gaps de calidad:
1. `createCapacitacion` usa `formData.get()` crudo sin validación Zod (requerido por AGENTS.md).
2. No existe UI para editar una capacitación aunque `CapacitacionRepository.update()` ya está implementado.
3. CBU, alias, email y número de WhatsApp hardcodeados en `BotonInscripcion.tsx`.
4. El botón "Bajarme" del historial socio cancela sin confirmación.

No hay cambios de schema de Prisma ni migraciones de Supabase en este change.

## Goals / Non-Goals

**Goals:**
- Agregar validación Zod en `createCapacitacion` y `updateCapacitacion`.
- Crear `/admin/capacitaciones/[id]/editar` con formulario pre-poblado.
- Externalizar datos bancarios y de contacto a variables de entorno `NEXT_PUBLIC_*`.
- Agregar confirmación antes de cancelar una inscripción (Client Component).

**Non-Goals:**
- Paginación o búsqueda funcional en la lista admin.
- Integración con pasarelas de pago.
- Cambio de arquitectura del repositorio.

## Decisions

### 1. Zod en los actions

Crear un único `CapacitacionSchema` en `actions.ts` (o en un archivo de validaciones compartido si se necesita en el futuro). Se reutiliza para `create` y `update` con `.partial()` para el update.

```
CapacitacionSchema = z.object({
  titulo: z.string().min(3),
  tipo: z.enum(["CURSO", "TALLER", "CONGRESO", "ASAMBLEA"]),
  modalidad: z.enum(["PRESENCIAL", "VIRTUAL", "HIBRIDO"]),
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date().optional(),
  ubicacion: z.string().optional(),
  cupoMaximo: z.coerce.number().int().positive().optional(),
  costo: z.coerce.number().nonnegative().optional(),
  publicada: z.boolean().default(false),
})
```

`formData.get("publicada") === "on"` se convierte antes del parse porque los checkboxes del DOM no emiten `true`/`false`.

**Alternativa descartada**: validación manual campo a campo — más código, menos mantenible.

### 2. Página de edición

Server Component en `/admin/capacitaciones/[id]/editar/page.tsx`:
- Usa `CapacitacionRepository.findById(id)` para obtener los datos actuales.
- Renderiza el mismo formulario que `nuevo/page.tsx` con `defaultValue` pre-poblado.
- Apunta a la action `updateCapacitacion(id, formData)` usando un hidden input con el `id` o via `bind`.
- Redirecciona a `/admin/capacitaciones` post-update.

Se agrega un botón `Edit` (ícono `Pencil`) en la fila de la tabla de `/admin/capacitaciones/page.tsx`, junto al botón `Users` existente. Apunta a `/admin/capacitaciones/{id}/editar`.

**Alternativa descartada**: modal de edición inline — más complejo, no agrega valor en este contexto admin.

### 3. Datos bancarios a env vars

Variables a agregar en `.env` y `.env.example`:
```
NEXT_PUBLIC_CBU=0110000000000000000000
NEXT_PUBLIC_ALIAS=CIRCULO.KINESIO.MZA
NEXT_PUBLIC_TITULAR=Círculo Kinesiólogos Mendoza
NEXT_PUBLIC_WHATSAPP=5492610000000
NEXT_PUBLIC_PAGOS_EMAIL=pagos@ckmendoza.com.ar
```

`BotonInscripcion.tsx` las consume vía `process.env.NEXT_PUBLIC_*`. Si alguna no está definida, se usa un fallback vacío y se loguea un warning en desarrollo.

### 4. Confirmación de cancelación

Crear `BotonCancelarInscripcion.tsx` como Client Component. Reemplaza el botón "Bajarme" actual (que era inline en la page Server Component). 

Flujo:
1. Click → `setConfirmando(true)` → muestra "¿Seguro?" con botones "Sí, cancelar" / "No".
2. "Sí, cancelar" → llama `cancelarInscripcionSocio()` → `setConfirmando(false)`.

Inline expand (no modal) para no interrumpir el flujo con un overlay pesado.

## Risks / Trade-offs

- **`NEXT_PUBLIC_*` son públicas en el bundle del cliente**: aceptable porque son datos bancarios que el socio necesita ver de todas formas.
- **`z.coerce.date()` puede aceptar fechas inválidas del DOM**: el input `datetime-local` garantiza formato válido, riesgo bajo.
- **El formulario de edición duplica JSX del de creación**: aceptable por ahora, si en el futuro se agregan más campos se extrae a un componente compartido `CapacitacionForm`.

## Migration Plan

1. Agregar variables a `.env` y `.env.example`.
2. Agregar Zod a `actions.ts`.
3. Agregar `updateCapacitacion` a `actions.ts`.
4. Crear `/admin/capacitaciones/[id]/editar/page.tsx`.
5. Agregar botón Editar en la lista admin.
6. Actualizar `BotonInscripcion.tsx` para leer env vars.
7. Crear `BotonCancelarInscripcion.tsx` y usarlo en la page del socio.

Sin rollback especial: todos los cambios son aditivos o de refactor de strings.

## Open Questions — Resueltas

- **`.env.example`**: No aplica, el proyecto usa `.env` directamente.
- **Errores Zod en el front**: Sí, se muestran inline. Los actions retornan `{ success: false, errors: ZodError.flatten().fieldErrors }`. Los forms usan `useActionState` (React 19) para capturar el estado y renderizar mensajes debajo de cada campo.
