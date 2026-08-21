# Tasks: Botón "Ir al sorteo" con link a Instagram

> Alcance cerrado, sin decisiones pendientes. Regla transversal: **no tocar** `InscripcionSorteo`, `InscripcionSorteoRepository`, `src/app/mi-panel/sorteos/actions.ts`, la rama `yaInscripto` de la card, el contador de inscriptos, ni nada del admin fuera de los dos forms.

## 1. DB / Prisma

- [x] 1.1 Agregar `instagramUrl String?` al modelo `Sorteo` en `prisma/schema.prisma` (debajo de `imagen_url`, línea ~308).
- [x] 1.2 Correr `npx prisma db push` y `npx prisma generate`.
- [x] 1.3 Verificar en Supabase que la columna existe. **No** hace falta `ENABLE ROW LEVEL SECURITY` (no es tabla nueva).

## 2. Backend / Validación

- [x] 2.1 `src/app/admin/sorteos/schema.ts`: agregar `instagramUrl: z.string().url("URL inválida").optional()` al `SorteoSchema`. Sin `.refine()` de dominio.
- [x] 2.2 `src/app/admin/sorteos/actions.ts` → `createSorteo`: leer `formData.get("instagramUrl")`, pasar `raw || undefined` al `safeParse` y sumar `...(instagramUrl ? { instagramUrl } : {})` al `SorteoRepository.create` (mismo patrón que `imagen_url`).
- [x] 2.3 `src/app/admin/sorteos/actions.ts` → `updateSorteo`: sumar el campo al `safeParse` con `raw || undefined` (el `.partial()` cubre el resto).
- [x] 2.4 Confirmar que `toggleEstadoSorteo`, `realizarSorteoAction` y `SorteoRepository` quedan **sin cambios**.

## 3. Frontend Admin

- [x] 3.1 `src/app/admin/sorteos/nuevo/page.tsx`: input "URL del Sorteo en Instagram (Opcional)" (`type="url"`, `name="instagramUrl"`, placeholder `https://www.instagram.com/p/...`) + render de `state?.errors?.instagramUrl?.[0]`, replicando las clases del campo "URL de Imagen".
- [x] 3.2 `src/app/admin/sorteos/[id]/editar/EditarSorteoForm.tsx`: mismo input con `defaultValue={sorteo.instagramUrl ?? ""}`, dentro del `fieldset` deshabilitable y con `disabled:cursor-not-allowed`.

## 4. Frontend Socio

- [x] 4.1 `src/app/mi-panel/sorteos/page.tsx` → `SorteoCard`, **solo la rama `else`** (líneas ~190-197): reemplazar `<form action={inscribirmeAlSorteo...}>` + `<button>Participar</button>` por `<a href={sorteo.instagramUrl} target="_blank" rel="noopener noreferrer" className="block w-full text-center px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">Ir al sorteo</a>`.
- [x] 4.2 Fallback sin URL: `<p className="text-xs font-medium text-slate-400 text-center">Link del sorteo próximamente</p>`.
- [x] 4.3 Ajustar el import de la línea 8: dejar solo `desinscribirmeDelSorteo` (`inscribirmeAlSorteo` queda sin uso). **No borrar** `actions.ts`.
- [x] 4.4 Verificar que NO se modificó: rama `yaInscripto`, contador `_count.inscripciones`, sección "Sorteos Realizados", ni la firma de `SorteoCard`.

## 5. Verificación

- [x] 5.1 `npx tsc --noEmit` sin errores.
- [x] 5.2 Manual admin: crear sorteo con URL inválida → error Zod; sin URL → guarda igual; editar y cargar URL → persiste.
- [x] 5.3 Manual socio: sorteo activo con URL → "Ir al sorteo" abre la publicación en pestaña nueva.
- [x] 5.4 Manual socio: sorteo activo sin URL → texto de fallback, card intacta.
- [x] 5.5 Manual socio: socio con inscripción previa → "Ya participás" + "Cancelar participación" siguen funcionando.
- [x] 5.6 Sin `console.log` residuales.

## 6. Cierre

- [x] 6.1 Sync de specs en archive: `openspec/specs/sorteos-management/spec.md` (el sorteo admite URL de IG opcional en creación/edición) y `openspec/specs/socio-sorteos/spec.md` (el CTA del sorteo activo es "Ir al sorteo" → link a IG; la desinscripción de socios ya inscriptos se conserva).
- [x] 6.2 Marcar todas las tareas como `[x]` antes de `opsx:archive`.
- [x] 6.3 Commit (`feat: link "Ir al sorteo" a la publicación de Instagram`) y push por SSH.
