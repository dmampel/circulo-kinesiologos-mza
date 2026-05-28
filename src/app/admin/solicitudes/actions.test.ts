import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  default: {
    solicitud: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    profesional: {
      create: vi.fn(),
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

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/lib/resend', () => ({
  getResend: vi.fn(() => ({ emails: { send: vi.fn() } })),
  canSendEmails: vi.fn(() => false),
  FROM_EMAIL: 'noreply@test.com',
}));

import prisma from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ProfesionalRepository } from '@/lib/repositories/ProfesionalRepository';
import { gestionarSolicitud } from './actions';

const mockSolicitudFindUnique = vi.mocked(prisma.solicitud.findUnique);
const mockSolicitudUpdate = vi.mocked(prisma.solicitud.update);
const mockProfesionalCreate = vi.mocked(prisma.profesional.create);
const mockInvite = vi.mocked(supabaseAdmin.auth.admin.inviteUserByEmail);
const mockFindByEmail = vi.mocked(ProfesionalRepository.findByEmail);
const mockFindByMatricula = vi.mocked(ProfesionalRepository.findByMatricula);

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
    especialidad: 'Kinesiología General',
    archivos: {},
    fecha_solicitud: new Date().toISOString(),
  },
};

beforeEach(() => {
  vi.clearAllMocks();
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
