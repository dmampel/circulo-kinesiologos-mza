import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    storage: {
      from: vi.fn(),
    },
  },
}));

import { supabaseAdmin } from '@/lib/supabase/admin';
import { firmarUrlsDocumentos, SIGNED_URL_TTL_SEGUNDOS } from './solicitudes';

const mockCreateSignedUrls = vi.fn();
const mockFrom = vi.mocked(supabaseAdmin.storage.from);

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockReturnValue({ createSignedUrls: mockCreateSignedUrls } as any);
});

describe('firmarUrlsDocumentos', () => {
  it('devuelve un mapa path -> url firmada', async () => {
    mockCreateSignedUrls.mockResolvedValue({
      data: [
        { path: '5678-dni-111.pdf', signedUrl: 'https://storage/firmada-dni', error: null },
        { path: '5678-cv-222.pdf', signedUrl: 'https://storage/firmada-cv', error: null },
      ],
      error: null,
    });

    const result = await firmarUrlsDocumentos(['5678-dni-111.pdf', '5678-cv-222.pdf']);

    expect(mockFrom).toHaveBeenCalledWith('solicitudes');
    expect(mockCreateSignedUrls).toHaveBeenCalledWith(
      ['5678-dni-111.pdf', '5678-cv-222.pdf'],
      SIGNED_URL_TTL_SEGUNDOS
    );
    expect(result).toEqual({
      '5678-dni-111.pdf': 'https://storage/firmada-dni',
      '5678-cv-222.pdf': 'https://storage/firmada-cv',
    });
  });

  it('omite los documentos que no se pudieron firmar en vez de romper la página', async () => {
    mockCreateSignedUrls.mockResolvedValue({
      data: [
        { path: '5678-dni-111.pdf', signedUrl: 'https://storage/firmada-dni', error: null },
        { path: '5678-borrado-222.pdf', signedUrl: null, error: 'Object not found' },
      ],
      error: null,
    });

    const result = await firmarUrlsDocumentos(['5678-dni-111.pdf', '5678-borrado-222.pdf']);

    expect(result).toEqual({ '5678-dni-111.pdf': 'https://storage/firmada-dni' });
    expect(result['5678-borrado-222.pdf']).toBeUndefined();
  });

  it('no llama a Storage si no hay paths', async () => {
    const result = await firmarUrlsDocumentos([]);

    expect(result).toEqual({});
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('devuelve un mapa vacio si Storage falla, sin lanzar', async () => {
    mockCreateSignedUrls.mockResolvedValue({ data: null, error: { message: 'boom' } });

    await expect(firmarUrlsDocumentos(['5678-dni-111.pdf'])).resolves.toEqual({});
  });
});
