# Proposal: Portal del Socio Core

## Goal
Implementar la base del portal privado para los profesionales kinesiólogos, incluyendo la protección de rutas mediante Middleware y la generación del Carnet Digital Dinámico.

## User Review Required
> [!IMPORTANT]
> El acceso al portal requerirá que el usuario esté autenticado. Los socios actuales deberán usar el link de invitación enviado por mail (implementado en el change anterior) para activar sus cuentas.

## Proposed Changes

### Auth & Middleware
Implementaremos la lógica de autenticación de Supabase adaptada a Next.js 15.

#### [NEW] [client.ts](file:///Users/delfina/Documents/Trabajo/CirculoKinesiologos/ckm-web/src/lib/supabase/client.ts)
Cliente de Supabase para componentes del lado del cliente.

#### [NEW] [server.ts](file:///Users/delfina/Documents/Trabajo/CirculoKinesiologos/ckm-web/src/lib/supabase/server.ts)
Cliente de Supabase para Server Components y Actions.

#### [NEW] [middleware.ts](file:///Users/delfina/Documents/Trabajo/CirculoKinesiologos/ckm-web/src/middleware.ts)
Middleware para proteger `/mi-panel/*` y refrescar sesiones.

---

### Portal UI
Estructura base del panel.

#### [NEW] [layout.tsx](file:///Users/delfina/Documents/Trabajo/CirculoKinesiologos/ckm-web/src/app/mi-panel/layout.tsx)
Layout con navegación lateral y estética premium.

#### [NEW] [page.tsx](file:///Users/delfina/Documents/Trabajo/CirculoKinesiologos/ckm-web/src/app/mi-panel/page.tsx)
Dashboard principal con bienvenida y acceso rápido al carnet.

#### [NEW] [CarnetDigital.tsx](file:///Users/delfina/Documents/Trabajo/CirculoKinesiologos/ckm-web/src/components/socio/CarnetDigital.tsx)
Componente de alta fidelidad para la credencial profesional.

---

### Institutional Layout

#### [MODIFY] [ConditionalLayout.tsx](file:///Users/delfina/Documents/Trabajo/CirculoKinesiologos/ckm-web/src/components/ConditionalLayout.tsx)
Excluir `/mi-panel` de la visualización del Navbar y Footer institucionales.

## Rollback Plan
Si el Middleware causa problemas de performance o bloqueos indebidos, se puede desactivar temporalmente comentando el matcher de rutas en `middleware.ts`.

## Verification Plan

### Automated Tests
- `npm test`: Verificar que los repositorios sigan funcionando.
- Test de Middleware: Simular navegación sin sesión y verificar redirección a `/login`.

### Manual Verification
- Acceder a `/mi-panel` sin estar logueado (debe redirigir).
- Loguearse como profesional y verificar visualización del Carnet con datos reales de la DB.
