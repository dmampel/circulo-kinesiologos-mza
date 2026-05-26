## Context

El dashboard (`src/app/mi-panel/page.tsx`) es un Server Component que ya carga `ProfesionalRepository`, `TurnoRepository` y `CapacitacionRepository`. La card de cabecera muestra matrícula y especialidades desde DB correctamente, pero "Dic 2026" y "Activo" están hardcodeados. El modelo `Profesional` tiene `status: Status` pero no tiene `fechaVencimiento`.

La agenda semanal (week strip + timeline) ya diferencia `esHoy` con fondo azul, pero no tiene lógica `esPasado`.

El auto-completado de turnos no existe: un turno que pasó ayer sigue mostrándose como PENDIENTE hasta que el kinesiólogo lo cambia manualmente.

## Goals / Non-Goals

**Goals:**
- Mostrar `status` y `fechaVencimiento` reales en la card de cabecera
- Días pasados visualmente apagados en la agenda (no interactivos)
- Auto-completar turnos pasados al cargar el dashboard (batch update silencioso)
- Fix de precio con locale `es-AR`

**Non-Goals:**
- Exponer `fechaVencimiento` en el admin CRUD (siguiente iteración)
- Animaciones o transiciones nuevas
- Lógica de vencimiento automático (cron/job) — solo carga del dashboard

## Decisions

### 1. Eliminar "Vencimiento" del card de cabecera

No existe base de datos para calcular la fecha de vencimiento (sin sistema de cuotas). Se elimina el campo "Vencimiento: Dic 2026" hardcodeado. El badge "Activo" se reemplaza por `profesional.status` (`ACTIVO` → verde, `INACTIVO` → gris). Sin schema change.

### 2. Auto-completado de turnos: batch update al cargar el dashboard

Al ejecutar `TurnoRepository.getByProfesionalAndWeek`, antes de devolver resultados se hace un `updateMany` que cambia a COMPLETADO todos los turnos del profesional con `fecha < now()` y `estado IN [PENDIENTE, CONFIRMADO]`.

Alternativa rechazada: cron job o webhook. Overkill para el volumen actual; el dashboard ya carga los turnos, el batch es transparente.

Alternativa rechazada: solo display (no persistir). Se descarta porque otros componentes (ej. la vista de turnos completa) también deben ver el estado correcto.

### 3. Agenda visual — días pasados con opacidad reducida

Agregar `esPasado: boolean` a la lógica del week strip. En el timeline, los ítems de días pasados se renderizan con `opacity-50` y sin hover interactivo.

Separación del "día actual" (`esHoy`) que ya existe y conserva su estilo azul.

### 4. Precio con locale explícito

`Number(c.costo).toLocaleString()` sin locale delega al entorno (Node en server, browser en client). En producción con Node.js el locale del sistema puede no ser `es-AR`. Fix: `toLocaleString("es-AR")` explícito. Ya aplicado en `[id]/page.tsx`, falta en `page.tsx:141`.

## Risks / Trade-offs

- **Batch update de turnos en cada load del dashboard** → si hay muchos turnos históricos el `updateMany` podría ser lento. Mitigación: filtrar por `profesionalId` (índice existente) y limitar a los últimos 90 días si el volumen crece.

## Migration Plan

Sin cambios de schema. Deploy directo, sin migraciones.
