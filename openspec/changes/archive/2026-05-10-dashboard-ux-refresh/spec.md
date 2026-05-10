# Spec: Dashboard UX Refresh

## Domain
`socio-portal` (delta)

## Requirements

### Requirement: Acceso Rápido Simplificado

El panel principal DEBE mostrar en "Acceso Rápido" únicamente el acceso a "Mi Perfil"
como enlace interno del portal.

Los shortcuts a páginas públicas externas (KineClub, Capacitaciones, Convenios)
DEBEN ser eliminados del Acceso Rápido ya que son redundantes con la navegación general.

#### Scenario: Acceso Rápido con un solo ítem

- GIVEN que un socio está en el dashboard `/mi-panel`
- WHEN carga la página
- THEN el área "Acceso Rápido" muestra únicamente el botón "Mi Perfil" con link a `/mi-panel/perfil`
- AND los botones "KineClub", "Capacitaciones" y "Convenios" no son visibles en esa sección

---

### Requirement: QR Funcional en el Carnet Digital

El carnet digital DEBE incluir un código QR real y legible que apunte al perfil público
del profesional en el padrón (`/profesionales/{slug}`).

El QR DEBE ser generado en el cliente para evitar dependencias de rendering SSR.

#### Scenario: QR apunta al perfil público

- GIVEN que el profesional tiene `slug = "mampel-delfina--43484771"`
- WHEN el carnet digital se renderiza
- THEN el QR code generado encoda la URL `https://ckmendoza.com.ar/profesionales/mampel-delfina--43484771`

#### Scenario: QR es legible

- GIVEN que el carnet se muestra en pantalla
- WHEN un dispositivo externo escanea el QR
- THEN el dispositivo navega al perfil público del profesional

---

### Requirement: Widget de Beneficios KineClub en el Dashboard

El dashboard DEBE mostrar una sección "Tus Beneficios" con hasta 3 beneficios activos
obtenidos de la base de datos, con link a la página completa de KineClub.

Los beneficios DEBEN provenir del modelo `BeneficioKineClub` donde `activa = true`.

#### Scenario: Beneficios disponibles en la DB

- GIVEN que existen registros en `BeneficioKineClub` con `activa = true`
- WHEN el dashboard carga
- THEN se muestran hasta 3 beneficios activos con empresa y descripción
- AND hay un link "Ver todos →" que lleva a `/kineclub`

#### Scenario: Sin beneficios en la DB

- GIVEN que no existen registros en `BeneficioKineClub` con `activa = true`
- WHEN el dashboard carga
- THEN la sección "Tus Beneficios" no se renderiza (se omite silenciosamente)

#### Scenario: Menos de 3 beneficios

- GIVEN que existen 2 registros activos en `BeneficioKineClub`
- WHEN el dashboard carga
- THEN se muestran los 2 beneficios disponibles sin errores

---

## Non-functional Requirements

- El QR DEBE renderizarse en el cliente (Client Component) para evitar errores de hydration
- La instalación de `qrcode.react` no debe impactar el bundle del servidor
- `BeneficioRepository.findFeatured` DEBE ordenar por `createdAt desc` para mostrar los más recientes primero
