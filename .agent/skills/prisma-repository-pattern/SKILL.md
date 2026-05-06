---
name: prisma-repository-pattern
description: >
  Implements the Repository Pattern with Prisma to decouple data access from business logic.
  Trigger: When working with Prisma, creating data access logic, or implementing backend features.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- When adding new Prisma models and needing data access.
- To avoid direct Prisma calls in Server Components or Server Actions.
- To facilitate unit testing by mocking repositories.
- To centralize query logic and prevent duplication.

## Critical Patterns

- **Location**: All repositories MUST be in `src/lib/repositories/`.
- **Naming**: `{ModelName}Repository.ts` (e.g., `ProfesionalRepository.ts`).
- **Singleton**: Use the shared prisma instance from `@/lib/prisma`.
- **Decoupling**: Return Domain types or DTOs instead of raw Prisma types where possible.
- **Error Handling**: Catch Prisma errors and throw domain-specific exceptions.

## Code Example

```typescript
// src/lib/repositories/ProfesionalRepository.ts
import prisma from '@/lib/prisma';
import { Profesional } from '@prisma/client';

export class ProfesionalRepository {
  static async findBySlug(slug: string): Promise<Profesional | null> {
    return prisma.profesional.findUnique({
      where: { slug },
      include: {
        localidad: true,
        especialidades: true,
      },
    });
  }

  static async getAllActive() {
    return prisma.profesional.findMany({
      where: { status: 'ACTIVO' },
      include: { localidad: true },
    });
  }
}
```

## Commands

```bash
# Create a new repository file
touch src/lib/repositories/NewModelRepository.ts
```

## Resources

- **Prisma Client**: [src/lib/prisma.ts](file:///c:/Users/loren/OneDrive/Documentos/Dixi/ckm-web/src/lib/prisma.ts)
- **Documentation**: [Prisma Repositories Guide](https://www.prisma.io/docs/guides/other/repository-pattern)
