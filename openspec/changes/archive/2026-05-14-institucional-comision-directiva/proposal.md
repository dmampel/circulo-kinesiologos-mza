# Proposal: Gestión Dinámica de Comisión Directiva

## Intent

Actualmente, los datos de la Comisión Directiva en la página "Institucional" están hardcodeados. Esto genera deuda técnica y dependencia del equipo de desarrollo para actualizaciones administrativas. El objetivo es mover estos datos a la base de datos (Supabase) y gestionarlos mediante el Repository Pattern, permitiendo que en el futuro se administren desde el panel de profesionales.

## Scope

### In Scope
- Creación del modelo `Autoridad` en Prisma.
- Implementación de `AutoridadRepository` para fetch de datos.
- Vinculación de `Autoridad` con el modelo `Profesional` para evitar duplicidad de datos.
- Refactorización de `src/app/institucional/page.tsx` para usar datos dinámicos.
- Script de migración/seed para cargar los datos actuales en la DB.

### Out of Scope
- Interfaz de edición en el panel administrativo (se hará en un change posterior).
- Historial de comisiones pasadas (se deja preparado el modelo pero no se implementa la UI).

## Capabilities

### New Capabilities
- `autoridades-management`: Capacidad de gestionar y visualizar los miembros de la comisión directiva vinculados a sus perfiles de profesionales.

### Modified Capabilities
- None

## Approach

1.  **Database**: Extender `schema.prisma` con el modelo `Autoridad`. Cada autoridad tendrá un `cargo`, un `orden` y una relación `1:1` o `N:1` con `Profesional`.
2.  **Data Access**: Crear `AutoridadRepository.ts` siguiendo el patrón del proyecto.
3.  **Frontend**: Convertir la sección de Comisión Directiva en `InstitucionalPage` para que realice el fetch (Server Component) de las autoridades.
4.  **Consistency**: Usar los datos del `Profesional` vinculado (nombre, iniciales, foto) para asegurar que la información esté centralizada.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Adición del modelo `Autoridad`. |
| `src/lib/repositories/` | New | Creación de `AutoridadRepository.ts`. |
| `src/app/institucional/page.tsx` | Modified | Refactorización a Server Component dinámico. |
| `prisma/seed.ts` | Modified | Carga inicial de autoridades. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Pérdida de performance por fetch adicional | Low | Uso de Server Components y caché de Next.js. |
| Inconsistencia si un profesional es eliminado | Low | Configurar `onDelete: Cascade` o validaciones en el repository. |

## Rollback Plan

Revertir los cambios en `schema.prisma` y restaurar la versión hardcodeada de `page.tsx` desde Git.

## Dependencies

- Prisma ORM
- Supabase (PostgreSQL)

## Success Criteria

- [ ] Los datos de la comisión se visualizan correctamente en `/institucional`.
- [ ] La información (nombres, cargos) proviene de la base de datos.
- [ ] Si se cambia un dato en el `Profesional`, se refleja en la Comisión Directiva.
