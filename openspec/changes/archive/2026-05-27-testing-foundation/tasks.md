
## 1. Setup

- [x] 1.1 Crear `src/test/setup.ts` con `import '@testing-library/jest-dom'`
- [x] 1.2 Actualizar `vitest.config.ts`: agregar `setupFiles: ['./src/test/setup.ts']`
- [x] 1.3 Eliminar `src/utils/math.test.ts`

## 2. TurnoRepository — detectarSolapamiento

- [x] 2.1 Crear `src/lib/repositories/TurnoRepository.test.ts`
- [x] 2.2 Mockear `@/lib/prisma` con `vi.mock`
- [x] 2.3 Test: sin turnos existentes → retorna `false`
- [x] 2.4 Test: turno cancelado en misma franja → retorna `false`
- [x] 2.5 Test: solapamiento parcial al inicio → retorna `true`
- [x] 2.6 Test: solapamiento parcial al final → retorna `true`
- [x] 2.7 Test: solapamiento exacto → retorna `true`
- [x] 2.8 Test: excludeId excluye el turno propio → retorna `false`

## 3. TurnoRepository — otros métodos

- [x] 3.1 Test: `autoCompletarPasados` llama `updateMany` con filtro correcto

## 4. ProfesionalRepository

- [x] 4.1 Crear `src/lib/repositories/ProfesionalRepository.test.ts`
- [x] 4.2 Test: `findByEmail` retorna profesional si existe
- [x] 4.3 Test: `findByMatricula` retorna `null` si no existe

## 5. Action — gestionarSolicitud

- [x] 5.1 Crear `src/app/admin/solicitudes/actions.test.ts`
- [x] 5.2 Mockear `@/lib/prisma`, `@/lib/supabase/admin`, `next/cache`, `@/lib/resend`
- [x] 5.3 Test: rechazar → `prisma.solicitud.update` con `RECHAZADA` + `{ success: true }`
- [x] 5.4 Test: aprobar con email duplicado → `{ success: false, error: ... }`
- [x] 5.5 Test: aprobar exitoso → crea profesional, actualiza solicitud, `{ success: true }`

## 6. Action — crearTurno

- [x] 6.1 Crear `src/app/mi-panel/turnos/actions.test.ts`
- [x] 6.2 Mockear `@/lib/prisma`, `next/cache`, `next/navigation`
- [x] 6.3 Test: solapamiento detectado → retorna resultado con warning
- [x] 6.4 Test: sin solapamiento → `prisma.turno.create` llamado correctamente

## 7. Verificación

- [x] 7.1 Correr `npm test` y verificar que todos los tests pasan
