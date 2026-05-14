# Design: Rediseño de la página institucional

## Resumen técnico

Cambio puramente de UI. No hay base de datos, ni backend, ni Server Actions involucradas. Se reescribe el JSX de `src/app/institucional/page.tsx` como un **Server Component plano**, default export del archivo, con todo el contenido modelado como **constantes tipadas** al tope del módulo.

## Decisiones clave

### 1. Server Component plano

- Sin `"use client"`. La página no requiere estado ni interactividad.
- Default export de `src/app/institucional/page.tsx`.
- Sin `useEffect`, sin handlers de cliente, sin librerías de animación que requieran client boundary.
- Consistente con el pilar **Server-First** de `AGENTS.md`.

### 2. Datos hardcodeados como constantes tipadas

Todas las piezas de contenido editables se definen al tope del archivo, antes del componente, como constantes con tipos `as const` o tipos inline. Esto las hace trivialmente localizables para edición futura por parte del cliente.

```ts
const PRESIDENTE: { nombre: string; cargo: string; iniciales: string }
const COMISION_DIRECTIVA: Array<{ nombre: string; cargo: string; iniciales: string }>
const HITOS: Array<{ año: string; titulo: string; desc: string }>
const DOCUMENTOS: Array<{ titulo: string; desc: string; href: string; icon: LucideIcon }>
```

Comentario marcador `// TODO: replace with real data` agrupando las constantes placeholder según lo pide la propuesta.

### 3. Avatares con iniciales (sin fotos)

- Cada miembro se renderiza como un `div` con sus iniciales centradas.
- Color de fondo determinista por **índice de array** sobre una paleta fija de Tailwind (no random, no hash inestable). Paleta sugerida:
  - `bg-blue-600`, `bg-slate-700`, `bg-indigo-600`, `bg-sky-600`, `bg-blue-800`, `bg-slate-600`.
- El Presidente usa un avatar más grande (`h-24 w-24` aprox) con tipografía mayor; el resto, avatares estándar.
- Iniciales se almacenan en la constante (no se calculan en render) para evitar lógica frágil con nombres compuestos.

### 4. Mapa embebido

- `<iframe>` directo con URL pública de Google Maps embed apuntando a "Eusebio Blanco 148, Capital, Mendoza, Argentina".
- Sin Maps JavaScript API, sin variables de entorno, sin API key.
- `loading="lazy"` y `referrerPolicy="no-referrer-when-downgrade"` para minimizar costo y respetar buenas prácticas.
- Container con `rounded-[2rem] overflow-hidden` para encajar con la estética del sitio.

### 5. Layout por sección

| # | Sección | Layout | Notas |
|---|---------|--------|-------|
| 1 | Hero | Centrado, una columna | Título grande + descripción larga oficial |
| 2 | Misión + Visión | Grid `md:grid-cols-2` | Card light (Misión) + card dark (Visión) para jerarquía visual |
| 3 | Timeline | Lista vertical con línea conectora | Línea izquierda (`border-l`), nodo circular por hito, año destacado |
| 4 | Comisión Directiva | Card featured full-width + grid `md:grid-cols-2 lg:grid-cols-3` | Presidente arriba como pieza destacada; resto en grilla |
| 5 | Documentos | Grid `md:grid-cols-2 lg:grid-cols-3` | Cards con icono Lucide + título + desc + link |
| 6 | Contacto + Mapa | Grid `lg:grid-cols-2` | Datos a la izquierda, iframe a la derecha; se apila en mobile |

### 6. Estética y tokens

- Paleta del sitio: `bg-slate-50` de fondo general, `bg-white` y `bg-slate-900` para cards, acentos `text-blue-600` / `bg-blue-50`.
- Rounded corners grandes: `rounded-[3rem]` para secciones grandes, `rounded-[2rem]` para cards individuales.
- Sombras sutiles: `shadow-sm` por defecto; `shadow-xl` solo en la card featured del Presidente.
- Tipografía: `font-black tracking-tighter` para títulos grandes, fluida con `text-4xl md:text-6xl`.
- Glassmorphism (`backdrop-blur`) opcional en la card del Presidente si encaja sin sobrecargar.

### 7. Responsive

- Todo en escalas Tailwind (`rem`-based). Sin `px` fijos salvo bordes de 1px.
- Prefijos `md:` y `lg:` para padding, grid columns y tipografía.
- Spacing adaptativo (`p-6 md:p-10`, `gap-6 md:gap-10`).
- En mobile: todas las grillas colapsan a una columna; el iframe del mapa mantiene aspect ratio (`aspect-video` o `min-h-[24rem]`).

### 8. Iconografía

- Continuar con `lucide-react` (ya importado en el archivo actual).
- Iconos sugeridos:
  - Documentos: `FileText`, `Scale`, `Receipt`, `BookOpen` según el documento.
  - Contacto: `MapPin`, `Mail`, `Phone`.
  - Timeline (opcional): `Milestone` o ninguno (puntos CSS).

### 9. Links

- Documentos: `<a href="#" target="_blank" rel="noopener noreferrer">` por ahora; cuando exista el archivo real, el `href` se reemplaza.
- Sin uso de `<Link>` de Next para enlaces externos/placeholder; se reserva `<Link>` para navegación interna si surge.

## Constraints respetados

- Sin Prisma, sin DB, sin Server Actions, sin RLS.
- Sin `console.log` en el archivo final.
- Sin fotos reales (avatares CSS + iniciales).
- Sin API keys (mapa por iframe embed público).
- Sin cambios a `/autoridades` ni `/estatuto` (evaluación postergada al archive).
- Sin metadata SEO avanzada ni i18n (fuera de alcance).

## Riesgos y mitigaciones

- **Riesgo**: El iframe de Google Maps puede romperse si Google cambia el formato de URL embed.
  **Mitigación**: Usar la URL canónica `https://www.google.com/maps?q=...&output=embed`, que es estable y no requiere autenticación.

- **Riesgo**: Los datos placeholder pueden quedar publicados en producción si el cliente no los reemplaza a tiempo.
  **Mitigación**: Marcador `// TODO: replace with real data` visible al tope del archivo, agrupado por sección. La propuesta deja explícito que son placeholders.

- **Riesgo**: Inconsistencia visual entre la card featured y la grilla de la Comisión Directiva.
  **Mitigación**: Compartir tokens de Tailwind (rounded, shadow, padding base) entre ambos sub-componentes inline; la card featured solo se diferencia en tamaño de avatar y layout horizontal.
