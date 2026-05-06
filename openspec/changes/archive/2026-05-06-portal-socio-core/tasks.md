# Implementation Tasks: Portal del Socio Core

## Phase 1: Auth Infrastructure
- [x] Implementar `src/lib/supabase/client.ts`.
- [x] Implementar `src/lib/supabase/server.ts`.
- [x] Crear `src/middleware.ts` con lógica de protección de rutas y refresco de sesión.
- [x] Configurar variables de entorno necesarias (si faltase alguna).

## Phase 2: Panel Foundation
- [x] Crear el Layout base en `src/app/mi-panel/layout.tsx`.
- [x] Implementar el Sidebar con navegación responsiva.
- [x] Modificar `src/components/ConditionalLayout.tsx` para excluir el portal del navbar/footer global.

## Phase 3: Core Features
- [x] Crear el Dashboard principal (`src/app/mi-panel/page.tsx`).
- [x] Desarrollar el componente `CarnetDigital.tsx` con estética premium.
- [x] Crear la página de visualización del carnet (`src/app/mi-panel/carnet/page.tsx`).

## Phase 4: Integration & UX
- [x] Conectar el fetch de datos del profesional en el panel usando el `userId` de la sesión.
- [x] Agregar transiciones suaves con Framer Motion entre las vistas del panel.
- [x] Implementar la funcionalidad de "Cerrar Sesión".
- [x] Crear ruta de callback (`src/app/auth/callback/route.ts`) para procesar invitaciones.
- [x] Crear página de activación de cuenta (`src/app/auth/set-password/page.tsx`).

## Phase 5: Verification
- [x] Verificar redirecciones del Middleware.
- [x] Validar visualización de datos en el Carnet Digital.
- [x] Correr tests de regresión (`npm test`).
