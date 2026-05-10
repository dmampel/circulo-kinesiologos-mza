# socio-perfil-autogestion Specification

## Purpose

Define el comportamiento del módulo de autogestión de perfil del socio,
que permite al profesional colegiado actualizar sus datos de contacto
y foto de perfil desde el portal privado `/mi-panel/perfil`.

## Requirements

### Requirement: Visualización de Datos Actuales

El sistema DEBE cargar y mostrar los datos actuales del profesional al ingresar a `/mi-panel/perfil`.

Los datos mostrados DEBEN incluir: `telefono`, `whatsapp`, `direccion`, `horarios` y `foto_url`.
Los campos de solo lectura (nombre, apellido, matrícula, especialidades) DEBEN mostrarse
pero NO ser editables por el socio.

#### Scenario: Acceso exitoso al perfil

- GIVEN un profesional autenticado con datos existentes en la base de datos
- WHEN navega a `/mi-panel/perfil`
- THEN el sistema muestra un formulario con sus datos actuales pre-completados

#### Scenario: Acceso sin datos opcionales

- GIVEN un profesional autenticado cuyos campos opcionales están vacíos
- WHEN navega a `/mi-panel/perfil`
- THEN el sistema muestra el formulario con los campos vacíos, sin errores

---

### Requirement: Actualización de Datos de Contacto

El sistema DEBE permitir al socio actualizar `telefono`, `whatsapp`, `direccion` y `horarios`.

La actualización DEBE estar restringida al profesional autenticado (validar `userId` en la Server Action).
El sistema NO DEBE permitir actualizar campos institucionales (nombre, matricula, especialidades).

#### Scenario: Actualización exitosa

- GIVEN un socio logueado en `/mi-panel/perfil`
- WHEN edita su teléfono y hace submit
- THEN el sistema persiste el cambio y muestra un mensaje de éxito
- AND los nuevos datos se reflejan en el Padrón Público sin acción adicional

#### Scenario: Submit sin cambios

- GIVEN un socio en `/mi-panel/perfil`
- WHEN hace submit sin modificar ningún campo
- THEN el sistema guarda sin error (idempotente)

#### Scenario: Intento de actualización no autorizada

- GIVEN una petición que modifica datos de otro profesional (userId distinto)
- WHEN la Server Action procesa el submit
- THEN el sistema rechaza la operación y retorna error de autorización

---

### Requirement: Actualización de Foto de Perfil

El sistema DEBE permitir subir una foto de perfil en formato JPG, PNG o WebP.

El archivo DEBE tener un tamaño máximo de 2MB.
La foto DEBE almacenarse en Supabase Storage (bucket `profesionales-fotos`).
Tras el upload exitoso, el campo `foto_url` del profesional DEBE actualizarse con la URL pública.

#### Scenario: Upload exitoso de foto

- GIVEN un socio logueado con una imagen válida (< 2MB, formato permitido)
- WHEN sube la imagen desde el formulario
- THEN el sistema la almacena en Storage, actualiza `foto_url` en la DB
- AND el Carnet Digital muestra la nueva foto sin recargar manualmente

#### Scenario: Archivo demasiado grande

- GIVEN una imagen mayor a 2MB
- WHEN el socio intenta subirla
- THEN el sistema rechaza el upload antes de enviarlo a Storage
- AND muestra un mensaje: "La imagen no puede superar los 2MB"

#### Scenario: Formato no permitido

- GIVEN un archivo que no es JPG, PNG ni WebP
- WHEN el socio intenta subirlo
- THEN el sistema rechaza el upload y muestra un mensaje de formato inválido

---

### Requirement: Invalidación de Caché Post-Actualización

Tras cualquier actualización exitosa (datos de contacto o foto), el sistema DEBE
invalidar la caché de las rutas `/mi-panel`, `/mi-panel/perfil` y la ruta pública
del profesional en el Padrón.

#### Scenario: Datos actualizados reflejados en el dashboard

- GIVEN un socio que actualizó su foto
- WHEN regresa a `/mi-panel`
- THEN el Carnet Digital muestra la foto nueva sin necesidad de un hard refresh
