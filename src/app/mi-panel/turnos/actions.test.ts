import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
      }),
    },
  })),
}));

vi.mock('@/lib/repositories/ProfesionalRepository', () => ({
  ProfesionalRepository: {
    findByUserId: vi.fn().mockResolvedValue({ id: 'prof-123' }),
  },
}));

vi.mock('@/lib/repositories/TurnoRepository', () => ({
  TurnoRepository: {
    detectarSolapamiento: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

import { TurnoRepository } from '@/lib/repositories/TurnoRepository';
import { crearTurno } from './actions';

const mockDetectar = vi.mocked(TurnoRepository.detectarSolapamiento);
const mockCreate = vi.mocked(TurnoRepository.create);

function makeFormData(overrides: Record<string, string> = {}) {
  const data: Record<string, string> = {
    pacienteId: 'pac-1',
    fecha: '2026-06-10',
    hora: '10:00',
    duracion: '50',
    ...overrides,
  };
  return {
    get: (key: string) => data[key] ?? null,
  } as unknown as FormData;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreate.mockResolvedValue({ id: 'turno-nuevo' } as any);
});

describe('crearTurno', () => {
  it('retorna success:true con warning cuando hay solapamiento', async () => {
    mockDetectar.mockResolvedValue(true);

    const result = await crearTurno(makeFormData());

    expect(result).toMatchObject({ success: true, warning: expect.stringContaining('solapamiento') });
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it('retorna success:true sin warning cuando no hay solapamiento', async () => {
    mockDetectar.mockResolvedValue(false);

    const result = await crearTurno(makeFormData());

    expect(result).toEqual({ success: true });
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it('retorna error si faltan campos obligatorios', async () => {
    const result = await crearTurno(makeFormData({ pacienteId: '' }));
    expect(result).toMatchObject({ success: false, error: expect.any(String) });
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
