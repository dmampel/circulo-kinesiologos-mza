## 1. Base de Datos

- [x] 1.1 Agregar enum `EstadoSorteo` y modelos `Sorteo` e `InscripcionSorteo` al schema de Prisma
- [x] 1.2 Agregar relaciones `inscripcionesSorteo` y `sorteoGanado` al modelo `Profesional`
- [ ] 1.3 Ejecutar `prisma db push` para aplicar los cambios al schema
- [ ] 1.4 Habilitar RLS en Supabase: `ALTER TABLE "Sorteo" ENABLE ROW LEVEL SECURITY` y `ALTER TABLE "InscripcionSorteo" ENABLE ROW LEVEL SECURITY`

## 2. Repositorios

- [x] 2.1 Crear `src/lib/repositories/SorteoRepository.ts` con métodos: `findAll`, `findById`, `create`, `update`, `realizarSorteo`
- [x] 2.2 Crear `src/lib/repositories/InscripcionSorteoRepository.ts` con métodos: `findBySorteo`, `inscribir`, `desinscribir`, `findByProfesional`

## 3. Panel Admin — Listado y Creación

- [x] 3.1 Crear `src/app/admin/sorteos/actions.ts` con Server Actions: `createSorteo`, `updateSorteo`, `toggleEstado`, `realizarSorteo`
- [x] 3.2 Crear `src/app/admin/sorteos/page.tsx` con listado de todos los sorteos (estado, cantidad de inscriptos, fecha de cierre)
- [x] 3.3 Crear `src/app/admin/sorteos/nuevo/page.tsx` con formulario de creación (título, descripción, imagen, fechaInicio, fechaCierre, maxParticipantes)

## 4. Panel Admin — Detalle y Sorteo

- [x] 4.1 Crear `src/app/admin/sorteos/[id]/page.tsx` con detalle del sorteo: datos, lista de inscriptos y botón "Realizar sorteo" (solo si estado = `ACTIVO` y hay inscriptos)
- [x] 4.2 Crear `src/app/admin/sorteos/[id]/editar/page.tsx` con formulario de edición (deshabilitado si estado = `REALIZADO`)
- [x] 4.3 Implementar la Server Action `realizarSorteo` con selección aleatoria y transición de estado a `REALIZADO`

## 5. Panel Admin — Navegación

- [x] 5.1 Agregar enlace "Sorteos" al sidebar de admin (`src/app/admin/_components/AdminSidebar.tsx`)

## 6. Panel Socio — Vista y Participación

- [x] 6.1 Crear `src/app/mi-panel/sorteos/actions.ts` con Server Actions: `inscribirme`, `desinscribirme`
- [x] 6.2 Crear `src/app/mi-panel/sorteos/page.tsx` con lista de sorteos activos y realizados, mostrando estado de inscripción del socio y ganador si corresponde
- [x] 6.3 Agregar enlace "Sorteos" al sidebar del socio (`src/components/socio/Sidebar.tsx`)
