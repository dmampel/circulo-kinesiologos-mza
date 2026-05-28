## ADDED Requirements

### Requirement: Setup de testing funcional
El proyecto SHALL tener un archivo de setup (`src/test/setup.ts`) importado en `vitest.config.ts` que extiende los matchers de Vitest con `@testing-library/jest-dom`.

#### Scenario: Setup cargado correctamente
- **WHEN** se corre `npm test`
- **THEN** los matchers de `@testing-library/jest-dom` (`.toBeInTheDocument()`, `.toHaveValue()`, etc.) están disponibles en todos los tests sin importación adicional

---

### Requirement: Tests de detectarSolapamiento — sin solapamiento
El sistema SHALL tener tests que verifiquen que `detectarSolapamiento` retorna `false` cuando no hay conflicto de horarios.

#### Scenario: Turno en horario libre
- **WHEN** no hay turnos en la misma franja horaria para el profesional
- **THEN** `detectarSolapamiento` retorna `false`

#### Scenario: Turno cancelado no cuenta
- **WHEN** existe un turno en la misma franja pero su estado es CANCELADO
- **THEN** `detectarSolapamiento` retorna `false`

---

### Requirement: Tests de detectarSolapamiento — con solapamiento
El sistema SHALL tener tests que verifiquen que `detectarSolapamiento` retorna `true` ante distintos tipos de conflicto.

#### Scenario: Solapamiento parcial al inicio
- **WHEN** el nuevo turno empieza antes de que termine un turno existente
- **THEN** `detectarSolapamiento` retorna `true`

#### Scenario: Solapamiento parcial al final
- **WHEN** el nuevo turno termina después de que empiece un turno existente
- **THEN** `detectarSolapamiento` retorna `true`

#### Scenario: Solapamiento exacto
- **WHEN** el nuevo turno tiene exactamente el mismo horario que uno existente
- **THEN** `detectarSolapamiento` retorna `true`

#### Scenario: excludeId ignora el turno propio
- **WHEN** se pasa `excludeId` con el ID de un turno que solaparía
- **THEN** `detectarSolapamiento` retorna `false` (el turno propio no cuenta)

---

### Requirement: Tests de TurnoRepository
El sistema SHALL tener tests unitarios de `TurnoRepository` con Prisma mockeado que cubran al menos `crear` y `autoCompletarPasados`.

#### Scenario: crear turno sin solapamiento
- **WHEN** `detectarSolapamiento` retorna `false`
- **THEN** `prisma.turno.create` es llamado con los datos correctos

#### Scenario: autoCompletarPasados actualiza los correctos
- **WHEN** `autoCompletarPasados` es llamado para un profesional
- **THEN** `prisma.turno.updateMany` es llamado con filtro de fecha pasada y estados PENDIENTE/CONFIRMADO

---

### Requirement: Tests de ProfesionalRepository
El sistema SHALL tener tests unitarios de `ProfesionalRepository` con Prisma mockeado que cubran `findByEmail` y `findByMatricula`.

#### Scenario: findByEmail retorna profesional existente
- **WHEN** `findByEmail` es llamado con un email que existe en la DB mockeada
- **THEN** retorna el profesional correspondiente

#### Scenario: findByMatricula retorna null si no existe
- **WHEN** `findByMatricula` es llamado con una matrícula que no existe
- **THEN** retorna `null`

---

### Requirement: Tests de gestionarSolicitud
El sistema SHALL tener tests de la action `gestionarSolicitud` con todas las dependencias externas mockeadas.

#### Scenario: Rechazo actualiza status a RECHAZADA
- **WHEN** `gestionarSolicitud(id, "RECHAZAR")` es llamado
- **THEN** `prisma.solicitud.update` es llamado con `status: "RECHAZADA"`
- **AND** retorna `{ success: true }`

#### Scenario: Aprobación con email duplicado retorna error
- **WHEN** `gestionarSolicitud(id, "APROBAR")` es llamado
- **AND** ya existe un profesional con el mismo email
- **THEN** retorna `{ success: false, error: ... }` sin crear el profesional

#### Scenario: Aprobación exitosa crea profesional y actualiza solicitud
- **WHEN** `gestionarSolicitud(id, "APROBAR")` es llamado sin duplicados
- **THEN** `prisma.profesional.create` y `prisma.solicitud.update` son llamados
- **AND** retorna `{ success: true }`

---

### Requirement: Tests de crearTurno
El sistema SHALL tener tests de la action `crearTurno` con Prisma mockeado.

#### Scenario: Turno con solapamiento retorna warning
- **WHEN** `crearTurno` es llamado y `detectarSolapamiento` retorna `true`
- **THEN** la action retorna un resultado con `warning` indicando el solapamiento

#### Scenario: Turno sin solapamiento se crea exitosamente
- **WHEN** `crearTurno` es llamado sin solapamiento
- **THEN** `prisma.turno.create` es llamado con los datos del formulario
