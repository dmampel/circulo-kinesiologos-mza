# Tasks: Rediseño de la página institucional

Implementación ordenada del rediseño de `src/app/institucional/page.tsx`. Marcar con `[x]` a medida que se completan.

## Implementación

- [x] Definir constantes de datos al tope de `src/app/institucional/page.tsx` (`PRESIDENTE`, `COMISION_DIRECTIVA`, `HITOS`, `DOCUMENTOS`) con tipos inline y marcador `// TODO: replace with real data`
- [x] Reemplazar la sección Hero por título institucional + descripción larga oficial, centrada
- [x] Reemplazar la sección Misión + Visión con grid `md:grid-cols-2` y tratamiento visual diferenciado (card light + card dark)
- [x] Implementar la sección Historia / Timeline con lista vertical, línea conectora y un nodo por hito iterando `HITOS`
- [x] Implementar la sección Comisión Directiva: card featured full-width para `PRESIDENTE` + grilla `md:grid-cols-2 lg:grid-cols-3` iterando `COMISION_DIRECTIVA`, con avatares CSS de iniciales y color por índice
- [x] Implementar la sección Documentos Institucionales con grid de cards (icono Lucide + título + descripción + link), iterando `DOCUMENTOS`
- [x] Implementar la sección Contacto + Mapa: grid `lg:grid-cols-2` con datos de contacto a la izquierda (dirección, email, teléfono) e `<iframe>` de Google Maps embed a la derecha
- [x] Limpiar imports no usados, verificar tipos TypeScript, asegurar que no quedan `console.log` ni `"use client"`
