# Tasks: Portal del Socio - Responsive Mobile

Checklist ordenado por fases. **Fase 1 es bloqueante** (sin sidebar responsive no se puede navegar en mobile). Fase 2 y 3 son secuenciales pero independientes entre si. Fase 4 cierra el change.

---

## Fase 1: Sidebar + Layout (BLOQUEANTE)

Objetivo: que el portal sea navegable en mobile con drawer.

- [x] **1.1** Crear `src/components/socio/MobileSidebarShell.tsx` (Client component)
  - [x] `"use client"` directive
  - [x] `useState(open)` para drawer
  - [x] `useEffect(pathname)` para cerrar al navegar (import `usePathname` de `next/navigation`)
  - [x] `useEffect(open)` para body scroll lock (`document.body.style.overflow`)
  - [x] Render: hamburger button fixed (`lg:hidden`), backdrop (`lg:hidden`), drawer container con `transform translateX`
  - [x] Drawer container: `fixed left-0 top-0 h-full w-80 max-w-[85vw] z-50 transition-transform duration-300 ease-out lg:static lg:translate-x-0 lg:max-w-none lg:w-80`
  - [x] Backdrop: `fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity` (visible solo cuando open)
  - [x] Hamburger: `fixed top-4 left-4 z-40 lg:hidden`, icon `Menu` de `lucide-react`, `bg-white/80 backdrop-blur border border-slate-200 rounded-xl p-2 shadow-sm`
  - [x] Boton close interno al drawer (top-right del drawer, `lg:hidden`, icon `X`)
  - [x] aria-label y `aria-expanded` en hamburger; `role="dialog"` y `aria-modal="true"` en drawer cuando open
  - [x] Children prop: renderiza `<Sidebar />` dentro

- [x] **1.2** Modificar `src/components/socio/Sidebar.tsx`
  - [x] Remover `h-screen sticky top-0 z-50` del `<aside>` raiz
  - [x] Mantener `w-80 bg-white border-r border-slate-100 flex flex-col px-6 py-5`
  - [x] Agregar `h-full overflow-y-auto` para scroll interno (el drawer puede ser mas alto que viewport)
  - [x] Verificar que el blur decorativo `absolute -bottom-20 -left-20` tenga `pointer-events-none` (ya lo tiene)
  - [x] Verificar que el aside tenga `overflow-hidden` o que el blur no desborde el drawer (overflow-x-hidden + relative added)

- [x] **1.3** Modificar `src/app/mi-panel/layout.tsx`
  - [x] Importar `MobileSidebarShell`
  - [x] Cambiar container raiz: `<div className="min-h-screen bg-slate-50 lg:flex lg:h-screen lg:overflow-hidden">`
  - [x] Wrappear `<Sidebar />` con `<MobileSidebarShell>`
  - [x] `<main>` -> `<main className="flex-1 lg:overflow-y-auto">`
  - [x] Inner div: `mx-auto max-w-6xl py-5 px-4 sm:px-6 lg:px-5 pt-16 lg:pt-5`
  - [x] Confirmar que sigue siendo Server Component (no agregar `"use client"`)

- [x] **1.4** Testing manual Fase 1 — verificado en Safari iOS
- [x] **1.5** Commit Fase 1

---

## Fase 2: Dashboard responsive

Objetivo: que `/mi-panel` sea legible y operable en 375px+.

- [x] **2.1** `src/app/mi-panel/page.tsx` — Agenda semanal (week strip)
  - [x] `grid-cols-7 mb-8` -> mantener `grid-cols-7` pero reducir items
  - [x] Items del dia: `h-8 w-8` -> `h-7 w-7 sm:h-8 sm:w-8`
  - [x] Numero del dia: `text-sm font-black` -> `text-xs sm:text-sm font-black`
  - [x] Label DOM/LUN/etc: `text-[9px]` se mantiene

- [x] **2.2** Timeline de circulares
  - [x] `pl-10` -> `pl-8 sm:pl-10` en el div padre de cada circular
  - [x] Pseudo-element `before:left-[11px]` -> usar `before:left-[9px] sm:before:left-[11px]` para alinearlo con el nuevo padding
  - [x] Dot absolute `left-0 top-[38px]`: verificar visualmente (deberia estar OK)

