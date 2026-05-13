<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# CKM-Web: Círculo de Kinesiólogos de Mendoza

## Project Overview
CKM-Web es la plataforma institucional y de gestión para el Círculo de Kinesiólogos de Mendoza. Su objetivo es centralizar la información para socios (Noticias, KineClub, Eventos) y facilitar la administración de beneficios y convenios.

### Tech Stack
- **Framework**: Next.js 15+ (App Router)
- **Database**: PostgreSQL (Supabase) via Prisma ORM
- **Styling**: Tailwind CSS 4
- **State/Logic**: Server Actions & Repository Pattern
- **Persistence**: OPSX (Spec-Driven Development)

---

## 🏛️ Architecture Pillars

1. **Repository Pattern**: No usar Prisma directamente en los componentes. Todo acceso a datos debe pasar por `src/lib/repositories/`.
2. **Server-First**: Priorizar Server Components para fetch de datos. Usar "use client" solo cuando sea estrictamente necesario para interactividad.
3. **OpenSpec (OPSX)**: Todo cambio significativo debe ser precedido por un `openspec new change` y seguir el flujo de Propuesta -> Diseño -> Tareas.
   - **Modo de Ejecución:** SIEMPRE usar modo `Interactivo` (pausar y validar después de cada fase).
   - **Artifact Store:** SIEMPRE usar `openspec` para documentar todo el proceso y las decisiones en el repositorio.
   - **Checklist de Tareas:** SIEMPRE antes de ejecutar la fase `sdd-archive`, volver al archivo `tasks.md` y marcar todas las tareas finalizadas con `[x]`.
   - **Persistence:** TRAS CADA CHANGE archivado, realizar un `git commit` (siguiendo Work Units) y un `git push` al repositorio remoto.
4. **Validation**: Usar esquemas de validación (Zod) para todos los inputs de usuario.
5. **RLS Obligatorio**: Cada tabla nueva creada en Supabase DEBE tener Row-Level Security habilitado. Ejecutar `ALTER TABLE "NombreTabla" ENABLE ROW LEVEL SECURITY;` en el SQL Editor de Supabase después de cada `prisma db push`. El sitio usa Prisma con `service_role` (bypasea RLS), por lo que no se necesitan políticas adicionales.

---

## 🎨 UI/UX Principles (Premium Design)

1. **Rich Aesthetics**: El sitio debe sentirse premium. Usar gradientes suaves, glassmorphism (`backdrop-blur`), y sombras sutiles. Evitar colores planos genéricos.
2. **Atomic Design**: Organizar componentes de forma jerárquica y reutilizable.
3. **Micro-animations**: Implementar transiciones suaves con `framer-motion` o CSS transitions para mejorar la experiencia percibida.
4. **Vibrant & Clean**: Fondo mayormente claro/blanco con acentos vibrantes (Azul CKM, Rojo KineClub).

---

## 📱 Responsive Design Rules

1. **NO FIXED PIXELS**: Nunca usar `px` fijos para espaciados, fuentes o anchos (excepto bordes de 1px). Usar escalas relativas de Tailwind.
2. **REM OVER PX**: Preferir unidades `rem`. (1rem = 16px base, adaptable según pantalla).
3. **ADAPTIVE SPACING**: Usar prefijos responsivos (`p-6 md:p-10`) para componentes grandes.
4. **FLUID TYPOGRAPHY**: Usar escalado fluido para headers (ej: `text-4xl md:text-6xl`).

---

## 🛠️ Workflow Standards

1. **Conventional Commits**: Seguir el estándar `type: description` (feat, fix, style, refactor, docs).
2. **No Console Logs**: Limpiar todos los logs antes de cada commit, a menos que sean críticos para depuración en desarrollo.
3. **Error Handling**: Siempre capturar errores en Server Actions y devolver un objeto `{ success: boolean, error?: string }`.
4. **Clean Code**: Mantener las funciones pequeñas y enfocadas en una sola responsabilidad.
