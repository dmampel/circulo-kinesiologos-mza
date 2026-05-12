## Context

`src/app/page.tsx` es actualmente un Client Component (`"use client"`) que usa framer-motion para animaciones y tiene datos hardcodeados en el JSX. Los repositories necesarios ya existen:

- `ProfesionalRepository.findPaginated(1, 1)` → `.total` para contar activos
- `ObraSocialRepository.getAllActive()` → array de obras sociales activas
- `BeneficioRepository.getAll()` → filtrar por `activa: true` para conteo y featured
- `NoticiaRepository.getLatest()` → filtrar por `publicada: true`, tomar 3
- `CapacitacionRepository.findPublicadas()` → filtrar por fecha futura, tomar 3

No hay cambios en schema ni repositories. El cambio es 100% en la capa de presentación.

## Goals / Non-Goals

**Goals:**
- Convertir `page.tsx` a Server Component con fetch paralelo (`Promise.all`)
- Stats reales: profesionales activos, obras sociales activas, beneficios KineClub activos
- Secciones dinámicas: Noticias, Capacitaciones, KineClub — ocultas si no hay data
- Vitrina institucional: Obras Sociales con conteo real
- CTA mejorado con datos reales integrados en el copy
- Diseño premium y guiado (el usuario recorre la página con narrativa)

**Non-Goals:**
- Crear repositorios nuevos o métodos nuevos
- Agregar páginas públicas para capacitaciones
- Modificar el schema Prisma
- Animaciones complejas (se reemplazan con CSS transitions de Tailwind)

## Decisions

### 1. Server Component en lugar de Client Component

**Elegido**: Server Component puro.  
**Alternativa descartada**: Client Component con `useEffect` + fetch.  
**Razón**: El home no necesita interactividad en el nivel de página. Server Component = fetch en el servidor, zero bundle JS adicional, mejor SEO, más simple.

### 2. Un solo `Promise.all` para todos los fetches

```ts
const [
  { total: totalProfesionales },
  obrasSociales,
  todosLosBeneficios,
  todasLasNoticias,
  capacitaciones,
] = await Promise.all([
  ProfesionalRepository.findPaginated(1, 1),
  ObraSocialRepository.getAllActive(),
  BeneficioRepository.getAll(),
  NoticiaRepository.getLatest(),
  CapacitacionRepository.findPublicadas(),
]);
```

Todos los queries corren en paralelo. `BeneficioRepository.getAll()` se usa tanto para el conteo como para los 3 featured (evita query duplicado).

### 3. Beneficios featured desde `getAll()` filtrado, no `findFeatured()`

`findFeatured()` y `getAll()` consultan la misma tabla. Al usar `getAll()` una sola vez y filtrar en memoria para los featured, se ahorra un round-trip a la DB.

```ts
const activeBeneficios = todosLosBeneficios.filter(b => b.activa);
const beneficiosFeatured = activeBeneficios.slice(0, 3);
```

### 4. Estructura de secciones de la página

| Sección | Tipo | Data |
|---------|------|------|
| Hero | Estático + stats | totalProfesionales, obrasSociales.length, activeBeneficios.length |
| Noticias | Dinámico (oculto si vacío) | últimas 3 publicadas |
| Capacitaciones | Dinámico (oculto si vacío) | próximas 3 (fechaInicio ≥ hoy) |
| KineClub | Dinámico (oculto si vacío) | 3 beneficios activos + total |
| Obras Sociales | Vitrina con data real | lista de nombres, conteo |
| CTA | Estático + datos reales en copy | obrasSociales.length, activeBeneficios.length |

### 5. Sin framer-motion

Se reemplaza con CSS transitions de Tailwind (`hover:-translate-y-1 transition-all`, `hover:shadow-md`). El resultado visual es prácticamente equivalente sin añadir JS al bundle del cliente.

### 6. Imágenes con `<img>` nativo

Las imágenes de noticias y beneficios vienen de Supabase Storage. Se usa `<img>` nativo con `object-cover` en lugar de `next/image` para evitar configurar dominios externos (ya funciona así en el resto del proyecto).

## Risks / Trade-offs

- **Capacitaciones sin página pública** → El home muestra las capacitaciones próximas pero no hay link "Ver todas" ya que `/mi-panel/capacitaciones` requiere auth. Mitigación: no se incluye link "Ver agenda" en esa sección; el CTA de registro menciona las capacitaciones como beneficio de asociarse.
- **Noticias sin filtro en el repository** → `NoticiaRepository.getLatest()` trae todas las noticias (publicadas y no). Se filtra en la página con `.filter(n => n.publicada)`. Mitigación: negligible — pocas noticias en total.
- **`BeneficioRepository.getAll()` sin paginación** → Trae todos los beneficios. Si escala a cientos, será ineficiente. Mitigación: aceptable para el volumen esperado de una institución local.
