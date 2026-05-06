# Technical Design: Portal del Socio Core

## Architecture Decisions

### Auth Logic (@supabase/ssr)
Utilizaremos la librería oficial de Supabase para Next.js para asegurar que el manejo de cookies y sesiones sea compatible con Server Components y el Middleware de la v15.

- **`src/lib/supabase/client.ts`**: Usará `createBrowserClient`.
- **`src/lib/supabase/server.ts`**: Usará `createServerClient` inyectando cookies.
- **`src/middleware.ts`**: Usará `updateSession` para verificar el usuario y refrescar tokens.

### Route Protection
El Middleware actuará como guardián. No usaremos protección a nivel de componente para evitar "flashes" de contenido no autorizado.

### UI Stack
- **Tailwind CSS 4**: Para el estilado premium.
- **Framer Motion**: Para la interactividad del Carnet y transiciones del panel.
- **Lucide React**: Para la iconografía.

---

## Component Design

### 1. Layout del Panel (`/app/mi-panel/layout.tsx`)
Estructura tipo "App Shell":
- `Sidebar`: Componente pegado a la izquierda (oculto en móvil).
- `Main Content`: Área central con scroll independiente.
- `Mobile Header`: Barra superior con el logo y el botón del menú para dispositivos pequeños.

### 2. Carnet Digital (`/components/socio/CarnetDigital.tsx`)
Diseño Premium:
- **Fondo:** Gradiente profundo (Azul CKM -> Azul Cobalto).
- **Glassmorphism:** Capas superiores con `backdrop-blur` y bordes sutiles de 1px.
- **Branding:** Logo del Círculo en marca de agua o esquina superior.
- **Datos:** Tipografía `Geist Sans` con pesos pesados para el nombre y matrícula.

---

## Data Flow

1. **Request a `/mi-panel`**:
   - `Middleware` intercepta.
   - Llama a `supabase.auth.getUser()`.
   - Si no hay usuario, redirige.
   - Si hay usuario, continúa.
2. **Renderizado de Página**:
   - `Page` (Server Component) llama a `auth.getUser()`.
   - Con el `userId`, llama a `ProfesionalRepository.getByUserId()`.
   - Pasa los datos del profesional a los componentes (Dashboard/Carnet).

---

## Security Considerations
- **Environment Variables**: Asegurar que `SUPABASE_SERVICE_ROLE_KEY` NUNCA se use en el cliente (usar solo en `supabaseAdmin` o server-side específico).
- **RLS (Row Level Security)**: Aunque el portal use Prisma, las políticas de Supabase deben estar configuradas por si acaso (aunque Prisma usa el Direct URL con bypass de RLS, es buena práctica).

---

## Alternatives Considered

| Approach | Pros | Cons |
|----------|------|------|
| **Protección en Page** | Simple de implementar. | Permite que el layout se cargue antes de redirigir (mala UX). |
| **Middleware (Elegida)** | Máxima seguridad, redirección antes de renderizar. | Un poco más compleja de configurar con cookies. |
