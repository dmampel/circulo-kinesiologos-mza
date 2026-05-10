# Delta for profesional-data-access

## ADDED Requirements

### Requirement: Actualización de Datos del Profesional por userId

El `ProfesionalRepository` DEBE exponer un método `update(userId, data)` que permita
modificar los campos de contacto y foto de un profesional identificado por su `userId` de Supabase Auth.

Los campos actualizables a través de este método DEBEN ser:
`telefono`, `whatsapp`, `direccion`, `horarios`, `foto_url`.

El método DEBE usar `userId` (no `id`) como clave de lookup para garantizar
que solo el usuario autenticado pueda modificar su propio registro.

#### Scenario: Actualización exitosa de datos de contacto

- GIVEN un `userId` válido correspondiente a un profesional activo
- WHEN se llama a `ProfesionalRepository.update(userId, { telefono: "2614000000" })`
- THEN el repositorio actualiza el campo en la base de datos y retorna el profesional actualizado

#### Scenario: Actualización de foto_url

- GIVEN una URL pública de Supabase Storage válida
- WHEN se llama a `ProfesionalRepository.update(userId, { foto_url: "https://..." })`
- THEN el campo `foto_url` del profesional queda actualizado en la base de datos

#### Scenario: userId inexistente

- GIVEN un `userId` que no corresponde a ningún profesional
- WHEN se llama a `ProfesionalRepository.update(userId, data)`
- THEN el repositorio lanza un error (Prisma P2025 — record not found)
