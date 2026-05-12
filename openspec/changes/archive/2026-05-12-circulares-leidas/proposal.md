# Proposal: Circulares Leídas

## Intent

Permitir a los profesionales marcar las circulares como "leídas" para saber qué avisos tienen pendientes. Esto mejora la experiencia de usuario (inbox zero) y provee métricas de lectura a la administración.

## Scope

### In Scope
- Nuevo modelo Prisma `LecturaCircular` que relaciona `Circular` y `Profesional`.
- Badge en la barra de navegación del socio indicando la cantidad de circulares no leídas.
- Vista de lista de circulares destacando las no leídas (ej. punto azul o negrita).
- Server Action silencioso para registrar la lectura al acceder al detalle de la circular.

### Out of Scope
- Panel de métricas detallado para el administrador (cuántos leyeron cada circular). Queda para una iteración futura.
- Notificaciones push o por email para circulares no leídas.

## Capabilities

### New Capabilities
- `circular-read-tracking`: Seguimiento del estado de lectura de circulares por socio.

### Modified Capabilities
- None

## Approach

Agregar un modelo `LecturaCircular` en Prisma uniendo `CircularId` y `ProfesionalId`.
En `CircularRepository`, agregar métodos para contar las no leídas y listarlas con el estado adjunto.
En el frontend, el layout/sidebar hace un fetch del count. La página de detalle ejecuta un Server Action para registrar la lectura.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Agregar modelo y relaciones |
| `src/lib/repositories/CircularRepository.ts` | Modified | Métodos de conteo y lectura |
| `src/app/mi-panel/layout.tsx` | Modified | Badge de no leídas |
| `src/app/mi-panel/circulares/page.tsx` | Modified | UI de estado leído/no leído |
| `src/app/mi-panel/circulares/[id]/page.tsx` | Modified | Trigger de lectura |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Consultas pesadas de conteo en el layout | Low | Usar un Prisma `count` eficiente aprovechando los índices en `ProfesionalId` y `CircularId`. |

## Rollback Plan

Revertir los commits. La tabla `LecturaCircular` puede permanecer en la base de datos sin impacto negativo si la lógica se elimina del código.

## Success Criteria

- [ ] El socio ve un badge con el número correcto de circulares no leídas.
- [ ] Al entrar al detalle de una circular, el badge disminuye y el estado se marca como leído.
- [ ] La lista de circulares refleja visualmente cuáles están leídas y cuáles no.
