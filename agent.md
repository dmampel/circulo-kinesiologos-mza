# agent.md — CKM-Web

> Notas internas de sesión para retomar el proyecto rápidamente.

---

## Estado Actual

**Última sesión:** 2026-05-12

Dos changes archivados y pusheados: seguimiento de lectura de circulares (`circulares-leidas`) y responsive mobile del portal del socio (`portal-socio-responsive`). El portal es ahora navegable en mobile con drawer sidebar.

---

## Módulos Implementados

### Portal Socio (`/mi-panel`)
| Ruta | Estado |
|------|--------|
| `/mi-panel` | Dashboard con agenda, circulares recientes, beneficios |
| `/mi-panel/carnet` | Carnet digital con flip 3D y QR |
| `/mi-panel/perfil` | Autogestión de datos y foto de perfil |
| `/mi-panel/capacitaciones` | Lista + detalle + inscripción |
| `/mi-panel/circulares` | Historial con indicador leída/no leída (dot azul pulsante) |
| `/mi-panel/circulares/[id]` | Detalle + preview PDF/imagen + registra lectura automáticamente |

### Admin (`/admin`)
| Módulo | Estado |
|--------|--------|
| Solicitudes | Aprobación con creación de cuenta Supabase |
| Noticias | CRUD completo |
| Capacitaciones | CRUD con Zod, edición, inscripciones |
| Beneficios/KineClub | CRUD con logos de empresas |
| Circulares | CRUD + upload a Supabase Storage |

---

## Decisiones Importantes

- **Etiquetas de circulares como texto libre** — no hay CRUD de categorías para no agregar fricción al flujo de publicación rápida.
- **Zod en todas las Server Actions** — validación en el servidor, throw de Error si falla (no return `{ success: false }` porque los forms son Server Components sin estado).
- **Storage cleanup explícito** — `deleteStorageFile()` en `actions.ts` limpia el bucket `circulares-adjuntos` al eliminar o reemplazar archivos. El error se swallows intencionalmente (no-crítico).
- **`redirect()` fuera del try/catch** — en Next.js 15, redirect lanza internamente. Ponerlo dentro de un try/catch sin re-throw rompe la navegación.
- **Preview de archivos sin Client Component** — `<iframe>` para PDFs y `<img>` para imágenes funcionan directo en Server Components.
- **Sidebar del socio** — Client Component necesario por `usePathname()` para el estado activo de navegación.
- **`revalidatePath` en Server Components** — prohibido en Next.js 15 durante el render. Mover siempre a un Server Action o a un Client Component con `useEffect` (patrón: `ReadTracker.tsx`).
- **Drawer mobile** — `MobileSidebarShell` es Client Component separado que envuelve al Sidebar. Así el `layout.tsx` sigue siendo Server Component. Estado del drawer: `useState` + `useEffect(pathname)` para cerrar al navegar + `useEffect(open)` para body scroll lock.
- **Carnet en mobile** — `p-8` y `h-28 w-28` se aplastaban en `aspect-[1.6/1]` a 375px. Usar `p-5 sm:p-8` y `h-20 w-20 sm:h-28 sm:w-28`.

---

## Gotchas Técnicos

- **Zod 4**: usar `z.url()` (no `z.string().url()`) y `.issues` (no `.errors`) en `safeParse`.
- **Next.js 15**: `params` en page components es `Promise<{ id: string }>` — siempre `await params`.
- **`isRedirectError`**: importar de `next/dist/client/components/redirect-error` para detectar redirects en catch blocks.
- **Supabase Storage URL**: para extraer el path del archivo usar `.split('?')[0].split('.').pop()` para ignorar query params.
- **Prisma P2002**: siempre validar duplicados antes de crear registros en Supabase Auth + DB (la aprobación de solicitudes tiene este guard).

---

## Repositorios en `src/lib/repositories/`

| Archivo | Métodos clave |
|---------|--------------|
| `CircularRepository.ts` | getAll, getPublishedLatest(n), getAllPublished, getPublishedById, getById, create, update, delete, markAsRead, countUnread, getAllPublishedWithStatus(id, limit?) |
| `CapacitacionRepository.ts` | findPublicadas, findPublicadaById, getInscripcionSocio, etc. |
| `ProfesionalRepository.ts` | findByUserId, update |
| `BeneficioRepository.ts` | getAll, getActivos |
| `NoticiaRepository.ts` | getAll, getPublicadas, etc. |

---

## Notas del Agente

- El diseño del portal sigue la guía en `AGENTS.md`: rounded-2xl, slate palette, blue-600 accent, font-black para headings.
- Todo cambio significativo va por OPSX (`openspec new change`) → apply → archive → commit + push.
- El socio se autentica via Supabase Auth. El auth guard en las páginas del portal usa `createClient` de `@/utils/supabase/server`.
- Supabase Storage bucket para circulares: `circulares-adjuntos` (acceso público).
