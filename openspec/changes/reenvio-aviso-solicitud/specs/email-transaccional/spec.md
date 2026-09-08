## ADDED Requirements

### Requirement: Reenvío manual del aviso institucional

El sistema SHALL permitir volver a emitir el aviso institucional completo de una solicitud de asociación ya persistida, a demanda, desde el detalle de esa solicitud en el panel administrativo.

El aviso reenviado SHALL tener el mismo contenido y la misma estructura que el aviso automático descrito en "Aviso institucional completo de nueva solicitud": los mismos datos del solicitante con etiqueta legible, los mismos enlaces a documentación, y la misma acción de WhatsApp hacia la dueña del producto. No SHALL existir una segunda plantilla: un cambio en el aviso automático SHALL reflejarse idénticamente en el reenviado.

El destinatario SHALL ser siempre la casilla institucional (`INSTITUTIONAL_EMAIL`). El destinatario NO SHALL ser configurable desde la interfaz ni derivarse de la sesión de quien dispara la acción.

Los datos del aviso SHALL leerse de la solicitud persistida —sus columnas propias y su snapshot `datos`— en el momento del reenvío. NO SHALL usarse valores de ejemplo, marcadores de posición ni datos de otra solicitud.

#### Scenario: Reenvío de una solicitud vieja con la plantilla actual

- **GIVEN** una solicitud persistida antes de que el aviso institucional incluyera todos los datos y la documentación
- **AND** la configuración de mail es válida
- **WHEN** un administrador dispara el reenvío del aviso para esa solicitud
- **THEN** el sistema SHALL enviar a `INSTITUTIONAL_EMAIL` un aviso con la plantilla vigente
- **AND** el cuerpo SHALL contener nombre, apellido, matrícula, email, DNI/CUIL, teléfono, dirección, localidad y especialidad(es) de esa solicitud
- **AND** SHALL incluir la acción de WhatsApp con el nombre, apellido y matrícula de ese solicitante

#### Scenario: La solicitud no existe

- **GIVEN** un identificador que no corresponde a ninguna solicitud
- **WHEN** se dispara el reenvío
- **THEN** el sistema NO SHALL enviar ningún mail
- **AND** SHALL informar que la solicitud no fue encontrada

#### Scenario: Datos ausentes en el snapshot de una solicitud vieja

- **GIVEN** una solicitud cuyo snapshot no declara algún campo (por ejemplo, teléfono o dirección)
- **WHEN** se dispara el reenvío
- **THEN** el aviso SHALL enviarse igualmente
- **AND** el campo ausente SHALL mostrarse como no especificado, sin exponer valores internos ni dejar la etiqueta vacía

---

### Requirement: El reenvío está disponible en cualquier estado de la solicitud

El reenvío del aviso institucional SHALL poder dispararse para una solicitud en cualquiera de sus estados: pendiente, aprobada o rechazada. El estado de la solicitud NO SHALL ser una condición de habilitación.

La razón es que el aviso es informativo y no muta nada: reenviarlo sobre una solicitud ya resuelta no altera su resolución, y el caso de uso que motiva la funcionalidad —recuperar el aviso de una solicitud vieja— aplica tanto a solicitudes pendientes como a ya procesadas.

Esto contrasta deliberadamente con la aprobación y el rechazo, que SHALL seguir restringidos al estado pendiente porque sí mutan la solicitud y notifican al solicitante.

#### Scenario: Reenvío sobre una solicitud pendiente

- **GIVEN** una solicitud en estado pendiente
- **WHEN** un administrador dispara el reenvío
- **THEN** el sistema SHALL enviar el aviso institucional

#### Scenario: Reenvío sobre una solicitud ya resuelta

- **GIVEN** una solicitud ya aprobada o ya rechazada
- **WHEN** un administrador dispara el reenvío
- **THEN** el sistema SHALL enviar el aviso institucional igualmente
- **AND** NO SHALL rechazar la operación por el estado de la solicitud

---

### Requirement: El reenvío no muta la solicitud ni notifica al solicitante

