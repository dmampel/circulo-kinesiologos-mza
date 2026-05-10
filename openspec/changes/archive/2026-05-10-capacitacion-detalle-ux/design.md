## Context

La página de detalle es un Server Component. Los datos de pago (CBU, Alias, Titular, WhatsApp, Email) ya están disponibles como `NEXT_PUBLIC_*` env vars y se usan en `BotonInscripcion`. El card CTA actual ya tiene el `BotonInscripcion` que abre un modal con esa info; queremos reemplazar ese modal por datos inline cuando el estado es `PENDIENTE`.

El `fechaInicio` llega como `Date` de Prisma. El countdown se puede calcular puramente en el Server Component (resta de milisegundos), sin necesidad de Client Component ni hidratación.

## Goals / Non-Goals

**Goals:**
- Datos bancarios visibles sin interacción extra cuando el pago está pendiente.
- Countdown legible: días exactos, con variantes "Hoy", "Mañana", "Ya comenzó".
- Barra de cupos con color semántico.
- Link externo a Google Maps para eventos presenciales con ubicación.

**Non-Goals:**
- Mapa embebido (iframe).
- Countdown con segundos en tiempo real (Client Component innecesario).
- Notificaciones push o recordatorios.

## Decisions

### 1. Datos bancarios inline — condicional por estado

Si `inscripcion?.estado === "PENDIENTE"` y `capacitacion.costo > 0`, el card CTA muestra:
- Un bloque con fondo `amber-50` y borde `amber-200` con CBU, Alias y Titular seleccionables.
- Los botones de WhatsApp y Email (igual que el modal de `BotonInscripcion`).
- El `BotonInscripcion` en este estado ya renderiza "Pendiente de Pago" — se mantiene como indicador de estado, los datos van debajo.

Esto evita duplicar lógica de inscripción. El `BotonInscripcion` sigue manejando el flujo de inscripción; la página de detalle solo agrega contexto adicional cuando ya está inscripto y pendiente.

### 2. Countdown — cálculo en Server Component

```ts
const ahora = new Date();
const diffMs = fechaInicio.getTime() - ahora.getTime();
const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
```

Variantes de texto:
- `diffDias < 0` → "Ya comenzó"
- `diffDias === 0` → "¡Hoy!"
- `diffDias === 1` → "Mañana"
- `diffDias <= 7` → "Esta semana · Faltan {N} días"
- `diffDias > 7` → "Faltan {N} días"

Se ubica debajo del título en el header, como un badge destacado. No requiere hidratación — el valor es estático al momento del request.

### 3. Barra de cupos — visual con color semántico

Solo visible cuando `cupoMaximo` está definido.

```ts
const porcentajeOcupado = (inscripciones / cupoMaximo) * 100;
```

Colores:
- `< 60%` → `bg-green-400`
- `60–85%` → `bg-amber-400`
- `> 85%` → `bg-red-400`

La barra va dentro del card de "Detalles del Evento", bajo el item de Cupos, reemplazando el texto plano actual.

### 4. Google Maps link — query string con ubicacion

```ts
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(capacitacion.ubicacion)}`;
```

Solo se renderiza si `capacitacion.modalidad !== "VIRTUAL"` y `capacitacion.ubicacion` tiene valor. Se muestra como un link pequeño junto al ítem de ubicación en la grilla de detalles: "Ver en Maps →".

## Risks / Trade-offs

- **Countdown estático**: el valor se calcula al momento del SSR. Si el usuario deja la pestaña abierta y regresa al día siguiente, el countdown no se actualiza hasta recargar. Aceptable — es una página de detalle, no un timer en vivo.
- **Maps con texto libre**: si `ubicacion` es ambigua (ej: "Salón Principal"), Google Maps puede mostrar resultados poco relevantes. Mitigación: el link abre Maps en modo búsqueda, no en modo navegación — el usuario puede refinar.
- **Datos bancarios visibles**: están en `NEXT_PUBLIC_*`, ya son públicos en el bundle del cliente. No hay exposición nueva.
