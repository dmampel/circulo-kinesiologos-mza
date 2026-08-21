# Proposal: Botón "Ir al sorteo" con link a Instagram

## Intent

Los sorteos se anuncian y se realizan en Instagram. Hoy el panel del socio (`/mi-panel/sorteos`) muestra un botón "Participar" que crea una `InscripcionSorteo` — inscribirse ahí no hace que el socio participe del sorteo real. El socio necesita llegar a la publicación de Instagram.

Cambio mínimo y acotado: **el botón "Participar" pasa a ser un link "Ir al sorteo" a la publicación de IG. Todo lo demás del módulo queda exactamente igual.**

## Scope

### In Scope
- `instagramUrl String?` (opcional) en el modelo `Sorteo` + `prisma db push`.
- Input "URL de la publicación de Instagram" (opcional, validado con Zod) en los forms admin de crear y editar sorteo, cableado en `schema.ts` y `actions.ts`.
- `SorteoCard` en `/mi-panel/sorteos`: la rama `else` (socio **no** inscripto) cambia el `<form>`+`<button>` "Participar" por un `<a href={sorteo.instagramUrl} target="_blank" rel="noopener noreferrer">Ir al sorteo</a>`, con el mismo look del botón actual.

### Out of Scope (explícito — queda todo igual)
- `InscripcionSorteo`, `InscripcionSorteoRepository`, `inscribirmeAlSorteo` / `desinscribirmeDelSorteo`: **no se tocan ni se borran**. `src/app/mi-panel/sorteos/actions.ts` se conserva.
- Rama `yaInscripto`: badge "Ya participás" + "Cancelar participación" **siguen funcionando igual** (socios con inscripciones viejas).
- Contador "N inscriptos" en la card: sin cambios.
- Vista admin de inscriptos, "Realizar sorteo", `realizarSorteo()`, `toggleEstadoSorteo`: sin cambios (misma firma, sin guards nuevos).
- **No** se agrega ninguna regla que exija `instagramUrl` para pasar a `ACTIVO`.

## Fallback (decidido)

Si `sorteo.instagramUrl` es `null` o vacío (sorteos viejos), la card **no renderiza el link**: muestra en su lugar un texto gris chico "Link del sorteo próximamente". Sin lógica de negocio adicional en ningún otro lado.

## Capabilities

### New Capabilities
- Ninguna.

### Modified Capabilities
- `socio-sorteos`: el CTA del sorteo activo pasa de "Participar" (inscripción) a "Ir al sorteo" (link externo a IG). La desinscripción de socios ya inscriptos se conserva.
- `sorteos-management`: el sorteo suma `instagramUrl` opcional en creación y edición.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` (`Sorteo`) | Modified | + `instagramUrl String?` |
| `src/app/admin/sorteos/schema.ts` | Modified | + `instagramUrl` en `SorteoSchema` |
| `src/app/admin/sorteos/actions.ts` | Modified | parseo del campo en `createSorteo` / `updateSorteo` |
| `src/app/admin/sorteos/nuevo/page.tsx` | Modified | input URL |
| `src/app/admin/sorteos/[id]/editar/EditarSorteoForm.tsx` | Modified | input URL con `defaultValue` |
| `src/app/mi-panel/sorteos/page.tsx` (`SorteoCard`) | Modified | rama `else`: botón → `<a>` "Ir al sorteo" |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Sorteos `ACTIVO` existentes sin `instagramUrl` | Alta | Fallback definido arriba; la admin edita el sorteo y carga la URL |
| URL mal pegada | Media | Zod `.url()` + `target="_blank"` (no rompe la página) |

## Rollback Plan

1. `git revert` del commit → vuelve el botón "Participar" tal cual está hoy.
2. La columna `instagramUrl` puede quedar en la DB (nullable, ignorada). Si se quiere limpiar: quitarla del schema + `prisma db push`.
3. Cero data destruida: ninguna `InscripcionSorteo` se toca.

## Dependencies

- Acceso a la DB de Supabase para el `prisma db push` (columna sobre tabla existente → sin RLS nuevo).

## Success Criteria

- [ ] La admin puede cargar y editar la URL de IG del sorteo, con error visible si la URL es inválida.
- [ ] En `/mi-panel/sorteos`, un sorteo activo con URL muestra "Ir al sorteo" y abre la publicación en una pestaña nueva.
- [ ] Un sorteo activo sin URL muestra el texto de fallback, sin romper la card.
- [ ] Socios ya inscriptos siguen viendo "Ya participás" y pueden cancelar, igual que antes.
