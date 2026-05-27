## ADDED Requirements

### Requirement: Obra Social del Paciente

El sistema MUST permitir registrar la obra social de un paciente como texto libre opcional. El campo NO MUST ser obligatorio — un paciente puede no tener obra social o el profesional puede no conocerla al momento del alta.

#### Scenario: Alta con obra social

- **WHEN** el profesional completa el campo obra social al crear o editar un paciente
- **THEN** el valor se persiste en `Paciente.obraSocial` en la base de datos

#### Scenario: Alta sin obra social

- **WHEN** el profesional deja el campo obra social vacío
- **THEN** el paciente se crea/actualiza correctamente con `obraSocial = null`

#### Scenario: Visualización en ficha del paciente

- **WHEN** el profesional accede al detalle de un paciente que tiene obra social registrada
- **THEN** el dato se muestra claramente en la ficha
- **WHEN** el paciente no tiene obra social
- **THEN** el campo no se muestra o se muestra como "—"