El reenvío del aviso institucional SHALL ser una operación de sólo lectura sobre el dominio: NO SHALL modificar el estado de la solicitud, NO SHALL registrar fecha de revisión, NO SHALL crear ni alterar profesionales, identidades de autenticación ni ningún otro registro.

El reenvío SHALL enviar exactamente un mail, a la casilla institucional. NO SHALL enviar mail al solicitante, ni a la dueña del producto, ni a ninguna otra casilla: el aviso a la dueña del producto sigue siendo el mensaje de WhatsApp que administración decide disparar desde el mail.

Reenviar dos veces el mismo aviso SHALL ser seguro: el único efecto de un doble disparo es un segundo mail idéntico, sin consecuencias sobre los datos. La interfaz SHALL evitar el doble disparo accidental, pero el sistema NO SHALL requerir un guard de idempotencia en el servidor.

#### Scenario: Estado de la solicitud tras el reenvío

- **GIVEN** una solicitud en cualquier estado
- **WHEN** se dispara el reenvío y el mail se envía con éxito
- **THEN** el estado de la solicitud SHALL permanecer igual que antes de la operación
- **AND** su fecha de revisión SHALL permanecer igual que antes de la operación

#### Scenario: Un solo destinatario por reenvío

- **GIVEN** una solicitud persistida
- **WHEN** se dispara el reenvío
- **THEN** el sistema SHALL enviar exactamente un mail
- **AND** el único destinatario SHALL ser `INSTITUTIONAL_EMAIL`

#### Scenario: Doble disparo

- **GIVEN** una solicitud persistida
- **WHEN** se dispara el reenvío dos veces
- **THEN** el sistema SHALL enviar dos mails de igual contenido
- **AND** los datos de la solicitud SHALL permanecer inalterados

---

### Requirement: Enlaces frescos a la documentación real en cada reenvío

Cada reenvío SHALL generar enlaces firmados **nuevos** para los documentos que esa persona subió efectivamente a Storage, con la misma vigencia extendida que usa el aviso automático. NO SHALL reutilizar enlaces de un envío anterior, que a esa altura pueden estar vencidos.

Los enlaces SHALL apuntar a los documentos reales de esa solicitud. Un documento que la persona nunca adjuntó NO SHALL figurar como enlace.

El bucket que aloja la documentación SHALL seguir siendo privado; el reenvío NO SHALL cambiar su visibilidad ni las políticas de acceso.

#### Scenario: Reenvío de una solicitud con su documentación completa

- **GIVEN** una solicitud cuyos documentos están en Storage
- **WHEN** se dispara el reenvío
- **THEN** el aviso SHALL incluir un enlace por documento adjuntado, con su etiqueta funcional
- **AND** cada enlace SHALL abrir el documento sin requerir sesión en el sitio

#### Scenario: Un documento ya no existe en el bucket

- **GIVEN** una solicitud cuyo snapshot referencia un documento que fue borrado o movido en Storage
- **WHEN** se dispara el reenvío
- **THEN** el aviso SHALL enviarse igualmente con el resto de la información
- **AND** ese documento SHALL indicarse como no disponible, con la instrucción de revisarlo desde el panel administrativo

#### Scenario: Storage no responde

- **GIVEN** una solicitud persistida
- **WHEN** el servicio de Storage falla al firmar los enlaces
- **THEN** el reenvío SHALL informar el fallo a quien lo disparó
- **AND** NO SHALL modificar la solicitud

#### Scenario: Vigencia de los enlaces reenviados

- **GIVEN** un aviso reenviado
- **WHEN** se abre un enlace después de vencida su vigencia
- **THEN** Storage SHALL rechazar el acceso
- **AND** un nuevo reenvío SHALL producir enlaces vigentes otra vez

---

### Requirement: El reenvío es una operación exclusiva de administradores

La acción de reenvío SHALL exigir una sesión autenticada con rol de administrador, con el mismo control de acceso que protege el resto del panel administrativo. La verificación SHALL ocurrir en el servidor, antes de leer la solicitud y antes de cualquier envío.

