## 1. Validación Zod + Actions

- [x] 1.1 Instalar `zod` si no está en el proyecto (`npm list zod`).
- [x] 1.2 Crear `CapacitacionSchema` en `src/app/admin/capacitaciones/actions.ts` con `z.object()` cubriendo todos los campos del formulario.
- [x] 1.3 Reescribir `createCapacitacion` para usar `useActionState`-compatible: recibir `prevState` como primer arg, parsear con Zod, retornar `{ success: false, errors }` en caso de fallo o `{ success: true }` y llamar `redirect()` en caso de éxito.
- [x] 1.4 Crear `updateCapacitacion(id, prevState, formData)` con la misma lógica, usando `CapacitacionSchema.partial()` y llamando `CapacitacionRepository.update(id, data)`.

## 2. Formulario de Creación con errores inline

- [x] 2.1 Convertir `src/app/admin/capacitaciones/nuevo/page.tsx` a Client Component (`"use client"`) para poder usar `useActionState`.
- [x] 2.2 Conectar `createCapacitacion` vía `useActionState` y mostrar errores de cada campo debajo del input correspondiente (texto rojo, `text-xs font-medium text-red-500`).

## 3. Página de Edición

- [x] 3.1 Crear `src/app/admin/capacitaciones/[id]/editar/page.tsx` como Server Component: fetch de la capacitación con `CapacitacionRepository.findById(id)`, 404 si no existe.
- [x] 3.2 Renderizar un Client Component `EditarCapacitacionForm` (en el mismo directorio) con el formulario pre-poblado (`defaultValue`) conectado a `updateCapacitacion` vía `useActionState` y errores inline.
- [x] 3.3 Agregar botón `Editar` (ícono `Pencil`) en cada fila de `src/app/admin/capacitaciones/page.tsx`, junto al botón `Users`, apuntando a `/admin/capacitaciones/${c.id}/editar`.

## 4. Datos bancarios a variables de entorno

- [x] 4.1 Agregar al `.env`: `NEXT_PUBLIC_CBU`, `NEXT_PUBLIC_ALIAS`, `NEXT_PUBLIC_TITULAR`, `NEXT_PUBLIC_WHATSAPP`, `NEXT_PUBLIC_PAGOS_EMAIL` con los valores actuales hardcodeados.
- [x] 4.2 Actualizar `src/components/socio/BotonInscripcion.tsx` para leer esas variables vía `process.env.NEXT_PUBLIC_*` en lugar de los strings literales.

## 5. Confirmación de cancelación

- [x] 5.1 Crear `src/components/socio/BotonCancelarInscripcion.tsx` como Client Component: botón "Bajarme" que al hacer click muestra un expand inline con "¿Confirmás la baja?" + botones "Sí, cancelar" / "No" antes de llamar `cancelarInscripcionSocio()`.
- [x] 5.2 Reemplazar el botón "Bajarme" inline en `src/app/mi-panel/capacitaciones/page.tsx` con `<BotonCancelarInscripcion>`.
