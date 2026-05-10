# Proposal: Dashboard UX Refresh

## Change Name
`dashboard-ux-refresh`

## Intent

Mejorar la utilidad y coherencia del dashboard del portal de socios eliminando shortcuts redundantes
(que repiten navegación del sidebar), reemplazándolos con contenido de valor real:
un QR funcional en el carnet y un widget de beneficios KineClub obtenido de la base de datos.

## Problem

El "Acceso Rápido" actual tiene 4 shortcuts (Mi Perfil, KineClub, Capacitaciones, Convenios).
Tres de ellos (KineClub, Capacitaciones, Convenios) llevan a páginas públicas que ya están
accesibles desde la navegación general del sitio y desde el sidebar del panel. El profesional
no gana nada específico del portal al hacer click en ellos.

El QR en el carnet digital es decorativo (ícono Lucide), no legible ni funcional.
Un QR real que linkee al perfil público del profesional tiene valor real: el socio puede mostrarlo
a pacientes o colegas para que accedan a su información de contacto y horarios.

El espacio derecho de la grid de circulares está desperdiciado con solo un widget de soporte.
El modelo `BeneficioKineClub` existe en la DB pero no se usa en el portal, siendo uno de los
valores tangibles de pertenecer al Círculo.

## Scope

- **Incluye:**
  - Eliminar shortcuts a KineClub, Capacitaciones y Convenios del "Acceso Rápido"
  - Generar un QR real en `CarnetDigital` usando `qrcode.react`
  - Crear `BeneficioRepository` con método `findFeatured(limit)`
  - Nuevo widget "Tus Beneficios" en la columna derecha del dashboard

- **Excluye:**
  - Conectar las circulares a la DB (change separado: `dashboard-circulares-db`)
  - Descarga del carnet como PNG/PDF (future)
  - Cambios en la sección de soporte

## Approach

1. Instalar `qrcode.react` — librería client-only, 2.2KB gzip.
2. `CarnetDigital.tsx` es actualmente un Server Component — el QR debe renderizarse en un
   Client Component hijo para poder usar `qrcode.react`. Se crea `CarnetQR.tsx` con `"use client"`.
3. `BeneficioRepository.findFeatured(limit)` consulta `BeneficioKineClub` donde `activa: true`,
   ordenado por `createdAt desc`, limitado a `limit` registros.
4. El widget de beneficios reemplaza la columna derecha de la grid junto con el widget de soporte
   (soporte se integra dentro del widget de beneficios al final).
5. El "Acceso Rápido" queda solo con Mi Perfil — el grid 2x2 se elimina y se reemplaza
   por una acción más prominente.

## Delivery

Single PR — budget estimado ~150 líneas cambiadas, dentro del límite de 400.
