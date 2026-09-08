## Context

Ver `proposal.md — Why` para la motivación. Lo que importa para el diseño es el estado actual del código:

- `crearSolicitud` (`src/app/registro/actions.ts`, líneas ~199-296) persiste la solicitud y, dentro del mismo `try`, dispara dos mails con `resend.emails.send`, cada uno con su HTML **inline como template literal** y su propio `try/catch` vacío. El institucional interpola cuatro campos crudos y linkea a `${SITE_URL}/admin/solicitudes`.
- El bucket `solicitudes` **es privado**. Está verificado en código: `src/lib/storage/solicitudes.ts` lo documenta explícitamente ("nunca debe servirse por URL pública") y `src/app/admin/solicitudes/[id]/page.tsx` firma sus enlaces por request. En todo el repo, `getPublicUrl` sólo se usa contra `noticias-imagenes`, `circulares` y avatares de perfil — nunca contra `solicitudes`. **No hace falta averiguar nada más: los enlaces del mail tienen que ser firmados.**
- Ya existe el helper `firmarUrlsDocumentos(paths): Promise<Record<string,string>>` con `SIGNED_URL_TTL_SEGUNDOS = 3600`, que usa `createSignedUrls` (plural, un solo round-trip) y nunca lanza: si Storage falla devuelve `{}`.
- Ya existe el catálogo `DOCUMENTOS_SOLICITUD` en `src/lib/solicitudes/ficha.ts`: id + label de los 8 documentos, en orden, compartido por la pantalla de detalle y la ficha exportable.
- `crearSolicitud` ya resuelve los nombres de especialidad best-effort con `prisma.especialidad.findMany`; la localidad, en cambio, sólo existe como `localidadId`.
- Hay tests con Vitest en `src/app/registro/actions.test.ts` y `src/lib/storage/solicitudes.test.ts`, con `@/lib/resend` y `@/lib/supabase/admin` mockeados.

Restricciones: sin cambios de schema Prisma, sin migraciones Supabase, sin RLS nueva, sin dependencias nuevas. Nivel de gobernanza MEDIUM.

## Goals / Non-Goals

**Goals:**

- Que el HTML del aviso institucional se arme en una función **pura y testeable**, fuera del server action: hoy es un template literal de 25 líneas embebido en la lógica de persistencia, y va a triplicar su tamaño.
- Que los enlaces a documentos funcionen desde un cliente de correo sin sesión, sin abrir el bucket.
- Que ninguna de las piezas nuevas (resolución de localidad, firma de enlaces, armado del HTML) pueda hacer fallar la creación de la solicitud.
- Reutilizar lo que ya existe: `firmarUrlsDocumentos`, `DOCUMENTOS_SOLICITUD`.

**Non-Goals:**

- Rediseñar el mail de confirmación al solicitante (queda tal cual, aunque el helper de escape aplique después a ambos si se quiere).
- Introducir React Email, MJML o cualquier motor de plantillas. El proyecto arma HTML a mano y este change no es el lugar para cambiar eso.
- Mover los envíos de mail a una cola o a un job en background.
- Cualquier automatización de WhatsApp.

## Decisions

### D1. Enlaces firmados, no bucket público. Vigencia 7 días.

**Decisión:** los enlaces del mail se generan con `createSignedUrls` y vigencia de **7 días** (`60 * 60 * 24 * 7 = 604800` segundos).

**Por qué no bucket público:** el bucket guarda DNI, título universitario, constancia de CUIT, póliza y CV de personas reales. Hacerlo público expone esa documentación a cualquiera que adivine o enumere un path —y los paths son predecibles: `${matricula}-${key}-${timestamp}.${ext}`. Está descartado.

**Por qué 7 días y no 1 hora:** la vigencia actual (1 hora) es correcta para la pantalla de admin, que firma por request mientras el admin está mirando. Un enlace que viaja por mail se abre cuando administración abre el mail, que puede ser al otro día o el lunes siguiente. Una hora garantiza que el mail llegue ya roto.

**Trade-off explícito, a confirmar con la dueña del producto:** un enlace firmado es un **portador** — quien tenga la URL entra, sin autenticación. Durante 7 días, cualquiera que reciba, reenvíe o intercepte el mail puede abrir el DNI del solicitante. Es exactamente el precio de que administración pueda trabajar sin acceso al panel. Alternativas descartadas: 24 h (rompe si la solicitud llega un viernes), 30 días (ventana de exposición desproporcionada), y "enlace al panel con login para administración" (es el problema que este change viene a resolver, no una alternativa).

