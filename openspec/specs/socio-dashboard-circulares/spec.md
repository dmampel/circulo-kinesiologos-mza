# Socio Dashboard Circulares Specification

## Purpose
Define how institutional circulares are displayed to the society members (socios) on their private dashboard.

## Requirements

### Requirement: Visualizar Últimas Circulares
The system MUST display the most recently published circulares on the partner dashboard.

#### Scenario: Socio views dashboard with published circulares
- GIVEN there are circulares with `publicada = true`
- WHEN the socio visits `/mi-panel`
- THEN the dashboard displays the latest published circulares ordered by `publicada_en` descending
- AND each circular displays its title, dynamic tag, and formatted date

#### Scenario: Excluir circulares en borrador
- GIVEN there are circulares with `publicada = false`
- WHEN the socio visits `/mi-panel`
- THEN those draft circulares MUST NOT appear in the list

#### Scenario: UI estética
- GIVEN the socio is viewing the latest circulares
- WHEN the system renders them
- THEN it MUST follow the vertical timeline layout aesthetic defined in the current UI
