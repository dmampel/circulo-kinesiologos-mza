## 1. Repository

- [x] 1.1 Agregar método `findPublicadaById(id: string)` a `CapacitacionRepository` — retorna la capacitación con `_count.inscripciones` (no canceladas), o `null` si no existe o no está publicada.
- [x] 1.2 Agregar método `getInscripcionSocio(profesionalId: string, capacitacionId: string)` a `CapacitacionRepository` — retorna la inscripción activa (estado `not: "CANCELADA"`) del profesional para esa capacitación usando `findFirst`, o `null`.

## 2. Server Actions

- [x] 2.1 Actualizar `inscribirseACapacitacion` en `actions.ts` — cambiar `revalidatePath("/mi-panel/capacitaciones")` a `revalidatePath("/mi-panel/capacitaciones", "layout")`.
- [x] 2.2 Actualizar `cancelarInscripcionSocio` en `actions.ts` — mismo cambio de revalidatePath.

## 3. Página de detalle

- [x] 3.1 Crear `src/app/mi-panel/capacitaciones/[id]/page.tsx` como Server Component con autenticación (redirect a `/login` si no hay sesión o profesional).
- [x] 3.2 Llamar `findPublicadaById(id)` y retornar `notFound()` si el resultado es `null`.
- [x] 3.3 Llamar `getInscripcionSocio(profesional.id, id)` para obtener el estado de inscripción del socio.
- [x] 3.4 Implementar el header de la página: botón back (`← Mis Capacitaciones`), badges de tipo y modalidad, título `font-black`.
- [x] 3.5 Implementar columna de info: descripción completa + grilla con fecha (es-AR con día de la semana), hora (omitir si es medianoche UTC), ubicación, cupos disponibles.
- [x] 3.6 Implementar card CTA sticky (columna derecha en desktop): precio prominente (o "Sin costo"), `BotonInscripcion` o mensaje "Cupo Agotado", y `BotonCancelarInscripcion` si hay inscripción activa.
- [x] 3.7 Verificar diseño responsive: en mobile el CTA card se apila debajo del header, antes de la descripción.

## 4. Cartelera — links a detalle

- [x] 4.1 En `src/app/mi-panel/capacitaciones/page.tsx`, envolver el título de cada card de la cartelera con un `<Link href={/mi-panel/capacitaciones/${c.id}}>` y agregar hover `text-blue-600`.
