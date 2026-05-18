## Context

El sistema de noticias actual de CKM-Web utiliza un único modelo `Noticia`. El filtrado en la UI se realiza mediante un array hardcodeado de strings en `NoticiasReaderClient.tsx`. Esta falta de normalización en los datos dificulta la gestión de categorías desde la base de datos o el panel de administración, y rompe la consistencia con el módulo de Beneficios que ya usa un sistema de categorías dinámico.

## Goals / Non-Goals

**Goals:**
- Normalizar las categorías de noticias en una tabla dedicada en la base de datos.
- Implementar el Patrón Repositorio para la gestión de categorías de noticias.
- Actualizar la UI para obtener y mostrar categorías dinámicas.
- Soportar filtrado por categoría en el lector de noticias utilizando los datos de la DB.

**Non-Goals:**
- Implementar un sistema de etiquetas (M-to-N). Se mantendrá la relación 1-a-N por simplicidad y consistencia con Beneficios.
- Desarrollar un panel de administración completo para categorías en esta fase (se cargarán vía seed o manual).

## Decisions

1.  **Modelo Prisma**: Crear `CategoriaNoticia` con los campos `id`, `nombre`, `slug`, `icono` y `color`. Esto espeja la estructura de `CategoriaBeneficio`.
2.  **Relación**: Agregar `categoriaId` a `Noticia` como opcional para evitar romper las noticias existentes que aún no tengan categoría asignada.
3.  **Repositorio**: Crear `CategoriaNoticiaRepository` con métodos para obtener todas las categorías y buscar por slug/id.
4.  **Flujo de Datos**: `NoticiasPage` (Server Component) obtendrá las categorías y las pasará al `NoticiasReaderClient`.
5.  **UI**: Refactorizar `NoticiasReaderClient` para que acepte un prop `categorias` y reemplace el array estático `TAGS`.

## Risks / Trade-offs

- **Migración de Datos**: Las noticias existentes no tendrán categoría asignada inicialmente. Se deberán actualizar manualmente o asignar una por defecto ("Institucional").
- **Complejidad**: Se añade una pequeña capa extra de complejidad al requerir un fetch adicional de categorías, pero se compensa con la flexibilidad ganada.
