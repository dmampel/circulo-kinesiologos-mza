import { describe, it, expect } from 'vitest';
import { construirMetadataRaiz, OG_IMAGE } from './metadata';

const BASE = 'https://www.kinesiologosmza.com.ar';
const OTRA_BASE = 'https://preview.kinesiologosmza.com.ar';

describe('construirMetadataRaiz', () => {
  it('fija metadataBase con la base recibida', () => {
    expect(construirMetadataRaiz(BASE).metadataBase?.toString()).toBe(`${BASE}/`);
    expect(construirMetadataRaiz(OTRA_BASE).metadataBase?.toString()).toBe(`${OTRA_BASE}/`);
  });

  it('declara el canonical de la home', () => {
    expect(construirMetadataRaiz(BASE).alternates?.canonical).toBe('/');
  });

  it('arma el openGraph con la url absoluta del sitio', () => {
    const og = construirMetadataRaiz(BASE).openGraph;
    expect(og?.url).toBe(BASE);
    expect(og?.siteName).toBe('Círculo de Kinesiólogos de Mendoza');
    expect(og).toMatchObject({ type: 'website', locale: 'es_AR' });
  });

  it('sigue a la base cuando cambia el dominio', () => {
    expect(construirMetadataRaiz(OTRA_BASE).openGraph?.url).toBe(OTRA_BASE);
  });

  it('incluye la imagen OG con las medidas que piden las redes', () => {
    const imagenes = construirMetadataRaiz(BASE).openGraph?.images;
    expect(imagenes).toEqual([
      { url: OG_IMAGE, width: 1200, height: 630, alt: expect.any(String) },
    ]);
  });

  it('usa summary_large_image en Twitter para que la tarjeta sea grande', () => {
    expect(construirMetadataRaiz(BASE).twitter).toMatchObject({
      card: 'summary_large_image',
      images: [OG_IMAGE],
    });
  });

  it('apunta el favicon a un archivo que existe en /public', () => {
    expect(construirMetadataRaiz(BASE).icons).toEqual({ icon: '/icon.png' });
  });

  it('conserva titulo y descripcion institucionales', () => {
    const m = construirMetadataRaiz(BASE);
    expect(m.title).toBe('Círculo de Kinesiólogos de Mendoza | Institución Profesional');
    expect(m.description).toContain('kinesiología');
  });
});
