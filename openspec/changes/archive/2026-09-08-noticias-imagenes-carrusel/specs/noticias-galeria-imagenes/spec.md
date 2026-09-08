# Noticias — Galería de Imágenes Specification

## Purpose

Define el modelo de datos, el almacenamiento en Supabase Storage, las reglas de orden y la
derivación de `Noticia.imagen_url` para el soporte de **múltiples imágenes de portada** por
noticia. Es la capacidad de base que consumen `admin-noticias-crud` (carga) y
`noticias-frontend` (render en carrusel).

## Requirements

### Requirement: Modelo NoticiaImagen

The system MUST persistir las imágenes de portada de una noticia en una tabla relacionada
`NoticiaImagen`, con relación 1-N desde `Noticia` y borrado en cascada.

Cada fila MUST tener: `id`, `noticiaId`, `url` (String, requerido), `alt` (String, opcional),
`orden` (Int, base 0) y `createdAt`.

#### Scenario: Creación de una imagen de galería

- GIVEN una noticia existente y una URL de imagen válida
- WHEN se persiste una `NoticiaImagen` con `noticiaId`, `url` y `orden`
- THEN el registro queda asociado a la noticia
- AND `orden` determina la posición de la imagen en el carrusel (0 = portada).

#### Scenario: Borrado en cascada al eliminar la noticia

- GIVEN una noticia con N filas en `NoticiaImagen`
- WHEN se elimina la noticia
- THEN todas sus `NoticiaImagen` MUST eliminarse automáticamente por `onDelete: Cascade`
- AND la operación MUST NOT fallar por restricción de clave foránea.

#### Scenario: Orden duplicado no bloquea el guardado

- GIVEN una reconciliación de galería que asigna `orden` secuencial 0..N-1
- WHEN se guardan las filas
- THEN el sistema MUST NOT depender de un índice único sobre `(noticiaId, orden)`
- AND el orden de lectura MUST resolverse siempre con `orderBy: { orden: "asc" }`.

### Requirement: RLS obligatorio en la tabla nueva

The system MUST habilitar Row-Level Security sobre `NoticiaImagen` en Supabase, según la
convención de `AGENTS.md` (pilar 5).

#### Scenario: Habilitación de RLS tras el push de schema

- GIVEN que se ejecutó `npx prisma db push` creando la tabla `NoticiaImagen`
- WHEN se completa la migración
- THEN se MUST ejecutar `ALTER TABLE "NoticiaImagen" ENABLE ROW LEVEL SECURITY;` en el SQL Editor
- AND NO se requieren políticas adicionales, porque el sitio accede con `service_role` vía Prisma
- AND cualquier acceso con clave `anon` a la tabla MUST quedar denegado por defecto.

### Requirement: Almacenamiento en Supabase Storage

The system MUST subir los archivos de imagen de noticias al bucket público `noticias-imagenes`,
usando el cliente `supabaseAdmin` desde el servidor, con el mismo patrón que
`src/app/admin/circulares/actions.ts`.

#### Scenario: Subida exitosa de una imagen

- GIVEN un admin autenticado que selecciona un archivo de imagen
- WHEN se invoca `subirImagenNoticia(formData)`
- THEN la action MUST llamar a `requireAdmin()` antes de tocar Storage
- AND MUST subir el archivo con un nombre único (`${Date.now()}-${random}.${ext}`)
- AND MUST devolver `{ success: true, url }` con la URL pública obtenida de `getPublicUrl`.

#### Scenario: Usuario no administrador intenta subir

- GIVEN un usuario sin rol `ADMIN` (o sin sesión)
- WHEN se invoca `subirImagenNoticia(formData)`
- THEN `requireAdmin()` MUST cortar la ejecución
- AND NO se MUST escribir ningún objeto en el bucket.

#### Scenario: Archivo con tipo o tamaño inválido

- GIVEN un archivo que no es `image/jpeg`, `image/png`, `image/webp` ni `image/avif`,
  o que supera los 4 MB
- WHEN se invoca `subirImagenNoticia(formData)`
- THEN la action MUST rechazarlo antes de subirlo
- AND MUST devolver `{ success: false, error }` con un mensaje legible
- AND el límite MUST mantenerse por debajo del `serverActions.bodySizeLimit` de `next.config.ts` (4 MB).

#### Scenario: Falla de Storage

- GIVEN que Supabase Storage devuelve un error en el `upload`
- WHEN se invoca `subirImagenNoticia(formData)`
- THEN la action MUST devolver `{ success: false, error }` sin lanzar la excepción al cliente
- AND NO se MUST crear ninguna fila en `NoticiaImagen`.

