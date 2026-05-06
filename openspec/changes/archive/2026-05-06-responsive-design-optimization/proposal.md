# Propuesta: Optimización de Diseño Responsivo Adaptativo

## Problema
El diseño actual utiliza valores de espaciado y tipografía que resultan excesivamente grandes en pantallas de laptops medianas (13"-14"), aunque se vean bien en pantallas grandes (16"+). Esto afecta la usabilidad y la estética del sitio.

## Solución
Implementar un sistema de diseño adaptable que utilice unidades relativas y escalado fluido.
1.  **Ajuste del Base Font Size**: Reducir ligeramente el tamaño base en resoluciones intermedias.
2.  **Refactor de Paddings y Tipografía**: Reemplazar valores fijos por escalas responsivas de Tailwind.
3.  **Establecer Reglas de Diseño**: Documentar el uso de unidades relativas para evitar regresiones.

## Alcance
- Modificación de `globals.css` para escalado dinámico.
- Ajuste de componentes principales (`KineClubClient`, `Noticias`, etc.).
- Actualización de `AGENTS.md` con las nuevas reglas.
