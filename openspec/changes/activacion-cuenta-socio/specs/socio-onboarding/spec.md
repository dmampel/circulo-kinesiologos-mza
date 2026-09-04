## ADDED Requirements

### Requirement: El onboarding termina invitado, no activado

Aprobar una solicitud SHALL dejar al socio en estado **invitado**: existe su identidad en el proveedor de autenticación y su registro en el padrón, pero la cuenta todavía no está en manos de su dueño porque no tiene contraseña propia. El onboarding SHALL considerarse completo recién cuando el socio define esa contraseña.

`Profesional.status` describe la pertenencia al padrón, no el estado de la cuenta. Su valor `ACTIVO` tras la aprobación NO SHALL interpretarse como que el socio puede ingresar al portal.

#### Scenario: Estado inmediatamente después de aprobar

- **GIVEN** un administrador que aprueba una solicitud pendiente
- **WHEN** la invitación se envía y el `Profesional` queda vinculado con su `userId`
- **THEN** la cuenta SHALL quedar sin marca de activación
- **AND** `Profesional.status` SHALL ser `ACTIVO`, describiendo únicamente su alta en el padrón
- **AND** el sistema NO SHALL tratar a ese socio como habilitado para usar el portal

#### Scenario: El socio abre el enlace pero abandona

- **GIVEN** un socio recién aprobado que abre el enlace de la invitación
- **WHEN** obtiene sesión y llega a `/auth/set-password` sin enviar el formulario
- **THEN** el onboarding SHALL seguir incompleto
- **AND** el socio NO SHALL poder usar el portal con esa sesión

#### Scenario: El onboarding se completa

- **GIVEN** un socio invitado y vinculado
- **WHEN** define su contraseña y su cuenta recibe la marca de activación
- **THEN** el onboarding SHALL considerarse completo
- **AND** el socio SHALL poder ingresar por `/login` con sus credenciales de ahí en adelante
