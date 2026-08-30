import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: { storage: { from: vi.fn() } },
}));

import { supabaseAdmin } from '@/lib/supabase/admin';
import { firmarUrlCircular, SIGNED_URL_TTL_SEGUNDOS } from './circulares';

const mockCreateSignedUrl = vi.fn();
const mockFrom = vi.mocked(supabaseAdmin.storage.from);

const PUBLICA = 'https://proj.supabase.co/storage/v1/object/public/circulares-adjuntos/1780-abc.pdf';

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockReturnValue({ createSignedUrl: mockCreateSignedUrl } as any);
});

describe('firmarUrlCircular', () => {
  it('firma una URL del bucket de circulares', async () => {
    mockCreateSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://firmada' }, error: null });

    const result = await firmarUrlCircular(PUBLICA);

    expect(mockFrom).toHaveBeenCalledWith('circulares-adjuntos');
    expect(mockCreateSignedUrl).toHaveBeenCalledWith('1780-abc.pdf', SIGNED_URL_TTL_SEGUNDOS);
    expect(result).toBe('https://firmada');
  });

  it('ignora el query string al extraer el path', async () => {
    mockCreateSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://firmada' }, error: null });

    await firmarUrlCircular(`${PUBLICA}?t=123`);

    expect(mockCreateSignedUrl).toHaveBeenCalledWith('1780-abc.pdf', SIGNED_URL_TTL_SEGUNDOS);
  });

  it('devuelve tal cual una URL externa pegada a mano por el admin', async () => {
    const externa = 'https://drive.google.com/file/d/xyz/view';

    const result = await firmarUrlCircular(externa);

    expect(result).toBe(externa);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('devuelve null si no hay url', async () => {
    expect(await firmarUrlCircular(null)).toBeNull();
    expect(await firmarUrlCircular('')).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('devuelve null si la firma falla, en vez de exponer la url publica', async () => {
    mockCreateSignedUrl.mockResolvedValue({ data: null, error: { message: 'not found' } });

    expect(await firmarUrlCircular(PUBLICA)).toBeNull();
  });

  it('devuelve null si Storage lanza', async () => {
    mockCreateSignedUrl.mockRejectedValue(new Error('boom'));

    expect(await firmarUrlCircular(PUBLICA)).toBeNull();
  });
});