**Implementación:** `firmarUrlsDocumentos` pasa a aceptar la vigencia como segundo parámetro con default en el valor actual, para no tocar al llamador existente:

```ts
export const SIGNED_URL_TTL_SEGUNDOS = 60 * 60;              // panel admin, sin cambios
export const SIGNED_URL_TTL_EMAIL_SEGUNDOS = 60 * 60 * 24 * 7; // enlaces que viajan por mail

export async function firmarUrlsDocumentos(
  paths: string[],
  ttlSegundos: number = SIGNED_URL_TTL_SEGUNDOS,
): Promise<Record<string, string>>
```

Se conserva la garantía de "nunca lanza": si Storage falla, devuelve `{}` y el mail sale con los documentos marcados como no disponibles.

**Nota Supabase:** `createSignedUrls` se ejecuta con `supabaseAdmin` (service role), que bypasea RLS de Storage. No hace falta política nueva ni cambio de configuración del bucket. La vigencia máxima de una signed URL de Supabase Storage no está acotada por debajo de 7 días, así que el valor es válido.

### D2. El HTML del mail institucional sale a un módulo puro

**Decisión:** nuevo módulo `src/lib/emails/solicitud-institucional.ts` que exporta

```ts
export type DatosAvisoInstitucional = {
  nombre: string; apellido: string; matricula: string; email: string;
  dni: string; telefono: string; direccion: string;
  localidad: string;        // ya resuelta, o el marcador de "no disponible"
  especialidades: string;   // ya resueltas
  documentos: Array<{ label: string; url?: string }>;
  panelUrl: string;
  whatsappUrl: string;
};

export function construirAvisoInstitucional(datos: DatosAvisoInstitucional): {
  subject: string;
  html: string;
};
```

Recibe todo ya resuelto — no hace I/O, no toca Prisma, Storage ni Resend. Sigue el precedente de `src/lib/solicitudes/ficha.ts`, que es explícitamente puro por el mismo motivo. Testeable de verdad: se le pasa un objeto y se afirma sobre el string.

**Alternativa descartada:** dejar el template literal creciendo dentro de `crearSolicitud`. Un HTML de ~60 líneas con condicionales por documento dentro de un server action no se puede testear sin mockear medio módulo, y ya hoy la función es larga.

### D3. Escape de HTML de los valores del solicitante

**Decisión:** una función `escaparHtml(valor: string): string` que reemplaza `& < > " '` por sus entidades, aplicada a **todo** valor de origen externo antes de interpolarlo. Vive junto al módulo del mail (o en `src/lib/utils`, si se prefiere compartirla).

**Por qué:** el código actual interpola `${nombre}`, `${email}`, etc. sin escapar. Con cuatro campos era tolerable; sumando dirección y teléfono —texto libre que el solicitante controla— alcanza para meter un `<a>` o cerrar el layout del mail. No es XSS de navegador, pero sí manipulación del contenido que administración lee para decidir una aprobación. Costo: una función de cinco líneas.

**Ojo con el orden:** las URLs firmadas y la URL de WhatsApp ya vienen URL-encodeadas; se escapan como atributo `href` (los `&` de la query string pasan a `&amp;`, que es lo correcto en HTML), pero **no** se les aplica `encodeURIComponent` una segunda vez.

### D4. Link de WhatsApp: helper puro, número como constante documentada

**Decisión:** nuevo módulo `src/lib/whatsapp.ts`:

```ts
/** Número de la dueña del producto, en formato E.164 sin `+` como exige wa.me. */
export const WHATSAPP_ADMINISTRACION = "5492616937588";

export function construirLinkWhatsApp(numero: string, mensaje: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export function mensajeNuevaSolicitud(nombre: string, apellido: string, matricula: string): string {
  return `Hola Delfina, llegó una solicitud nueva de ${nombre} ${apellido} (matrícula ${matricula}), ¿la aprobamos?`;
}
```

`encodeURIComponent` sobre el mensaje completo es lo que hace que acentos, eñes, espacios, coma y signos de interrogación lleguen bien. El número va como constante y no como env var: es un dato estable y no secreto, y meterlo en el entorno agrega una variable más que puede quedar vacía en producción y romper el enlace en silencio — el mismo problema que `src/lib/resend.ts` documenta haber sufrido. Sigue el patrón de `EMAIL_INSTITUCIONAL` en `src/lib/site.ts`: constante con comentario que explica por qué está ahí.

### D5. Localidad resuelta best-effort, en el mismo round-trip que las especialidades

