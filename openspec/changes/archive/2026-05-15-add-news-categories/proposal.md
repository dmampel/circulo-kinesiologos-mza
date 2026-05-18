## Why

Las categorías de noticias están actualmente hardcodeadas en el frontend (`TAGS` en `NoticiasReaderClient.tsx`), lo que las hace difíciles de mantener y poco consistentes con el resto del sistema. Al migrar esto a la base de datos siguiendo el patrón ya implementado en "Beneficios" (relación 1-a-N con una tabla dedicada), logramos una arquitectura más sólida, escalable y fácil de gestionar desde el panel de administración en el futuro.

## What Changes

- **Base de Datos**: Creación del modelo `CategoriaNoticia` en Prisma y establecimiento de la relación con el modelo `Noticia`.
- **Repositorios**: Implementación de `CategoriaNoticiaRepository` para la gestión de categorías y actualización de `NoticiaRepository` para incluir la información de categoría en las consultas.
- **Frontend**: Refactorización de `NoticiasReaderClient.tsx` para eliminar los tags estáticos y reemplazarlos por data dinámica proveniente de la DB.
- **Filtrado**: Mejora en la lógica de filtrado de noticias para usar los IDs/slugs de las nuevas categorías.

## Capabilities

### New Capabilities
- `news-management`: Gestión integral de categorías de noticias y su vinculación con los artículos publicados.

### Modified Capabilities
- `noticias-reader`: Actualización del lector de noticias para soportar filtrado dinámico basado en las categorías de la base de datos.

## Impact

- `prisma/schema.prisma`: Definición del nuevo modelo y relación.
- `src/lib/repositories/NoticiaRepository.ts`: Actualización de métodos de fetch.
- `src/lib/repositories/CategoriaNoticiaRepository.ts`: Nuevo repositorio.
- `src/app/noticias/NoticiasReaderClient.tsx`: Actualización de la lógica de tags y filtrado.
- `src/app/noticias/page.tsx`: Inyección de categorías desde el Server Component.
