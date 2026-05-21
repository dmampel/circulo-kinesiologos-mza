# Design: capacitaciones-cupo

## Implementación existente (relevamiento 21/05/2026)

### Repositorio — `src/lib/repositories/CapacitacionRepository.ts`
`inscribir()` valida cupo dentro de una transacción antes de crear la inscripción. Lanza `"Cupo agotado"` si `_count.inscripciones >= cupoMaximo`.

### UI — `src/app/mi-panel/capacitaciones/[id]/page.tsx`
- Muestra vacantes restantes con texto color-coded (verde/ámbar/rojo)
- Barra de progreso de ocupación (`calcularBarraCupos`)
- Botón reemplazado por bloque "Cupo Agotado" cuando `sinCupo && !inscripcion`

### UI — `src/app/mi-panel/capacitaciones/page.tsx`
- Cards de la cartelera muestran cupos libres en línea
- Botón deshabilitado con "Cupo Agotado" cuando `sinCupo && !yaInscripto`
