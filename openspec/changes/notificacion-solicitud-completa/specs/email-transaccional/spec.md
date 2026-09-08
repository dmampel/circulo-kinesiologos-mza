## ADDED Requirements

### Requirement: Aviso institucional completo de nueva solicitud

El sistema SHALL enviar a la casilla institucional (`INSTITUTIONAL_EMAIL`) un aviso autosuficiente por cada solicitud de asociación guardada con éxito. "Autosuficiente" significa que quien lo recibe SHALL poder leer la solicitud entera y abrir su documentación **sin iniciar sesión en el sitio**, porque el personal de administración no tiene rol `admin` en el panel.

El aviso SHALL incluir, con etiqueta legible, todos los datos declarados por el solicitante: nombre, apellido, matrícula, email, DNI/CUIL, teléfono, dirección, localidad y especialidad(es).

Los identificadores internos (IDs de localidad y de especialidad) NO SHALL aparecer en el mail: se muestran resueltos a su nombre. Si la resolución de un nombre falla, el aviso SHALL enviarse igual, indicando ese campo como no disponible.

Todo dato provisto por el solicitante SHALL escaparse antes de incorporarse al cuerpo HTML del aviso, de modo que ningún valor de texto libre pueda alterar la estructura del mensaje.

#### Scenario: Solicitud creada con envío de mails habilitado

- **GIVEN** una solicitud de asociación válida, con sus datos y documentos ya persistidos
- **AND** la configuración de mail es válida (`canSendEmails()` devuelve `true`)
- **WHEN** `crearSolicitud` guarda la solicitud sin errores
- **THEN** el sistema SHALL enviar un aviso a `INSTITUTIONAL_EMAIL`
- **AND** el cuerpo SHALL contener nombre, apellido, matrícula, email, DNI/CUIL, teléfono, dirección, localidad y especialidad(es) del solicitante

#### Scenario: No se puede resolver el nombre de localidad o especialidad

- **GIVEN** una solicitud cuya localidad o especialidad no puede resolverse a un nombre legible
- **WHEN** se arma el aviso institucional
- **THEN** el aviso SHALL enviarse igualmente
- **AND** el campo afectado SHALL mostrarse como no disponible en lugar de exponer el identificador interno

#### Scenario: Un dato del solicitante contiene markup

- **GIVEN** un solicitante cuya dirección o nombre incluye caracteres con significado en HTML
- **WHEN** se arma el aviso institucional
- **THEN** ese valor SHALL aparecer como texto literal en el mail
- **AND** NO SHALL alterar la estructura ni los enlaces del mensaje

#### Scenario: Envío de mails deshabilitado

- **GIVEN** una configuración de mail incompleta (`canSendEmails()` devuelve `false`)
- **WHEN** `crearSolicitud` guarda la solicitud sin errores
- **THEN** el sistema NO SHALL intentar enviar el aviso institucional
- **AND** la solicitud SHALL quedar creada igual

---

### Requirement: Enlaces a la documentación desde el aviso institucional

El aviso institucional SHALL incluir un enlace por cada documento adjuntado a la solicitud, identificado por su etiqueta funcional (Fotocopia DNI, Título Universitario, Constancia CUIT/IIBB, Póliza Mala Praxis, Curriculum Vitae, Matrícula Provincial, y los opcionales Superintendencia de Salud y Habilitación Consultorio).

El bucket de Storage que aloja esa documentación es **privado** —contiene DNI, título, seguro y CV de personas reales— y NO SHALL volverse público para resolver este requisito. Los enlaces SHALL ser enlaces firmados de vigencia acotada, generados en el momento del envío.

La vigencia SHALL ser lo bastante larga para cubrir el tiempo real de revisión administrativa (varios días) y lo bastante corta para que el enlace deje de servir una vez cerrada esa ventana. Vencida la firma, el enlace SHALL dejar de dar acceso al documento.

Los documentos opcionales no adjuntados NO SHALL figurar como enlaces rotos: SHALL omitirse o marcarse explícitamente como no adjuntados.

#### Scenario: Solicitud con los seis documentos obligatorios

- **GIVEN** una solicitud creada con sus seis documentos obligatorios en Storage
- **WHEN** se envía el aviso institucional
- **THEN** el aviso SHALL incluir seis enlaces, uno por documento, con su etiqueta funcional
- **AND** cada enlace SHALL abrir el documento sin requerir sesión en el sitio ni credenciales de Supabase

