## Exploration: fix-solicitud-duplicate-error

### Current State
La Server Action `gestionarSolicitud` en `src/app/admin/solicitudes/actions.ts` intenta crear un registro en `Profesional` directamente usando Prisma sin validar previamente si el email o la matrícula ya existen. Esto causa un error `P2002` (Unique constraint failed) que rompe el flujo y deja al usuario en un estado inconsistente (invitado a Supabase pero sin registro en el padrón).

### Affected Areas
- `src/app/admin/solicitudes/actions.ts` — Requiere validación previa y manejo de errores específico.
- `src/lib/repositories/ProfesionalRepository.ts` — Se debe extender para incluir métodos de búsqueda por email/matrícula siguiendo el patrón del proyecto.

### Approaches
1. **Validación Previa en Server Action**:
   - Consultar si existe un profesional con el mismo email o matrícula antes de proceder con Supabase/Prisma.
   - **Pros**: Previene el error antes de que ocurra, permite feedback claro al admin, evita invitaciones basura.
   - **Cons**: Una consulta extra a la DB (despreciable).
   - **Esfuerzo**: Bajo.

2. **Manejo de Errores con Catch de Prisma**:
   - Intentar la operación y capturar el error `P2002` para devolver un mensaje amigable.
   - **Pros**: Atómico si se usaran transacciones (pero Supabase queda afuera).
   - **Cons**: El usuario ya fue invitado a Supabase antes del error de Prisma. Rollback complejo.
   - **Esfuerzo**: Medio.

### Recommendation
**Enfoque 1: Validación Previa**. Es lo más robusto dado que interactuamos con un servicio externo (Supabase Auth). Debemos normalizar el email a lowercase para evitar duplicados por casing y usar el `ProfesionalRepository` para mantener la arquitectura.

### Risks
- **Race conditions**: Si dos admins aprueban al mismo tiempo (muy baja probabilidad).
- **Consistencia Auth/DB**: Si la invitación de Supabase falla, debemos asegurar que el flujo se detenga.

### Ready for Proposal
Sí. Procederemos a la fase de Propuesta.
