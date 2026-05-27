## 1. Schema y Repositorio

- [x] 1.1 `prisma/schema.prisma` — agregar `obraSocial String?` al model `Paciente`, después del campo `email`
- [x] 1.2 `npx prisma db push` — migrar la base de datos
- [x] 1.3 `src/lib/repositories/PacienteRepository.ts` — agregar `obraSocial?: string` a `CreatePacienteInput` y `UpdatePacienteInput`, pasar el campo en create/update

## 2. Server Actions

- [x] 2.1 `src/app/mi-panel/turnos/pacientes/actions.ts` — extraer `obraSocial` del formData en `crearPaciente` y `actualizarPaciente`, pasarlo al repositorio

## 3. UI

- [x] 3.1 `src/app/mi-panel/turnos/pacientes/_components/PacienteForm.tsx` — agregar `obraSocial?: string | null` a `initialValues`, agregar input de texto entre Email y Notas
- [x] 3.2 `src/app/mi-panel/turnos/pacientes/[id]/editar/page.tsx` — pasar `obraSocial` del paciente cargado a `PacienteForm`
