## Context

24 `console.error()`/`console.warn()` dispersos en 10 archivos de Server Actions y un componente cliente. Un `data: any` en `saveProfesional()` y `conditions: any[]` en `getProfesionales()` que rompen el contrato de types en `admin/profesionales/actions.ts`. Un comentario TODO sin resolver en `institucional/page.tsx`. Ausencia de `.env.example` que obliga a rastrear variables en el código.

Son cambios mecánicos sin impacto en lógica de negocio. No hay cambios de DB, schema, ni dependencias nuevas.

## Goals / Non-Goals

**Goals:**
- Remover todos los `console.*` de Server Actions — la información de error ya se retorna como `{ success: false, error }` al cliente
- Tipificar `saveProfesional` con una interfaz inline y `getProfesionales` usando `Prisma.ProfesionalWhereInput[]`
- Eliminar el TODO comment en `institucional/page.tsx`
- Crear `.env.example` con las 10 variables de entorno requeridas, con descripción de cada una

**Non-Goals:**
- No implementar un sistema de logging centralizado (fuera de alcance)
- No agregar validación Zod a `saveProfesional` (scope creep — el formulario admin ya valida en el cliente)
- No tocar lógica de negocio en ningún archivo

## Decisions

**1. Remover console.error, no reemplazar por logger**  
Alternativa: introducir un wrapper `logger.error()`. Decisión: remover directamente. Razón: el error ya está siendo capturado y retornado al cliente como mensaje de usuario. Agregar un logger introduce una dependencia que no existe en el proyecto y está fuera del scope de este change.

**2. Usar `Prisma.ProfesionalWhereInput[]` para `conditions`**  
El array de condiciones en `getProfesionales` puede tipificarse directamente con el tipo de Prisma sin introducir tipos custom. Importar `{ Prisma }` de `@prisma/client`.

**3. Interfaz inline para `saveProfesional`**  
Definir `ProfesionalInput` en el mismo archivo de actions. No moverlo a un archivo de types separado — la única función que lo usa está en ese archivo.

**4. console.warn en perfil/actions.ts línea 100 — mantener o remover**  
Es un caso especial: falla al borrar la foto anterior en Storage, operación secundaria que no debe bloquear el flujo. Decisión: remover el `console.warn` también — el flujo ya está protegido por el `try/catch` que no relanza el error.

## Risks / Trade-offs

- [Sin logs de servidor] En producción, si una Server Action falla silenciosamente, no habrá traza en los logs del servidor → Mitigación: Supabase y Vercel tienen sus propios logs de plataforma; para errores críticos se puede habilitar logging en el futuro como change separado.
- [Cambio de tipos en actions.ts de profesionales] Si hay código que llama a `saveProfesional` pasando campos extra o mal tipados, TypeScript lo marcará → esto es un beneficio, no un riesgo.
