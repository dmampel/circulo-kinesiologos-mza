## Requirements

### Requirement: Solicitud de recuperación de contraseña

El sistema SHALL proveer un formulario en `/forgot-password` donde el socio ingresa su email para recibir un enlace de recuperación de contraseña.

#### Scenario: Envío exitoso

- **WHEN** el socio ingresa un email y envía el formulario
- **THEN** el sistema llama a `supabase.auth.resetPasswordForEmail` con `redirectTo` apuntando a `/auth/callback?next=/auth/set-password`
- **THEN** muestra el mensaje "Si el email existe en nuestro sistema, recibirás un correo con instrucciones"
- **THEN** el formulario queda deshabilitado para evitar reenvíos accidentales

#### Scenario: Email no registrado

- **WHEN** el socio ingresa un email que no existe en Supabase
- **THEN** el sistema muestra el mismo mensaje genérico (no revela si el email existe o no)

#### Scenario: Error de Supabase

- **WHEN** `supabase.auth.resetPasswordForEmail` retorna error
- **THEN** el sistema muestra un mensaje de error genérico y permite reintentar

### Requirement: Redirección correcta del email de recovery

El sistema SHALL redirigir al socio a `/auth/set-password` después de hacer clic en el enlace del email de recovery, con la sesión ya establecida.

#### Scenario: Click en link del email

- **WHEN** el socio hace clic en el enlace del email de recovery
- **THEN** Supabase redirige a `/auth/callback?code=<code>&next=/auth/set-password`
- **THEN** el callback intercambia el code por sesión y redirige a `/auth/set-password`
- **THEN** el socio puede ingresar y confirmar su nueva contraseña

### Requirement: Acceso desde el login

El sistema SHALL proveer un link visible en la página de login que lleve al flujo de recuperación.

#### Scenario: Click en "¿Olvidaste tu contraseña?"

- **WHEN** el socio hace clic en el link "¿Olvidaste tu contraseña?" en `/login`
- **THEN** es redirigido a `/forgot-password`
