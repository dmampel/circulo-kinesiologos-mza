import { describe, it, expect } from 'vitest';
import { normalizarBaseUrl, construirUrlAbsoluta } from './site';

const FALLBACK = 'https://www.kinesiologosmza.com.ar';

describe('normalizarBaseUrl', () => {
  it('usa el valor configurado', () => {
    expect(normalizarBaseUrl('https://www.kinesiologosmza.com.ar')).toBe(FALLBACK);
  });

  it('saca la barra final para no generar urls con doble barra', () => {
    expect(normalizarBaseUrl('https://www.kinesiologosmza.com.ar/')).toBe(FALLBACK);
    expect(normalizarBaseUrl('https://www.kinesiologosmza.com.ar///')).toBe(FALLBACK);
  });

  it('cae al dominio real del Círculo si no hay valor', () => {
    expect(normalizarBaseUrl(undefined)).toBe(FALLBACK);
    expect(normalizarBaseUrl('')).toBe(FALLBACK);
    expect(normalizarBaseUrl('   ')).toBe(FALLBACK);
  });

  it('ignora espacios alrededor', () => {
    expect(normalizarBaseUrl('  https://www.kinesiologosmza.com.ar  ')).toBe(FALLBACK);
  });
});

describe('construirUrlAbsoluta', () => {
  it('arma la url con una sola barra', () => {
    expect(construirUrlAbsoluta('/profesionales', FALLBACK)).toBe(`${FALLBACK}/profesionales`);
    expect(construirUrlAbsoluta('profesionales', FALLBACK)).toBe(`${FALLBACK}/profesionales`);
  });

  it('devuelve la base para la raiz', () => {
    expect(construirUrlAbsoluta('/', FALLBACK)).toBe(FALLBACK);
    expect(construirUrlAbsoluta('', FALLBACK)).toBe(FALLBACK);
  });
});
