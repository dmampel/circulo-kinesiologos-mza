import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  default: {
    solicitud: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    profesional: {
      create: vi.fn(),
      update: vi.fn(),
    },
    especialidad: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        inviteUserByEmail: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/repositories/ProfesionalRepository', () => ({
  ProfesionalRepository: {
    findByEmail: vi.fn(),
    findByMatricula: vi.fn(),
  },
}));

vi.mock('@/utils/supabase/require-admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/lib/resend', () => ({
  getResend: vi.fn(() => ({ emails: { send: vi.fn() } })),
  canSendEmails: vi.fn(() => false),
  FROM_EMAIL: 'noreply@test.com',
}));

import prisma from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ProfesionalRepository } from '@/lib/repositories/ProfesionalRepository';
import { requireAdmin } from '@/utils/supabase/require-admin';
import { gestionarSolicitud } from './actions';

const mockSolicitudFindUnique = vi.mocked(prisma.solicitud.findUnique);
const mockSolicitudUpdate = vi.mocked(prisma.solicitud.update);
const mockProfesionalCreate = vi.mocked(prisma.profesional.create);
const mockProfesionalUpdate = vi.mocked(prisma.profesional.update);
const mockEspecialidadFindMany = vi.mocked(prisma.especialidad.findMany);
const mockInvite = vi.mocked(supabaseAdmin.auth.admin.inviteUserByEmail);
const mockFindByEmail = vi.mocked(ProfesionalRepository.findByEmail);
const mockFindByMatricula = vi.mocked(ProfesionalRepository.findByMatricula);
const mockRequireAdmin = vi.mocked(requireAdmin);

const solicitudBase = {
  id: 'sol-1',
  nombre: 'Ana',
  apellido: 'García',
  email: 'ana@example.com',
  matricula: '5678',
  status: 'PENDIENTE',
  revisada_en: null,
  createdAt: new Date(),
  datos: {
    dni: '12345678',
    telefono: '2614000000',
    direccion: 'Calle 1',
    localidadId: 'loc-1',
    especialidades: ['esp-1'],
    archivos: {},
    fecha_solicitud: new Date().toISOString(),
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockEspecialidadFindMany.mockResolvedValue([]);
});

describe('gestionarSolicitud — RECHAZAR', () => {
  it('actualiza la solicitud a RECHAZADA y retorna success:true', async () => {
    mockSolicitudFindUnique.mockResolvedValue(solicitudBase as any);
    mockSolicitudUpdate.mockResolvedValue({ ...solicitudBase, status: 'RECHAZADA' } as any);

    const result = await gestionarSolicitud('sol-1', 'RECHAZAR');

    expect(mockSolicitudUpdate).toHaveBeenCalledWith({
      where: { id: 'sol-1' },
      data: expect.objectContaining({ status: 'RECHAZADA' }),
    });
    expect(result).toEqual({ success: true });
  });
});

describe('gestionarSolicitud — APROBAR', () => {
  it('retorna error si ya existe un profesional con el mismo email', async () => {
    mockSolicitudFindUnique.mockResolvedValue(solicitudBase as any);
    mockFindByEmail.mockResolvedValue({ id: 'prof-existente' } as any);
    mockFindByMatricula.mockResolvedValue(null);

    const result = await gestionarSolicitud('sol-1', 'APROBAR');

    expect(result).toEqual({
      success: false,
      error: expect.stringContaining(solicitudBase.email),
    });
    expect(mockProfesionalCreate).not.toHaveBeenCalled();
  });

  it('crea el profesional, actualiza la solicitud y retorna success:true', async () => {
    mockSolicitudFindUnique.mockResolvedValue(solicitudBase as any);
    mockFindByEmail.mockResolvedValue(null);
    mockFindByMatricula.mockResolvedValue(null);
    mockInvite.mockResolvedValue({
      data: { user: { id: 'auth-uuid' } },
      error: null,
    } as any);
    mockProfesionalCreate.mockResolvedValue({ id: 'prof-nuevo' } as any);
    mockSolicitudUpdate.mockResolvedValue({ ...solicitudBase, status: 'APROBADA' } as any);

    const result = await gestionarSolicitud('sol-1', 'APROBAR');

    expect(mockProfesionalCreate).toHaveBeenCalledOnce();
    expect(mockSolicitudUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'APROBADA' }) })
    );
    expect(result).toEqual({ success: true });
  });
});

describe('gestionarSolicitud — idempotencia', () => {
  /**
   * El caso real: la lista mostraba los botones tambien para solicitudes ya
   * resueltas, el admin volvio a hacer click y el solicitante recibio dos
   * veces el mail de rechazo. El guard tiene que estar en el servidor.
   */
  it.each(['RECHAZADA', 'APROBADA'] as const)(
    'no reprocesa ni reenvia mail si la solicitud ya esta %s',
    async (status) => {
      mockSolicitudFindUnique.mockResolvedValue({ ...solicitudBase, status } as any);

      const result = await gestionarSolicitud('sol-1', 'RECHAZAR');

      expect(result.success).toBe(false);
      expect(result.error).toContain(status);
      expect(mockSolicitudUpdate).not.toHaveBeenCalled();
    }
  );

  it('tampoco crea identidad en Auth al re-aprobar una solicitud ya APROBADA', async () => {
    mockSolicitudFindUnique.mockResolvedValue({ ...solicitudBase, status: 'APROBADA' } as any);

    const result = await gestionarSolicitud('sol-1', 'APROBAR');

    expect(result.success).toBe(false);
    expect(mockInvite).not.toHaveBeenCalled();
    expect(mockProfesionalCreate).not.toHaveBeenCalled();
  });

  it('retorna error claro si la solicitud no existe', async () => {
    mockSolicitudFindUnique.mockResolvedValue(null);

    const result = await gestionarSolicitud('inexistente', 'RECHAZAR');

    expect(result).toEqual({ success: false, error: 'Solicitud no encontrada.' });
    expect(mockSolicitudUpdate).not.toHaveBeenCalled();
  });
});

