# Proposal: fix-solicitud-duplicate-error

## Intent

Prevenir errores de restricción única (P2002) al aprobar solicitudes de socios cuyos datos (email o matrícula) ya existen en el sistema. Actualmente, el flujo falla después de haber invitado al usuario a Supabase, lo que genera inconsistencia de datos y una mala experiencia para el administrador.

## Scope

### In Scope
- Validación previa de email y matrícula en el Server Action `gestionarSolicitud`.
- Implementación de métodos de búsqueda por email y matrícula en `ProfesionalRepository`.
- Normalización de emails a minúsculas en el proceso de validación e inserción.
- Mejora de los mensajes de error devueltos a la UI del administrador.

### Out of Scope
- Eliminación de usuarios huérfanos en Supabase Auth (se manejará manualmente si es necesario).
- Refactorización masiva del sistema de solicitudes.

## Capabilities

### Modified Capabilities
- `socio-onboarding`: Se agregan requerimientos de validación previa para evitar fallos de consistencia entre Auth y DB.
- `profesional-data-access`: Se expande la capacidad del repositorio para buscar profesionales por campos únicos.

## Approach

1. **Extender Repository**: Agregar `findByEmail` y `findByMatricula` a `ProfesionalRepository.ts`.
2. **Validación Preemptiva**: En `gestionarSolicitud`, antes de cualquier interacción con Supabase, verificar si el profesional ya existe.
3. **Manejo de Errores**: Capturar errores específicos de duplicidad y devolver un objeto `{ success: false, error: "..." }` descriptivo.
4. **Normalización**: Asegurar que todos los emails se comparen y guarden en lowercase.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/repositories/ProfesionalRepository.ts` | Modified | Nuevos métodos de búsqueda única. |
| `src/app/admin/solicitudes/actions.ts` | Modified | Lógica de validación y manejo de errores. |
| `openspec/specs/socio-onboarding/spec.md` | Modified | Actualización de requerimientos de consistencia. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Usuario ya existe en Supabase pero no en DB | Med | El flujo de invitación de Supabase maneja re-invitaciones, pero debemos asegurar que el vínculo en DB sea correcto. |
| Conflictos de matrícula | Low | La matrícula es única por ley, el error de validación es la respuesta correcta. |

## Rollback Plan

Revertir los cambios en `actions.ts` y el repositorio mediante `git checkout`. Los cambios en la DB son solo de consulta, por lo que no afectan el estado.

## Success Criteria

- [ ] Intentar aprobar una solicitud con un email ya registrado devuelve un mensaje de error claro en lugar de un crash 500.
- [ ] Intentar aprobar una solicitud con una matrícula ya registrada devuelve un mensaje de error claro.
- [ ] El flujo de aprobación exitosa sigue funcionando correctamente para nuevos socios.
