# Tasks: Dashboard — Accesos Rápidos + Credencial Premium

## Phase 1: Acceso Rápido (completado)

- [x] 1.1 Reemplazar único link "Mi Perfil" por lista vertical de 3 accesos en `src/app/mi-panel/page.tsx`.
- [x] 1.2 Ajustar imports lucide-react (`BookOpen` in, `QrCode` out al QRModal).
- [x] 1.3 Eliminar "Beneficios" de Acceso Rápido. Conservar sidebar.
- [x] 1.4 Crear `src/components/socio/QRModal.tsx` — modal QR grande + descarga PNG.
- [x] 1.5 Fix bug `src/app/mi-panel/carnet/page.tsx`: prop `slug` faltante en `<CarnetDigital>`.

## Phase 2: Credencial Premium (completado)

- [x] 2.1 Crear `src/components/socio/CarnetFlip.tsx`:
  - Flip 3D con estado `flipped` + animación 0.7s cubic-bezier.
  - Mouse tracking → tilt `rotateX/Y` entre -8° y 8° (desactivado al flipear).
  - Capa holographic: radial-gradient + `mix-blend-mode: overlay` siguiendo el mouse.
  - Hints "Tocá para girar" / "Volver al frente".
- [x] 2.2 Dorso con QR grande (140px, fondo blanco), nombre, matrícula, emisor y URL verificable.
- [x] 2.3 Sección "Compartir": Copiar link (con feedback "¡Copiado!"), WhatsApp, Mail.
- [x] 2.4 Actualizar `src/app/mi-panel/carnet/page.tsx` para usar `CarnetFlip`.
