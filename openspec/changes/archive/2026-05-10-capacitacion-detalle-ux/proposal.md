## Why

La página de detalle `/mi-panel/capacitaciones/[id]` funciona pero no es suficientemente útil. El socio con pago pendiente tiene que hacer click en un modal para ver a dónde transferir. No hay sentido de urgencia temporal ni visual sobre cupos. Y en eventos presenciales, llegar al lugar requiere salir de la app manualmente. Tres gaps concretos con soluciones directas.

## What Changes

- **Datos bancarios inline**: si el socio tiene una inscripción en estado `PENDIENTE` y el evento tiene costo, mostrar CBU, Alias y Titular directamente en el card CTA —sin modal— junto con los botones de WhatsApp y Email.
- **Countdown al evento**: mostrar "Faltan X días" (o "Hoy", "Mañana", "Ya comenzó") calculado en el Server Component a partir de `fechaInicio`.
- **Barra de cupos**: visualización de progreso (X/Y) con color semántico (verde → amarillo → rojo según disponibilidad) cuando `cupoMaximo` está definido.
- **Link a Google Maps**: si `modalidad !== "VIRTUAL"` y hay `ubicacion`, mostrar un link `target="_blank"` al buscador de Google Maps con la dirección como query.

## Capabilities

### New Capabilities
- `capacitacion-detalle-ux`: Mejoras de UX en la página de detalle del portal socio — datos de pago inline, countdown, barra de cupos y link a Maps.

### Modified Capabilities
- (ninguna — no cambian requisitos de specs existentes, solo se enriquece la UI)

## Impact

- **Modificado**: `src/app/mi-panel/capacitaciones/[id]/page.tsx` — todos los cambios son en este archivo.
- Sin cambios en schema Prisma, repositorios, ni actions.
- Sin nuevas dependencias externas.
