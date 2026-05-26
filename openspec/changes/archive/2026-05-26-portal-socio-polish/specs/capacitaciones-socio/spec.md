## MODIFIED Requirements

### Requirement: Cards de cartelera enlazan a la página de detalle
Las cards de la cartelera de capacitaciones SHALL mostrar el costo formateado con locale `es-AR` (punto como separador de miles), usando `toLocaleString("es-AR")`. El formato deberá mostrar `$2.000` en lugar de `$2,000`.

#### Scenario: Precio con miles se formatea correctamente
- **WHEN** una capacitación tiene `costo = 2000`
- **THEN** la card muestra `$2.000`

#### Scenario: Precio cero o gratuito
- **WHEN** una capacitación tiene `costo = 0` o `costo = null`
- **THEN** la card muestra "Gratuito" o `$0` según el componente existente