**Decisión:** agregar `prisma.localidad.findUnique({ where: { id: localidadId }, select: { nombre: true } })` al bloque `try` best-effort que ya resuelve especialidades, ejecutándolo en el mismo `Promise.all`. Si falla o no existe, la localidad va como `"No especificada"`, nunca como el UUID.

Un `findUnique` por id es una lectura trivial. **No pasa por el Repository Pattern**: es una resolución de nombre para presentación dentro del mismo server action que ya hace `prisma.especialidad.findMany` inline. Si en algún momento se crea `src/lib/repositories/localidades.ts`, esta llamada se muda ahí; abrir el repositorio sólo por este `findUnique` sería más ceremonia que valor.

### D6. Documentos: recorrer el catálogo, no el mapa de archivos

**Decisión:** el aviso itera `DOCUMENTOS_SOLICITUD` (orden y labels canónicos) y, para cada entrada, busca su path en `archivos[doc.id]`. Los que no tienen path se omiten si son opcionales; los obligatorios sin URL firmada se muestran con la leyenda "no disponible — revisar en el panel". Así el mail nunca queda con un `<a href="undefined">` ni delata al lector que faltó algo sin decirlo.

### Estructura del HTML (breakdown)

Mismo esqueleto visual que el mail actual —header oscuro, cuerpo blanco, footer gris; tabla de 600 px de ancho máximo con estilos inline, que es lo que sobrevive a los clientes de correo— con cuatro bloques dentro del cuerpo:

1. **Datos del solicitante** — filas etiqueta/valor: Nombre y apellido · Matrícula · Email · DNI/CUIL · Teléfono · Dirección · Localidad · Especialidad(es).
2. **Documentación** — una línea por documento del catálogo: label + enlace, o label + "no disponible".
3. **Acciones** — botón verde "Avisar por WhatsApp" (`whatsappUrl`) primero, botón azul "Ir al Panel de Control" (`panelUrl`) después, como vía secundaria para quien tenga acceso admin.
4. **Nota de vigencia** — línea al pie aclarando que los enlaces a la documentación vencen a los 7 días y que después hay que verla desde el panel.

Sin Tailwind, sin clases: estilos inline. Las reglas de responsive del proyecto (`rem`, sin px fijos) aplican a la UI del sitio, no al HTML de correo, donde los px inline son la práctica obligada.

## Risks / Trade-offs

- **Enlace firmado reenviable durante 7 días → ** mitigación: vigencia acotada (no permanente) y bucket que sigue privado; el mail va a una única casilla institucional; el pie del mail avisa que los enlaces vencen. Riesgo residual aceptado y explicitado a la dueña del producto (ver D1).
- **`createSignedUrls` agrega un round-trip a Storage dentro de `crearSolicitud` → ** mitigación: es una sola llamada para los 6-8 documentos (versión plural), va después del `prisma.solicitud.create`, y está envuelta en el `try/catch` del bloque de mails: si tarda o falla, la solicitud ya está guardada.
- **El número de WhatsApp queda hardcodeado; si cambia, hay que tocar código → ** mitigación: una constante única y documentada en `src/lib/whatsapp.ts`, con test que la afirma. Cambiarlo es una línea.
- **El mail crece y algún cliente de correo (Gmail) puede recortarlo → ** mitigación: el HTML se mantiene por debajo de los ~102 KB que dispara el "[Mensaje recortado]" de Gmail; con texto plano y enlaces no hay riesgo real, pero conviene no agregar imágenes embebidas.
- **`escaparHtml` aplicado de más rompería los `href` → ** mitigación: se escapan valores de texto, y los URLs se insertan ya construidos; queda cubierto por un test con un nombre que contenga `<` y otro con un mensaje de WhatsApp acentuado.

## Migration Plan

No hay migración: no hay estado que migrar ni datos que transformar. El cambio es efectivo para las solicitudes creadas a partir del deploy; las solicitudes anteriores ya notificadas no se re-notifican.

Rollback: revertir el commit. No quedan artefactos persistidos (las signed URLs son efímeras por definición y no se guardan en ningún lado).

Verificación post-deploy: crear una solicitud de prueba con un email real, confirmar que el aviso institucional llega completo, que los seis enlaces abren el documento en una ventana privada sin sesión, y que el botón de WhatsApp abre el chat con el mensaje pre-cargado y legible.

## Open Questions

- **Vigencia de 7 días:** el valor está decidido y justificado en D1, pero es una decisión de privacidad sobre documentación personal de terceros. Corresponde confirmarla con la dueña del producto antes del deploy; bajarla a 72 h o subirla a 14 días es un cambio de una constante y no altera specs, approach ni tareas.
