# Design: Módulo de Capacitaciones

## Architectural Decisions

### AD-1: Estructura del Modelo Prisma

**Decisión:** Crear dos modelos interrelacionados:
```prisma
enum TipoCapacitacion {
  CURSO
  TALLER
  CONGRESO
  ASAMBLEA
}

enum ModalidadCapacitacion {
  PRESENCIAL
  VIRTUAL
  HIBRIDO
}

enum EstadoInscripcion {
  PENDIENTE
  CONFIRMADA
  CANCELADA
  ASISTIO
}

model Capacitacion {
  id              String   @id @default(cuid())
  tipo            TipoCapacitacion
  titulo          String
  descripcion     String   @db.Text
  modalidad       ModalidadCapacitacion
  fechaInicio     DateTime
  fechaFin        DateTime?
  ubicacion       String?  // Link de zoom o dirección física
  cupoMaximo      Int?
  costo           Decimal? @db.Decimal(10,2)
  publicada       Boolean  @default(false)
  
  inscripciones   InscripcionCapacitacion[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model InscripcionCapacitacion {
  id              String   @id @default(cuid())
  capacitacionId  String
  profesionalId   String
  estado          EstadoInscripcion @default(PENDIENTE)
  
  capacitacion    Capacitacion @relation(fields: [capacitacionId], references: [id])
  profesional     Profesional  @relation(fields: [profesionalId], references: [id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([capacitacionId, profesionalId]) // Un profesional no puede inscribirse dos veces
}
```

### AD-2: Validación de Cupos
**Decisión:** En `CapacitacionRepository.inscribir()`, hacer la validación transaccional: contar inscriptos donde estado != CANCELADA. Si es `>= cupoMaximo`, rechazar inscripción.

### AD-3: Rutas de Admin
- `/admin/capacitaciones` -> Listado (Tabla DataTables standard del admin)
- `/admin/capacitaciones/nuevo` -> Formulario ABM
- `/admin/capacitaciones/[id]` -> Vista con pestañas: Detalles, Inscriptos (Tabla de gestión).

### AD-4: Rutas del Socio
- `/mi-panel/capacitaciones` -> Pestañas de Shadcn/Radix (Cartelera | Mis Inscripciones)
- Tarjetas con layout claro usando iconos (calendario, map-pin, users para cupos).

## Open Questions
_Ninguna por ahora._