### Requirement: Reconciliación de la galería

The system MUST reconciliar la galería completa en cada guardado de noticia, tomando la lista
ordenada recibida como fuente de verdad, dentro de una transacción de Prisma y a través de
`NoticiaRepository` (nunca `prisma` directo desde la Server Action).

#### Scenario: Guardado con imágenes agregadas, reordenadas y quitadas

- GIVEN una noticia con imágenes previas y una lista nueva enviada por el form
- WHEN se ejecuta `actualizarNoticia(id, formData)`
- THEN el sistema MUST reemplazar las filas de `NoticiaImagen` por la lista nueva
- AND MUST reasignar `orden` de forma secuencial 0..N-1 según la posición recibida
- AND MUST ejecutar el borrado y la creación dentro de una misma transacción.

#### Scenario: Limpieza de archivos quitados

- GIVEN que una imagen del bucket `noticias-imagenes` fue quitada de la lista
- WHEN se guarda la noticia
- THEN el sistema MUST borrar ese objeto del bucket (best-effort)
- AND una falla de borrado en Storage MUST NOT abortar el guardado de la noticia
- AND las URLs externas (no pertenecientes al bucket) MUST NOT intentar borrarse.

#### Scenario: Validación de la lista con Zod

- GIVEN el payload de galería enviado por el formulario
- WHEN se valida antes de persistir
- THEN cada ítem MUST tener `url` válida y `alt` opcional de hasta 200 caracteres
- AND la lista MUST aceptar como máximo 10 imágenes
- AND si la validación falla, la action MUST devolver `{ success: false, error }` sin escribir en la DB.

### Requirement: imagen_url derivado

The system MUST conservar `Noticia.imagen_url` como cache derivado de la primera imagen de la
galería, para no alterar listados, sitemap ni metadatos Open Graph.

#### Scenario: Derivación al guardar

- GIVEN una noticia que se crea o actualiza con una galería no vacía
- WHEN se persisten los cambios
- THEN `imagen_url` MUST quedar igual a la `url` de la imagen con `orden = 0`.

#### Scenario: Galería vacía

- GIVEN una noticia guardada sin ninguna imagen
- WHEN se persisten los cambios
- THEN `imagen_url` MUST quedar en `null`.

#### Scenario: imagen_url no se edita a mano

- GIVEN el formulario de admin
- WHEN el admin gestiona la portada
- THEN `imagen_url` MUST NOT exponerse como campo editable independiente
- AND su único punto de escritura MUST ser la reconciliación de la galería.

### Requirement: Backfill de noticias existentes

The system MUST migrar las noticias preexistentes para que su portada actual quede
representada también en `NoticiaImagen`.

#### Scenario: Noticia con imagen_url y sin filas de galería

- GIVEN una noticia con `imagen_url` no nulo y cero `NoticiaImagen`
- WHEN se ejecuta el script de backfill
- THEN se MUST crear una `NoticiaImagen` con esa `url` y `orden = 0`
- AND `imagen_url` MUST permanecer sin cambios.

#### Scenario: Backfill idempotente

- GIVEN una noticia que ya tiene al menos una `NoticiaImagen`
- WHEN se ejecuta el script de backfill nuevamente
- THEN NO se MUST crear filas duplicadas.

### Requirement: Acceso a datos vía Repository

The system MUST exponer la galería a través de `NoticiaRepository`, sin uso directo de
`prisma` en Server Actions ni componentes (pilar 1 de `AGENTS.md`).

#### Scenario: Lectura con galería

- GIVEN una consulta por `getBySlug(slug)` o `getById(id)`
- WHEN el repositorio resuelve la noticia
- THEN MUST incluir `imagenes` con `orderBy: { orden: "asc" }`.

#### Scenario: Listados sin overfetch

- GIVEN `getPaginated`, `getUltimas`, `getLatest` o `getRelated`
- WHEN se resuelven los listados
- THEN NO se MUST incluir la relación `imagenes`
- AND los listados MUST seguir leyendo `imagen_url`.

#### Scenario: Creación y borrado por repositorio

- GIVEN las Server Actions `crearNoticia` y `eliminarNoticia`
- WHEN se ejecutan
- THEN MUST usar `NoticiaRepository.create(...)` y `NoticiaRepository.delete(...)`
- AND NO MUST invocar `prisma.noticia.create` ni `prisma.noticia.delete` directamente.
