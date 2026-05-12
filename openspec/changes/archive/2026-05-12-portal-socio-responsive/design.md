# Design: Portal del Socio - Responsive Mobile

## Contexto

El portal del socio se construyo asumiendo desktop:
- `src/app/mi-panel/layout.tsx` usa `flex h-screen` + sidebar de `w-80` fijo.
- `src/components/socio/Sidebar.tsx` tiene `w-80 h-screen sticky top-0` sin breakpoint.
- Las paginas internas usan grids fijos (`grid-cols-7` para semana, `lg:grid-cols-3` para capacitaciones) que se deforman en mobile.

Hay que introducir un patron drawer estandar sin romper Server-First ni el diseno premium del proyecto.

## Decisiones de arquitectura

### 1. Estado del drawer: aislado en un Client wrapper

**Decision:** Crear `src/components/socio/MobileSidebarShell.tsx` (Client component) que recibe el Sidebar como `children` (o como prop renderizado) y maneja `useState(open)`, hamburger button, backdrop y animacion.

**Por que:**
- El layout sigue siendo Server Component, fetcheando user, profesional y unreadCount como hoy.
- El Sidebar actual (que ya es Client porque usa `usePathname`/`useRouter`/Supabase) se mantiene Client. No hay duplicacion.
- Aislar el estado del drawer en su propio componente respeta el principio Server-First del AGENTS.md.

**Alternativas descartadas:**
- *Convertir el layout a Client*: rompe Server-First, obliga a mover el fetch a server actions/queries client-side. Demasiado costoso para un cambio responsive.
- *Pasar el estado a traves de Context*: overkill para un solo consumidor (Sidebar).
- *Usar libreria de drawer (vaul, radix-dialog)*: agrega dependencia innecesaria; un `<aside>` con `transform: translateX(-100%)` y `transition-transform` resuelve el caso.

### 2. Breakpoint unico: `lg` (1024px)

**Decision:** El drawer aplica para `< 1024px`. En `>= 1024px` el sidebar es fijo como hoy.

**Por que:**
- El sidebar mide 20rem (`w-80` = 320px). En tablets verticales (`md`, 768px) ocuparia el 42% del ancho — incomodo.
- Tener un solo breakpoint simplifica la mental model y testing.
- 1024px coincide con tablets en landscape, donde el sidebar fijo es razonable.

**Alternativas descartadas:**
- `md` (768px): el sidebar es demasiado ancho para tablets verticales.
- Dos breakpoints (drawer en mobile, sidebar reducido en tablet): mas codigo, mas estados visuales, mas testing.

### 3. Tecnica de animacion: CSS transform, no framer-motion

**Decision:** El drawer se anima con `transform: translateX(-100%)` <-> `translateX(0)` y `transition-transform duration-300 ease-out`. Backdrop con `opacity` + `transition-opacity`.

**Por que:**
- GPU-accelerated, sin layout thrash.
- Sin JS adicional para tween.
- Framer-motion ya esta en el bundle, pero usarlo aca seria overkill: una sola transicion lineal de un eje.

### 4. Body scroll lock al abrir drawer

**Decision:** Cuando `open === true`, aplicar `document.body.style.overflow = 'hidden'` via `useEffect`; restaurarlo al cerrar y al unmount.

**Por que:**
- Sin esto, el contenido detras del backdrop sigue scrolleando — mala UX.
- No usar paquete externo; 6 lineas de useEffect alcanzan.

### 5. Cierre automatico al navegar

**Decision:** `useEffect` que observa `pathname` (de `usePathname()`); cuando cambia, set `open = false`.

**Por que:** En SPA, un Link no recarga; sin esto el drawer queda abierto despues de navegar. Es el patron estandar.

### 6. Z-index scale

**Decision:**
- Hamburger button: `z-40` (visible siempre que el drawer este cerrado)
- Backdrop: `z-40`
- Drawer (sidebar mobile): `z-50`
- El sidebar actual ya tiene `z-50`; se mantiene.

Modals existentes (QRModal) usan `z-50+`. Verificar que no haya conflicto cuando el QRModal abre con el drawer cerrado (deberia estar bien porque el drawer cerrado tiene `translateX(-100%)`).

### 7. Hamburger button: position fixed top-left en mobile

**Decision:** Boton fijo arriba a la izquierda (`fixed top-4 left-4 z-40 lg:hidden`), con `bg-white/80 backdrop-blur` (premium) y border. Cambia a icon `X` cuando el drawer esta abierto, ubicado dentro del drawer header.

**Alternativa descartada:** Hamburger dentro de un nuevo TopBar mobile. Es mas codigo, ocupa altura, y no aporta valor — el portal ya tiene mucho contenido vertical.

## Estructura de cambios por archivo

### `src/components/socio/MobileSidebarShell.tsx` (NUEVO)

```tsx
"use client";
// Maneja: useState(open), useEffect(pathname) -> close,
// useEffect(open) -> body scroll lock,
// renderiza: hamburger button (lg:hidden), backdrop, drawer wrapper.
// Recibe { children } = el Sidebar real.
```

Structure:
- `<button>` hamburger (visible solo `lg:hidden`, oculto cuando `open`)
- `<div>` backdrop (visible cuando `open`)
- `<div>` drawer container (`fixed left-0 top-0 h-full w-80 max-w-[85vw] transform transition-transform lg:static lg:translate-x-0`)
  - Dentro: `<button>` close (visible solo `lg:hidden`) + `{children}` (Sidebar)

