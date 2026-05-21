## 1. Tipado en admin/profesionales/actions.ts

- [x] 1.1 Agregar `import { Prisma } from "@prisma/client"` al archivo
- [x] 1.2 Cambiar `conditions: any[]` por `conditions: Prisma.ProfesionalWhereInput[]` en `getProfesionales`
- [x] 1.3 Definir interfaz `ProfesionalInput` con todos los campos usados en `saveProfesional`
- [x] 1.4 Reemplazar `data: any` por `data: ProfesionalInput` en la firma de `saveProfesional`

## 2. Remoción de console.* en Server Actions

- [x] 2.1 Remover `console.error` de `admin/profesionales/actions.ts` (3 ocurrencias)
- [x] 2.2 Remover `console.error` de `admin/noticias/actions.ts` (1 ocurrencia)
- [x] 2.3 Remover `console.error` de `admin/solicitudes/actions.ts` (2 ocurrencias)
- [x] 2.4 Remover `console.error` de `admin/beneficios/actions.ts` (2 ocurrencias)
- [x] 2.5 Remover `console.error` de `admin/autoridades/actions.ts` (3 ocurrencias)
- [x] 2.6 Remover `console.error` de `admin/obras-sociales/actions.ts` (4 ocurrencias)
- [x] 2.7 Remover `console.error` de `registro/actions.ts` (3 ocurrencias)
- [x] 2.8 Remover `console.error` y `console.warn` de `mi-panel/perfil/actions.ts` (4 ocurrencias)
- [x] 2.9 Remover `console.error` de `mi-panel/circulares/actions.ts` (1 ocurrencia)
- [x] 2.10 Remover `console.error` de `components/socio/BotonInscripcion.tsx` (1 ocurrencia)

## 3. Cleanup de comentarios

- [x] 3.1 Eliminar el comentario `// TODO: move to a utility if needed` en `src/app/institucional/page.tsx`
- [x] 3.2 Eliminar el comentario inline `// Basic slugification for new creation if missing` en `admin/profesionales/actions.ts` (se explica solo)
- [x] 3.3 Eliminar el comentario inline `// Prevent duplicates` en `admin/profesionales/actions.ts`
- [x] 3.4 Eliminar el comentario inline `// La URL pública tiene el formato: ...` en `mi-panel/perfil/actions.ts`
- [x] 3.5 Eliminar el comentario inline `// No bloquear el flujo si la eliminación falla` en `mi-panel/perfil/actions.ts`

## 4. Crear .env.example

- [x] 4.1 Crear `ckm-web/.env.example` con las 10 variables de entorno documentadas