#### Scenario: Solicitud con documentos opcionales adjuntados

- **GIVEN** una solicitud que además adjuntó documentación opcional
- **WHEN** se envía el aviso institucional
- **THEN** el aviso SHALL incluir también un enlace por cada documento opcional presente

#### Scenario: Solicitud sin los documentos opcionales

- **GIVEN** una solicitud que no adjuntó documentación opcional
- **WHEN** se envía el aviso institucional
- **THEN** el aviso NO SHALL incluir enlaces vacíos ni rotos para esos documentos

#### Scenario: Storage no puede firmar los enlaces

- **GIVEN** una solicitud válida
- **WHEN** el servicio de Storage falla o no puede firmar uno o más documentos
- **THEN** el aviso institucional SHALL enviarse igualmente con el resto de la información
- **AND** los documentos sin enlace SHALL indicarse como no disponibles, con la instrucción de revisarlos desde el panel administrativo
- **AND** la creación de la solicitud NO SHALL fallar

#### Scenario: Enlace vencido

- **GIVEN** un aviso institucional enviado y sus enlaces firmados
- **WHEN** se abre un enlace después de vencida su vigencia
- **THEN** Storage SHALL rechazar el acceso al documento
- **AND** la documentación SHALL seguir siendo accesible desde el panel administrativo, que firma sus propios enlaces por request

---

### Requirement: Aviso a la dueña del producto por WhatsApp click-to-chat

El aviso institucional SHALL incluir una acción de WhatsApp que le permita a administración avisarle a la dueña del producto que hay una solicitud nueva para aprobar, sin salir del mail.

Esa acción SHALL ser un enlace `wa.me` de click-to-chat hacia el número de la dueña del producto, con un mensaje pre-cargado que identifique al solicitante por nombre, apellido y matrícula. El mensaje SHALL viajar codificado para URL, de modo que acentos, espacios y signos de puntuación lleguen intactos al cliente de WhatsApp.

El envío SHALL ser manual: el sistema NO SHALL enviar mensajes de WhatsApp por su cuenta, NO SHALL integrar la WhatsApp Business API, y NO SHALL incorporar dependencias para esto. Es un enlace que administración decide tocar.

La dueña del producto NO SHALL recibir por mail los datos completos ni la documentación de la solicitud: su única vía de aviso es este mensaje de WhatsApp.

#### Scenario: Aviso institucional con la acción de WhatsApp

- **GIVEN** una solicitud creada de una persona con nombre, apellido y matrícula
- **WHEN** se envía el aviso institucional
- **THEN** el aviso SHALL incluir un enlace `wa.me` al número de la dueña del producto
- **AND** el mensaje pre-cargado SHALL nombrar al solicitante y su matrícula
- **AND** el mensaje SHALL estar codificado para URL

#### Scenario: Datos del solicitante con acentos o caracteres especiales

- **GIVEN** un solicitante cuyo nombre o apellido lleva acentos, eñes o espacios
- **WHEN** se arma el enlace de WhatsApp
- **THEN** el enlace SHALL seguir siendo un URL válido
- **AND** al abrirlo, el mensaje SHALL mostrarse con esos caracteres correctos

#### Scenario: La dueña del producto no recibe el mail

- **GIVEN** una solicitud creada
- **WHEN** se ejecutan los envíos de mail del registro
- **THEN** el sistema SHALL enviar exactamente dos mails: el aviso institucional y la confirmación al solicitante
- **AND** NO SHALL enviar un tercer mail con los datos de la solicitud a ninguna otra casilla

---

### Requirement: El aviso institucional nunca bloquea el registro

Un fallo en cualquier parte del armado o del envío del aviso institucional —resolución de nombres, firma de enlaces en Storage, o el envío mismo— NO SHALL impedir que la solicitud quede creada ni que el solicitante reciba su confirmación.

#### Scenario: El proveedor de mail rechaza el aviso institucional

- **GIVEN** una solicitud ya persistida
- **WHEN** el envío del aviso institucional devuelve error
- **THEN** el sistema SHALL continuar con la confirmación al solicitante
- **AND** `crearSolicitud` SHALL devolver `{ success: true }`

#### Scenario: Falla la firma de enlaces antes del envío

- **GIVEN** una solicitud ya persistida
- **WHEN** la generación de enlaces firmados lanza un error
- **THEN** el error SHALL quedar contenido
- **AND** `crearSolicitud` SHALL devolver `{ success: true }`
