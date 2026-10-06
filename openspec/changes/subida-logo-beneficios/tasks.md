## 1. DB / Prisma

- [x] 1.1 Confirmar que no hay cambios de schema (`logo_url String?` queda igual). Nada que migrar; no hay tablas nuevas, no aplica RLS.
- [x] 1.2 `BeneficioRepository`: agregar `getById`, `create`, `update`, `delete` (tipos de Prisma, sin `any`).

## 2. Supabase (scripts manuales — NUNCA los ejecuta un agente)

- [x] 2.1 Crear `scripts/setup-beneficios-logos.ts` calcado de `setup-bolsa-trabajo.ts` sin RLS: crea bucket `beneficios-logos` público, 2 MB, PNG/JPEG/WEBP/AVIF, idempotente; sube PNG de prueba, verifica 200 en la URL pública, lo borra. Header con instrucciones de uso.
- [x] 2.2 Crear `scripts/migrar-logos-beneficios.ts` (opcional): simulación por defecto, `--aplicar` para escribir; descarga logos externos con timeout, valida tipo/tamaño, sube, actualiza `logo_url`; reporta los vencidos para carga manual.

## 3. Backend: validación y storage (con tests vitest)

- [x] 3.1 Mover `extraerPathDelBucket` a `src/lib/storage/bucketPath.ts` con firma `(url, bucket)`; `noticias.ts` lo reutiliza. `npx vitest run src/lib/storage` sigue verde; agregar `bucketPath.test.ts` (URL propia, externa, inválida, otro bucket).
- [x] 3.2 Crear `src/lib/validations/beneficio.ts`: `beneficioSchema` (Zod, incluye `logo_url_externa` https-only o vacío → null), `ALLOWED_LOGO_MIME_TYPES`, `MAX_LOGO_SIZE_BYTES` (2 MB), `validarLogo(file: ArchivoLike)`. Tests en `beneficio.test.ts`: válido, > 2 MB, SVG, schema con empresa vacía, enlace vacío → null, enlace inválido, `logo_url_externa` https OK / http rechazada / texto rechazado / vacía → null.
- [x] 3.3 Crear `src/lib/storage/beneficios.ts`: `resolverCambioLogo` (pura), `subirLogoBeneficio`, `borrarLogoDeStorage` (best-effort, ignora URLs externas). Tests en `beneficios.test.ts` con `supabaseAdmin` mockeado como en `noticias.test.ts`: los casos de `resolverCambioLogo` (archivo gana sobre URL, quitar, URL nueva reemplaza, URL igual a la actual no borra, nada cambia), borrado ignora URL de Instagram, borrado traga error de Storage.
- [x] 3.4 Reescribir `src/app/admin/beneficios/actions.ts`: `requireAdmin` → Zod → `validarLogo` (si hay archivo) → leer actual de la base (edición) → subir (si hay archivo; gana sobre la URL) → `resolverCambioLogo` → repo → borrar viejo sólo si es del bucket → revalidar `/admin/beneficios`, `/kineclub`, `/`. Si la base falla tras subir, borrar lo subido. `eliminarBeneficio` borra el logo. Todas devuelven `{ success, error? }`, `catch (error: unknown)`, sin `prisma` directo.
- [x] 3.5 `editar/[id]/page.tsx`: usar `BeneficioRepository.getById` y quitar el `as any`.

## 4. Frontend

- [x] 4.1 Mover `SafeLogoImage` a `src/components/atoms/SafeLogoImage.tsx`; actualizar import en `src/app/admin/beneficios/page.tsx`.
- [x] 4.2 Crear molécula `src/app/admin/beneficios/LogoBeneficioInput.tsx` (client): input file `name="logo"` (principal) + input `type="url" name="logo_url_externa"` opcional con el aviso "Los links externos pueden dejar de funcionar (los de Instagram, Facebook o WhatsApp vencen en días). Recomendamos subir el archivo." (sin bloquear dominios), vista previa con object URL (revocar), error de `validarLogo`, logo actual con `SafeLogoImage`, opción "Quitar logo" (`quitar_logo`) sólo en edición. Estilo de la drop zone de `GaleriaImagenesInput`, sin px fijos.
- [x] 4.3 `nuevo/page.tsx`: reemplazar bloque "Logo de la Empresa (URL)" por la molécula; quitar estado `logoUrl`.
- [x] 4.4 `EditBeneficioForm.tsx`: reemplazar bloque "URL del Logo" (hoy `required`) por la molécula con logo actual; quitar estado `logoUrl`.
- [x] 4.5 `src/app/page.tsx` (~L283) y `src/app/kineclub/KineClubClient.tsx` (~L153): renderizar con `SafeLogoImage` pasando como `fallback` el ícono que ya usan (`Award` / `ShoppingBag`).

## 5. Verificación

- [x] 5.1 `npx vitest run` completo en verde y `npx tsc --noEmit` sin errores nuevos.
- [ ] 5.2 Verificación manual (después de que la usuaria corra 2.1 en el entorno de prueba): alta con archivo, alta con URL https, alta con archivo + URL (gana archivo), URL http rechazada, alta sin logo, editar sin tocar logo, reemplazar logo del bucket por URL (archivo viejo se borra), reemplazar URL externa por archivo, quitar, eliminar beneficio (archivo desaparece del bucket), archivo > 2 MB y SVG rechazados, logo de Instagram vencido muestra ícono en home y `/kineclub`.
