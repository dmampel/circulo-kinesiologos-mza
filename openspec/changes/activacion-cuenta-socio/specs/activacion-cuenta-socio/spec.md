## Purpose

Define el estado "activación completada" de la cuenta de un socio: cuándo una cuenta pasa a estar realmente en manos de su dueño, cómo el portal lo exige antes de dar acceso, y cómo se reconcilian las cuentas creadas antes de que ese estado existiera.

## ADDED Requirements

### Requirement: Estado de activación de la cuenta

El sistema SHALL registrar de forma explícita y persistente el momento en que un socio define su propia contraseña. Una cuenta se considera **activada** si y sólo si existe esa marca. Abrir el enlace del email, tener sesión válida, o figurar como `ACTIVO` en el padrón NO constituyen activación.

La marca SHALL grabarse en la misma operación que la contraseña, de modo que sea imposible que una quede escrita sin la otra.

#### Scenario: El socio guarda su contraseña por primera vez

- **GIVEN** un socio con sesión válida obtenida desde el enlace de invitación o de recuperación
- **AND** su cuenta no tiene marca de activación
- **WHEN** envía el formulario de `/auth/set-password` con una contraseña válida
- **THEN** el sistema SHALL guardar la contraseña y la marca de activación en una única operación contra el proveedor de autenticación
- **AND** la marca SHALL contener el instante de la activación en formato ISO-8601 UTC
- **AND** el socio SHALL ser redirigido a `/mi-panel`

#### Scenario: Falla el guardado de la contraseña

- **GIVEN** un socio en `/auth/set-password`
- **WHEN** el proveedor de autenticación rechaza la operación (contraseña repetida, contraseña corta, sesión vencida, o error desconocido)
- **THEN** el sistema NO SHALL registrar la marca de activación
- **AND** SHALL redirigir a `/auth/set-password` con el código de error correspondiente
- **AND** la cuenta SHALL permanecer como no activada

#### Scenario: Un socio ya activado cambia su contraseña

- **GIVEN** una cuenta que ya tiene marca de activación
- **WHEN** su dueño define una contraseña nueva desde el flujo de recuperación
- **THEN** el sistema SHALL conservar la marca de activación original sin pisarla
- **AND** NO SHALL alterar ningún otro dato del perfil del socio

#### Scenario: La marca no es un control de autorización

- **GIVEN** que la marca de activación vive en metadata que el propio usuario puede escribir con su token
- **WHEN** un socio la escribe por su cuenta sin definir contraseña
- **THEN** el sistema SHALL seguir negándole el ingreso por `/login`, porque no tiene contraseña con la cual autenticarse
- **AND** la marca SHALL entenderse como una guía de experiencia y una métrica, nunca como una frontera de seguridad

### Requirement: Acceso al portal condicionado a la activación

El sistema SHALL impedir el acceso a `/mi-panel` y a todas sus subrutas a un usuario con sesión válida cuya cuenta no esté activada, redirigiéndolo a `/auth/set-password` para que complete el paso que le falta.

La verificación SHALL aplicarse en el borde de la request (antes de renderizar) y SHALL repetirse en el límite del segmento del portal, de modo que ninguna ruta ni acción de servidor bajo `/mi-panel` quede sin cubrir.

#### Scenario: Socio sin activar intenta entrar al portal

- **GIVEN** un socio con sesión válida y sin marca de activación
- **WHEN** navega a `/mi-panel` o a cualquier subruta (`/mi-panel/circulares`, `/mi-panel/perfil`, etc.)
- **THEN** el sistema SHALL redirigirlo a `/auth/set-password`
- **AND** NO SHALL renderizar ningún dato del portal

#### Scenario: Socio activado entra normalmente

- **GIVEN** un socio con sesión válida y con marca de activación
- **WHEN** navega a `/mi-panel` o a cualquier subruta
- **THEN** el sistema SHALL permitirle el acceso sin ninguna redirección adicional

#### Scenario: La pantalla de activación queda fuera del guard

- **GIVEN** un socio sin activar que fue redirigido a `/auth/set-password`
- **WHEN** el sistema procesa esa request
- **THEN** `/auth/set-password` NO SHALL estar sujeta al guard de activación
- **AND** NO SHALL producirse un ciclo de redirecciones entre el portal y la pantalla de activación

#### Scenario: Sin sesión, la falta de sesión manda

- **GIVEN** un visitante sin sesión
- **WHEN** navega a `/mi-panel`
- **THEN** el sistema SHALL redirigirlo a `/login`, como ya lo hace hoy
- **AND** el guard de activación NO SHALL evaluarse, porque no hay cuenta que evaluar

#### Scenario: Los administradores quedan exentos

- **GIVEN** un usuario cuyo rol administrativo está declarado en la metadata de aplicación de su cuenta
- **WHEN** navega a `/mi-panel` sin marca de activación
- **THEN** el sistema NO SHALL aplicarle el guard
- **AND** SHALL permitirle el acceso

Un administrador nunca atraviesa el flujo de activación de socio, y dejarlo afuera del panel por una marca que su flujo jamás escribe es un riesgo de bloqueo sin contrapartida.

#### Scenario: La activación recién hecha se ve en la misma navegación

- **GIVEN** un socio que acaba de guardar su contraseña
- **WHEN** es redirigido a `/mi-panel`
- **THEN** el sistema SHALL leer el estado de activación desde el proveedor de autenticación y no desde una copia cacheada del token
- **AND** el socio SHALL entrar sin ser devuelto a `/auth/set-password`

