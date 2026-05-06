# Propuesta: Gestión Integral de Categorías de Beneficios

## Problema
Tras la migración de las categorías a un modelo dinámico, necesitamos una interfaz en el panel de administración para crearlas, editarlas y eliminarlas de forma sencilla.

## Solución
Implementar un sistema híbrido de gestión:
1.  **Sidebar Lateral**: En el listado principal de beneficios, para creación rápida y vista general.
2.  **Página de Edición**: Una ruta dedicada para modificaciones detalladas de cada categoría.

## Alcance
- UI de Sidebar para creación rápida.
- Página `/admin/beneficios/categorias/[id]` para edición.
- Server Actions para CRUD completo.
- Integración en el listado principal de beneficios del admin.
