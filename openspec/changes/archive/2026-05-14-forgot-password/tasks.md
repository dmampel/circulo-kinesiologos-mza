## 1. Server Action

- [x] 1.1 Agregar action `requestPasswordReset` en `src/app/auth/actions.ts` que llame a `supabase.auth.resetPasswordForEmail` con `redirectTo = ${origin}/auth/callback?next=/auth/set-password`
- [x] 1.2 La action redirige a `/forgot-password?message=sent` en éxito o `/forgot-password?error=...` en fallo

## 2. Página Forgot Password

- [x] 2.1 Crear `src/app/forgot-password/page.tsx` con formulario de email (Server Component, mismo estilo visual que `/login`)
- [x] 2.2 Mostrar mensaje de éxito si `searchParams.message === 'sent'`
- [x] 2.3 Mostrar mensaje de error si `searchParams.error` está presente

## 3. Conexión y Configuración

- [x] 3.1 Actualizar el href del link "¿Olvidaste tu contraseña?" en `src/app/login/page.tsx` de `#` a `/forgot-password`
- [x] 3.2 Agregar `http://localhost:3000/auth/callback` y la URL de producción a la allowlist de Redirect URLs en el dashboard de Supabase (Authentication → URL Configuration)
