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

### Requirement: Socio puede acceder a la publicación del sorteo
El sistema SHALL mostrar un botón "Ir al sorteo" que dirige al socio a la publicación de Instagram del sorteo en estado `ACTIVO`. Si no hay URL disponible, muestra un texto de fallback. Para socios ya inscriptos en sorteos anteriores, se conserva la opción de cancelar su inscripción.

#### Scenario: Sorteo con URL de Instagram disponible
- **WHEN** el socio ve un sorteo activo que tiene URL de Instagram configurada
- **THEN** el sistema muestra un botón "Ir al sorteo" que abre la publicación en una pestaña nueva

#### Scenario: Sorteo sin URL de Instagram
- **WHEN** el socio ve un sorteo activo sin URL configurada
- **THEN** el sistema muestra el texto "Link del sorteo próximamente" en lugar del botón

#### Scenario: Socio ya inscripto en sorteos anteriores
- **WHEN** el socio está inscripto en un sorteo en estado `ACTIVO`
- **THEN** el sistema muestra "Ya participás" y el botón para cancelar su inscripción

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
