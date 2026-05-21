# Tasks: admin-mobile-sidebar

## Checklist

- [x] 1. Crear `src/app/admin/_components/AdminMobileSidebar.tsx`
  - Props: `open: boolean`, `onClose: () => void`
  - Backdrop overlay con `onClick={onClose}` (lg:hidden)
  - Drawer container con `translate-x` animado
  - Nav links admin (mismo array SIDEBAR_LINKS, lógica active con usePathname)
  - useEffect: cerrar al cambiar pathname
  - useEffect: scroll lock en body mientras open

- [x] 2. Modificar `src/app/admin/layout.tsx`
  - Agregar `useState<boolean>` para `mobileOpen`
  - Agregar `Menu` icon al import de lucide
  - Agregar hamburger button en el header (left side, `lg:hidden`)
  - Montar `<AdminMobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />`
