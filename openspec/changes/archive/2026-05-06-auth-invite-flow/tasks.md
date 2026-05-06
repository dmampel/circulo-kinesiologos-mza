# Tasks: auth-invite-flow

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~50 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Infraestructura de Supabase Admin

- [x] 1.1 Crear el archivo `src/lib/supabase/admin.ts` para exportar el cliente `supabaseAdmin`.
- [x] 1.2 Validar que las variables `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` estén disponibles.

## Phase 2: Integración en Solicitudes (Server Actions)

- [x] 2.1 Importar `supabaseAdmin` en `src/app/admin/solicitudes/actions.ts`.
- [x] 2.2 Modificar la función `gestionarSolicitud` para incluir la llamada a `auth.admin.inviteUserByEmail`.
- [x] 2.3 Capturar el `id` del usuario retornado por Supabase.
- [x] 2.4 Actualizar la creación del `Profesional` en Prisma para incluir el `userId`.
- [x] 2.5 Envolver el flujo en un bloque `try/catch` para capturar errores de Supabase y mostrarlos al admin.

## Phase 3: Verificación y QA

- [x] 3.1 Crear una solicitud de prueba en el frontend de registro.
- [x] 3.2 Aprobar la solicitud desde el panel de administración.
- [x] 3.3 Verificar la creación del usuario en el Dashboard de Supabase (sección Auth).
- [x] 3.4 Verificar la vinculación del `userId` en la tabla `Profesional` (vía Prisma Studio).