- [x] **2.3** Grid principal del dashboard
  - [x] `grid grid-cols-1 lg:grid-cols-12 gap-12` -> `grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12`
  - [x] Content grid `gap-16` -> `gap-8 lg:gap-16`

- [x] **2.4** Hero / Carnet
  - [x] Verificar `lg:col-span-6 flex justify-center lg:justify-start` — OK en mobile (centra el carnet)
  - [x] `max-w-md` en el carnet — OK

- [x] **2.5** Quick Access cards
  - [x] `p-5` -> `p-4 sm:p-5`
  - [x] Confirmar que `ArrowUpRight` no se solape con texto en mobile

- [x] **2.6** Header institucional
  - [x] `text-4xl lg:text-5xl` ya es fluido — OK
  - [x] Pill de matricula ya tiene `hidden lg:flex` — OK

- [x] **2.7** Aside derecho (Beneficios + Soporte)
  - [x] `p-6 rounded-[1.5rem]` -> `p-4 sm:p-6 rounded-2xl sm:rounded-[1.5rem]`
  - [x] Verificar que `truncate` y `line-clamp-2` funcionen en mobile

- [x] **2.8** Testing manual dashboard — verificado en Safari iOS
- [x] **2.9** Commit Fase 2

---

## Fase 3: Paginas secundarias

Objetivo: capacitaciones, circulares y perfil legibles en mobile.

### Capacitaciones

- [x] **3.1** `src/app/mi-panel/capacitaciones/page.tsx`
  - [x] Header: `text-3xl font-black` — OK (no requiere cambio)
  - [x] Grid `grid-cols-1 lg:grid-cols-3 gap-8` -> `grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8`
  - [x] Card de capacitacion: `flex flex-col md:flex-row gap-6` — OK
  - [x] `p-6` en cards -> `p-4 sm:p-6`
  - [x] `rounded-3xl` -> mantener
  - [x] Columna derecha (Mis Inscripciones) `space-y-8` -> OK
  - [x] `InscripcionCard`: `p-4` ya esta — OK

### Circulares

- [x] **3.2** `src/app/mi-panel/circulares/page.tsx`
  - [x] Card de circular `flex gap-5 ... p-6` -> `flex gap-3 sm:gap-5 ... p-4 sm:p-6`
  - [x] Bloque de fecha `w-10`: verificar que numeros como `28` no overfloween con `text-2xl` — OK, no overflowea con w-10 (40px) y text-2xl (24px)
  - [x] Divisor vertical `w-px self-stretch`: OK
  - [x] `max-w-3xl mx-auto`: OK

### Perfil

- [x] **3.3** `src/app/mi-panel/perfil/page.tsx` y `src/components/socio/PerfilForm.tsx`
  - [x] Leer `PerfilForm.tsx` y verificar:
    - inputs full-width en mobile — OK (w-full en todos)
    - botones no overflowean — OK (no ancho fijo)
    - foto de perfil + upload son operables — OK (flex-col sm:flex-row)
  - [x] Aplicar `p-4 sm:p-6` y `gap-4 sm:gap-6` donde haga falta — NO-OP, ya responsive

### Carnet (verificacion)

- [x] **3.4** `src/app/mi-panel/carnet/` (si existe como ruta dedicada)
  - [x] Leer la pagina y `CarnetFlip.tsx` (usa CarnetFlip, no CarnetDigital)
  - [x] Verificar que el carnet renderiza bien a 375px — OK: usa w-full aspect-[1.6/1], fluido
  - [x] Ajustes solo si hay overflow o texto cortado — NO-OP, no hay overflow crítico

- [x] **3.5** Testing manual páginas secundarias — verificado en Safari iOS
- [x] **3.6** Commit Fase 3
- [x] **3.7** Fix adicional: `CarnetDigital.tsx` y `CarnetFlip.tsx` — `p-5 sm:p-8`, foto `h-20 w-20 sm:h-28 sm:w-28`, nombre `text-xl sm:text-2xl`

---

## Fase 4: Verificacion y cierre

- [x] **4.1** Verificación visual en Safari iOS — OK
- [x] **4.2** TypeScript clean — sin errores nuevos
- [x] **4.3** Conventions verificadas — no "use client" en layout, no repos tocados
- [x] **4.4** Listo para archive
