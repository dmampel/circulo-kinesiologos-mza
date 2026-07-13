## Context

El proyecto usa Repository Pattern para aislar Prisma de los componentes Next.js. El módulo de sorteos sigue el mismo patrón ya establecido por `Capacitacion`/`InscripcionCapacitacion`. El admin gestiona los sorteos; los socios los ven y participan desde su panel.

## Goals / Non-Goals

**Goals:**
- Modelo de datos con estados claros (`BORRADOR` → `ACTIVO` → `REALIZADO`)
- CRUD admin bajo `/admin/sorteos/`
- Vista + inscripción del socio bajo `/mi-panel/sorteos/`
- Sorteo aleatorio ejecutado en una Server Action (sin dependencia de libs externas)

**Non-Goals:**
- Notificaciones al ganador (puede ser una segunda iteración)
- Historial de sorteos anteriores en el panel de socio (se puede agregar después)
- Cupos limitados con validación de concurrencia (el cupo máximo es informativo por ahora)

## Decisions

### D1: Enum `EstadoSorteo` en lugar de booleano `publicado`

`BORRADOR | ACTIVO | REALIZADO` en vez de `publicado: Boolean + realizado: Boolean`.

**Por qué**: El flujo tiene tres estados mutuamente excluyentes y secuenciales. Un enum lo expresa sin ambigüedad y evita estados inválidos como `publicado=false, realizado=true`.

**Alternativa descartada**: dos booleanos — generan 4 combinaciones posibles, 2 de las cuales no tienen sentido.

---

### D2: Schema Prisma — dos nuevos modelos

```prisma
enum EstadoSorteo {
  BORRADOR
  ACTIVO
  REALIZADO
}

model Sorteo {
  id               String         @id @default(cuid())
  titulo           String
  descripcion      String         @db.Text
  imagen_url       String?
  fechaInicio      DateTime
  fechaCierre      DateTime?
  maxParticipantes Int?
  estado           EstadoSorteo   @default(BORRADOR)

  inscripciones    InscripcionSorteo[]
  ganadorId        String?        @unique
  ganador          Profesional?   @relation("SorteoGanador", fields: [ganadorId], references: [id])

  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
}

model InscripcionSorteo {
  id            String      @id @default(cuid())
  sorteoId      String
  profesionalId String
  sorteo        Sorteo      @relation(fields: [sorteoId], references: [id], onDelete: Cascade)
  profesional   Profesional @relation(fields: [profesionalId], references: [id], onDelete: Cascade)
  createdAt     DateTime    @default(now())

  @@unique([sorteoId, profesionalId])
}
```

También agregar en `Profesional`:
```prisma
inscripcionesSorteo InscripcionSorteo[]
sorteoGanado        Sorteo?            @relation("SorteoGanador")
```

---

### D3: Lógica del sorteo como Server Action

La selección del ganador se hace con `Math.random()` sobre el array de inscriptos devuelto por Prisma. No se necesita extensión de DB (`TABLESAMPLE`) para el volumen de datos esperado (decenas a centenas de inscriptos).

```ts
// En SorteoRepository.realizarSorteo(sorteoId)
const inscripciones = await prisma.inscripcionSorteo.findMany({ where: { sorteoId } });
if (!inscripciones.length) throw new Error("Sin inscriptos");
const ganador = inscripciones[Math.floor(Math.random() * inscripciones.length)];
await prisma.sorteo.update({
  where: { id: sorteoId },
  data: { estado: "REALIZADO", ganadorId: ganador.profesionalId }
});
```

---

### D4: Estructura de rutas

```
src/app/admin/sorteos/
  page.tsx                   ← lista de sorteos
  nuevo/page.tsx             ← formulario de creación
  [id]/page.tsx              ← detalle + inscriptos + botón de sorteo
  [id]/editar/page.tsx       ← formulario de edición
  actions.ts                 ← Server Actions (create, update, publish, realizarSorteo)

src/app/mi-panel/sorteos/
  page.tsx                   ← lista de sorteos activos + realizados
  actions.ts                 ← Server Actions (inscribirse, desinscribirse)
```

---

### D5: Repositorios

- `SorteoRepository`: `findAll`, `findById`, `create`, `update`, `publish`, `realizarSorteo`
- `InscripcionSorteoRepository`: `findBySorteo`, `inscribir`, `desinscribir`, `findByProfesional`

## Risks / Trade-offs

- **[Risk] Condición de carrera en el sorteo** → El admin realiza el sorteo desde un único punto de acción. Con el volumen esperado no es un problema real, pero si dos admins ejecutan simultáneamente podrían registrarse dos ganadores. Mitigación: la constraint `@unique` en `ganadorId` hace que solo una escritura tenga éxito.
- **[Risk] RLS no configurado** → Tras `prisma db push`, ejecutar `ALTER TABLE "Sorteo" ENABLE ROW LEVEL SECURITY` y `ALTER TABLE "InscripcionSorteo" ENABLE ROW LEVEL SECURITY` en Supabase. El site usa `service_role` (bypasea RLS), así que no se necesitan policies adicionales.

## Migration Plan

1. Agregar modelos al schema de Prisma
2. `prisma db push` (o migración)
3. Habilitar RLS en Supabase para las dos tablas nuevas
4. Implementar repositorios y Server Actions
5. Implementar UI admin y UI socio

## Open Questions

*(ninguna — el scope está claro)*
