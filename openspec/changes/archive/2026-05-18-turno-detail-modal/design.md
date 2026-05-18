## Context

La agenda semanal (`AgendaSemanal.tsx`) renderiza cada turno como un `<Link>` a `/mi-panel/turnos/[id]/editar`, rompiendo el flujo. El kinesiólogo necesita una vista de detalle rápida sin salir de la agenda.

La query actual `TurnoRepository.getByProfesionalAndWeek` ya trae los turnos con `paciente: { id, nombre, apellido }` — le faltan `telefono` y `email` para poder contactar. El server action `cambiarEstadoTurno(id, estado)` ya existe y no requiere modificaciones.

## Goals / Non-Goals

**Goals:**
- Panel de detalle inline (slide-over lateral) al clickear un turno en la agenda.
- Mostrar todos los campos del turno (fecha, hora, duración, motivo, notas, estado).
- Mostrar datos de contacto del paciente con links directos a WhatsApp y email.
- Botones de cambio de estado desde el modal (Confirmar, Completar, Cancelar, Pendiente).
- Botón "Editar" que navega a la página de edición completa.

**Non-Goals:**
- Edición inline de campos desde el modal (eso lo maneja `/editar`).
- Cambios en la estructura de Prisma / migraciones Supabase.
- Soporte de múltiples estados al mismo tiempo.

## Decisions

### 1. Modal vs Slide-over
**Decisión:** Slide-over lateral (panel que emerge desde la derecha).

**Alternativas consideradas:**
- Dialog centrado: tapa la agenda, peor UX en desktop con un grid visual.
- Navegación a `/detalle`: rompe el flujo, misma problemática que la situación actual.

**Rationale:** El slide-over permite que el usuario mantenga la agenda visible y vea en contexto el turno seleccionado. Consistent con el diseño premium del proyecto.

### 2. Estrategia de datos
**Decisión:** Extender el select de `getByProfesionalAndWeek` para incluir `telefono` y `email` del paciente. Un solo fetch, sin round-trips adicionales.

**Alternativas consideradas:**
- Fetch separado al abrir el modal: introduce latencia visible al clickear.
- Query independiente `TurnoRepository.findById`: innecesaria — los datos ya están disponibles en la semana cargada.

**Rationale:** Los datos de contacto son livianos, el costo de incluirlos en la query semanal es mínimo. La UX es instantánea (no spinner al abrir el modal).

### 3. Gestión de estado del modal
**Decisión:** Estado local en `AgendaSemanal.tsx` con `useState<TurnoConPaciente | null>`. No se necesita context ni store global.

**Rationale:** El modal vive dentro del mismo componente que lo abre. Scope acotado, sin complejidad innecesaria.

### 4. Cambio de estado desde el modal
**Decisión:** Llamar `cambiarEstadoTurno` y actualizar el estado local optimísticamente antes de la revalidación del servidor.

**Alternativas consideradas:**
- Solo revalidar (sin optimistic update): provoca flash/cierre del modal al recargar.

**Rationale:** UX fluida. Si el server action falla, se revierte. El estado se sincroniza con el servidor vía `revalidatePath`.

### 5. Contacto por WhatsApp
**Decisión:** Link `https://wa.me/549{telefono}` (formato internacional Argentina, sin `+` ni `0`). Si el teléfono tiene prefijo 0 se limpia con una función helper `formatWhatsappNumber`.

## Componentes

```
AgendaSemanal.tsx  (modificado)
└── TurnoDetailModal.tsx  (nuevo, "use client")
```

**`TurnoDetailModal` props:**
```typescript
type Props = {
  turno: TurnoConPaciente | null;
  onClose: () => void;
  onEstadoChange: (id: string, estado: EstadoTurno) => void;
};
```

**`TurnoConPaciente` (extendido):**
```typescript
type TurnoConPaciente = {
  id: string;
  fecha: Date;
  duracion: number;
  motivo: string | null;
  notas: string | null;
  estado: EstadoTurno;
  paciente: {
    id: string;
    nombre: string;
    apellido: string;
    telefono: string | null;
    email: string | null;
  };
};
```

## Risks / Trade-offs

- **Datos de contacto sensibles**: `telefono` y `email` se exponen en el cliente vía la query semanal. Son datos propios del profesional sobre sus pacientes → aceptable dentro del modelo de aislamiento existente.
- **AgendaSemanal crece en responsabilidad**: Al manejar estado del modal, el componente añade lógica de UI. Si en el futuro se agregan más interacciones, considerar extraer un hook `useAgendaModal`.
- **Número de teléfono sin formato estándar**: Los pacientes pueden tener formatos variables (011, +549, etc.). El helper `formatWhatsappNumber` debe manejar los casos comunes pero puede no ser perfecto.

## Open Questions

- ¿Debe mostrarse el campo `notas` del paciente en el detalle del turno, o solo las notas del turno? → Decisión: solo las notas del turno para mantener el modal acotado.