describe('gestionarSolicitud — control de acceso', () => {
  it('propaga el error y no toca la base si el usuario no es admin', async () => {
    mockRequireAdmin.mockRejectedValue(new Error('Forbidden'));

    await expect(gestionarSolicitud('sol-1', 'APROBAR')).rejects.toThrow('Forbidden');

    expect(mockSolicitudFindUnique).not.toHaveBeenCalled();
    expect(mockSolicitudUpdate).not.toHaveBeenCalled();
    expect(mockProfesionalCreate).not.toHaveBeenCalled();
    expect(mockInvite).not.toHaveBeenCalled();
  });

  it('propaga el error y no toca la base si no hay sesión', async () => {
    mockRequireAdmin.mockRejectedValue(new Error('Unauthorized'));

    await expect(gestionarSolicitud('sol-1', 'RECHAZAR')).rejects.toThrow('Unauthorized');

    expect(mockSolicitudFindUnique).not.toHaveBeenCalled();
    expect(mockSolicitudUpdate).not.toHaveBeenCalled();
  });
});

describe('gestionarSolicitud — especialidades', () => {
  function prepararAprobacion(datos: Record<string, unknown>) {
    mockSolicitudFindUnique.mockResolvedValue({
      ...solicitudBase,
      datos: { ...solicitudBase.datos, ...datos },
    } as any);
    mockRequireAdmin.mockResolvedValue(undefined as any);
    mockFindByEmail.mockResolvedValue(null);
    mockFindByMatricula.mockResolvedValue(null);
    mockInvite.mockResolvedValue({ data: { user: { id: 'auth-uuid' } }, error: null } as any);
    mockProfesionalCreate.mockResolvedValue({ id: 'prof-nuevo' } as any);
    mockSolicitudUpdate.mockResolvedValue({ ...solicitudBase, status: 'APROBADA' } as any);
  }

  function especialidadesConectadas() {
    return mockProfesionalCreate.mock.calls[0]![0].data.especialidades;
  }

  it('conecta por ID todas las especialidades declaradas en el formato nuevo', async () => {
    prepararAprobacion({ especialidades: ['esp-1', 'esp-2'] });
    mockEspecialidadFindMany.mockResolvedValue([
      { id: 'esp-1', nombre: 'NEURO' },
      { id: 'esp-2', nombre: 'TRAUMATO' },
    ] as any);

    const result = await gestionarSolicitud('sol-1', 'APROBAR');

    expect(result).toEqual({ success: true });
    expect(especialidadesConectadas()).toEqual({
      connect: [{ id: 'esp-1' }, { id: 'esp-2' }],
    });
  });

  it('sigue funcionando con solicitudes viejas que guardaron una sola especialidad', async () => {
    prepararAprobacion({ especialidades: undefined, especialidad: 'esp-1' });
    mockEspecialidadFindMany.mockResolvedValue([{ id: 'esp-1', nombre: 'NEURO' }] as any);

    await gestionarSolicitud('sol-1', 'APROBAR');

    expect(especialidadesConectadas()).toEqual({ connect: [{ id: 'esp-1' }] });
  });

  /**
   * Regresión del bug real: se hacía `connectOrCreate` por `nombre` con el ID que
   * mandaba el formulario, así que cada aprobación creaba una Especialidad llamada
   * como un cuid (`cmorf6cmc000f21fbv5y792dv`) y ensuciaba el select público.
   */
  it('nunca crea una Especialidad nueva a partir de un ID generado', async () => {
    prepararAprobacion({ especialidades: ['cmorf6cmc000f21fbv5y792dv'] });
    mockEspecialidadFindMany.mockResolvedValue([] as any);

    await gestionarSolicitud('sol-1', 'APROBAR');

    const conectadas = especialidadesConectadas();
    expect(JSON.stringify(conectadas ?? {})).not.toContain('connectOrCreate');
    expect(JSON.stringify(conectadas ?? {})).not.toContain('cmorf6cmc000f21fbv5y792dv');
  });

  it('suma especialidades sin pisar las que ya tenía un profesional del padrón', async () => {
    prepararAprobacion({ especialidades: ['esp-2'] });
    mockFindByMatricula.mockResolvedValue({ id: 'prof-padron', telefono: null } as any);
    mockEspecialidadFindMany.mockResolvedValue([{ id: 'esp-2', nombre: 'TRAUMATO' }] as any);
    mockProfesionalUpdate.mockResolvedValue({ id: 'prof-padron' } as any);

    await gestionarSolicitud('sol-1', 'APROBAR');

    const data = mockProfesionalUpdate.mock.calls[0]![0].data;
    expect(data.especialidades).toEqual({ connect: [{ id: 'esp-2' }] });
    expect(JSON.stringify(data.especialidades)).not.toContain('set');
  });
});
