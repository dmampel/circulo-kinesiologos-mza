## Purpose

Define cómo un admin carga, reemplaza y quita el logo de un beneficio KineClub, dónde queda almacenado, y cómo se muestra al público de forma que nunca aparezca una imagen rota.

## ADDED Requirements

### Requirement: Subida del logo como archivo
El sistema SHALL permitir que un admin adjunte el logo de un beneficio como archivo de imagen al crear o editar el beneficio; es la opción principal del formulario. El archivo MUST almacenarse en el bucket público propio `beneficios-logos` de Supabase Storage y `logo_url` MUST guardar la URL pública resultante.

#### Scenario: Alta con logo
- **GIVEN** un admin autenticado en `/admin/beneficios/nuevo`
- **WHEN** completa los campos obligatorios, elige un PNG de 500 KB como logo y guarda
- **THEN** el beneficio se crea, el archivo queda en el bucket `beneficios-logos` y `logo_url` es la URL pública de ese archivo

#### Scenario: Alta sin logo
- **GIVEN** un admin autenticado en `/admin/beneficios/nuevo`
- **WHEN** guarda sin elegir archivo
- **THEN** el beneficio se crea con `logo_url` vacío y no se sube nada a Storage

#### Scenario: Vista previa antes de guardar
- **WHEN** el admin elige un archivo válido
- **THEN** el formulario muestra la vista previa de la imagen elegida sin haberla subido todavía

### Requirement: Logo por URL pegada como alternativa
El formulario SHALL ofrecer un campo opcional para pegar la URL del logo. La URL MUST validarse en el servidor y aceptarse sólo con protocolo `https`. Si en el mismo envío llegan archivo y URL, el archivo MUST prevalecer y la URL se ignora. Debajo del campo MUST mostrarse el aviso genérico "Los links externos pueden dejar de funcionar (los de Instagram, Facebook o WhatsApp vencen en días). Recomendamos subir el archivo." Ningún dominio MUST bloquearse.

#### Scenario: Alta con URL pegada
- **WHEN** el admin no elige archivo, pega `https://empresa.com/logo.png` y guarda
- **THEN** el beneficio se crea con `logo_url` igual a esa URL y no se sube nada a Storage

#### Scenario: Archivo y URL a la vez
- **WHEN** el admin elige un archivo válido y además pega una URL
- **THEN** `logo_url` es la URL pública del archivo subido al bucket

#### Scenario: URL no https
- **WHEN** el admin pega `http://empresa.com/logo.png` o un texto que no es URL
- **THEN** la acción devuelve `{ success: false, error }` y no modifica el beneficio

#### Scenario: URL de Instagram
- **WHEN** el admin pega una URL de `cdninstagram.com`
- **THEN** se acepta (no se bloquea) y el aviso genérico bajo el campo sigue visible recomendando subir el archivo

### Requirement: Validación del archivo de logo
El sistema MUST aceptar sólo imágenes PNG, JPEG, WEBP o AVIF de hasta 2 MB. SVG MUST rechazarse. La validación MUST ocurrir en el navegador antes de enviar y MUST repetirse en el servidor. Ante un archivo inválido, la acción MUST devolver `{ success: false, error }` con un mensaje claro y no modificar el beneficio.

#### Scenario: Archivo demasiado grande
- **WHEN** el admin elige una imagen de 3 MB
- **THEN** el formulario muestra "El logo supera el tamaño máximo de 2 MB" y no permite enviarlo

#### Scenario: Tipo no permitido llega al servidor
- **GIVEN** una request que saltea la validación del navegador con un archivo SVG
- **WHEN** la server action la procesa
- **THEN** devuelve `{ success: false, error }` indicando los formatos aceptados, no sube nada y no modifica la base

### Requirement: Validación de los datos del beneficio
La creación y edición de un beneficio MUST validar sus campos en el servidor (empresa, descripción y descuento obligatorios; categoría obligatoria; enlace opcional con formato URL). Ante datos inválidos la acción MUST devolver `{ success: false, error }` sin escribir en base ni en Storage.

#### Scenario: Falta la empresa
- **WHEN** se envía el formulario con `empresa` vacío
- **THEN** la acción devuelve `{ success: false, error }` y no se sube ningún archivo

### Requirement: Reemplazo y quita del logo
Al editar, el admin SHALL poder conservar el logo actual, reemplazarlo (por archivo o por URL), o quitarlo. El logo actual MUST tomarse de la base, no del formulario. Al reemplazarlo o quitarlo, el logo anterior MUST borrarse del bucket sólo si pertenece a `beneficios-logos`; las URLs externas MUST ignorarse sin error. El borrado es best-effort: una falla de Storage MUST NOT impedir guardar el beneficio.

