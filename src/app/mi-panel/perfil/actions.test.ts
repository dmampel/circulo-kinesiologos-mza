import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Profesional, Especialidad } from '@prisma/client';

const mockGetUser = vi.fn();
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

vi.mock('@/lib/repositories/ProfesionalRepository', () => ({
  ProfesionalRepository: {
    update: vi.fn(),
    findByUserId: vi.fn(),
    findByMatricula: vi.fn(),
  },
}));

vi.mock('@/lib/repositories/LocalidadRepository', () => ({
  LocalidadRepository: {
    getAll: vi.fn(),
  },
}));

vi.mock('@/lib/repositories/EspecialidadRepository', () => ({
  EspecialidadRepository: {
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
import { EspecialidadRepository } from '@/lib/repositories/EspecialidadRepository';
import { updateDatosContacto } from './actions';

type ProfesionalConRelaciones = Awaited<ReturnType<typeof ProfesionalRepository.findByMatricula>>;

const mockUpdate = vi.mocked(ProfesionalRepository.update);
const mockGetAll = vi.mocked(LocalidadRepository.getAll);
const mockFindByMatricula = vi.mocked(ProfesionalRepository.findByMatricula);
const mockGetAllEspecialidades = vi.mocked(EspecialidadRepository.getAll);

function buildFormData(fields: Record<string, string | string[]>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (Array.isArray(v)) {
      for (const item of v) fd.append(k, item);
    } else {
      fd.set(k, v);
    }
  }
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
    mockGetAllEspecialidades.mockResolvedValue([
      { id: 'esp-1', nombre: 'Kinesiología Deportiva', createdAt: new Date() },
      { id: 'esp-2', nombre: 'Neurología', createdAt: new Date() },
    ] as unknown as Especialidad[]);
    mockFindByMatricula.mockResolvedValue(null);
    mockUpdate.mockResolvedValue({} as unknown as Profesional);
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

describe('updateDatosContacto — nombre, apellido y matrícula', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'auth-user-1' } } });
    mockGetAll.mockResolvedValue([]);
    mockGetAllEspecialidades.mockResolvedValue([]);
    mockFindByMatricula.mockResolvedValue(null);
    mockUpdate.mockResolvedValue({} as unknown as Profesional);
  });

  it('guarda nombre y apellido cuando vienen completos', async () => {
    const result = await updateDatosContacto(
      null,
      buildFormData({ nombre: 'Ana', apellido: 'Pérez' })
    );

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith(
      'auth-user-1',
      expect.objectContaining({ nombre: 'Ana', apellido: 'Pérez' })
    );
  });

  it('rechaza un nombre vacío', async () => {
    const result = await updateDatosContacto(null, buildFormData({ nombre: '  ' }));

    expect(result).toEqual({ success: false, error: 'El nombre es obligatorio.' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('guarda la matrícula cuando no colisiona con otro profesional', async () => {
    mockFindByMatricula.mockResolvedValue(null);

    const result = await updateDatosContacto(null, buildFormData({ matricula: '1234' }));

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith(
      'auth-user-1',
      expect.objectContaining({ matricula: '1234' })
    );
  });

  it('permite guardar la propia matrícula sin cambios', async () => {
    mockFindByMatricula.mockResolvedValue({ userId: 'auth-user-1' } as unknown as ProfesionalConRelaciones);

    const result = await updateDatosContacto(null, buildFormData({ matricula: '1234' }));

    expect(result).toEqual({ success: true });
  });

  it('rechaza una matrícula que ya usa otro profesional', async () => {
    mockFindByMatricula.mockResolvedValue({ userId: 'otro-user' } as unknown as ProfesionalConRelaciones);

    const result = await updateDatosContacto(null, buildFormData({ matricula: '1234' }));

    expect(result).toEqual({
      success: false,
      error: 'Esa matrícula ya está registrada por otro profesional.',
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('rechaza una matrícula con caracteres no permitidos', async () => {
    const result = await updateDatosContacto(null, buildFormData({ matricula: '12/34' }));

    expect(result).toEqual({
      success: false,
      error: 'La matrícula contiene caracteres no permitidos.',
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe('updateDatosContacto — especialidades', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'auth-user-1' } } });
    mockGetAll.mockResolvedValue([]);
    mockGetAllEspecialidades.mockResolvedValue([
      { id: 'esp-1', nombre: 'Kinesiología Deportiva', createdAt: new Date() },
      { id: 'esp-2', nombre: 'Neurología', createdAt: new Date() },
    ] as unknown as Especialidad[]);
    mockFindByMatricula.mockResolvedValue(null);
    mockUpdate.mockResolvedValue({} as unknown as Profesional);
  });

  it('guarda las especialidades elegidas cuando existen en el catálogo', async () => {
    const result = await updateDatosContacto(
      null,
      buildFormData({ especialidadesEnviadas: '1', especialidadIds: ['esp-1', 'esp-2'] })
    );

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith(
      'auth-user-1',
      expect.objectContaining({ especialidadIds: ['esp-1', 'esp-2'] })
    );
  });

  it('rechaza si no queda ninguna especialidad seleccionada', async () => {
    const result = await updateDatosContacto(
      null,
      buildFormData({ especialidadesEnviadas: '1' })
    );

    expect(result).toEqual({
      success: false,
      error: 'Tenés que elegir al menos una especialidad.',
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('rechaza un id de especialidad inexistente en el catálogo', async () => {
    const result = await updateDatosContacto(
      null,
      buildFormData({ especialidadesEnviadas: '1', especialidadIds: ['esp-inventada'] })
    );

    expect(result).toEqual({
      success: false,
      error: 'Una de las especialidades seleccionadas no es válida.',
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('no toca las especialidades si el widget no formó parte del submit', async () => {
    const result = await updateDatosContacto(null, buildFormData({ telefono: '261 4000000' }));

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith(
      'auth-user-1',
      expect.not.objectContaining({ especialidadIds: expect.anything() })
    );
  });
});
