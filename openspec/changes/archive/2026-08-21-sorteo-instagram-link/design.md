# Design: Botón "Ir al sorteo" con link a Instagram

Cambio chico: una columna nullable, dos inputs de admin y el reemplazo de un botón por un ancla. Sin capas nuevas, sin componentes nuevos, sin librerías, sin cambios de firma en actions existentes.

## 1. Prisma / DB

```prisma
model Sorteo {
  // ...
  imagen_url       String?
  instagramUrl     String?   // URL de la publicación de IG del sorteo
  // ...
}
```

- **Nullable**: los sorteos existentes no la tienen y no se les exige nada.
- Migración: `npx prisma db push` + `npx prisma generate` (convención del repo, `AGENTS.md`).
- **RLS**: no aplica — es una columna sobre una tabla existente, no una tabla nueva.
- `SorteoRepository` no cambia: `create`/`update` usan `Prisma.SorteoCreateInput`/`UpdateInput` y `findForSocios()` usa `include` (no `select`), así que `instagramUrl` aparece solo en `SorteoPublico` tras `generate`.

## 2. Validación — `src/app/admin/sorteos/schema.ts`

```ts
instagramUrl: z.string().url("URL inválida").optional(),
```

Mismo estilo encadenado que `imagen_url`, para consistencia con el archivo. **No** se agrega un `.refine(includes("instagram.com"))`: no fue pedido y agrega una regla que puede molestar (links acortados, `instagr.am`).

En `actions.ts`, mismo patrón exacto que `imagen_url` — el input vacío llega como `""` y rompería `.url()`:

```ts
const instagramRaw = formData.get("instagramUrl") as string;
// en el safeParse:
instagramUrl: instagramRaw || undefined,
```

- `createSorteo`: replicar el spread condicional del destructuring — `const { imagen_url, instagramUrl, ...rest }` y `...(instagramUrl ? { instagramUrl } : {})`, para no escribir `undefined`.
- `updateSorteo`: `SorteoSchema.partial()` ya lo cubre; alcanza con sumar el campo al `safeParse`.
- `toggleEstadoSorteo` y `realizarSorteoAction`: **sin cambios**.

## 3. UI Admin

Bloque idéntico al de "URL de Imagen", dentro del mismo grid de 2 columnas, en ambos forms:

- `label`: "URL del Sorteo en Instagram (Opcional)"
- `input type="url" name="instagramUrl"`, `placeholder="https://www.instagram.com/p/..."`
- Error: `state?.errors?.instagramUrl?.[0]`
- En `EditarSorteoForm`: `defaultValue={sorteo.instagramUrl ?? ""}`, dentro del `fieldset` deshabilitable, con las clases `disabled:cursor-not-allowed` de sus vecinos.

Se copian las clases exactas de los inputs contiguos — sin diseño nuevo.

## 4. UI Socio — `SorteoCard`

Solo cambia la rama `else` (socio **no** inscripto). La rama `yaInscripto` (badge verde + "Cancelar participación" con `desinscribirmeDelSorteo`) queda intacta, igual que el contador de inscriptos y la sección "Sorteos Realizados".

```tsx
) : sorteo.instagramUrl ? (
  <a
    href={sorteo.instagramUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="block w-full text-center px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
  >
    Ir al sorteo
  </a>
) : (
  <p className="text-xs font-medium text-slate-400 text-center">
    Link del sorteo próximamente
  </p>
)}
```

Decisiones de UI:
- **Mismas clases del botón actual** (azul CKM) + `block text-center` porque un `<a>` no centra el texto como un `<button>`. Cero cambio visual percibido.
- `target="_blank"` + `rel="noopener noreferrer"` (obligatorio por seguridad al abrir dominio externo).
- Sin ícono ni gradiente nuevos: el pedido es cambiar el destino del botón, no rediseñarlo.
- La firma de `SorteoCard` (`sorteo`, `yaInscripto`, `profesionalId`) **no cambia** — `yaInscripto` sigue en uso.
- `inscribirmeAlSorteo` deja de tener llamador; `desinscribirmeDelSorteo` se sigue usando, así que el import de `page.tsx` se reduce a esa sola action. El archivo `actions.ts` **no se borra**.

## 5. Verificación

Sin test runner en el proyecto (`strict_tdd: false`). Verificación manual:
1. `npx tsc --noEmit` limpio.
2. Crear sorteo con URL inválida → error Zod visible; sin URL → guarda igual.
3. Editar un sorteo activo, cargar la URL → la card del socio muestra "Ir al sorteo" y abre IG en pestaña nueva.
4. Sorteo activo sin URL → aparece "Link del sorteo próximamente", card sin romperse.
5. Socio con inscripción vieja → sigue viendo "Ya participás" y puede cancelar.
