/**
 * Armado del aviso institucional de nueva solicitud de asociación.
 *
 * Es deliberadamente puro — recibe todos los datos ya resueltos (localidad,
 * especialidades, URLs firmadas, links) y devuelve `{ subject, html }` listo
 * para `resend.emails.send`. Sin I/O, sin Prisma, sin Storage, sin Resend:
 * sigue el mismo precedente que `src/lib/solicitudes/ficha.ts`. Testeable de
 * verdad — se le pasa un objeto y se afirma sobre el string resultante.
 */

/**
 * Escapa los cinco caracteres con significado en HTML. El `&` va primero
 * para no volver a escapar las entidades que produce el resto de los
 * reemplazos (evita el doble escape tipo `&amp;amp;`).
 */
export function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type DatosAvisoInstitucional = {
  nombre: string;
  apellido: string;
  matricula: string;
  email: string;
  dni: string;
  telefono: string;
  direccion: string;
  /** Ya resuelta desde `localidadId`, o el marcador de "no disponible". */
  localidad: string;
  /** Ya resueltas desde los IDs de especialidad. */
  especialidades: string;
  documentos: Array<{ label: string; url?: string }>;
  whatsappUrl: string;
};

/** Fila de dato del solicitante: etiqueta/valor, con el valor ya escapado. */
function filaDato(etiqueta: string, valor: string): string {
  return `<p style="margin: 6px 0;"><strong>${etiqueta}:</strong> ${escaparHtml(valor)}</p>`;
}

function bloqueDocumentos(documentos: DatosAvisoInstitucional["documentos"]): string {
  const filas = documentos
    .map((documento) => {
      const label = escaparHtml(documento.label);
      if (documento.url) {
        return `<p style="margin: 6px 0;"><a href="${documento.url}" style="color: #2563eb;">${label}</a></p>`;
      }
      return `<p style="margin: 6px 0; color: #64748b;">${label}: no disponible — revisar en el panel</p>`;
    })
    .join("\n");

  return `
    <h2 style="font-size: 16px; margin: 24px 0 8px;">Documentación</h2>
    ${filas}
  `;
}

/**
 * Construye el aviso institucional de nueva solicitud. `datos` llega con
 * todo ya resuelto: no hace ninguna llamada a Prisma, Storage ni Resend.
 */
export function construirAvisoInstitucional(
  datos: DatosAvisoInstitucional,
): { subject: string; html: string } {
  const subject = `Nueva Solicitud de Asociación: ${datos.nombre} ${datos.apellido}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
      <div style="background: #0f172a; padding: 20px; color: white; text-align: center;">
        <h1 style="margin: 0;">Nueva Solicitud</h1>
      </div>
      <div style="padding: 30px;">
        <p>Se ha recibido una nueva solicitud de ingreso al Círculo:</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        ${filaDato("Nombre y apellido", `${datos.nombre} ${datos.apellido}`)}
        ${filaDato("Matrícula", datos.matricula)}
        ${filaDato("Email", datos.email)}
        ${filaDato("DNI/CUIL", datos.dni)}
        ${filaDato("Teléfono", datos.telefono)}
        ${filaDato("Dirección", datos.direccion)}
        ${filaDato("Localidad", datos.localidad)}
        ${filaDato("Especialidad(es)", datos.especialidades)}
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        ${bloqueDocumentos(datos.documentos)}
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <h2 style="font-size: 16px; margin: 24px 0 8px;">Acciones</h2>
        <p style="margin: 0 0 10px;">Una vez aprobada la documentación, avisale a Delfina para darlo de alta en la web:</p>
        <a href="${datos.whatsappUrl}"
           style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
          Avisar por WhatsApp
        </a>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #64748b; font-size: 12px;">
          Los enlaces a la documentación vencen a los 7 días de este envío. Pasado ese plazo, la documentación
          sigue disponible desde el panel administrativo.
        </p>
      </div>
      <div style="background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
        Este es un mensaje automático del sistema de gestión de Círculo Kinesiólogos.
      </div>
    </div>
  `;

  return { subject, html };
}
