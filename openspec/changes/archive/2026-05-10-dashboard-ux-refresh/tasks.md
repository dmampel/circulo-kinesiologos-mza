# Tasks: Dashboard UX Refresh

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150–180 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Delivery strategy | single-pr |

---

## Phase 1: Dependencia y Repository

- [x] 1.1 Instalar `qrcode.react`: `npm install qrcode.react`
- [x] 1.2 Crear `src/lib/repositories/BeneficioRepository.ts` con clase estática y método `findFeatured(limit = 3)`

## Phase 2: CarnetQR — Client Component

- [x] 2.1 Crear `src/components/socio/CarnetQR.tsx` como Client Component (`"use client"`)

## Phase 3: Actualizar CarnetDigital

- [x] 3.1 En `src/components/socio/CarnetDigital.tsx`: agregar `slug` a Props, reemplazar QR mockup por `<CarnetQR slug={slug} />`
- [x] 3.2 En `src/app/mi-panel/page.tsx`: pasar `slug={profesional.slug}` al componente `<CarnetDigital>`

## Phase 4: Refactorizar Dashboard

- [x] 4.1 Importar `BeneficioRepository` y fetchar `beneficios = await BeneficioRepository.findFeatured(3)`
- [x] 4.2 Reemplazar grid 2x2 de shortcuts por botón único "Mi Perfil" full-width
- [x] 4.3 Reemplazar columna derecha con widget "Tus Beneficios" + Soporte
