# Design: Dashboard UX Refresh

## Architectural Decisions

### AD-1: Separar el QR en un Client Component hijo

**Decisión:** `CarnetDigital.tsx` permanece como Server Component. Se extrae un componente
`CarnetQR.tsx` con `"use client"` que usa `qrcode.react`.

**Razón:** `qrcode.react` usa APIs del browser (canvas o SVG). Si se importa en un Server Component
Turbopack falla. Al aislar el QR en un Client Component, el tree queda:

```
CarnetDigital (Server) → CarnetQR (Client, lazy)
```

**Alternativa rechazada:** Convertir `CarnetDigital` entero en Client Component — innecesario y
perdemos los beneficios de RSC para el resto de los datos del carnet.

---

### AD-2: QR usando SVG, no canvas

**Decisión:** Usar `<QRCodeSVG>` de `qrcode.react` en lugar de `<QRCodeCanvas>`.

**Razón:** SVG se integra mejor con Tailwind (tamaño controlado por className), no requiere
`ref` ni manipulación del DOM, y es resolution-independent para pantallas de alta densidad.

---

### AD-3: URL del QR — absoluta con dominio de producción

**Decisión:** El QR encoda `https://ckmendoza.com.ar/profesionales/{slug}`.
Hardcoded como constante `BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ckmendoza.com.ar"`.

**Razón:** El QR debe ser válido cuando se escanea desde un dispositivo externo.
Una URL relativa (`/profesionales/{slug}`) o `localhost` no sería escaneable en producción.

---

### AD-4: BeneficioRepository — nuevo archivo, patrón estático

**Decisión:** Crear `src/lib/repositories/BeneficioRepository.ts` con clase estática,
siguiendo exactamente el patrón de `ProfesionalRepository`.

Método:
```typescript
static async findFeatured(limit = 3): Promise<BeneficioKineClub[]>
```

Implementación:
```typescript
prisma.beneficioKineClub.findMany({
  where: { activa: true },
  orderBy: { createdAt: "desc" },
  take: limit,
  include: { categoria: true },
})
```

---

### AD-5: Acceso Rápido — de grid 2x2 a acción única

**Decisión:** Eliminar el map sobre 4 shortcuts. Reemplazar con un único botón "Mi Perfil"
estilizado de forma más prominente (full-width, con descripción breve).

La columna derecha del hero (actualmente solo shortcuts) queda reorganizada con:
1. Botón "Mi Perfil" (prominente, full-width)
2. Espacio para el widget de beneficios (se ubica abajo de la fold en mobile, columna derecha en desktop)

---

### AD-6: Widget de Beneficios — posición en el layout

**Decisión:** El widget "Tus Beneficios" reemplaza la columna derecha (`lg:col-span-4`) de la
grid de circulares (actualmente ocupada solo por "Soporte"). El widget de soporte se integra
al final del widget de beneficios como footer.

Layout resultante de la grid inferior:
```
[Circulares         ] [Tus Beneficios    ]
[lg:col-span-8      ] [lg:col-span-4     ]
                      [+ Soporte al fondo]
```

---

## File Changes

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/lib/repositories/BeneficioRepository.ts` | **Nuevo** | `findFeatured(limit)` |
| `src/components/socio/CarnetQR.tsx` | **Nuevo** | Client Component con QR SVG |
| `src/components/socio/CarnetDigital.tsx` | Modificar | Importar `CarnetQR`, pasar `slug` |
| `src/app/mi-panel/page.tsx` | Modificar | Shortcuts → Mi Perfil único + widget beneficios |

## Open Questions

_Ninguna — diseño completamente resuelto._
