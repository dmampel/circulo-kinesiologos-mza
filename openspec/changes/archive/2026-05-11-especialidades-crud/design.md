## Context

La tabla `Especialidad` ya existe en el schema de Prisma con `id` (cuid), `nombre` (String @unique) y relación many-to-many con `Profesional`. El `EspecialidadRepository` tiene solo `getAll()`. El formulario de registro tiene 3 opciones hardcodeadas con valores arbitrarios (`"traumato"`, `"neuro"`, `"rpg"`).

El patrón de referencia es `CategoriaSidebar` en `/admin/beneficios`: un drawer deslizante con formulario dual (crear/editar), listado de existentes con botones de editar/eliminar, y `categoria-actions.ts` con Server Actions separadas. Este patrón debe replicarse exactamente.

## Goals / Non-Goals

**Goals:**
- Panel admin en `/admin/profesionales` con sidebar para gestionar especialidades (crear, editar, eliminar)
- Fix del select de especialidad en `/registro` — carga dinámica desde BD
- Guardar relación correcta en la action de registro (buscar `Especialidad` por nombre)

**Non-Goals:**
- No se agrega icono ni color a `Especialidad` — el modelo es simple (`id`, `nombre`)
- No se modifican las especialidades ya asignadas a profesionales existentes
- No se crea una página dedicada `/admin/especialidades`

## Decisions

**1. Sidebar en `/admin/profesionales/page.tsx` — no página separada**
Igual que `CategoriaSidebar` en beneficios. Mantiene consistencia de UX y evita agregar rutas innecesarias. La especialidad es metadata de configuración, no una entidad principal.

**2. `EspecialidadSidebar.tsx` + `especialidad-actions.ts` — mirror exacto del patrón de categorías**
Misma estructura de archivos. Sin icono ni color — el formulario es solo un campo `nombre`. Sidebar con drawer animado (framer-motion), listado con hover actions, y formulario dual crear/editar.

**3. Protección en delete: verificar profesionales asociados**
Si la especialidad tiene profesionales relacionados, la eliminación devuelve error con mensaje claro. Mismo patrón que `eliminarCategoria` verifica `beneficiosCount`.

**4. Registro: `page.tsx` pasa a hacer fetch de especialidades**
`/registro/page.tsx` ya recibe `localidades` como prop desde el Server Component. Se agrega `especialidades` del mismo modo: `EspecialidadRepository.getAll()`. El select pasa a usar `esp.id` como value y `esp.nombre` como label.

**5. Action de registro: conectar por id en vez de string**
`actions.ts` del registro actualmente guarda el string arbitrario en el email. Como ahora tenemos IDs reales, podemos almacenar el `especialidadId` en la solicitud o en el campo de notificación. Se actualiza para usar el nombre real de la especialidad.

## Risks / Trade-offs

- **Especialidades en BD vacías al momento del deploy** → La página de registro mostraría el select vacío. Mitigación: durante el primer deploy, el admin crea las especialidades antes de desactivar el hardcodeo — o se hace un seed con las 3 existentes como punto de partida.
- **Eliminación de especialidad con profesionales** → Bloqueada con mensaje de error. Trade-off: no hay cascade, el admin debe reasignar antes de eliminar. Aceptable dado el volumen bajo del dominio.
