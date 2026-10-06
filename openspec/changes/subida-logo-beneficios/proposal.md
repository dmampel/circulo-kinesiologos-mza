## Why

Los logos de los beneficios KineClub se cargan pegando una URL (`BeneficioKineClub.logo_url`). Los admins pegan URLs del CDN de Instagram (`scontent.cdninstagram.com/...&oe=<timestamp>`), que vencen a los pocos días: el logo se rompe y en la home y en `/kineclub` aparece el ícono de imagen rota. Mientras el logo dependa de un servidor ajeno que firma URLs con vencimiento, el problema vuelve cada semana.

## What Changes

- Los formularios de alta y edición de beneficios (`/admin/beneficios/nuevo`, `/admin/beneficios/editar/[id]`) ofrecen un **selector de archivo** (opción principal) con vista previa local, un campo opcional **"o pegá una URL"** y la opción "Quitar logo". Si se elige archivo, gana sobre la URL.
- El archivo se sube a un **bucket público nuevo de Supabase Storage, `beneficios-logos`** (2 MB, PNG/JPEG/WEBP/AVIF; sin SVG), dentro de la misma server action que guarda el beneficio. `logo_url` pasa a guardar la URL pública del bucket.
- **Se mantiene la carga por URL pegada como alternativa**, validada con Zod (sólo `https`). Debajo del campo se muestra un aviso genérico: "Los links externos pueden dejar de funcionar (los de Instagram, Facebook o WhatsApp vencen en días). Recomendamos subir el archivo." No se bloquea ningún dominio. Los beneficios existentes conservan su URL mientras no se cambie el logo.
- Al reemplazar o quitar el logo, o al borrar el beneficio, el archivo viejo se borra del bucket sólo si es del bucket propio; las URLs externas se ignoran (best-effort: una falla de Storage no aborta el guardado).
- Validación con Zod de los campos del beneficio (incluida la URL pegada) y validación del archivo (tipo y tamaño) en cliente y en servidor. Las actions devuelven `{ success, error? }`.
- Las actions de beneficios dejan de usar Prisma directo y pasan por `BeneficioRepository` (pilar 1 de AGENTS.md).
- En la home y en `/kineclub`, si el logo no carga se muestra el ícono de reemplazo en vez de la imagen rota (se reutiliza `SafeLogoImage`, movido a `src/components/atoms/`).
- Script manual de infraestructura `scripts/setup-beneficios-logos.ts`: crea el bucket de forma idempotente y verifica que sea público. Lo corre la usuaria, nunca un agente.
- Script manual opcional `scripts/migrar-logos-beneficios.ts`: descarga los logos externos vigentes, los sube al bucket y actualiza `logo_url`. Por defecto en modo simulación (`--aplicar` para escribir).

## Capabilities

### New Capabilities
- `kineclub-beneficios-logos`: carga (archivo o URL), reemplazo, borrado y visualización del logo de un beneficio KineClub, preferentemente almacenado en Storage propio, con fallback visual cuando la imagen no carga.

### Modified Capabilities
<!-- Ninguna: no existe spec previa de beneficios KineClub. -->

## Impact

- **Base de datos / Prisma**: sin cambios de schema. `logo_url String?` se mantiene; cambia el origen del valor. No hay tablas nuevas, así que no aplica RLS.
- **Supabase**: bucket nuevo `beneficios-logos` (público). No requiere migraciones SQL; se crea con el script manual. **Bloqueante para producción**: el bucket tiene que existir antes de desplegar el código.
- **Código**: `src/app/admin/beneficios/actions.ts`, `nuevo/page.tsx`, `editar/[id]/EditBeneficioForm.tsx`, `editar/[id]/page.tsx`, `src/lib/repositories/BeneficioRepository.ts`, `src/lib/storage/` (helper nuevo + extracción de path compartida con noticias), `src/lib/validations/beneficio.ts` (nuevo), `src/app/page.tsx`, `src/app/kineclub/KineClubClient.tsx`, `src/app/admin/beneficios/page.tsx` (import de `SafeLogoImage`), `scripts/`.
- **Límites**: el archivo viaja en la server action; el límite de 2 MB queda holgado bajo `serverActions.bodySizeLimit: "6mb"`.
- **Sin dependencias nuevas.**
