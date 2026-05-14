## Why

El flujo de recuperación de contraseña no está implementado: el link "¿Olvidaste tu contraseña?" del login apunta a `#` y el email de recovery de Supabase redirige al home sin establecer sesión. Los socios no pueden recuperar su acceso de forma autónoma.

## What Changes

- Nueva página `/forgot-password` con formulario de email para solicitar el reset.
- Nueva server action `requestPasswordReset` que llama a `supabase.auth.resetPasswordForEmail` con `redirectTo` apuntando a `/auth/callback?next=/auth/set-password`.
- El link "¿Olvidaste tu contraseña?" en el login pasa a apuntar a `/forgot-password`.
- La página `/auth/set-password` ya existe y funciona; solo se asegura que el callback la active correctamente.

## Capabilities

### New Capabilities

- `forgot-password`: Flujo completo de recuperación de contraseña vía email para socios.

### Modified Capabilities

_(ninguna)_

## Impact

- `src/app/login/page.tsx` — actualizar href del link de recuperación.
- `src/app/forgot-password/page.tsx` — nueva página (formulario de email).
- `src/app/auth/actions.ts` — nueva action `requestPasswordReset`.
- No requiere cambios de DB ni migraciones de Supabase.
