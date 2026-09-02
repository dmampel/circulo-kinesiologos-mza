import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  default: {
    profesional: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        generateLink: vi.fn(),
      },
    },
  },
}));

vi.mock('@/utils/supabase/require-admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const mockEmailsSend = vi.fn();
vi.mock('@/lib/resend', () => ({
  getResend: vi.fn(() => ({ emails: { send: mockEmailsSend } })),
  canSendEmails: vi.fn(() => true),
  FROM_EMAIL: 'noreply@test.com',
}));

import prisma from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/utils/supabase/require-admin';
import { canSendEmails } from '@/lib/resend';
import { reenviarInvitacion } from './actions';

const mockFindUnique = vi.mocked(prisma.profesional.findUnique);
const mockGenerateLink = vi.mocked(supabaseAdmin.auth.admin.generateLink);
const mockRequireAdmin = vi.mocked(requireAdmin);
const mockCanSendEmails = vi.mocked(canSendEmails);

const profesionalBase = {
  email: 'ana@example.com',
  nombre: 'Ana',
  apellido: 'García',
  full_name: 'Ana García',
  userId: 'auth-user-1',
};

describe('reenviarInvitacion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanSendEmails.mockReturnValue(true);
    mockEmailsSend.mockResolvedValue({ data: {}, error: null });
  });

  it('requiere admin', async () => {
    mockFindUnique.mockResolvedValue(profesionalBase as any);
    mockGenerateLink.mockResolvedValue({
      data: { properties: { hashed_token: 'token-abc' } },
      error: null,
    } as any);

    await reenviarInvitacion('prof-1');

    expect(mockRequireAdmin).toHaveBeenCalled();
  });

  it('genera el link y envía el email cuando el profesional tiene cuenta invitada', async () => {
    mockFindUnique.mockResolvedValue(profesionalBase as any);
    mockGenerateLink.mockResolvedValue({
      data: { properties: { hashed_token: 'token-abc' } },
      error: null,
    } as any);

    const resultado = await reenviarInvitacion('prof-1');

    expect(resultado).toEqual({ success: true });
    expect(mockGenerateLink).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'invite', email: profesionalBase.email })
    );
    expect(mockEmailsSend).toHaveBeenCalledTimes(1);
    const emailEnviado = mockEmailsSend.mock.calls[0][0];
    expect(emailEnviado.to).toEqual([profesionalBase.email]);
    expect(emailEnviado.html).toContain('token-abc');
  });

  it('falla si el profesional no existe', async () => {
    mockFindUnique.mockResolvedValue(null);

    const resultado = await reenviarInvitacion('prof-inexistente');

    expect(resultado.success).toBe(false);
    expect(mockGenerateLink).not.toHaveBeenCalled();
  });

  it('falla si el profesional nunca fue invitado (sin userId)', async () => {
    mockFindUnique.mockResolvedValue({ ...profesionalBase, userId: null } as any);

    const resultado = await reenviarInvitacion('prof-1');

    expect(resultado.success).toBe(false);
    expect(mockGenerateLink).not.toHaveBeenCalled();
  });

  it('falla si Supabase no puede generar el link', async () => {
    mockFindUnique.mockResolvedValue(profesionalBase as any);
    mockGenerateLink.mockResolvedValue({
      data: null,
      error: { message: 'User already confirmed' },
    } as any);

    const resultado = await reenviarInvitacion('prof-1');

    expect(resultado.success).toBe(false);
    expect(resultado.error).toContain('User already confirmed');
    expect(mockEmailsSend).not.toHaveBeenCalled();
  });

  it('falla si el envío de emails no está configurado', async () => {
    mockFindUnique.mockResolvedValue(profesionalBase as any);
    mockGenerateLink.mockResolvedValue({
      data: { properties: { hashed_token: 'token-abc' } },
      error: null,
    } as any);
    mockCanSendEmails.mockReturnValue(false);

    const resultado = await reenviarInvitacion('prof-1');

    expect(resultado.success).toBe(false);
    expect(mockEmailsSend).not.toHaveBeenCalled();
  });

  it('falla si Resend rechaza el envío', async () => {
    mockFindUnique.mockResolvedValue(profesionalBase as any);
    mockGenerateLink.mockResolvedValue({
      data: { properties: { hashed_token: 'token-abc' } },
      error: null,
    } as any);
    mockEmailsSend.mockRejectedValue(new Error('SMTP caído'));

    const resultado = await reenviarInvitacion('prof-1');

    expect(resultado.success).toBe(false);
    expect(resultado.error).toContain('SMTP caído');
  });
});
