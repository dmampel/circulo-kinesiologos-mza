## ADDED Requirements

### Requirement: Admin puede crear un sorteo
El sistema SHALL permitir al admin crear un sorteo con título, descripción, fecha de inicio, fecha de cierre opcional, cupo máximo opcional e imagen opcional. El sorteo se crea en estado `BORRADOR`.

#### Scenario: Creación exitosa
- **WHEN** el admin completa el formulario con título y fecha de inicio y guarda
- **THEN** el sorteo queda guardado en estado `BORRADOR` y aparece en la lista de sorteos

#### Scenario: Campos requeridos faltantes
- **WHEN** el admin intenta guardar sin título o sin fecha de inicio
- **THEN** el sistema muestra un error de validación y no persiste el sorteo

---

### Requirement: Admin puede publicar y despublicar un sorteo
El sistema SHALL permitir al admin cambiar el estado de un sorteo entre `BORRADOR` y `ACTIVO`. Solo los sorteos en estado `ACTIVO` son visibles para los socios.

#### Scenario: Publicar un sorteo
- **WHEN** el admin cambia el estado de `BORRADOR` a `ACTIVO`
- **THEN** el sorteo pasa a ser visible en el panel de socios

#### Scenario: Despublicar un sorteo activo
- **WHEN** el admin cambia el estado de `ACTIVO` a `BORRADOR`
- **THEN** el sorteo deja de ser visible para los socios (las inscripciones existentes se conservan)

---

### Requirement: Admin puede ver la lista de inscriptos
El sistema SHALL mostrar al admin, en el detalle de cada sorteo, la lista completa de profesionales inscriptos con nombre, apellido y matrícula.

#### Scenario: Sorteo con inscriptos
- **WHEN** el admin abre el detalle de un sorteo con inscriptos
- **THEN** ve la lista de inscriptos con nombre completo y matrícula

#### Scenario: Sorteo sin inscriptos
- **WHEN** el admin abre el detalle de un sorteo sin inscriptos
- **THEN** ve un mensaje indicando que aún no hay participantes

---

### Requirement: Admin puede realizar el sorteo
El sistema SHALL permitir al admin ejecutar el sorteo seleccionando aleatoriamente un ganador entre los inscriptos. Una vez realizado, el estado pasa a `REALIZADO` y el ganador queda registrado. Esta acción es irreversible.

#### Scenario: Sorteo con inscriptos disponibles
- **WHEN** el admin hace clic en "Realizar sorteo" y confirma la acción
- **THEN** el sistema selecciona un ganador al azar, guarda el resultado y el sorteo pasa a estado `REALIZADO`

#### Scenario: Sorteo sin inscriptos
- **WHEN** el admin intenta realizar el sorteo sin inscriptos
- **THEN** el sistema muestra un error y no permite ejecutar el sorteo

#### Scenario: Sorteo ya realizado
- **WHEN** el sorteo está en estado `REALIZADO`
- **THEN** el botón de sorteo no está disponible y se muestra el ganador

---

### Requirement: Admin puede editar un sorteo no realizado
El sistema SHALL permitir editar los datos de un sorteo en estado `BORRADOR` o `ACTIVO`. No se puede editar un sorteo en estado `REALIZADO`.

#### Scenario: Edición de sorteo editable
- **WHEN** el admin edita un sorteo en estado `BORRADOR` o `ACTIVO` y guarda
- **THEN** los cambios se persisten correctamente

#### Scenario: Intento de edición de sorteo realizado
- **WHEN** el sorteo está en estado `REALIZADO`
- **THEN** el formulario de edición no está disponible
