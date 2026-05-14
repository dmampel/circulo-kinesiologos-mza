## Context

El auth usa Supabase con PKCE flow (App Router, server-side). Ya existe `/auth/callback/route.ts` que intercambia un `code` por sesión y acepta el parámetro `next` para redirigir. También existe `/auth/set-password/page.tsx` con el formulario de nueva contraseña. Solo falta el punto de entrada: la página y la action que disparan el email de recovery.

## Goals / Non-Goals

**Goals:**
- Socio puede solicitar reset de contraseña ingresando su email.
- El email de Supabase redirige correctamente a `/auth/set-password` vía el callback existente.
- Feedback visual claro (enviado / error).

**Non-Goals:**
- Rate limiting del formulario.
- Cambio de contraseña desde el panel (ya autenticado).
- Flujo de registro de nuevos socios.

## Decisions

**1. Action: `requestPasswordReset` en `src/app/auth/actions.ts`**
Llama a `supabase.auth.resetPasswordForEmail(email, { redirectTo })` donde `redirectTo = ${origin}/auth/callback?next=/auth/set-password`.
El `origin` se obtiene desde `headers().get('origin')` (disponible en Server Actions).
Redirige a `/forgot-password?message=sent` o `/forgot-password?error=...` según resultado.

No se revela si el email existe o no (security: siempre muestra "si el email existe, te llegará un correo").

**2. Página: `src/app/forgot-password/page.tsx`**
Server Component. Muestra el formulario con un campo de email.
Reutiliza el mismo estilo visual del login (tarjeta blanca, bordes redondeados, tipografía premium).
Lee `searchParams.message` y `searchParams.error` para mostrar feedback post-submit.

**3. Supabase redirect URL**
El `redirectTo` debe estar en la allowlist del dashboard de Supabase (Authentication → URL Configuration → Redirect URLs).
En dev: `http://localhost:3000/auth/callback`
En prod: `https://dominio.com/auth/callback`

## Risks / Trade-offs

- **Supabase allowlist**: Si el `redirectTo` no está permitido, Supabase lo ignora y redirige al Site URL → el mismo bug de antes. Mitigación: documentar en tasks que hay que agregarlo al dashboard.
- **Email de usuario inexistente**: Supabase no retorna error si el email no existe (diseño intencional). El mensaje genérico es correcto para evitar user enumeration.
