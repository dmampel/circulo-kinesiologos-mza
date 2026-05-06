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
  - Mi Perfil (Próximamente)
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
