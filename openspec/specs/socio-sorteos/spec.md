## ADDED Requirements

### Requirement: Socio puede ver sorteos activos
El sistema SHALL mostrar en el panel del socio la lista de sorteos en estado `ACTIVO`, con título, descripción, imagen, fecha de cierre (si aplica) y su estado de inscripción.

#### Scenario: Hay sorteos activos
- **WHEN** el socio accede a la sección de sorteos
- **THEN** ve la lista de sorteos publicados con su información y si ya está inscripto o no

#### Scenario: No hay sorteos activos
- **WHEN** no hay sorteos en estado `ACTIVO`
- **THEN** el sistema muestra un mensaje indicando que no hay sorteos disponibles por el momento

---

### Requirement: Socio puede inscribirse en un sorteo
El sistema SHALL permitir al socio inscribirse en cualquier sorteo en estado `ACTIVO`. Cada socio puede inscribirse solo una vez por sorteo.

#### Scenario: Inscripción exitosa
- **WHEN** el socio hace clic en "Inscribirme" en un sorteo activo
- **THEN** el sistema registra su inscripción y actualiza la UI para reflejar que está inscripto

#### Scenario: Intento de doble inscripción
- **WHEN** el socio intenta inscribirse en un sorteo en el que ya está inscripto
- **THEN** el sistema rechaza la acción (constraint único `@@unique([sorteoId, profesionalId])`)

---

### Requirement: Socio puede desinscribirse de un sorteo
El sistema SHALL permitir al socio cancelar su inscripción en un sorteo que aún no fue realizado (estado `ACTIVO`).

#### Scenario: Desinscripción exitosa
- **WHEN** el socio hace clic en "Cancelar inscripción" en un sorteo activo
- **THEN** su inscripción se elimina y la UI refleja que ya no está inscripto

#### Scenario: Intento de desinscripción de sorteo realizado
- **WHEN** el sorteo está en estado `REALIZADO`
- **THEN** la opción de cancelar inscripción no está disponible

---

### Requirement: Socio puede ver el resultado de sorteos realizados
El sistema SHALL mostrar, en los sorteos en estado `REALIZADO`, el nombre del ganador.

#### Scenario: Ver ganador de un sorteo realizado
- **WHEN** el socio accede a un sorteo en estado `REALIZADO`
- **THEN** el sistema muestra el nombre completo del ganador
