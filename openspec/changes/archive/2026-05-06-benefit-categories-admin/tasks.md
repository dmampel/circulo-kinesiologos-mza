## 1. Infraestructura y Lógica

- [ ] 1.1 Implementar Server Actions en `src/app/admin/beneficios/categoria-actions.ts` (CRUD completo).
- [ ] 1.2 Asegurar que `BeneficioRepository` incluya la relación con categorías en todos los queries.

## 2. Interfaz de Usuario (Admin)

- [ ] 2.1 Finalizar `CategoriaSidebar.tsx` con integración de las acciones.
- [ ] 2.2 Integrar el Sidebar en `src/app/admin/beneficios/page.tsx`.
- [ ] 2.3 Crear la página de edición: `src/app/admin/beneficios/categorias/[id]/page.tsx`.
- [ ] 2.4 Refactorizar la tabla de beneficios en el admin para mostrar el nombre de la categoría dinámicamente.

## 3. Verificación

- [ ] 3.1 Probar el flujo completo: Crear -> Editar -> Listar -> Borrar.
- [ ] 3.2 Verificar que no se puedan borrar categorías con beneficios activos.
