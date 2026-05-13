## ADDED Requirements

### Requirement: Secciones del home se animan al entrar en viewport
Cada sección del home público SHALL aparecer con una animación de fade-up al entrar en el viewport del usuario. La animación MUST ejecutarse una sola vez por visita de página.

#### Scenario: Usuario hace scroll hacia una sección
- **WHEN** el usuario hace scroll y una sección del home entra en el viewport
- **THEN** la sección aparece con una animación de fade-up (translateY + opacity)

#### Scenario: Sección ya visible al cargar
- **WHEN** el usuario carga la página y una sección ya está visible en el viewport inicial
- **THEN** la animación se dispara inmediatamente al montar el componente

#### Scenario: Segunda visita al mismo nodo
- **WHEN** el usuario hace scroll hacia arriba y luego vuelve a bajar
- **THEN** la animación NO se repite (once: true)

### Requirement: Grillas de cards aparecen con stagger
Las grillas de cards (noticias, KineClub, obras sociales, pillars) SHALL animar sus ítems con un stagger secuencial de 100ms entre cada uno.

#### Scenario: Grilla entra en viewport
- **WHEN** una grilla de cards entra en el viewport
- **THEN** cada card aparece con 100ms de delay respecto a la anterior, de izquierda a derecha / arriba hacia abajo

### Requirement: Stats del hero se cuentan desde cero
Los valores numéricos en `FloatingStatPills` SHALL animarse contando desde 0 hasta el valor real cuando los pills entran en viewport.

#### Scenario: Pills del hero entran en viewport
- **WHEN** los pills de estadísticas entran en el viewport por primera vez
- **THEN** los números cuentan progresivamente desde 0 hasta el valor real en ~1 segundo

### Requirement: Animaciones respetan prefers-reduced-motion
El sistema SHALL respetar la preferencia de accesibilidad `prefers-reduced-motion`. Si el usuario la tiene activada, las animaciones MUST ser instantáneas (sin transición).

#### Scenario: Usuario tiene prefers-reduced-motion: reduce
- **WHEN** el sistema detecta `prefers-reduced-motion: reduce`
- **THEN** los elementos aparecen sin animación, directamente en su estado final
