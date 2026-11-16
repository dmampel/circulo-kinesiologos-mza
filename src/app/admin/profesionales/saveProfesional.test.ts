import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  default: {
    profesional: { update: vi.fn(), create: vi.fn() },
    localidad: { findMany: vi.fn() },
  },
}));
vi.mock('@/lib/repositories/ProfesionalRepository', () => ({
  ProfesionalRepository: { setDomiciliosAdicionales: vi.fn() },
}));
vi.mock('@/lib/supabase/admin', () => ({ supabaseAdmin: {} }));
vi.mock('@/utils/supabase/require-admin', () => ({ requireAdmin: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/resend', () => ({ getResend: vi.fn(), canSendEmails: vi.fn(), FROM_EMAIL: 'x' }));

import prisma from '@/lib/prisma';
import { ProfesionalRepository } from '@/lib/repositories/ProfesionalRepository';
import { saveProfesional } from './actions';

const base = { id: 'prof-1', nombre: 'Ana', apellido: 'García', matricula: '1', localidadId: 'loc-1' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.profesional.update).mockResolvedValue({ id: 'prof-1' } as any);
  vi.mocked(prisma.profesional.create).mockResolvedValue({ id: 'prof-2' } as any);
  vi.mocked(prisma.localidad.findMany).mockResolvedValue([{ id: 'loc-1' }, { id: 'loc-2' }] as any);
});

describe('saveProfesional — domicilios adicionales', () => {
  it('guarda los adicionales al editar', async () => {
    const items = [{ direccion: 'Colón 1', localidadId: 'loc-2' }];
    const res = await saveProfesional({ ...base, domiciliosAdicionales: JSON.stringify(items) }, []);
    expect(res.success).toBe(true);
    expect(ProfesionalRepository.setDomiciliosAdicionales).toHaveBeenCalledWith('prof-1', items);
  });

  it('usa el id del profesional recién creado', async () => {
    const items = [{ direccion: 'Colón 1', localidadId: 'loc-2' }];
    await saveProfesional(
      { ...base, id: undefined, domiciliosAdicionales: JSON.stringify(items) },
      []
    );
    expect(ProfesionalRepository.setDomiciliosAdicionales).toHaveBeenCalledWith('prof-2', items);
  });

  it('rechaza localidades inválidas sin escribir', async () => {
    const res = await saveProfesional(
      { ...base, domiciliosAdicionales: JSON.stringify([{ direccion: 'X', localidadId: 'nope' }]) },
      []
    );
    expect(res.success).toBe(false);
    expect(prisma.profesional.update).not.toHaveBeenCalled();
  });

  it('no toca adicionales si no vienen en el input', async () => {
    await saveProfesional(base, []);
    expect(ProfesionalRepository.setDomiciliosAdicionales).not.toHaveBeenCalled();
  });
});
