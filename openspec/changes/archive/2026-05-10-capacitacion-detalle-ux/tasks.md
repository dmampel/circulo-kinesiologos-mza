## 1. Countdown

- [x] 1.1 Calcular `diffDias` en el Server Component: `Math.ceil((fechaInicio - ahora) / 86400000)`.
- [x] 1.2 Derivar el texto del countdown: "Ya comenzó" / "¡Hoy!" / "Mañana" / "Esta semana · Faltan N días" / "Faltan N días".
- [x] 1.3 Renderizar el badge de countdown debajo del título en el header, con color según urgencia (slate → blue → amber → red).

## 2. Barra de cupos

- [x] 2.1 Calcular `porcentajeOcupado` cuando `cupoMaximo` existe: `(inscripciones / cupoMaximo) * 100`.
- [x] 2.2 Derivar el color de la barra: verde < 60%, ámbar 60–85%, rojo > 85%.
- [x] 2.3 Reemplazar el texto de cupos en la grilla de detalles por la barra visual + texto "X de Y disponibles".

## 3. Link a Google Maps

- [x] 3.1 Construir `mapsUrl` con `encodeURIComponent(capacitacion.ubicacion)` solo si `modalidad !== "VIRTUAL"` y `ubicacion` tiene valor.
- [x] 3.2 Agregar el link "Ver en Maps →" junto al ítem de ubicación en la grilla, con `target="_blank" rel="noreferrer"`.

## 4. Datos bancarios inline

- [x] 4.1 Leer las env vars `NEXT_PUBLIC_CBU`, `NEXT_PUBLIC_ALIAS`, `NEXT_PUBLIC_TITULAR`, `NEXT_PUBLIC_WHATSAPP`, `NEXT_PUBLIC_PAGOS_EMAIL` en el Server Component.
- [x] 4.2 Renderizar el bloque de datos bancarios en el card CTA solo si `inscripcion?.estado === "PENDIENTE"` y `Number(capacitacion.costo) > 0`.
- [x] 4.3 El bloque incluye: CBU, Alias, Titular (seleccionables), botón WhatsApp y botón Email con los mismos textos que el modal de `BotonInscripcion`.