### Requirement: Reconciliación de las cuentas anteriores al change

El sistema SHALL proveer un procedimiento idempotente que marque como activadas a todas las cuentas que ya tienen una contraseña propia, antes de que el guard entre en vigencia.

La decisión SHALL basarse en la existencia de una contraseña en el proveedor de autenticación, que es la única señal concluyente. Una invitación nunca deja contraseña; sólo la deja quien completó la activación. NO SHALL usarse la heurística de comparación de timestamps del diagnóstico, que tiene falsos positivos conocidos.

#### Scenario: Cuenta con contraseña y sin marca

- **GIVEN** una cuenta de autenticación con contraseña definida
- **AND** sin marca de activación
- **WHEN** se ejecuta el procedimiento de reconciliación
- **THEN** el sistema SHALL escribirle la marca de activación
- **AND** SHALL usar como instante la última modificación conocida de la cuenta
- **AND** SHALL dejar registrado que esa marca fue inferida y no medida

#### Scenario: Cuenta sin contraseña

- **GIVEN** una cuenta invitada que nunca definió contraseña
- **WHEN** se ejecuta el procedimiento de reconciliación
- **THEN** el sistema NO SHALL escribirle la marca
- **AND** esa cuenta SHALL quedar sujeta al guard, que es el resultado buscado

#### Scenario: Segunda ejecución

- **GIVEN** que el procedimiento ya se ejecutó una vez
- **WHEN** se lo vuelve a ejecutar
- **THEN** NO SHALL modificar ninguna cuenta que ya tenga marca
- **AND** SHALL reportar cero cambios sobre esas cuentas

#### Scenario: Ensayo previo sin escritura

- **WHEN** el procedimiento se ejecuta en modo de ensayo
- **THEN** SHALL informar cuántas cuentas modificaría y cuáles
- **AND** NO SHALL escribir nada en el proveedor de autenticación

#### Scenario: El guard no entra en vigencia antes de la reconciliación

- **GIVEN** un socio que ya activó correctamente su cuenta antes de este change
- **WHEN** el guard queda activo
- **THEN** ese socio SHALL entrar al portal sin ser redirigido
- **AND** el despliegue SHALL ordenarse de modo que ninguna cuenta con contraseña quede sin marca mientras el guard está activo

### Requirement: Visibilidad administrativa del estado real de activación

El panel administrativo de invitaciones SHALL distinguir a quien **abrió el enlace** de quien **completó la activación**, y SHALL ofrecer el reenvío del enlace para ambos casos incompletos.

#### Scenario: Socio que abrió el enlace pero no guardó contraseña

- **GIVEN** una cuenta con ingreso registrado y sin marca de activación
- **WHEN** un administrador consulta el panel de invitaciones
- **THEN** el sistema SHALL mostrarla en un estado propio, distinto de "Activado" y distinto de "En limbo"
- **AND** SHALL explicar en la interfaz que esa persona entró pero no tiene contraseña
- **AND** SHALL ofrecer la acción de reenviar el enlace de activación

#### Scenario: Socio con contraseña propia

- **GIVEN** una cuenta con marca de activación
- **WHEN** un administrador consulta el panel de invitaciones
- **THEN** el sistema SHALL mostrarla como "Activado"

#### Scenario: Socio invitado que nunca entró

- **GIVEN** una cuenta invitada sin ingreso registrado y sin marca de activación
- **WHEN** un administrador consulta el panel de invitaciones
- **THEN** el sistema SHALL mostrarla como "En limbo", conservando el significado que ese estado ya tenía

#### Scenario: El resumen refleja los estados nuevos

- **WHEN** un administrador abre el panel de invitaciones
- **THEN** el conteo de activados SHALL incluir únicamente cuentas con marca de activación
- **AND** SHALL exponerse el conteo del estado nuevo como métrica propia

#### Scenario: Cuenta huérfana

- **GIVEN** un profesional vinculado a una cuenta de autenticación que ya no existe
- **WHEN** un administrador consulta el panel
- **THEN** el sistema SHALL seguir mostrándola como "Huérfano" y no SHALL clasificarla por activación

#### Scenario: El estado de padrón no se confunde con el de cuenta

- **GIVEN** un profesional con `Profesional.status` igual a `ACTIVO` y sin marca de activación
- **WHEN** un administrador consulta cualquiera de los dos paneles
- **THEN** el sistema SHALL presentarlos como dos estados independientes
- **AND** NO SHALL derivar uno del otro

### Requirement: Ausencia de cambios de esquema y de RLS

La marca de activación SHALL almacenarse en la metadata de usuario del proveedor de autenticación. El sistema NO SHALL introducir tablas, columnas ni enums nuevos en la base gestionada por el ORM.

#### Scenario: No se requiere migración

- **WHEN** se implementa este change
- **THEN** NO SHALL existir ninguna modificación del esquema del ORM
- **AND** NO SHALL requerirse habilitar Row Level Security sobre ninguna tabla nueva
- **AND** el estado de activación SHALL leerse siempre desde el proveedor de autenticación, nunca desde una copia en la base de la aplicación

#### Scenario: Lectura administrativa con privilegios elevados

- **GIVEN** que la metadata de otras cuentas no es accesible con la sesión de un socio
- **WHEN** el panel administrativo necesita el estado de activación de todo el padrón
- **THEN** SHALL obtenerlo mediante el cliente administrativo de service role, que no está sujeto a RLS
- **AND** ese cliente NO SHALL exponerse nunca al navegador
