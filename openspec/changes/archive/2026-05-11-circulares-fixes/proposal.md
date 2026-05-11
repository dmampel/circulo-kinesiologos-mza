# Proposal: circulares-fixes

## Intent
Corregir 6 problemas detectados en el módulo de Circulares Internas tras su implementación inicial:
bugs funcionales, violaciones del contrato del proyecto (Zod, error handling), y gaps de UX para el socio.

## Problems Found

1. **Sin validación Zod** — `createCircular` y `updateCircular` reciben FormData crudo sin validar. Viola AGENTS.md.
2. **Sin manejo de errores en actions** — Ninguna action sigue el contrato `{ success: boolean, error?: string }`. Viola AGENTS.md.
3. **Buscador decorativo** — El `<input>` de búsqueda en admin list no filtra nada. Confunde al usuario.
4. **Bug: circulares de solo texto son inaccesibles** — Si una circular tiene `contenido` pero no `archivo_url`, el link del socio queda como `href="#"`. No hay página de detalle.
5. **Archivos huérfanos en Storage** — `deleteCircular` y `updateCircular` no borran el archivo anterior del bucket de Supabase Storage.
6. **Link "Ver historial" apunta a `/novedades`** — Ruta incorrecta. No existe una página de historial de circulares.

## Scope

In Scope:
- Validación Zod en `actions.ts` (create + update)
- Try/catch + error handling en todas las actions
- Eliminar el input de búsqueda no funcional del admin
- Crear `/mi-panel/circulares/[id]/page.tsx` — detalle de circular para el socio
- Crear `/mi-panel/circulares/page.tsx` — historial completo de circulares publicadas
- Agregar `getPublishedById` y `getAllPublished` a `CircularRepository`
- Limpiar archivo de Storage en delete y update (cuando se reemplaza)
- Corregir link "Ver historial" en mi-panel

Out of Scope:
- Editor rich text para contenido
- Paginación del historial (hay pocas circulares por ahora)
- Búsqueda funcional (futura iteración)
