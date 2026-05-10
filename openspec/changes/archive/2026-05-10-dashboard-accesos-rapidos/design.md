# Design: Dashboard — Accesos Rápidos + Credencial Premium

## Acceso Rápido (completado)
Ver tasks 1.1–1.5.

---

## Credencial Premium

### Arquitectura de componentes
```
CarnetPage (/mi-panel/carnet)
└── CarnetFlip (nuevo, "use client")
    ├── CarnetFrente (refactor de CarnetDigital)
    └── CarnetDorso (nuevo)
        ├── QRCodeCanvas (grande, ~180px)
        ├── Info legal
        └── Contacto institucional
```

### Flip 3D
- Estado `flipped: boolean` en `CarnetFlip`.
- CSS: `rotateY(0)` → `rotateY(180deg)` con `transition: transform 0.7s`.
- `backface-visibility: hidden` en frente y dorso.
- Clic en cualquier parte del carnet togglea el flip.
- Indicador visual: texto pequeño "Tocá para girar" / "Volver al frente".

### Tilt + Holographic (mouse tracking)
- `onMouseMove` calcula `(x, y)` relativo al centro del elemento → `rotateX` / `rotateY` entre -8° y 8°.
- `onMouseLeave` resetea a `0, 0` con transición suave.
- Holographic: capa `background: conic-gradient(...)` con `opacity` y `mix-blend-mode: overlay`, posición animada con `backgroundPosition` siguiendo el mouse.
- Solo activo en el frente (no en el dorso para no interferir con la lectura del QR).

### Compartir
- Tres botones debajo del carnet:
  - **Copiar link**: `navigator.clipboard.writeText(url)` + feedback visual "¡Copiado!".
  - **WhatsApp**: `https://wa.me/?text=...` con link verificable.
  - **Mail**: `mailto:?subject=...&body=...`.
- URL verificable: `{BASE_URL}/profesionales/{slug}`.

### Archivos afectados
| Archivo | Acción |
|---------|--------|
| `src/components/socio/CarnetFlip.tsx` | Crear (componente principal) |
| `src/components/socio/CarnetDigital.tsx` | Conservar (usado en dashboard) |
| `src/app/mi-panel/carnet/page.tsx` | Usar `CarnetFlip` en lugar de `CarnetDigital` |

### Decisiones
- `CarnetDigital` no se toca — sigue siendo el carnet compacto del dashboard.
- `CarnetFlip` es el carnet expandido solo para `/mi-panel/carnet`.
- El tilt usa inline styles (no Tailwind) para valores dinámicos del mouse.
- No usar framer-motion para el flip (CSS puro es más performante para esta transformación).
