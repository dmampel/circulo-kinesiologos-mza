# Proposal: admin-mobile-sidebar

## Problema
El panel de administración (`/admin`) no tiene navegación lateral accesible en dispositivos móviles. El sidebar está marcado como `hidden lg:flex`, lo que lo hace completamente invisible en pantallas pequeñas. El portal del socio (`/mi-panel`) ya resolvió esto con `MobileSidebarShell`. El admin quedó inconsistente e inutilizable en celular.

## Solución
Crear `AdminMobileSidebar.tsx` siguiendo el mismo patrón de `MobileSidebarShell.tsx`:
- Botón hamburger en el header del admin (visible solo en mobile)
- Overlay (backdrop) al abrir el drawer
- Drawer slide-in lateral con toda la navegación admin
- Se cierra automáticamente al navegar o hacer click en el backdrop
- El estado `open/onClose` se maneja en el layout para integrar el hamburger en el header existente

## Archivos afectados
- **nuevo**: `src/app/admin/_components/AdminMobileSidebar.tsx`
- **modifica**: `src/app/admin/layout.tsx` — agrega hamburger en header + usa AdminMobileSidebar

## Estimado
~200 líneas, 1 PR.
