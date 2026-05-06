## 1. Base de Datos

- [x] 1.1 Modificar `schema.prisma` para agregar `CategoriaBeneficio` y actualizar `BeneficioKineClub`.
- [x] 1.2 Ejecutar `npx prisma db push` para aplicar los cambios sin resetear.
- [x] 1.3 Crear script de seed para poblar las categorías iniciales (Turismo, Salud, etc.).

## 2. Lógica de Datos (Repositories)

- [x] 2.1 Crear `src/lib/repositories/CategoriaRepository.ts`.
- [x] 2.2 Refactorizar `src/lib/repositories/BeneficioRepository.ts` para usar la nueva relación.

## 3. Integración en el Admin

- [x] 3.1 Actualizar `crearBeneficio` en `admin/beneficios/actions.ts` para manejar `categoriaId`.
- [x] 3.2 Actualizar el formulario en `admin/beneficios/nuevo/page.tsx` para cargar las categorías desde la DB.

## 4. Verificación

- [x] 4.1 Verificar que el listado de beneficios en el KineClub siga funcionando con el nuevo filtrado.
- [x] 4.2 Probar la creación de un beneficio con una categoría dinámica.
