import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  const dataPath = path.join(process.cwd(), '../data_seed.json');
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
