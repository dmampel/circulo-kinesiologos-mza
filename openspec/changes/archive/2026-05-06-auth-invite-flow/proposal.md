# Proposal: Auth Invite Flow

## Intent
Actualmente, el proceso de admisión permite al administrador aprobar las solicitudes de nuevos socios, pero está desconectado del sistema de autenticación. El kinesiólogo no es notificado ni se le crea una cuenta de usuario, lo que es un bloqueante total para el futuro "Portal del Socio". Necesitamos vincular la aprobación de la solicitud con la creación segura del usuario en Supabase Auth de forma automática.

## Scope

### In Scope
- Creación de un cliente administrador de Supabase (`supabaseAdmin`) con permisos elevados.
- Ejecución de `inviteUserByEmail` al momento de que un Admin aprueba la solicitud.
- Inserción del `userId` (UUID generado por Supabase) en el registro `Profesional` de nuestra base de datos.
- Manejo de excepciones en caso de que Supabase rechace la invitación.

### Out of Scope
- Diseño del email de bienvenida (se configurará manualmente desde el dashboard de Supabase).
- Implementación de la vista frontend para setear la contraseña inicial (se tratará en el módulo del Portal del Socio).
- Notificación de "Rechazo" vía email.

## Capabilities

### New Capabilities
- `socio-onboarding`: Automatización de la creación de la identidad digital del socio al ser admitido por el Círculo.
- `admin-auth-management`: Conexión de privilegios elevados (Service Role) con Supabase para acciones de administración de usuarios.

### Modified Capabilities
- Ninguna.

## Approach
Se creará un utilitario estricto en `src/lib/supabase/admin.ts` que instancie `@supabase/supabase-js` utilizando `SUPABASE_SERVICE_ROLE_KEY`. En la Server Action de aprobación (`gestionarSolicitud`), modificaremos el flujo para que primero invoque a Supabase para invitar al usuario. Si Supabase responde exitosamente con el objeto `user`, tomamos su `user.id` y procedemos a crear el registro en la tabla `Profesional` de Prisma, vinculando ambas bases de datos.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/supabase/admin.ts` | New | Archivo de inicialización del cliente admin |
| `src/app/admin/solicitudes/actions.ts` | Modified | Inserción de la lógica de invitación previa a la persistencia en Prisma |
| `.env` | Modified | Requiere configuración de Service Role Key por parte del desarrollador |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Desincronización (Auth se crea pero Prisma falla) | Medium | Si Prisma falla luego de invitar, el usuario queda en Auth pero no en Prisma. Para mitigarlo se envolverá en un `try/catch` robusto y se lanzará un error explícito. A futuro se puede considerar compensar (borrando el usuario de auth). |
| Service Role expuesto al frontend | Low | Asegurarse de que el archivo `admin.ts` esté restringido al servidor y la variable de entorno NO empiece con `NEXT_PUBLIC_`. |

## Rollback Plan
Revertir el commit de `actions.ts`, eliminar `admin.ts` y limpiar manualmente a los usuarios fantasma desde el panel web de Supabase.

## Dependencies
- `@supabase/supabase-js` (Ya instalado)

## Success Criteria
- [ ] El Administrador aprueba una solicitud sin errores en la UI.
- [ ] Aparece un nuevo usuario en la sección Authentication del dashboard de Supabase.
- [ ] La tabla `Profesional` tiene un nuevo registro donde el campo `userId` coincide con el UUID de Supabase.
