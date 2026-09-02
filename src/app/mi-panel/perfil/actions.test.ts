import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUser = vi.fn();
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

vi.mock('@/lib/repositories/ProfesionalRepository', () => ({
  ProfesionalRepository: {
    update: vi.fn(),
    findByUserId: vi.fn(),
  },
}));

vi.mock('@/lib/repositories/LocalidadRepository', () => ({
  LocalidadRepository: {
    getAll: vi.fn(),
  },
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: { storage: { from: vi.fn() } },
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

import { ProfesionalRepository } from '@/lib/repositories/ProfesionalRepository';
import { LocalidadRepository } from '@/lib/repositories/LocalidadRepository';
import { updateDatosContacto } from './actions';

const mockUpdate = vi.mocked(ProfesionalRepository.update);
const mockGetAll = vi.mocked(LocalidadRepository.getAll);

function buildFormData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe('updateDatosContacto — localidad', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'auth-user-1' } } });
    mockGetAll.mockResolvedValue([
      { id: 'loc-1', nombre: 'Mendoza', createdAt: new Date() },
      { id: 'loc-2', nombre: 'Godoy Cruz', createdAt: new Date() },
    ] as any);
    mockUpdate.mockResolvedValue({} as any);
  });

  it('guarda la localidad elegida cuando existe en el padrón', async () => {
    const result = await updateDatosContacto(
      null,
      buildFormData({ telefono: '261 4000000', localidadId: 'loc-2' })
    );

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith(
      'auth-user-1',
      expect.objectContaining({ localidadId: 'loc-2' })
    );
  });

  it('rechaza una localidad inexistente y no guarda nada', async () => {
    const result = await updateDatosContacto(
      null,
      buildFormData({ telefono: '261 4000000', localidadId: 'loc-inventada' })
    );

    expect(result).toEqual({
      success: false,
      error: 'La localidad seleccionada no es válida.',
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('no toca la localidad si el formulario no la envía', async () => {
    const result = await updateDatosContacto(
      null,
      buildFormData({ telefono: '261 4000000' })
    );

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith(
      'auth-user-1',
      expect.not.objectContaining({ localidadId: expect.anything() })
    );
  });
});
