## Why

El flujo de activación no distingue **"hizo click en el link del mail"** de **"definió su contraseña"**. El socio entra por la invitación, queda con sesión activa, y si abandona antes de guardar la contraseña —o si `updateUser` falla y no lee el cartel— se queda con una cuenta viva, sin contraseña propia y figurando como activa en el panel. Cuando la sesión del link se vence, `/login` le devuelve `credenciales_invalidas` y nadie se entera hasta que llama por teléfono.

Medido en producción el 2026-09-04 sobre `auth.users.encrypted_password`: de 244 profesionales vinculados a una cuenta de Auth, **49 tienen contraseña propia y 195 (80%) todavía no abrieron su link**. El número se mueve a diario: subió de 47 a 49 en las horas que llevó implementar este change. Hoy no hay nadie atrapado en el limbo, y ese es justamente el momento de cerrarlo: cada uno de esos 195 puede caer cuando haga click. No hay un bug de código: los 4 call sites de `inviteUserByEmail`, `/auth/callback` y la traducción de errores funcionan bien. Falta el estado **"activación completada"**: hoy no existe en ningún lado, así que ni el sistema puede exigirlo ni el Círculo puede medirlo.

## What Changes

- **Nuevo estado explícito de activación.** `updatePassword` graba `activacion_completada_en` (timestamp ISO) en el `user_metadata` de Supabase Auth, **en la misma llamada** `updateUser({ password, data })`. Una sola operación atómica: o se guardan la contraseña y la marca juntas, o no se guarda ninguna. Es exactamente el estado parcial que hoy existe el que desaparece.
- **Guard de activación en `/mi-panel`.** Un socio con sesión pero sin activación completada es redirigido a `/auth/set-password` en vez de entrar al portal. Se aplica en el middleware (choke point único, cubre subrutas y server actions) y se repite en el layout del segmento como defensa en profundidad, ambos sobre el mismo helper puro.
- **Backfill autoritativo de las cuentas ya activadas.** Un script idempotente marca `activacion_completada_en` en las cuentas que **sí** tienen contraseña, leyendo `auth.users.encrypted_password` — la única señal que distingue con certeza "guardó contraseña" de "sólo abrió el link". Sin esto, el guard le rompería el acceso a los socios que hoy funcionan.
- **BREAKING (semántico, no de API): se corrige el significado de `EstadoInvitacion`.** `InvitacionRepository` hoy calcula `ACTIVADO` como `email_confirmed_at || last_sign_in_at`, es decir, da por activado a quien apenas abrió el link — es la misma confusión que causa el problema, ya horneada en el panel `/admin/invitaciones`. Se agrega el estado `SIN_CONTRASENA` y `ACTIVADO` pasa a significar "tiene contraseña propia". Los números que hoy ve el Círculo en ese panel van a cambiar: es el punto, hoy son falsos.
- **Rescate de quien caiga en el estado: manual, nunca masivo.** Al 2026-09-04 no hay ninguna cuenta en `SIN_CONTRASENA`, así que no hay rescate pendiente; lo que se deja listo es el camino para cuando aparezca la primera. No se agrega ningún envío masivo automático. Se apoya en el `BotonReenviar` que **ya existe** en `/admin/invitaciones` (usa `generateLink` + Resend), que a partir de este change queda habilitado también para el estado `SIN_CONTRASENA`. El Círculo decide a quién le reenvía y cuándo.

### Fuera de scope

- Envío masivo automático de links (efecto irreversible sobre 244 inboxes reales; queda como decisión operativa del Círculo, socio por socio).
- Cambiar el flujo de invitación, `/auth/callback` o la traducción de errores: están verificados y funcionan.
- Tocar `Profesional.status` (ACTIVO/INACTIVO/PENDIENTE). Es estado de **padrón**, no de cuenta, y se mantiene tal cual.

## Capabilities

### New Capabilities

- `activacion-cuenta-socio`: el estado "activación completada" de la cuenta de un socio — cómo se graba, cómo se lee, cómo se exige antes de dar acceso al portal, y cómo se reconcilian las cuentas anteriores al change.

### Modified Capabilities

- `socio-onboarding`: la aprobación de una solicitud deja al socio **invitado, no activado**. El requirement actual afirma que tras aprobar `Profesional.status` es `ACTIVO`, lo cual es correcto para el padrón pero se viene leyendo como si la cuenta estuviera lista para usarse. Se agrega el requirement que separa ambas cosas y define el estado terminal del onboarding.

## Impact

### Base de datos y migraciones

**No hay cambios de schema de Prisma y no hace falta ninguna migración.** La marca de activación vive en `auth.users.raw_user_meta_data`, que es de Supabase Auth y no está bajo el control de Prisma. Sin tabla nueva, sin columna nueva, y por lo tanto **sin RLS que habilitar**. El backfill es un script de una sola vez (lee `auth.users` por SQL, escribe por la Admin API), no una migración.

### Código afectado

| Archivo | Cambio |
|---|---|
| `src/lib/activacion.ts` | **Nuevo.** Helper puro: `activacionCompletada(user)`, constante de la clave de metadata. |
| `src/app/auth/actions.ts` | `updatePassword` agrega `data` a `updateUser`. |
| `src/utils/supabase/middleware.ts` | Guard de activación sobre `/mi-panel`. |
| `src/app/mi-panel/layout.tsx` | Mismo guard, defensa en profundidad. |
| `src/lib/repositories/InvitacionRepository.ts` | Nuevo estado `SIN_CONTRASENA`; `ACTIVADO` se recalcula sobre el flag. |
| `src/app/admin/invitaciones/page.tsx` | Etiqueta, color, ayuda y tarjeta de métrica del nuevo estado; reenvío habilitado para él. |
| `scripts/backfill-activacion.ts` | **Nuevo.** Backfill idempotente. Ensaya por defecto; escribe sólo con `--escribir`. |
| `scripts/listar-socios-en-limbo.ts` | Se commitea. Ya fue reescrito sobre `encrypted_password`: la heurística de delta que usaba antes daba 100% de falsos positivos. |

### Tests

Suite existente a extender, manteniendo el estilo: `src/app/auth/actions.test.ts`, `src/lib/repositories/InvitacionRepository.test.ts`. Nuevo: `src/lib/activacion.test.ts`.

### Personas afectadas

244 socios con cuenta de Auth. **Riesgo principal:** si el guard se activa antes de que el backfill corra, los ~49 socios que hoy entran normalmente quedan atrapados en `/auth/set-password` — y al reingresar su contraseña actual reciben `same_password`, o sea que quedan trabados sin salida. El orden de despliegue es parte del contrato de este change, no un detalle de implementación.

### Operación

Requiere `SUPABASE_SERVICE_ROLE_KEY` y `DATABASE_URL` para el backfill (ambas ya en uso). El panel `/admin/invitaciones` va a mostrar números distintos el día del deploy; hay que avisarle al Círculo antes.
