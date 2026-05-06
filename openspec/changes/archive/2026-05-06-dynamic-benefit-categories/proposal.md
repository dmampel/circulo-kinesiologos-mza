# Propuesta: Categorías Dinámicas para Beneficios

## Problema
Actualmente, las categorías de los beneficios del KineClub están definidas como un `Enum` en el esquema de Prisma. Esto limita la flexibilidad del sistema, ya que agregar o modificar una categoría requiere cambios en el código y migraciones manuales.

## Solución
Migrar el sistema de categorías de un `Enum` a un modelo relacional (`CategoriaBeneficio`). Esto permitirá gestionar las categorías de forma dinámica desde el panel de administración en el futuro y facilitará la adición de metadatos (como iconos o colores) a cada categoría.

## Alcance
- Modificación de `schema.prisma`.
- Creación de migración de base de datos.
- Creación de `CategoriaRepository`.
- Refactorización de `BeneficioRepository` para usar la relación.
- Actualización de los formularios de administración de beneficios.
