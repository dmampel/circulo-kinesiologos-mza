# Proposal: Portal del Socio - Responsive Mobile

## Intent

El portal del socio (`/mi-panel`) es inutilizable en mobile. El sidebar tiene `w-80` (320px) fijo sin breakpoints, lo que rompe el layout en pantallas chicas y bloquea el acceso a navegacion. No existe hamburger menu, drawer ni overlay. Adicionalmente, varias paginas internas tienen grids y espaciados que rompen en mobile/tablet (calendario semanal `grid-cols-7`, timeline con `pl-10`, gaps generosos sin breakpoints intermedios).

El portal del socio es una pieza central de la plataforma CKM y debe ser usable desde cualquier dispositivo. Hoy un socio que abre el portal desde el celular no puede navegar.

## Scope

### In Scope
- Sidebar responsive: oculto en mobile, drawer/overlay con hamburger button, visible normalmente en `lg+`
- Layout del portal (`src/app/mi-panel/layout.tsx`) adaptado a mobile con padding fluido
- Dashboard (`/mi-panel`): agenda semanal y timeline de circulares responsive
- Pagina Capacitaciones: grid de 3 columnas con breakpoint intermedio (`md`)
- Pagina Circulares: cards de listado optimizadas para mobile
- Verificacion de Perfil y Carnet en mobile (ajustes menores si aparecen)
- Cierre automatico del drawer al navegar (cambio de ruta)

### Out of Scope
- Rediseno visual del portal (esto es solo responsive, no redesign)
- Cambios en logica de negocio, repositories o queries
- Refactor de componentes a nuevos patrones (mantener Server-First actual)
- Responsive del area admin (`/admin`) — sera otro change
- Soporte para orientacion landscape especial en mobile
- Animaciones avanzadas del drawer mas alla de transicion simple
- Cambios al CarnetDigital o QRModal (ya son responsive)

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- None (cambio puramente de UI/responsive — no afecta comportamiento ni requirements a nivel spec)

## Approach

**Sidebar mobile como drawer overlay**. El sidebar actual se mantiene casi intacto para `lg+` (oculto con `hidden lg:flex`). Para mobile/tablet se introduce:

1. Un nuevo componente Client `MobileSidebar` (o adaptacion del actual) que renderiza un hamburger button fixed top-left y un drawer overlay deslizable.
2. El layout del portal se reestructura: en mobile, el sidebar no ocupa espacio en el flow; el `<main>` toma el ancho completo. En `lg+`, vuelve al layout actual de dos columnas.
3. Estado del drawer (`useState`) vive en un componente Client que envuelve sidebar y hamburger (extraido del Sidebar actual para no convertir el layout entero en Client).
4. Cierre automatico al cambiar de ruta (`useEffect` con `pathname`).
5. Backdrop con `bg-black/40` y `backdrop-blur-sm` (consistente con UI premium del proyecto).

**Breakpoint:** `lg` (1024px). Por debajo de `lg` -> drawer mobile. Desde `lg` -> sidebar fijo actual. Esto evita un breakpoint tablet intermedio que complicaria la UI.

**Paginas internas:** se aplican prefijos responsivos (`sm:`, `md:`, `lg:`) a grids, paddings y gaps existentes. No se reescriben pages; se ajustan classnames Tailwind. Se mantiene Server-First — solo el sidebar/drawer necesita Client.

**Responsive spacing convention (per AGENTS.md):** preferir `p-4 md:p-6 lg:p-10`, `gap-4 md:gap-6 lg:gap-8`, evitar `px` fijos.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/mi-panel/layout.tsx` | Modified | Layout responsive, sidebar deja de ocupar espacio en mobile |
| `src/components/socio/Sidebar.tsx` | Modified | Acepta props para uso en drawer, se le saca `w-80 sticky` hardcodeado |
| `src/components/socio/MobileSidebarShell.tsx` | New | Client component que envuelve Sidebar con drawer + hamburger + backdrop |
| `src/app/mi-panel/page.tsx` | Modified | Agenda semanal y timeline responsive |
| `src/app/mi-panel/capacitaciones/page.tsx` | Modified | Grid 1/2/3 cols segun breakpoint, gaps adaptativos |
| `src/app/mi-panel/circulares/page.tsx` | Modified | Cards de listado: padding y gap reducidos en mobile |
| `src/app/mi-panel/perfil/page.tsx` | Modified (likely no-op) | Verificacion; ajustes menores si surgen |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Convertir el layout a Client component rompe Server-First | Med | Aislar el estado del drawer en `MobileSidebarShell` (Client); layout sigue siendo Server Component |
| El sidebar tiene logica de logout que usa Supabase client — duplicar logica si se separa | Low | El Sidebar ya es Client; lo mantenemos Client, solo se cambia su contenedor |
| Animation jank en drawer en celulares de gama baja | Low | Usar `transform: translateX` con `transition-transform` (GPU-accelerated), evitar framer-motion para esto |
| Z-index conflicts con QRModal u otros overlays | Med | Documentar z-index scale: drawer `z-50`, backdrop `z-40`, modals existentes `z-50+` (revisar) |
| Scroll lock al abrir drawer (background sigue scrolleable) | Med | Aplicar `overflow-hidden` al body cuando drawer esta abierto via `useEffect` |
| Romper el `lg:flex` actual por mal uso de breakpoints | Low | Probar manualmente en 320px, 768px, 1024px, 1280px antes de cerrar el change |

## Rollback Plan

Cambio aislado a archivos del portal (`src/app/mi-panel/**` y `src/components/socio/Sidebar.tsx`). Si rompe:
1. `git revert` del commit de la fase Sidebar+Layout (Fase 1) restaura el comportamiento desktop actual.
2. El nuevo `MobileSidebarShell.tsx` se borra; no hay migraciones de DB ni de datos.
3. Los cambios responsive de paginas internas son aditivos (solo agregan classes Tailwind) — un revert no afecta la logica.

## Dependencies

- Tailwind CSS 4 (ya presente)
- `lucide-react` para icono de hamburger (`Menu`, `X`) — ya presente
- No se introducen libs nuevas

## Success Criteria

- [ ] El portal se navega completamente desde un viewport de 375px (iPhone SE) sin scroll horizontal
- [ ] El hamburger abre y cierra el drawer con animacion suave (<300ms)
- [ ] El drawer se cierra automaticamente al navegar a otra ruta
- [ ] El sidebar desktop (lg+) se ve identico al actual
- [ ] Dashboard, Capacitaciones, Circulares y Perfil son legibles y operables en 375px, 768px y 1024px
- [ ] Lighthouse mobile del portal mantiene o mejora el score actual (sin regresiones)
- [ ] No se introducen `px` fijos para espaciados (excepto borders 1px)
- [ ] `useState` del drawer vive en Client component; el layout sigue siendo Server Component
