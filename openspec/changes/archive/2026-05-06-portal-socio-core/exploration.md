## Exploration: Portal del Socio Core

### Current State
El sistema actualmente permite el registro de profesionales y su visualización pública. Ya existe una integración con Supabase Auth que invita a los socios por mail al aprobar su solicitud. Sin embargo, no hay un área privada (`/mi-panel`) ni protección de rutas mediante Middleware.

### Affected Areas
- `ckm-web/src/middleware.ts` — [NEW] Protección de rutas privadas.
- `ckm-web/src/lib/supabase/client.ts` — [NEW] Cliente de Supabase para el navegador.
- `ckm-web/src/lib/supabase/server.ts` — [NEW] Cliente de Supabase para Server Components.
- `ckm-web/src/app/mi-panel/` — [NEW] Layout y páginas del portal del socio.
- `ckm-web/src/components/ConditionalLayout.tsx` — [MODIFY] Ocultar Navbar/Footer institucional en el portal.

### Approaches
1. **Middleware con @supabase/ssr** — Utilizar la librería oficial para gestionar sesiones en el servidor y proteger rutas.
   - Pros: Estándar de la industria, seguro, maneja refresco de tokens automáticamente.
   - Cons: Requiere configuración inicial de clientes específicos para Next.js 15.
   - Effort: Medium

2. **Carnet Digital con CSS + Framer Motion** — Crear un componente de alta fidelidad con efectos de vidrio (glassmorphism) y animaciones de entrada.
   - Pros: Look & feel premium, alineado con los pilares de diseño del proyecto.
   - Cons: Requiere precisión en el CSS.
   - Effort: Medium

### Recommendation
Implementar la arquitectura de Auth recomendada por Supabase para Next.js 15 (App Router). Esto nos dará la base sólida para luego escalar a la edición de perfil y subida de archivos. Para el Carnet, usaremos un diseño tipo "wallet" que sea fácil de mostrar en el celular.

### Risks
- **Desincronización de Sesión:** Asegurar que el Middleware refresque el token correctamente para evitar que el usuario sea pateado del panel inesperadamente.
- **Next.js 15 APIs:** El App Router en la v15 tiene sutiles cambios en cómo se manejan los headers/cookies que debemos respetar.

### Ready for Proposal
Yes — Procederemos a la creación de la propuesta detallada para el Portal del Socio.
