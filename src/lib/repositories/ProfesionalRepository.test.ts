import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfesionalRepository } from './ProfesionalRepository';

vi.mock('@/lib/prisma', () => ({
  default: {
    profesional: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    domicilioAdicional: { deleteMany: vi.fn(), createMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import prisma from '@/lib/prisma';

const mockFindUnique = vi.mocked(prisma.profesional.findUnique);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProfesionalRepository.findByEmail', () => {
  it('retorna el profesional cuando el email existe', async () => {
    const profesionalMock = {
      id: 'prof-1',
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@example.com',
      matricula: '12345',
      localidad: { id: 'loc-1', nombre: 'Mendoza' },
      especialidades: [],
    };
    mockFindUnique.mockResolvedValue(profesionalMock as any);

    const result = await ProfesionalRepository.findByEmail('juan@example.com');

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { email: 'juan@example.com' },
      include: { localidad: true, especialidades: true },
    });
    expect(result).toEqual(profesionalMock);
  });

  it('normaliza el email a minúsculas antes de buscar', async () => {
    mockFindUnique.mockResolvedValue(null);
    await ProfesionalRepository.findByEmail('JUAN@EXAMPLE.COM');
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'juan@example.com' } })
    );
  });
});

describe('ProfesionalRepository.findByMatricula', () => {
  it('retorna null cuando la matrícula no existe', async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await ProfesionalRepository.findByMatricula('99999');
    expect(result).toBeNull();
  });

  it('retorna el profesional cuando la matrícula existe', async () => {
    const profesionalMock = { id: 'prof-1', matricula: '12345' };
    mockFindUnique.mockResolvedValue(profesionalMock as any);
    const result = await ProfesionalRepository.findByMatricula('12345');
    expect(result).toEqual(profesionalMock);
  });
});

describe('ProfesionalRepository.findPaginated — domicilios adicionales', () => {
  it('filtra por localidad en el domicilio principal O en los adicionales', async () => {
    vi.mocked(prisma.profesional.count).mockResolvedValue(0);
    vi.mocked(prisma.profesional.findMany).mockResolvedValue([]);

    await ProfesionalRepository.findPaginated(1, 24, { localidadId: 'loc-2' });

    const where = vi.mocked(prisma.profesional.findMany).mock.calls[0][0]!.where as any;
    expect(where.AND).toContainEqual({
      OR: [{ localidadId: 'loc-2' }, { domiciliosAdicionales: { some: { localidadId: 'loc-2' } } }],
    });
  });
});

describe('ProfesionalRepository.setDomiciliosAdicionales', () => {
  it('reemplaza los domicilios en una transacción', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([] as any);
    await ProfesionalRepository.setDomiciliosAdicionales('prof-1', [
      { direccion: 'Av. Colón 1', localidadId: 'loc-2' },
    ]);
    expect(prisma.domicilioAdicional.deleteMany).toHaveBeenCalledWith({ where: { profesionalId: 'prof-1' } });
    expect(prisma.domicilioAdicional.createMany).toHaveBeenCalledWith({
      data: [{ profesionalId: 'prof-1', direccion: 'Av. Colón 1', localidadId: 'loc-2' }],
    });
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
