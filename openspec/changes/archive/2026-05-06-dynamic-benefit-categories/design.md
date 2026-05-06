# Diseño Técnico: Categorías Dinámicas

## Arquitectura de Datos

### Cambio en el Esquema
Se eliminará el `enum CategoriaKineClub` y se reemplazará por:

```prisma
model CategoriaBeneficio {
  id          String              @id @default(cuid())
  nombre      String              @unique
  slug        String              @unique
  icono       String?             // Nombre del icono de Lucide
  color       String?             // Clase de color de Tailwind
  beneficios  BeneficioKineClub[]
  createdAt   DateTime            @default(now())
}
```

En `BeneficioKineClub`:
- Se reemplaza `categoria CategoriaKineClub` por `categoriaId String` y una relación con `CategoriaBeneficio`.

## Implementación

### Repositorios
- **CategoriaRepository**: Métodos `getAll()`, `getBySlug()`, `create()`.
- **BeneficioRepository**: Actualizar el filtrado para usar `categoriaId`.

### UI Admin
- El formulario de beneficios consultará a `CategoriaRepository.getAll()` para poblar el dropdown.

## Plan de Migración
1. Crear el nuevo modelo.
2. Script temporal para migrar los beneficios existentes a las nuevas categorías.
3. Eliminar el Enum.
