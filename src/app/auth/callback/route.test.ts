import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockExchangeCodeForSession = vi.fn();
const mockVerifyOtp = vi.fn();

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
      verifyOtp: mockVerifyOtp,
    },
  })),
}));

import { GET } from './route';

const ORIGEN = 'https://www.kinesiologosmza.com.ar';
const socio = { id: 'user-1', app_metadata: {} };
const admin = { id: 'user-2', app_metadata: { role: 'admin' } };

const pedir = (query: string) => GET(new Request(`${ORIGEN}/auth/callback${query}`));
const destino = (res: Response) => res.headers.get('location');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /auth/callback — links de la admin API (token_hash)', () => {
  /**
   * El caso que estuvo roto desde siempre: los links de `inviteUserByEmail` no
   * traen `code` porque no hay PKCE, y el callback los rechazaba a todos. Ni
   * una invitación llegó a activarse por esto.
   */
  it('verifica el token_hash de un invite y lleva a set-password', async () => {
    mockVerifyOtp.mockResolvedValue({ data: { user: socio }, error: null });

    const res = await pedir('?token_hash=abc123&type=invite&next=/auth/set-password');

    expect(mockVerifyOtp).toHaveBeenCalledWith({ type: 'invite', token_hash: 'abc123' });
    expect(destino(res)).toBe(`${ORIGEN}/auth/set-password`);
  });

  it('también acepta type=recovery', async () => {
    mockVerifyOtp.mockResolvedValue({ data: { user: socio }, error: null });

    const res = await pedir('?token_hash=abc123&type=recovery');

    expect(mockVerifyOtp).toHaveBeenCalledWith({ type: 'recovery', token_hash: 'abc123' });
    expect(destino(res)).toBe(`${ORIGEN}/mi-panel`);
  });

  it('rechaza un type que no es de los que manda Supabase', async () => {
    const res = await pedir('?token_hash=abc123&type=cualquier-cosa');

    expect(mockVerifyOtp).not.toHaveBeenCalled();
    expect(destino(res)).toContain('/login?error=');
  });

  it('manda a login si el token ya fue usado o vencio', async () => {
    mockVerifyOtp.mockResolvedValue({ data: { user: null }, error: { message: 'expired' } });

    const res = await pedir('?token_hash=viejo&type=invite');

    expect(destino(res)).toContain('/login?error=');
  });
});

describe('GET /auth/callback — links de la app (code / PKCE)', () => {
  it('sigue intercambiando el code por sesion', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ data: { user: socio }, error: null });

    const res = await pedir('?code=xyz&next=/auth/set-password');

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('xyz');
    expect(destino(res)).toBe(`${ORIGEN}/auth/set-password`);
  });

  it('manda a login si el code es invalido', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ data: { user: null }, error: { message: 'bad code' } });

    const res = await pedir('?code=roto');

    expect(destino(res)).toContain('/login?error=');
  });
});

describe('GET /auth/callback — destino segun rol', () => {
  it('manda al admin a /admin cuando no vino un next explicito', async () => {
    mockVerifyOtp.mockResolvedValue({ data: { user: admin }, error: null });

    const res = await pedir('?token_hash=abc&type=magiclink');

    expect(destino(res)).toBe(`${ORIGEN}/admin`);
  });

  it('respeta el next explicito aunque sea admin', async () => {
    mockVerifyOtp.mockResolvedValue({ data: { user: admin }, error: null });

    const res = await pedir('?token_hash=abc&type=invite&next=/auth/set-password');

    expect(destino(res)).toBe(`${ORIGEN}/auth/set-password`);
  });
});

describe('GET /auth/callback — sin parametros', () => {
  it('manda a login sin llamar a Supabase', async () => {
    const res = await pedir('');

    expect(mockVerifyOtp).not.toHaveBeenCalled();
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(destino(res)).toContain('/login?error=');
  });
});
