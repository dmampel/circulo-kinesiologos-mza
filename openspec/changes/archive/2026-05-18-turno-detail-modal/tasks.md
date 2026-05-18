## 1. Datos — Extender query semanal con contacto del paciente

- [x] 1.1 En `TurnoRepository.getByProfesionalAndWeek`, agregar `telefono` y `email` al `select` de `paciente`
- [x] 1.2 Actualizar el tipo `TurnoConPaciente` en `AgendaSemanal.tsx` para incluir `telefono: string | null` y `email: string | null` en el objeto `paciente`
- [x] 1.3 Agregar `notas: string | null` al tipo `TurnoConPaciente` y al select del repositorio

## 2. Componente — TurnoDetailModal

- [x] 2.1 Crear `src/app/mi-panel/turnos/_components/TurnoDetailModal.tsx` como `"use client"`
- [x] 2.2 Implementar el layout del slide-over: overlay oscuro + panel lateral derecho con transición CSS
- [x] 2.3 Sección de cabecera: nombre y apellido del paciente, badge de estado con colores consistentes con `ESTADO_STYLES`
- [x] 2.4 Sección de info del turno: fecha formateada, hora de inicio y fin, duración en minutos, motivo y notas
- [x] 2.5 Sección de contacto: botón WhatsApp (`wa.me/549{telefono}`) y botón email (`mailto:`), ocultos si el dato es null
- [x] 2.6 Implementar helper `formatWhatsappNumber(telefono: string): string` que limpia el número (quita `0`, `+`, espacios, guiones) y construye el link `wa.me`
- [x] 2.7 Sección de estados: cuatro botones (PENDIENTE / CONFIRMADO / COMPLETADO / CANCELADO) con el estado activo resaltado; al clickear llama `cambiarEstadoTurno` y actualiza localmente vía callback `onEstadoChange`
- [x] 2.8 Botón "Editar turno" que navega a `/mi-panel/turnos/[id]/editar`
- [x] 2.9 Botón de cierre (X) en la cabecera y click en overlay llaman `onClose`

## 3. Integración — AgendaSemanal

- [x] 3.1 Añadir `useState<TurnoConPaciente | null>(null)` para el turno seleccionado en `AgendaSemanal`
- [x] 3.2 Convertir los cards de turno de `<Link>` a `<button>` con `onClick={() => setSelectedTurno(turno)}`
- [x] 3.3 Implementar handler `handleEstadoChange(id, nuevoEstado)` que actualiza el turno en el array local antes de la revalidación del servidor
- [x] 3.4 Renderizar `<TurnoDetailModal turno={selectedTurno} onClose={() => setSelectedTurno(null)} onEstadoChange={handleEstadoChange} />` al final del componente
