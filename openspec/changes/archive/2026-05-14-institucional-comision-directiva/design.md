# Design: Gestión Dinámica de Comisión Directiva

## Technical Approach

La implementación se basa en la creación de un nuevo modelo relacional `Autoridad` que actúa como un "nombramiento" vinculado a un registro existente en la tabla `Profesional`. Se seguirá el **Repository Pattern** establecido en el proyecto para el acceso a datos y se refactorizará la página institucional para que sea un Server Component que obtenga los datos en tiempo de ejecución.

## Architecture Decisions

### Decision: Modelo Relacional para Autoridades

**Choice**: Crear una tabla `Autoridad` vinculada a `Profesional` mediante `profesionalId`.
**Alternatives considered**: Agregar campos de cargo directamente a la tabla `Profesional`.
**Rationale**: Las autoridades son temporales y específicas de la gestión. Vincularlas permite mantener la información del profesional (identidad) separada de su cargo institucional (rol), facilitando la rotación de la comisión sin modificar los datos base del profesional.

### Decision: Uso del Repository Pattern

**Choice**: Implementar `AutoridadRepository.ts`.
**Alternatives considered**: Usar Prisma directamente en el componente de Next.js.
**Rationale**: Mantener la consistencia arquitectónica del proyecto definida en `AGENTS.md`. El repositorio encapsula la lógica de ordenamiento y el `include` del profesional.

## Data Flow

```
InstitucionalPage (Server Component) 
  ──→ AutoridadRepository.findAll() 
  ──→ Prisma (Autoridad ⨝ Profesional) 
  ──→ PostgreSQL (Supabase)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | Definición del modelo `Autoridad`. |
| `src/lib/repositories/AutoridadRepository.ts` | Create | Repositorio para CRUD y búsquedas de autoridades. |
| `src/app/institucional/page.tsx` | Modify | Conversión a Server Component dinámico y mapeo de datos. |
| `prisma/seed.ts` | Modify | Script para cargar los datos de la comisión actual. |

## Interfaces / Contracts

```typescript
// src/lib/repositories/AutoridadRepository.ts

export interface AutoridadWithProfesional {
  id: string;
  cargo: string;
  orden: number;
  profesional: {
    nombre: string;
    apellido: string;
    full_name: string | null;
    matricula: string;
    foto_url: string | null;
  };
}

export class AutoridadRepository {
  static async findAll(): Promise<AutoridadWithProfesional[]> {
    // Implementación con include: { profesional: true } y orderBy: { orden: 'asc' }
  }
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | AutoridadRepository | Verificar que `findAll` retorne los datos ordenados y con el profesional incluido. |
| Integration | DB Schema | Validar que la relación `profesionalId` funcione y maneje correctamente eliminaciones. |
| Manual | UI Rendering | Verificar que la página institucional muestre los datos reales de la DB. |

## Migration / Rollout

1.  Actualizar `schema.prisma`.
2.  Ejecutar `npx prisma db push`.
3.  Actualizar `seed.ts` y ejecutar `npx prisma db seed`.
4.  Desplegar cambios de código.

## Open Questions

- [ ] ¿Es necesario que una autoridad PUEDA no ser un profesional del padrón? (Asumimos que no por ahora).
- [ ] ¿Se requiere soporte para fotos específicas de comisión distintas a las del padrón? (Asumimos que usa la del profesional).
