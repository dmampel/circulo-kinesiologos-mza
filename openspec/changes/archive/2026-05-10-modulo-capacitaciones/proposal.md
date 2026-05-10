# Proposal: Módulo de Capacitaciones

## Change Name
`modulo-capacitaciones`

## Intent
Proveer un sistema integral para la gestión de capacitaciones, cursos y eventos institucionales.
Permitir a los administradores crear, publicar y gestionar inscriptos.
Permitir a los socios visualizar la oferta académica y registrarse desde su panel de autogestión.

## Problem
Actualmente el Colegio no tiene una forma centralizada de ofrecer y gestionar capacitaciones.
Los profesionales ven un acceso rápido "Capacitaciones" que probablemente lleva a páginas estáticas.
La gestión de inscriptos (quién va, cupos, pagos pendientes) se hace manualmente por fuera del sistema.

## Scope
- **Incluye:**
  - Modelo `Capacitacion` (Cursos, Talleres, Eventos, Asambleas)
  - Modelo `InscripcionCapacitacion` (Relación Profesional <> Capacitacion)
  - `CapacitacionRepository` y Server Actions asociadas.
  - **Panel de Administración (`/admin/capacitaciones`)**:
    - Listado de capacitaciones.
    - Formulario ABM (Crear / Editar).
    - Vista de detalle de una capacitación con listado de inscriptos y control de estados.
  - **Portal del Socio (`/mi-panel/capacitaciones`)**:
    - Cartelera pública de capacitaciones activas.
    - Botón de inscripción.
    - Historial "Mis Capacitaciones".

- **Excluye (MVP - V1):**
  - Pasarela de pago integrada (MercadoPago/Stripe). El pago se acordará "off-platform" (transferencia).
  - Generación automática de certificados en PDF.
  - Envío automático de emails (puede agregarse luego un webhook en la DB).

## Approach
1. **Schema Prisma**: Crear las dos tablas nuevas. Una Capacitación puede tener `cupoMaximo` y `costo`. Una Inscripción tiene un `estado` (PENDIENTE, CONFIRMADA, CANCELADA).
2. **Repositorio**: `CapacitacionRepository` para manejar la lógica de datos y concurrencia simple (chequear cupos antes de inscribir).
3. **Panel Admin**: Usar el layout existente de CRUD que ya funciona para noticias/beneficios. Agregando una vista tabular extra para gestionar inscriptos de cada capacitación.
4. **Panel Socio**: Una nueva pestaña en el sidebar "Mis Capacitaciones" que lista tarjetas descriptivas con el contenido del evento y acción directa de "Anotarme".
