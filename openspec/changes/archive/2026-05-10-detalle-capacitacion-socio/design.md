## Context

El portal del socio en `/mi-panel/capacitaciones` muestra una lista de capacitaciones disponibles con info resumida (título, fecha, modalidad, costo) y los botones de inscripción. No existe página de detalle: la descripción está truncada y la hora del evento no es visible en ningún lugar del flujo del socio.

Los componentes `BotonInscripcion` y `BotonCancelarInscripcion` ya están construidos y funcionan correctamente. El `CapacitacionRepository` tiene los métodos de admin (`findById` — que incluye la lista de todos los inscriptos) pero ningún método orientado al socio que retorne sólo la información pública de una capacitación.

## Goals / Non-Goals

**Goals:**
- Página de detalle `/mi-panel/capacitaciones/[id]` con toda la información del evento.
- Mostrar la hora del evento (campo `fechaInicio` con `toLocaleTimeString`).
- Reutilizar `BotonInscripcion` y `BotonCancelarInscripcion` existentes.
- Encapsular el acceso a datos en el Repository (no Prisma directo en la page).
- Enriquecer los cards de la cartelera con un enlace a la página de detalle.

**Non-Goals:**
- Cambios en el schema de Prisma.
- Página de detalle para el admin (ya existe en `/admin/capacitaciones/[id]`).
- Lógica de compartir o exportar info del evento.

## Decisions

### 1. Nuevos métodos en CapacitacionRepository en lugar de reutilizar `findById`

`findById` (admin) incluye la relación `inscripciones` con todos los profesionales inscriptos — datos sensibles que el socio no debe ver. Se agrega `findPublicadaById` que retorna sólo el modelo con `_count.inscripciones` (filtrando canceladas), idéntico a `findPublicadas`. Esto mantiene el principio de menor privilegio.

`getInscripcionSocio` retorna la inscripción activa (no cancelada) de un profesional para una capacitación específica, usando `findFirst` en lugar de descargar todas las inscripciones del socio.

### 2. Server Component con `notFound()` para capacitaciones inexistentes o no publicadas

La página es un Server Component. Si la capacitación no existe o no está publicada, se llama `notFound()` de Next.js. Esto genera la página 404 estándar del portal sin exponer detalles del error.

### 3. Revalidación con `revalidatePath("/mi-panel/capacitaciones", "layout")`

El tipo `"layout"` revalida todas las rutas anidadas bajo `/mi-panel/capacitaciones/`, incluyendo la lista y cualquier página de detalle. Esto es más robusto que revalidar paths específicos y no requiere pasar el `capacitacionId` a `cancelarInscripcionSocio`.

### 4. Layout de detalle: dos columnas en desktop, apilado en mobile

- Columna izquierda (2/3): descripción completa + grilla de info (fecha, hora, ubicación, cupos).
- Columna derecha (1/3 sticky): card CTA con precio prominente + `BotonInscripcion` + `BotonCancelarInscripcion`.
- En mobile: ambas columnas apiladas, CTA primero (debajo del header).

### 5. Hora del evento con `toLocaleTimeString("es-AR")`

Se usa `toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })`. Si la hora es medianoche (00:00), se omite el dato (indica que el organizador no cargó hora). Mismo criterio para `fechaFin`.

## Risks / Trade-offs

- **Timezone UTC vs. local**: Prisma/Vercel usa UTC. Si el admin cargó una fecha "sin hora" (midnight UTC), el socio verá "00:00 hs" en lugar de "a definir". Mitigación: mostrar la hora solo si no es medianoche (`getUTCHours() !== 0 || getUTCMinutes() !== 0`).
- **SEO**: La ruta `/mi-panel/capacitaciones/[id]` está detrás de auth, no es indexable. Sin impacto negativo.
- **Revalidación amplia**: `"layout"` revalida más rutas de las estrictamente necesarias. Trade-off aceptable dado que el portal del socio tiene pocas rutas bajo ese path.
