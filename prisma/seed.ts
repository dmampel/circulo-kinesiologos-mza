import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  const dataPath = path.join(process.cwd(), '../resources/data_seed.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const { localidades, especialidades, profesionales } = JSON.parse(rawData);

  console.log(`📊 Cargando ${localidades.length} localidades...`);
  for (const loc of localidades as string[]) {
    await prisma.localidad.upsert({
      where: { nombre: loc },
      update: {},
      create: { nombre: loc },
    });
  }

  console.log(`📊 Cargando ${especialidades.length} especialidades...`);
  for (const spec of especialidades as string[]) {
    if (spec === 'UBICACIÓN') continue;
    await prisma.especialidad.upsert({
      where: { nombre: spec },
      update: {},
      create: { nombre: spec },
    });
  }

  console.log(`📊 Cargando ${profesionales.length} profesionales...`);
  for (const p of profesionales) {
    const slug = p.full_name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    try {
      await prisma.profesional.upsert({
        where: { matricula: p.matricula },
        update: {},
        create: {
          wp_id: p.wp_id,
          nombre: p.nombre,
          apellido: p.apellido,
          full_name: p.full_name,
          email: p.email || null,
          matricula: p.matricula,
          dni: p.dni,
          telefono: p.telefono,
          whatsapp: p.whatsapp,
          direccion: p.direccion,
          horarios: p.horarios,
          foto_url: p.foto_url,
          slug: slug,
          status: 'ACTIVO',
          role: 'PROFESIONAL',
          localidad: {
            connect: { nombre: (p.localidades as string[])[0] || 'CIUDAD' }
          },
          especialidades: {
            connect: (p.especialidades as string[])
              .filter((s: string) => s !== 'UBICACIÓN')
              .map((s: string) => ({ nombre: s }))
          }
        },
      });
    } catch (error: any) {
      console.error(`❌ Error con ${p.full_name}:`, error.message);
    }
  }

  const CATEGORIAS_NOTICIA = [
    { nombre: "Institucional", slug: "institucional", icono: "Building2", color: "blue" },
    { nombre: "Eventos", slug: "eventos", icono: "Calendar", color: "orange" },
    { nombre: "Capacitación", slug: "capacitacion", icono: "GraduationCap", color: "green" },
    { nombre: "Convenios", slug: "convenios", icono: "Handshake", color: "purple" },
  ];

  console.log(`📊 Cargando ${CATEGORIAS_NOTICIA.length} categorías de noticias...`);
  const categoriasMap: Record<string, string> = {};
  for (const cat of CATEGORIAS_NOTICIA) {
    const created = await prisma.categoriaNoticia.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    categoriasMap[cat.slug] = created.id;
  }

  const NOTICIAS = [
    {
      titulo: "Nuevo Convenio con Obra Social de Mendoza",
      contenido: "Se ha firmado un acuerdo histórico que mejora los honorarios profesionales para todos nuestros asociados a partir del próximo mes.",
      resumen: "Se ha firmado un acuerdo histórico que mejora los honorarios profesionales para todos nuestros asociados a partir del próximo mes.",
      publicada_en: new Date("2026-05-01"),
      slug: "nuevo-convenio-obra-social-mendoza",
      categoriaId: categoriasMap["convenios"],
    },
    {
      titulo: "Curso de Especialización en Kinesiología Deportiva",
      contenido: "Inscripciones abiertas para el nuevo ciclo de capacitaciones 2026 con certificación internacional. Cupos limitados.",
      resumen: "Inscripciones abiertas para el nuevo ciclo de capacitaciones 2026 con certificación internacional. Cupos limitados.",
      publicada_en: new Date("2026-04-28"),
      slug: "curso-especializacion-kinesiologia-deportiva",
      categoriaId: categoriasMap["capacitacion"],
    },
    {
      titulo: "Asamblea General Ordinaria: Convocatoria",
      contenido: "Invitamos a todos los socios a participar de la próxima asamblea para tratar el balance anual y nuevos proyectos del Círculo.",
      resumen: "Invitamos a todos los socios a participar de la próxima asamblea para tratar el balance anual y nuevos proyectos del Círculo.",
      publicada_en: new Date("2026-04-15"),
      slug: "asamblea-general-ordinaria-convocatoria",
      categoriaId: categoriasMap["institucional"],
    }
  ];

  console.log(`📊 Cargando ${NOTICIAS.length} noticias...`);
  for (const n of NOTICIAS) {
    await prisma.noticia.upsert({
      where: { slug: n.slug },
      update: {},
      create: {
        ...n,
        publicada: true,
      },
    });
  }

  // Seed Comision Directiva
  const profs = await prisma.profesional.findMany({ take: 7 });
  if (profs.length >= 7) {
    console.log('📊 Cargando Comisión Directiva...');
    const cargos = [
      "Presidente", "Vicepresidente/a", "Secretario/a", 
      "Tesorero/a", "1° Vocal Titular", "2° Vocal Titular", "Vocal Suplente"
    ];

    for (let i = 0; i < cargos.length; i++) {
      await prisma.autoridad.upsert({
        where: { id: `seed-autoridad-${i}` },
        update: {
          cargo: cargos[i],
          orden: i,
          profesionalId: profs[i].id
        },
        create: {
          id: `seed-autoridad-${i}`,
          cargo: cargos[i],
          orden: i,
          profesionalId: profs[i].id
        }
      });
    }
  }

  console.log('✅ Seed completado con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
