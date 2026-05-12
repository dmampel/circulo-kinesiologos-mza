# Design: Circulares Leídas

## Technical Approach

Implementaremos el seguimiento de lectura mediante una tabla pivote en PostgreSQL gestionada por Prisma. La lógica de negocio se centralizará en el `CircularRepository` siguiendo el patrón del proyecto. La actualización del estado de lectura se realizará mediante un Server Action disparado desde el detalle de la circular.

## Database Schema

Agregaremos el siguiente modelo a `prisma/schema.prisma`:

```prisma
model LecturaCircular {
  id             String      @id @default(cuid())
  circularId     String
  profesionalId  String
  readAt         DateTime    @default(now())

  circular       Circular    @relation(fields: [circularId], references: [id], onDelete: Cascade)
  profesional    Profesional @relation(fields: [profesionalId], references: [id], onDelete: Cascade)

  @@unique([circularId, profesionalId])
}
```

También actualizaremos los modelos `Circular` y `Profesional` para incluir la relación inversa:

- `Circular`: `lecturas LecturaCircular[]`
- `Profesional`: `lecturasCirculares LecturaCircular[]`

## Data Layer (Repository)

### `src/lib/repositories/CircularRepository.ts`

- **`markAsRead(circularId: string, profesionalId: string): Promise<void>`**
  Realizará un `upsert` o un `create` con `@@unique` para asegurar que no haya duplicados.

- **`countUnread(profesionalId: string): Promise<number>`**
  ```typescript
  return prisma.circular.count({
    where: {
      publicada: true,
      lecturas: {
        none: { profesionalId }
      }
    }
  });
  ```

- **`getAllWithReadStatus(profesionalId: string): Promise<CircularWithReadStatus[]>`**
  Utilizará un `include` para traer la relación de lecturas filtrada por el profesional actual.

## Server Actions

### `src/app/mi-panel/circulares/actions.ts`

- **`registrarLecturaAction(circularId: string)`**
  1. Validar sesión del usuario.
  2. Obtener `profesionalId` del repositorio de profesionales.
  3. Llamar a `CircularRepository.markAsRead`.
  4. Ejecutar `revalidatePath('/mi-panel')` para actualizar badges y listas.

## Frontend Architecture

### Componentes de UI

1.  **Layout Badge (`src/app/mi-panel/layout.tsx`)**:
    Componente de servidor que obtiene el conteo de no leídas y lo inyecta en el Sidebar.

2.  **Lista de Circulares (`src/app/mi-panel/circulares/page.tsx`)**:
    Mostrará un indicador visual (ej: `<div className="w-2 h-2 rounded-full bg-blue-500" />`) si la circular no tiene registro de lectura.

3.  **Detalle de Circular (`src/app/mi-panel/circulares/[id]/page.tsx`)**:
    Al cargar el detalle, un componente de cliente o un `useEffect` (o simplemente el Server Component llamando al action si es factible) registrará la lectura. *Decisión: Usaremos un Server Component que dispare la acción si no se ha leído, o un componente de cliente ligero para evitar bloqueos de renderizado.*

## Affected Files

- `ckm-web/prisma/schema.prisma`
- `ckm-web/src/lib/repositories/CircularRepository.ts`
- `ckm-web/src/app/mi-panel/circulares/actions.ts`
- `ckm-web/src/app/mi-panel/layout.tsx`
- `ckm-web/src/app/mi-panel/circulares/page.tsx`
- `ckm-web/src/app/mi-panel/circulares/[id]/page.tsx`
