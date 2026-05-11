# Proposal: Módulo de Circulares Internas

## Intent

El objetivo es crear un sistema de notificaciones y avisos administrativos exclusivamente internos para los socios ("Circulares"), totalmente separado de las noticias públicas de la web. Esto evita mezclar audiencias y permite categorizar los avisos con etiquetas específicas (ej. "Institucional", "Salud", "Circular Nº 124") como requiere el diseño actual.

## Scope

### In Scope
- Creación del modelo `Circular` en la base de datos (`schema.prisma`).
- Creación del repositorio de base de datos (`CircularRepository`).
- Vistas CRUD en el panel de Administrador (`/app/admin/circulares`).
- Integración en la pantalla `Mi Panel` del socio (`/app/mi-panel/page.tsx`) para reemplazar los datos hardcodeados por registros dinámicos de la DB.

### Out of Scope
- Sistema de envío de mails o notificaciones push automáticas al publicar una circular.
- Tracking de lectura / Acuses de recibo por parte de cada socio.
- Manejo nativo de adjuntos múltiples (solo soportaremos un `archivo_url` simple o link externo).

## Capabilities

### New Capabilities
- `circulares-management`: CRUD administrativo de circulares internas con soporte de etiquetas, estado de publicación y fechas.
- `socio-dashboard-circulares`: Visualización de circulares institucionales publicadas en el panel del profesional.

### Modified Capabilities
- None

## Approach

Se extenderá el esquema de Prisma con un modelo `Circular` (`id`, `titulo`, `contenido`, `etiqueta`, `archivo_url`, `publicada`, `publicada_en`). Se creará un submódulo dentro de `/app/admin/` reutilizando los patrones de UI modernos que ya se usan en `/app/admin/noticias`. Finalmente, la página `mi-panel/page.tsx` consumirá `CircularRepository.getLatest(3)` para inyectar y renderizar los avisos reales de base de datos respetando el layout estético actual.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Nuevo modelo `Circular` |
| `src/lib/repositories/CircularRepository.ts` | New | Acceso a BD para circulares |
| `src/app/admin/circulares/*` | New | Pantallas de gestión (lista, nueva, edición) |
| `src/app/mi-panel/page.tsx` | Modified | Reemplazo de data estática por dinámica |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Inconsistencia visual de fechas | Low | Reutilizar la lógica de `Intl.DateTimeFormat("es-AR")` ya existente en el panel. |
| Confusión de uso por parte del Admin | Medium | Incorporar copy y descripciones claras en el panel admin enfatizando que este módulo es "Exclusivo para uso interno de Socios". |

## Rollback Plan

- Revertir los cambios en `mi-panel/page.tsx` mediante Git para volver a los datos estáticos hardcodeados.
- Eliminar la carpeta de rutas `/app/admin/circulares`.
- Eliminar el modelo de Prisma (solo si no hay datos productivos afectados).

## Dependencies

- Prisma ORM para persistencia.
- Server Actions para la mutación de datos en el Admin.

## Success Criteria

- [ ] El administrador puede crear, editar, listar y eliminar Circulares desde su panel.
- [ ] Las circulares con estado `publicada = true` aparecen automáticamente en la sección "Circulares Institucionales" del Mi Panel.
- [ ] Las etiquetas dinámicas (ej. "Institucional") y las fechas se renderizan respetando exactamente el diseño de la UI actual.
