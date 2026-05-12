# Circular Read Tracking Specification

## Purpose

Permitir el seguimiento del estado de lectura de las circulares institucionales por parte de los profesionales asociados, mejorando la comunicación y la gestión de la información.

## Requirements

### Requirement: Registro de Lectura

El sistema MUST registrar automáticamente cuando un profesional visualiza el detalle de una circular publicada. Solo se debe registrar la lectura si la circular está en estado "publicada".

#### Scenario: Profesional lee una circular por primera vez
- GIVEN un profesional autenticado
- AND una circular con ID "circ-1" que está "publicada"
- AND el profesional NO ha leído la circular "circ-1" previamente
- WHEN el profesional accede al detalle de la circular "circ-1"
- THEN el sistema MUST registrar una nueva entrada de lectura para el profesional y la circular "circ-1" con el timestamp actual.

#### Scenario: Profesional lee una circular ya leída
- GIVEN un profesional autenticado
- AND una circular con ID "circ-1" ya marcada como leída por este profesional
- WHEN el profesional accede al detalle de la circular "circ-1"
- THEN el sistema SHOULD NOT crear un nuevo registro de lectura (puede actualizar el timestamp o simplemente ignorar).

### Requirement: Conteo de Circulares No Leídas

El sistema MUST proporcionar un conteo preciso de las circulares que están marcadas como "publicadas" pero que el profesional actual no ha leído todavía.

#### Scenario: Cálculo de badge de notificaciones
- GIVEN que existen 5 circulares "publicadas" en total
- AND el profesional ha leído 2 de esas circulares
- WHEN el sistema solicita el conteo de no leídas para este profesional
- THEN el sistema MUST retornar el valor 3.

### Requirement: Indicación Visual de Estado

El sistema MUST permitir distinguir visualmente entre circulares leídas y no leídas en cualquier listado destinado al socio.

#### Scenario: Visualización en listado de circulares
- GIVEN una lista de circulares publicadas
- WHEN el socio visualiza la lista
- THEN cada circular que NO tenga un registro de lectura para el socio actual MUST mostrar un indicador de "Nuevo" o resaltado visual (negrita, punto azul).
- AND las circulares ya leídas MUST mostrarse con un estilo estándar (leído).
