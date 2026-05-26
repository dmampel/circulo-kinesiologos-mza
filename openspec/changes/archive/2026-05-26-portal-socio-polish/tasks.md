## 1. TurnoRepository — auto-completado de turnos pasados

- [x] 1.1 En `src/lib/repositories/TurnoRepository.ts`, agregar método estático `autoCompletarPasados(profesionalId: string)` que ejecute `prisma.turno.updateMany` con `fecha < new Date()` y `estado IN [PENDIENTE, CONFIRMADO]` → `COMPLETADO`
- [x] 1.2 Llamar `TurnoRepository.autoCompletarPasados(profesional.id)` en `src/app/mi-panel/page.tsx` antes de `getByProfesionalAndWeek`

## 2. Dashboard — card de cabecera

- [x] 2.1 En `src/app/mi-panel/page.tsx`, eliminar el bloque `<div>` con "Vencimiento" y "Dic 2026"
- [x] 2.2 Reemplazar el badge "Activo" hardcodeado por lógica dinámica: `profesional.status === "ACTIVO"` → badge verde "Activo"; `INACTIVO` → badge gris "Inactivo"

## 3. Dashboard — agenda visual (días pasados)

- [x] 3.1 En el week strip de `src/app/mi-panel/page.tsx`, agregar `esPasado` (`dia < hoy && !esHoy`) y aplicar `opacity-40` al número y etiqueta del día
- [x] 3.2 En el timeline unificado, aplicar `opacity-50` y quitar hover a los ítems cuyo día sea pasado (usar la variable `esPasado` derivada del `key` o de `diaDate`)

## 4. Capacitaciones — formato de precio

- [x] 4.1 En `src/app/mi-panel/capacitaciones/page.tsx` línea ~141, cambiar `toLocaleString()` → `toLocaleString("es-AR")`
