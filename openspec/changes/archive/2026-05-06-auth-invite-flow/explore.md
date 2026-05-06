## Exploration: auth-invite-flow

### Current State
- En `src/app/admin/solicitudes/actions.ts` (`gestionarSolicitud`), al aprobar una solicitud se crea el registro `Profesional` en la base de datos local (Prisma).
- El campo `userId` en el modelo `Profesional` (que debería guardar el ID de Supabase Auth) queda en `null`.
- El socio no se entera de que fue aprobado ni se le crea la cuenta real para poder loguearse.
- No existe actualmente un cliente administrador de Supabase configurado en el backend (ej: `src/lib/supabase/admin.ts`).

### Affected Areas
- `.env` — Necesita tener la `SUPABASE_SERVICE_ROLE_KEY`.
- `src/lib/supabase/admin.ts` (NUEVO) — Cliente de `@supabase/supabase-js` instanciado con la Service Role Key para tener permisos de creación de usuarios bypassando políticas.
- `src/app/admin/solicitudes/actions.ts` — Al aprobar, antes de crear el `Profesional`, hay que llamar a Supabase para invitar al usuario.

### Approaches
1. **Supabase `inviteUserByEmail` (Nativo)**
   - Pros: Supabase gestiona la seguridad del token. Al crear al usuario, devuelve el `id` para guardarlo en Prisma. Supabase envía el email directamente.
   - Cons: El diseño del mail de bienvenida se tiene que editar desde el panel web de Supabase, no desde el código.
   - Effort: Bajo.

2. **Creación silenciosa + Magic Link Manual vía Resend**
   - Pros: Control absoluto del diseño del email de bienvenida desde nuestro código usando `resend` (que ya está instalado).
   - Cons: Hay que generar el link mágico vía API, armar el componente React Email, y mandarlo por Resend.
   - Effort: Medio.

### Recommendation
Opción 1 (**Supabase Nativo**). Es la forma más robusta y segura. Usamos la API `admin.inviteUserByEmail` de Supabase Auth, tomamos el `user.id` que nos devuelve la promesa, y lo insertamos como `userId` en la tabla `Profesional` de Prisma. El kinesiólogo recibe un mail seguro para configurar su contraseña.

### Risks
- Falla la invitación si la variable de entorno `SUPABASE_SERVICE_ROLE_KEY` no está configurada.
- Si Prisma falla al crear el Profesional *después* de que Supabase creó el usuario, quedamos con un usuario huérfano en Auth (se puede mitigar haciendo primero Prisma o manejando el error, pero Supabase no tiene transacciones distribuidas con Prisma).

### Ready for Proposal
Sí. La ruta de acción está clara.
