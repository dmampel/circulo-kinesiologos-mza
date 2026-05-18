## 1. Capa de Datos (Prisma & DB)

- [x] 1.1 Agregar el modelo `CategoriaNoticia` a `prisma/schema.prisma` (espejando `CategoriaBeneficio`).
- [x] 1.2 Agregar el campo `categoriaId` y la relación en el modelo `Noticia`.
- [x] 1.3 Ejecutar `npx prisma db push` para actualizar el esquema en Supabase.
- [x] 1.4 (Opcional) Realizar un seed inicial o carga manual de las categorías básicas: Institucional, Eventos, Capacitación, Convenios.

## 2. Repositorios

- [x] 2.1 Crear `src/lib/repositories/CategoriaNoticiaRepository.ts` con métodos `getAll`, `getById` y `getBySlug`.
- [x] 2.2 Actualizar `src/lib/repositories/NoticiaRepository.ts` para incluir (`include`) la relación `categoria` en los métodos de fetch (paginado, por slug, etc.).

## 3. Frontend (UI & Lógica)

- [x] 3.1 Actualizar `src/app/noticias/page.tsx` (Server Component) para obtener las categorías usando el nuevo repositorio.
- [x] 3.2 Pasar el listado de categorías como prop al componente `NoticiasReaderClient`.
- [x] 3.3 Refactorizar `src/app/noticias/NoticiasReaderClient.tsx`:
    - [x] Eliminar el array hardcodeado `TAGS`.
    - [x] Actualizar la interfaz `Props` para recibir `categorias`.
    - [x] Ajustar la lógica de filtrado para que use los slugs/IDs de las categorías de la DB.
    - [x] Asegurar que la opción "Todas" siga existiendo como filtro por defecto.
- [x] 3.4 Actualizar la visualización de la noticia seleccionada para mostrar su categoría si la tiene.
- [x] 3.5 Corregir la persistencia del artículo seleccionado: si no pertenece a la categoría activa, mostrar estado vacío o invitar a seleccionar.
- [x] 3.6 Asegurar que la sección "Más notas" también respete el filtro activo.
- [x] 3.7 Ordenar dinámicamente las categorías (tags) según la cantidad de noticias que contienen (de mayor a menor).

## 4. Verificación

- [x] 4.1 Comprobar que la barra de filtros muestra las categorías cargadas en la DB.
- [x] 4.2 Verificar que al clickear una categoría el sidebar se filtra correctamente.
- [x] 4.3 Validar que las noticias sin categoría asignada se sigan listando bajo el filtro "Todas".
