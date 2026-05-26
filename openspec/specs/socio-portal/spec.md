# Specification: Portal del Socio Core

## Requirements

### 1. Route Protection (Middleware)
- **R1.1:** Todas las rutas bajo `/mi-panel` DEBEN estar protegidas.
- **R1.2:** Si un usuario no autenticado intenta acceder, DEBE ser redirigido a `/login`.
- **R1.3:** El Middleware DEBE refrescar la sesión de Supabase en cada petición para mantener el acceso fluido.

### 2. Portal Layout
- **R2.1:** El panel DEBE tener un diseño independiente del sitio institucional.
- **R2.2:** DEBE incluir una barra lateral (sidebar) o menú de navegación con:
  - Inicio / Dashboard
  - Mi Carnet
  - Mi Perfil ← ruta activa `/mi-panel/perfil`
  - Cerrar Sesión
- **R2.3:** El layout DEBE ser responsivo, ocultando el sidebar en móviles tras un menú hamburguesa.

### 3. Dashboard Principal
- **R3.1:** DEBE mostrar un mensaje de bienvenida personalizado con el nombre del profesional.
- **R3.2:** DEBE ofrecer acceso rápido a la visualización del Carnet Digital.

### 4. Carnet Digital Dinámico
- **R4.1:** DEBE renderizar los datos reales del profesional desde Prisma:
  - Nombre y Apellido completo.
  - Matrícula Profesional.
  - Foto de Perfil (si no hay, mostrar iniciales).
  - Estado de Habilitación (siempre "Verificado" para socios activos).
- **R4.2:** El diseño DEBE ser "mobile-first", optimizado para mostrarse en la pantalla de un celular como credencial.

### 5. Sección Mi Perfil en Navegación
- **R5.1:** El sidebar DEBE incluir el ítem "Mi Perfil" como enlace activo a `/mi-panel/perfil`.
- **R5.2:** El ítem DEBE mostrar estado visual activo cuando la ruta actual es `/mi-panel/perfil`.

### Requirement: Dashboard muestra status real del profesional
La card de cabecera del dashboard SHALL mostrar el campo `profesional.status` como badge (ACTIVO → verde, INACTIVO → gris). El texto "Vencimiento: Dic 2026" hardcodeado SHALL ser eliminado.

#### Scenario: Profesional activo
- **WHEN** el profesional tiene `status = ACTIVO`
- **THEN** la card muestra un badge verde con el texto "Activo"

#### Scenario: Profesional inactivo
- **WHEN** el profesional tiene `status = INACTIVO`
- **THEN** la card muestra un badge gris con el texto "Inactivo"

#### Scenario: Sin campo vencimiento
- **WHEN** el dashboard se renderiza
- **THEN** no aparece ningún campo "Vencimiento" en la card de cabecera

### Requirement: Agenda diferencia días pasados del día actual
En la agenda semanal del dashboard, los días anteriores al día actual SHALL mostrarse visualmente apagados (opacidad reducida). El día actual SHALL mantener su estilo destacado existente.

#### Scenario: Días pasados en el week strip
- **WHEN** un día de la semana tiene fecha anterior a hoy
- **THEN** el número del día y su etiqueta se renderizan con `opacity-40` o equivalente

#### Scenario: Eventos de días pasados en el timeline
- **WHEN** un evento (turno o capacitación) pertenece a un día anterior a hoy
- **THEN** el ítem se muestra con opacidad reducida y sin efecto hover interactivo

#### Scenario: Día actual no se ve afectado
- **WHEN** un día es el día de hoy (`esHoy = true`)
- **THEN** su estilo destacado (fondo azul) se mantiene sin cambios

### Requirement: Turnos pasados se marcan automáticamente como COMPLETADO
Al cargar el dashboard, el sistema SHALL actualizar en batch todos los turnos del profesional cuya fecha ya pasó y cuyo estado sea PENDIENTE o CONFIRMADO, cambiándolos a COMPLETADO.

#### Scenario: Turno pasado en estado PENDIENTE
- **WHEN** el dashboard carga y existen turnos con `fecha < now()` y `estado = PENDIENTE`
- **THEN** esos turnos se actualizan a `estado = COMPLETADO` antes de renderizar la agenda

#### Scenario: Turno pasado en estado CONFIRMADO
- **WHEN** el dashboard carga y existen turnos con `fecha < now()` y `estado = CONFIRMADO`
- **THEN** esos turnos se actualizan a `estado = COMPLETADO` antes de renderizar la agenda

#### Scenario: Turno cancelado no se modifica
- **WHEN** un turno tiene `estado = CANCELADO` y fecha pasada
- **THEN** su estado permanece CANCELADO sin cambios

#### Scenario: Turno futuro no se modifica
- **WHEN** un turno tiene `fecha >= now()`
- **THEN** su estado no es modificado por el batch

## Scenarios

### Scenario 1: Acceso no autorizado
- **Given** que un usuario no ha iniciado sesión.
- **When** intenta navegar a `https://ckmendoza.com.ar/mi-panel`.
- **Then** el sistema lo redirige a `https://ckmendoza.com.ar/login`.

### Scenario 2: Visualización del Carnet
- **Given** que un socio "Juan Pérez" con matrícula "1234" está logueado.
- **When** accede a su panel.
- **Then** ve una tarjeta visualmente atractiva que dice "Juan Pérez", "M.P. 1234" y el logo del Círculo.

### Scenario 3: Cierre de Sesión
- **Given** que un socio está en el panel.
- **When** hace click en "Cerrar Sesión".
- **Then** su sesión de Supabase se destruye y es redirigido al inicio del sitio público.

### Scenario 4: Navegación a Mi Perfil
- **Given** que un socio está autenticado en el dashboard.
- **When** hace click en "Mi Perfil" en el sidebar.
- **Then** es redirigido a `/mi-panel/perfil` con su formulario de autogestión.

### Scenario 5: Indicador de ruta activa
- **Given** que un socio está en `/mi-panel/perfil`.
- **When** mira el sidebar.
- **Then** el ítem "Mi Perfil" aparece visualmente destacado (activo).

