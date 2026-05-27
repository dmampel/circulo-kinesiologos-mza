## Why

Los kinesiólogos necesitan registrar la obra social de sus pacientes para gestionar la facturación y el seguimiento clínico. Actualmente el modelo `Paciente` no tiene ningún campo para este dato, obligando a incluirlo en el campo libre de notas.

## What Changes

- Nuevo campo opcional `obraSocial String?` en el modelo `Prisma` `Paciente`
- Migración de base de datos (Prisma db push)
- Campo de texto libre en el formulario de alta y edición de paciente
- Visualización del dato en la ficha/detalle del paciente

## Capabilities

### New Capabilities

<!-- Ninguna nueva capacidad — es una extensión del CRUD existente -->

### Modified Capabilities

- `gestion-pacientes`: Agregar campo `obraSocial` (string libre, opcional) al modelo Paciente — el formulario de alta/edición y la vista de detalle deben incluirlo.

## Impact

- `prisma/schema.prisma` — campo `obraSocial String?` en model `Paciente`
- `src/lib/repositories/PacienteRepository.ts` — incluir `obraSocial` en create/update
- `src/app/mi-panel/pacientes/` — formulario y vista de detalle
- Supabase: migración automática vía `prisma db push` (campo nullable, sin riesgo de datos existentes)
