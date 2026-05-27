## Context

Resend ya está instalado (`resend` package) y se usa en `src/app/registro/actions.ts` para notificar al equipo institucional cuando llega una nueva solicitud. El flujo hacia el solicitante (confirmación, aprobación, rechazo) no existe. Los emails de aprobación/rechazo se disparan desde `src/app/admin/solicitudes/actions.ts` (`gestionarSolicitud`).

Datos hardcodeados a eliminar:
- `from: 'Círculo Kinesiólogos <onboarding@resend.dev>'` → `RESEND_FROM_EMAIL`
- `to: ['institucional@circulokinesiologos.com']` → `INSTITUTIONAL_EMAIL`

## Goals / Non-Goals

**Goals:**
- Email de confirmación al solicitante al enviar su solicitud
- Email de aprobación al profesional cuando su solicitud es aprobada
- Email de rechazo al profesional cuando su solicitud es rechazada
- Mover email institucional y sender a variables de entorno

**Non-Goals:**
- Templates visuales con React Email (inline HTML es suficiente, misma línea que el email ya existente)
- Sistema de cola o reintentos de emails
- Emails para otros flujos (capacitaciones, turnos)

## Decisions

### D1: Inline HTML vs React Email

**Decisión**: Continuar con inline HTML como en el email existente de `registro/actions.ts`.

**Alternativa descartada**: React Email — agrega dependencia y complejidad que no justifica el scope (3 emails).

**Rationale**: Consistencia con el código existente; los emails son simples y raramente cambian.

---

### D2: Instancia de Resend — singleton vs instancia local

**Decisión**: Crear un singleton en `src/lib/resend.ts` que exporta la instancia de Resend.

**Rationale**: Actualmente `registro/actions.ts` instancia Resend directamente en el módulo. Al sumar `solicitudes/actions.ts`, tener dos instancias es redundante. Un módulo central evita duplicación y centraliza la guard del API key.

---

### D3: Fallo de email no bloquea la operación

**Decisión**: Todos los envíos están envueltos en `try/catch` silencioso — si el email falla, la operación principal (guardar solicitud, aprobar, rechazar) no se revierte.

**Rationale**: El email es un efecto secundario. Un fallo de Resend no debe impedir que el admin pueda aprobar/rechazar ni que el solicitante quede registrado.

---

### D4: Guard de API key

**Decisión**: Verificar `process.env.RESEND_API_KEY` antes de intentar enviar, igual que en el código existente.

**Rationale**: En local/dev sin API key configurada, los emails simplemente no se envían sin tirar error.

## Risks / Trade-offs

- **[Riesgo] Supabase ya envía invite email al aprobar** → El profesional recibirá dos emails al ser aprobado: el invite de Supabase (con el link de set-password) y el email de aprobación del Círculo. Mitigación: el email del Círculo es de bienvenida institucional; el de Supabase es funcional (contiene el link). Son complementarios y no redundantes.

- **[Riesgo] `RESEND_FROM_EMAIL` requiere dominio verificado en Resend** → En producción hay que tener el dominio verificado. Si no, usar `onboarding@resend.dev` solo sirve para testing. Mitigación: documentar en `.env.example`.

## Migration Plan

1. Crear `src/lib/resend.ts` con singleton
2. Actualizar `registro/actions.ts`: leer env vars + agregar email al solicitante
3. Actualizar `admin/solicitudes/actions.ts`: agregar emails de aprobación y rechazo
4. Agregar `RESEND_FROM_EMAIL` y `INSTITUTIONAL_EMAIL` a `.env.example` (si el archivo tiene permisos)
5. Deploy sin migraciones Prisma

**Rollback**: Los emails están en bloques `try/catch` independientes — revertir es quitar los bloques sin afectar la lógica de negocio.