Una petición sin sesión o con una sesión sin rol de administrador NO SHALL producir ningún mail ni exponer dato alguno de la solicitud.

#### Scenario: Petición sin sesión

- **GIVEN** una petición de reenvío sin sesión autenticada
- **WHEN** llega al servidor
- **THEN** SHALL rechazarse
- **AND** NO SHALL enviarse ningún mail

#### Scenario: Petición con sesión sin rol de administrador

- **GIVEN** una petición de reenvío de un usuario autenticado que no es administrador
- **WHEN** llega al servidor
- **THEN** SHALL rechazarse
- **AND** NO SHALL revelarse ningún dato de la solicitud

---

### Requirement: El reenvío informa su resultado sin romper el panel

El reenvío SHALL devolver un resultado explícito de éxito o de fallo. Ningún fallo —configuración de mail incompleta, error de Storage, rechazo del proveedor de mail, solicitud inexistente— SHALL propagarse como una excepción no controlada que rompa la página de detalle.

Si la configuración de mail no es válida, el sistema NO SHALL intentar el envío y SHALL informar que el envío de mails está deshabilitado, en lugar de reportar un éxito falso.

Si el proveedor de mail rechaza el envío, el resultado SHALL ser un fallo explícito: el reenvío es una acción deliberada de un administrador que espera confirmación, y a diferencia del aviso automático del registro NO SHALL fallar en silencio.

#### Scenario: Envío de mails deshabilitado

- **GIVEN** una configuración de mail incompleta
- **WHEN** un administrador dispara el reenvío
- **THEN** el sistema NO SHALL intentar enviar el mail
- **AND** SHALL informar que el envío está deshabilitado

#### Scenario: El proveedor de mail rechaza el envío

- **GIVEN** una solicitud persistida y una configuración de mail válida
- **WHEN** el proveedor de mail devuelve error
- **THEN** el reenvío SHALL informar el fallo a quien lo disparó
- **AND** la página de detalle SHALL seguir operativa

#### Scenario: Reenvío exitoso

- **GIVEN** una solicitud persistida y una configuración de mail válida
- **WHEN** el envío se completa sin error
- **THEN** el sistema SHALL informar el éxito a quien lo disparó

---

### Requirement: Los nombres de localidad y especialidad se resuelven igual en todos los avisos

Los identificadores internos de localidad y de especialidad NO SHALL aparecer nunca en un aviso institucional, sea automático o reenviado: se muestran resueltos a su nombre.

La resolución SHALL producir el mismo texto para la misma solicitud, sea cual sea el camino que originó el aviso. Una solicitud reenviada SHALL mostrar la misma localidad y las mismas especialidades que mostró —o habría mostrado— su aviso automático, salvo que esos catálogos hayan cambiado en la base entre ambos envíos.

La resolución SHALL contemplar las solicitudes viejas, que declaran una única especialidad en lugar de una lista, y las que declaran nombres en lugar de identificadores.

Si la resolución falla o no encuentra correspondencia, el aviso SHALL enviarse igual mostrando ese campo como no especificado.

#### Scenario: Solicitud con formato viejo de especialidad

- **GIVEN** una solicitud creada cuando el formulario guardaba una sola especialidad en lugar de una lista
- **WHEN** se dispara el reenvío
- **THEN** el aviso SHALL mostrar el nombre de esa especialidad
- **AND** NO SHALL mostrar su identificador interno

#### Scenario: Solicitud con varias especialidades

- **GIVEN** una solicitud que declara varias especialidades
- **WHEN** se dispara el reenvío
- **THEN** el aviso SHALL mostrar los nombres de todas ellas en un texto legible

#### Scenario: La localidad ya no existe en el catálogo

- **GIVEN** una solicitud cuya localidad fue eliminada del catálogo
- **WHEN** se dispara el reenvío
- **THEN** el aviso SHALL enviarse igualmente
- **AND** la localidad SHALL mostrarse como no especificada, sin exponer el identificador
