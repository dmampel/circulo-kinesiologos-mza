# Design: Módulo de Circulares Internas

## Technical Approach

El módulo se implementará utilizando Server Components para la lectura de datos y Server Actions para las mutaciones. El modelo de datos vivirá en PostgreSQL vía Prisma. Se utilizará un patrón Repository (`CircularRepository`) para encapsular las llamadas a Prisma, aislando la capa de datos de la capa de UI. 

## Architecture Decisions

### Decision: Separación de Noticias y Circulares

**Choice**: Crear un modelo `Circular` independiente en la BD.
**Alternatives considered**: Modificar `Noticia` agregando un flag `es_circular` o un campo `etiqueta`.
**Rationale**: Al mantener entidades separadas, evitamos acoplar la lógica de permisos y visualización de la web pública con la intranet privada. Facilita futuros requerimientos exclusivos para socios (ej. acuses de recibo).

### Decision: Capa de Acceso a Datos

**Choice**: Uso del patrón Repository (`CircularRepository`).
**Alternatives considered**: Llamadas directas a `prisma.circular.findMany()` en las vistas.
**Rationale**: Mantiene coherencia con el resto del proyecto (`ProfesionalRepository`, `CapacitacionRepository`) y centraliza la lógica de filtrado (ej. `getPublishedLatest(3)`).

## Data Flow

    [Admin UI] ──(Server Action)──→ [CircularRepository] ──→ [Prisma/DB]
                                                                  │
    [Mi Panel Socio] ◀──(Server Component)── [CircularRepository] ◀┘

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | Agregar modelo `Circular`. |
| `src/lib/repositories/CircularRepository.ts` | Create | Métodos `getAll`, `getPublishedLatest`, `create`, `update`, `delete`. |
| `src/app/admin/circulares/page.tsx` | Create | Lista administrativa de circulares. |
| `src/app/admin/circulares/nueva/page.tsx` | Create | Formulario para nueva circular. |
| `src/app/admin/circulares/editar/[id]/page.tsx` | Create | Formulario de edición pre-cargado. |
| `src/app/admin/circulares/actions.ts` | Create | Server actions para las operaciones CRUD. |
| `src/app/mi-panel/page.tsx` | Modify | Reemplazar mock data por `CircularRepository.getPublishedLatest(3)`. |

## Interfaces / Contracts

```typescript
// Modelo Prisma generado (Aproximación)
export type Circular = {
  id: string;
  titulo: string;
  contenido: string | null;
  etiqueta: string;
  archivo_url: string | null;
  publicada: boolean;
  publicada_en: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Integration | Creación de circular | Manual: Crear y verificar redirección y visibilidad en lista admin. |
| E2E | Visibilidad en Dashboard | Manual: Verificar que solo las `publicada=true` se muestran en Mi Panel. |

## Migration / Rollout

No data migration required. Al correr `npx prisma db push`, se creará la tabla vacía en la base de datos de desarrollo. Para producción se requerirá generar una migración formal de Prisma.

## Open Questions

- [ ] ¿El campo `contenido` debe soportar Markdown o texto plano? Asumiremos texto plano para la primera iteración a menos que se requiera renderizado enriquecido (como las noticias).
