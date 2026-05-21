# Design: admin-mobile-sidebar

## Arquitectura

### Componente nuevo: `AdminMobileSidebar`

```
src/app/admin/_components/AdminMobileSidebar.tsx
```

Props:
```ts
interface Props {
  open: boolean;
  onClose: () => void;
}
```

Responsabilidades:
- Backdrop (overlay oscuro, click cierra)
- Drawer slide-in (translate-x animado)
- Navlinks admin (mismos que desktop sidebar, misma lógica de active con `usePathname`)
- Cierre automático al cambiar de ruta

### Cambios en `admin/layout.tsx`

- Agregar `useState<boolean>` para `mobileOpen`
- Agregar hamburger button en el header (`Menu` icon de lucide, `lg:hidden`)
- Montar `<AdminMobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />`

## Decisiones

**¿Por qué el estado en el layout y no self-contained?**
El hamburger debe vivir en el header sticky del admin (no en un botón flotante), para coherencia visual con el diseño del panel. Self-contained implicaría un botón fijo que se superpone al header. Al tener el estado en el layout, el botón del header controla el drawer sin conflicto de z-index.

**¿Por qué `AdminMobileSidebar` y no reusar `MobileSidebarShell`?**
`MobileSidebarShell` es genérico y sus children son el sidebar del socio. Para admin necesitamos los nav links del admin (distintos íconos, rutas, tema dark). Un componente propio es más claro y no rompe el socio.

## Responsive logic

| Breakpoint | Sidebar desktop | AdminMobileSidebar |
|------------|-----------------|--------------------|
| < lg       | hidden          | visible (drawer)   |
| lg+        | visible (fixed) | hidden             |
