## Context

El modelo `Paciente` existe desde el change `turnero-pacientes`. Tiene campos: `id`, `nombre`, `apellido`, `telefono`, `email`, `notas`, `profesionalId`. No tiene obra social. El formulario de alta/edición vive en `src/app/mi-panel/pacientes/`.

La tabla `ObraSocial` existe para los convenios institucionales del Círculo — es un dominio distinto (acuerdos del Círculo con prestadoras) y no debe mezclarse con la obra social particular de cada paciente.

## Goals / Non-Goals

**Goals:**
- Agregar `obraSocial String?` al schema Prisma (nullable, sin default)
- Reflejar el campo en create/update del repositorio
- Mostrar el campo en el formulario de paciente (alta + edición)
- Mostrar el dato en la ficha del paciente si está cargado

**Non-Goals:**
- Validar contra la tabla `ObraSocial` existente
- Autocompletar con obras sociales conocidas
- Filtrar pacientes por obra social

## Decisions

**String libre, no FK**: La obra social de un paciente es un dato informativo para el kinesiólogo. El paciente puede tener cualquier prestadora — no necesariamente una de las que tiene convenio el Círculo. Un `String?` es suficiente y elimina complejidad innecesaria.

**Campo nullable**: No todos los pacientes tienen obra social (o el kinesiólogo puede no saberlo). El campo es siempre opcional.

**Sin migración manual**: `prisma db push` es suficiente — el campo es nullable, no rompe datos existentes.

**Ubicación en el form**: Después de `email`, antes de `notas` — agrupa los datos de contacto/cobertura.

## Risks / Trade-offs

- **Inconsistencia de nombres**: al ser string libre, cada kinesiólogo puede escribir "OSDE", "Osde", "O.S.D.E." — no hay normalización. Aceptable para esta etapa; autocomplete se puede agregar después si se necesita.
- **Sin búsqueda/filtro por obra social**: Si en el futuro se quiere filtrar pacientes por obra social, habrá que agregar esa feature separada. No es bloqueante.