#### Scenario: Editar sin tocar el logo
- **GIVEN** un beneficio con logo
- **WHEN** el admin cambia sólo la descripción, deja vacíos archivo y URL, y guarda
- **THEN** `logo_url` no cambia y no se borra ni sube ningún archivo

#### Scenario: Conservar una URL externa legacy
- **GIVEN** un beneficio cuyo `logo_url` es una URL de Instagram cargada antes de este cambio
- **WHEN** el admin edita otro campo y guarda
- **THEN** `logo_url` conserva la URL externa

#### Scenario: Reemplazar el logo
- **GIVEN** un beneficio cuyo logo está en `beneficios-logos`
- **WHEN** el admin elige un archivo nuevo y guarda
- **THEN** `logo_url` apunta al archivo nuevo y el archivo anterior se borra del bucket

#### Scenario: Reemplazar un logo del bucket por una URL
- **GIVEN** un beneficio cuyo logo está en `beneficios-logos`
- **WHEN** el admin pega una URL https nueva sin elegir archivo y guarda
- **THEN** `logo_url` pasa a ser la URL pegada y el archivo anterior se borra del bucket

#### Scenario: Reemplazar una URL externa por un archivo
- **GIVEN** un beneficio cuyo `logo_url` es externo
- **WHEN** el admin sube un archivo y guarda
- **THEN** `logo_url` apunta al bucket y no se intenta borrar nada en Storage

#### Scenario: Quitar el logo
- **WHEN** el admin marca "Quitar logo" y guarda
- **THEN** `logo_url` queda vacío y, si el logo anterior era del bucket, se borra

#### Scenario: Falla el borrado del archivo viejo
- **GIVEN** Storage responde con error al borrar
- **WHEN** el admin reemplaza el logo
- **THEN** el beneficio se guarda igual con el logo nuevo y la acción devuelve `{ success: true }`

#### Scenario: Falla la base después de subir
- **GIVEN** la subida del archivo nuevo fue exitosa
- **WHEN** falla la escritura en la base
- **THEN** la acción devuelve `{ success: false, error }` y el archivo recién subido se borra del bucket (best-effort)

### Requirement: Borrado del logo al eliminar el beneficio
Al eliminar un beneficio, su logo MUST borrarse del bucket si pertenece a `beneficios-logos` (best-effort).

#### Scenario: Eliminar beneficio con logo propio
- **WHEN** el admin elimina un beneficio cuyo logo está en el bucket
- **THEN** el beneficio desaparece de la base y el archivo se borra del bucket

### Requirement: Sólo admins operan sobre logos
Subir, reemplazar o borrar logos MUST requerir sesión de admin. El bucket MUST ser de lectura pública y escritura sólo con service role.

#### Scenario: Usuario no admin
- **WHEN** un usuario sin rol admin invoca la acción de crear o actualizar beneficio
- **THEN** la acción no sube archivos ni modifica la base

### Requirement: Visualización pública con fallback
La home y `/kineclub` MUST mostrar el logo del beneficio y, si la imagen no carga (URL vencida, archivo borrado, error de red), MUST reemplazarla por el ícono genérico en lugar de mostrar una imagen rota.

#### Scenario: Logo externo vencido
- **GIVEN** un beneficio cuyo `logo_url` es una URL de Instagram ya vencida
- **WHEN** un visitante abre la home
- **THEN** la tarjeta muestra el ícono genérico, no una imagen rota

#### Scenario: Logo propio
- **GIVEN** un beneficio con logo en `beneficios-logos`
- **WHEN** un visitante abre `/kineclub`
- **THEN** la tarjeta muestra la imagen del logo

### Requirement: Infraestructura y migración manuales
La creación del bucket y la migración de logos externos existentes MUST realizarse con scripts que ejecuta manualmente una persona. El script de setup MUST ser idempotente y verificar que el bucket es público. El script de migración MUST correr en modo simulación por defecto y escribir sólo con un flag explícito.

#### Scenario: Setup corrido dos veces
- **WHEN** se ejecuta el script de setup con el bucket ya creado
- **THEN** informa que ya existe, no lo recrea y vuelve a verificar el acceso público

#### Scenario: Migración en simulación
- **WHEN** se ejecuta el script de migración sin `--aplicar`
- **THEN** lista qué beneficios migraría y cuáles tienen la URL ya vencida, sin subir archivos ni modificar la base

#### Scenario: Logo externo ya vencido durante la migración
- **WHEN** la descarga de un logo externo falla
- **THEN** el script lo reporta y deja ese beneficio sin cambios para que un admin suba el logo a mano
