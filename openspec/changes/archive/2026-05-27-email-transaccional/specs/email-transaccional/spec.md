## ADDED Requirements

### Requirement: Email de confirmación al solicitante
El sistema SHALL enviar un email al solicitante inmediatamente después de que su solicitud sea guardada exitosamente en la base de datos.

#### Scenario: Registro exitoso con API key configurada
- **WHEN** `crearSolicitud` guarda la solicitud en la DB sin errores
- **AND** `RESEND_API_KEY` está configurada y no es el placeholder
- **THEN** el sistema envía un email al email del solicitante confirmando la recepción de su solicitud

#### Scenario: Registro exitoso sin API key
- **WHEN** `crearSolicitud` guarda la solicitud en la DB sin errores
- **AND** `RESEND_API_KEY` no está configurada o es el placeholder
- **THEN** el sistema NO intenta enviar el email y continúa normalmente

#### Scenario: Fallo de envío no bloquea el registro
- **WHEN** Resend devuelve un error al enviar el email de confirmación
- **THEN** el sistema ignora el error y completa el redirect a `/registro/exito`

---

### Requirement: Email de aprobación al profesional
El sistema SHALL enviar un email al profesional cuando su solicitud es aprobada por el admin.

#### Scenario: Aprobación exitosa con API key configurada
- **WHEN** `gestionarSolicitud` aprueba una solicitud (`accion === "APROBAR"`)
- **AND** el profesional es creado exitosamente en la DB
- **AND** `RESEND_API_KEY` está configurada
- **THEN** el sistema envía un email al email de la solicitud notificando la aprobación e indicando que recibirán un link de acceso

#### Scenario: Fallo de envío no bloquea la aprobación
- **WHEN** Resend devuelve un error al enviar el email de aprobación
- **THEN** el sistema ignora el error y retorna `{ success: true }`

---

### Requirement: Email de rechazo al profesional
El sistema SHALL enviar un email al profesional cuando su solicitud es rechazada por el admin.

#### Scenario: Rechazo con API key configurada
- **WHEN** `gestionarSolicitud` rechaza una solicitud (`accion === "RECHAZAR"`)
- **AND** `RESEND_API_KEY` está configurada
- **THEN** el sistema envía un email al email de la solicitud notificando el rechazo

#### Scenario: Fallo de envío no bloquea el rechazo
- **WHEN** Resend devuelve un error al enviar el email de rechazo
- **THEN** el sistema ignora el error y retorna `{ success: true }`

---

### Requirement: Email institucional y sender como variables de entorno
El sistema SHALL leer el email de destino institucional y el sender de Resend desde variables de entorno, sin valores hardcodeados en el código.

#### Scenario: Variables configuradas
- **WHEN** `RESEND_FROM_EMAIL` y `INSTITUTIONAL_EMAIL` están definidas en el entorno
- **THEN** el sistema las usa como `from` y `to` en todos los emails institucionales

#### Scenario: Variables no configuradas — fallback
- **WHEN** `RESEND_FROM_EMAIL` no está definida
- **THEN** el sistema usa `'onboarding@resend.dev'` como fallback (entorno de desarrollo)
- **WHEN** `INSTITUTIONAL_EMAIL` no está definida
- **THEN** el sistema usa `'admin@circulokinesiologos.com'` como fallback