### `src/components/socio/Sidebar.tsx` (MODIFICAR)

- Sacar `h-screen sticky top-0 z-50` del `<aside>` raiz — ahora vive en el shell.
- Mantener `w-80` como ancho del aside (consistente entre mobile drawer y desktop).
- Sacar el blur decorativo absoluto (puede romper en mobile) o mantenerlo con `pointer-events-none` (ya tiene).
- Opcional: aceptar prop `onNavigate?: () => void` que el shell pasa para cerrar al click en Link. (Ya lo cubre el `useEffect(pathname)`, pero el callback es mas responsive en feel.)

### `src/app/mi-panel/layout.tsx` (MODIFICAR)

```tsx
// Server Component, sigue async
return (
  <div className="min-h-screen bg-slate-50 lg:flex lg:h-screen lg:overflow-hidden">
    <MobileSidebarShell>
      <Sidebar unreadCirculares={unreadCount} />
    </MobileSidebarShell>
    <main className="flex-1 lg:overflow-y-auto">
      <div className="mx-auto max-w-6xl py-5 px-4 sm:px-6 lg:px-5 pt-16 lg:pt-5">
        {children}
      </div>
    </main>
  </div>
);
```

Notas:
- `pt-16 lg:pt-5`: deja espacio en mobile para el hamburger fixed.
- `lg:flex lg:h-screen lg:overflow-hidden`: solo aplica el layout de dos columnas + viewport-lock en desktop. En mobile el documento scrollea normal.
- `px-4 sm:px-6 lg:px-5`: padding adaptativo.

### `src/app/mi-panel/page.tsx` (Dashboard) (MODIFICAR)

Cambios responsive:
- Header institucional (M.P. / Especialidad / Vencimiento): el `hidden lg:flex` ya esta — OK.
- **Agenda semanal `grid-cols-7`**: mantener 7 columnas pero reducir tamano de items en mobile. Cambiar `h-8 w-8` a `h-7 w-7 sm:h-8 sm:w-8`, text-size a `text-xs sm:text-sm`.
- **Timeline circulares con `pl-10`**: cambiar a `pl-8 sm:pl-10`. El absolute dot (`left-0 top-[38px]`) sigue funcionando.
- **`gap-12` y `gap-16` entre grid columns**: cambiar a `gap-8 lg:gap-12` y `gap-8 lg:gap-16`.
- **Aside de beneficios + soporte**: ya cae a stack por `lg:col-span-*`. Verificar padding interno.

### `src/app/mi-panel/capacitaciones/page.tsx` (MODIFICAR)

- Grid principal `grid-cols-1 lg:grid-cols-3 gap-8` -> `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8`.
- Wait: la columna izquierda usa `lg:col-span-2`. En `md` con 2 cols esto no aplicaria — habria que decidir si en `md` mostramos cartelera arriba e inscripciones abajo, o si solo activamos 3-col en `lg`. **Decision:** mantener `grid-cols-1 lg:grid-cols-3` (sin md) para no introducir un breakpoint donde el span-2 no encaja. Ajustar solo gaps y paddings.
- Cards de capacitacion: el `flex flex-col md:flex-row gap-6` ya esta — OK.

### `src/app/mi-panel/circulares/page.tsx` (MODIFICAR)

- El listado ya tiene `max-w-3xl mx-auto` — OK.
- Card de circular usa `flex gap-5 p-6`: cambiar a `gap-3 sm:gap-5 p-4 sm:p-6`.
- Bloque de fecha `w-10`: OK pero verificar que con `text-2xl` no haga overflow.

### `src/app/mi-panel/perfil/page.tsx` (REVISAR, posible no-op)

- `max-w-3xl mx-auto space-y-10` — OK.
- El verdadero contenido vive en `PerfilForm`. Verificar form en mobile como tarea de la Fase 3; si esta OK, no-op.

## Convenciones de codigo aplicadas

- Server-First: el layout es Server; solo `MobileSidebarShell` y `Sidebar` son Client.
- No fixed px: uso de `w-80` (= 20rem) y `max-w-[85vw]` para drawer en pantallas chicas. Paddings con `p-4 sm:p-6 lg:p-10`.
- Tailwind 4 utility-first, sin CSS modules ni styled-components.
- Conventional commits por fase (feat: por sidebar mobile, fix: por ajustes de paginas, etc).

## Riesgos tecnicos y mitigaciones

| Riesgo | Mitigacion |
|--------|------------|
| `usePathname()` en MobileSidebarShell + en Sidebar = doble subscription | Aceptable, costo nulo; ambas son lecturas de Next router. |
| `document.body` no existe en SSR | El effect corre client-side, `typeof window !== 'undefined'` no es estrictamente necesario porque `useEffect` solo corre en cliente. |
| Conflicto del hamburger fixed con el contenido del dashboard | Compensar con `pt-16 lg:pt-5` en el container interno del layout. |
| El sidebar tiene un blur decorativo absolute en bottom-left que podria asomar fuera del drawer | Ya tiene `pointer-events-none`. Verificar `overflow-hidden` en el aside. |

## Decisiones diferidas

- Si el hamburger debe convertirse en un TopBar completo con titulo de pagina actual y avatar -> NO ahora. Solo hamburger discreto.
- Migracion del area admin a responsive -> NO en este change.
- Refactor del Sidebar a Server Component con interactivity isolada -> NO; el costo no se justifica para este cambio.
