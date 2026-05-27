## 1. Infraestructura

- [x] 1.1 Crear `src/lib/resend.ts` — singleton de Resend con guard de API key
- [x] 1.2 Agregar `RESEND_FROM_EMAIL` e `INSTITUTIONAL_EMAIL` al `.env.example` (bloqueado por permisos — agregar manualmente: `RESEND_FROM_EMAIL=` e `INSTITUTIONAL_EMAIL=`)

## 2. registro/actions.ts

- [x] 2.1 Reemplazar instancia local de Resend por el singleton de `src/lib/resend.ts`
- [x] 2.2 Leer `RESEND_FROM_EMAIL` e `INSTITUTIONAL_EMAIL` desde env (con fallbacks)
- [x] 2.3 Agregar email de confirmación al solicitante después de guardar la solicitud en la DB

## 3. admin/solicitudes/actions.ts

- [x] 3.1 Importar el singleton de Resend
- [x] 3.2 Agregar email de aprobación al profesional en el bloque `APROBAR` (después de crear el profesional)
- [x] 3.3 Agregar email de rechazo al profesional en el bloque `RECHAZAR`
