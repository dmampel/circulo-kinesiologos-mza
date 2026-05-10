# Delta for socio-portal

## MODIFIED Requirements

### Requirement: Portal Layout

El panel DEBE tener un diseño independiente del sitio institucional.
DEBE incluir una barra lateral (sidebar) o menú de navegación con:
- Inicio / Dashboard
- Mi Carnet
- Mi Perfil ← (antes: "Próximamente"; ahora: ruta activa `/mi-panel/perfil`)
- Cerrar Sesión

El layout DEBE ser responsivo, ocultando el sidebar en móviles tras un menú hamburguesa.

(Previously: "Mi Perfil" estaba marcado como "Próximamente" sin ruta funcional)

#### Scenario: Acceso no autorizado

- GIVEN un usuario no autenticado
- WHEN intenta acceder a cualquier ruta bajo `/mi-panel`
- THEN es redirigido a `/login`

#### Scenario: Cierre de Sesión

- GIVEN un socio autenticado en el panel
- WHEN hace click en "Cerrar Sesión"
- THEN su sesión de Supabase se destruye y es redirigido al inicio del sitio público

#### Scenario: Navegación a Mi Perfil (nuevo)

- GIVEN un socio autenticado en el dashboard
- WHEN hace click en "Mi Perfil" en el sidebar
- THEN es redirigido a `/mi-panel/perfil` con su formulario de autogestión

## ADDED Requirements

### Requirement: Sección Mi Perfil en Navegación

El sidebar DEBE incluir el ítem "Mi Perfil" como enlace activo a `/mi-panel/perfil`.
El ítem DEBE mostrar estado visual activo cuando la ruta actual es `/mi-panel/perfil`.

#### Scenario: Indicador de ruta activa

- GIVEN un socio en `/mi-panel/perfil`
- WHEN mira el sidebar
- THEN el ítem "Mi Perfil" aparece visualmente destacado (activo)
