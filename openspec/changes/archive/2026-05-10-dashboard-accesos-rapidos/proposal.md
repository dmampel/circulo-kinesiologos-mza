# Proposal: Dashboard — Accesos Rápidos + Credencial Premium

## Intent
Dos mejoras relacionadas al panel del socio:
1. Expandir "Acceso Rápido" con los accesos más frecuentes.
2. Convertir la página `/mi-panel/carnet` en una credencial digital premium con flip 3D, animación holográfica y opciones de compartir.

## Scope

### In Scope
**Acceso Rápido** (completado):
- Lista vertical de 3 accesos: Editar Perfil, Generar QR (modal), Cursos (stub).
- Modal QR con descarga PNG.

**Credencial Premium** (nuevo):
- Flip 3D al hacer clic: frente (foto, nombre, matrícula) → dorso (QR grande, info legal, contacto).
- Tilt 3D suave con mouse tracking + efecto glass/holographic.
- Compartir: copiar link verificable, WhatsApp, mail.

### Out of Scope
- Notificaciones de vencimiento de matrícula (requiere datos en DB).
- Mini analytics, tema dinámico, beneficios como entry point (changes futuros).
- Indicadores de firma digital (sin infraestructura real).

## Motivation
La credencial digital es la feature más visible del portal para el socio. Con flip + animación + compartir pasa de ser una tarjeta estática a una pieza premium que el profesional quiere mostrar.
