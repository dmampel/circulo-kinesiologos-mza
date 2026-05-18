# Delta for socio-portal

## ADDED Requirements

### Requirement: Widget de Próximos Turnos en Dashboard

El dashboard de `/mi-panel` MUST mostrar un widget con los turnos del profesional para el día actual. Si no hay turnos para hoy, SHOULD mostrar los próximos 3 turnos futuros. El widget MUST enlazar a la sección `/mi-panel/turnos`.

#### Scenario: Turnos para hoy

- GIVEN que el profesional tiene turnos agendados para el día actual
- WHEN accede al dashboard
- THEN ve el widget "Tus Turnos de Hoy" con los turnos del día, ordenados por hora

#### Scenario: Sin turnos hoy, con turnos futuros

- GIVEN que el profesional no tiene turnos para hoy pero sí próximos
- WHEN accede al dashboard
- THEN el widget muestra los próximos 3 turnos con su fecha y hora

#### Scenario: Sin turnos registrados

- GIVEN que el profesional no tiene ningún turno agendado
- WHEN accede al dashboard
- THEN el widget muestra un estado vacío con CTA "Agendar turno"

---

### Requirement: Ítem "Turnos" en Sidebar

El sidebar del portal del socio MUST incluir el ítem de navegación "Turnos" que enlaza a `/mi-panel/turnos`. El ítem MUST mostrar estado activo cuando la ruta actual es `/mi-panel/turnos` o cualquier subruta.

#### Scenario: Navegación al turnero

- GIVEN que el profesional está en el portal del socio
- WHEN hace click en "Turnos" en el sidebar
- THEN es redirigido a `/mi-panel/turnos` con la vista de agenda semanal

#### Scenario: Estado activo del ítem

- GIVEN que el profesional está en cualquier ruta bajo `/mi-panel/turnos`
- WHEN mira el sidebar
- THEN el ítem "Turnos" aparece visualmente destacado (activo)
