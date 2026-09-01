import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * Guardas de arquitectura para el dominio publico del sitio.
 *
 * `site.ts` existe para que exista UNA sola fuente de verdad. Estos tests
 * fallan si alguien vuelve a leer la env var o a hardcodear un dominio por su
 * cuenta: asi fue como tres componentes del carnet quedaron apuntando a
 * `ckmendoza.com.ar`, un dominio que ni siquiera resuelve.
 */

const RAIZ = join(__dirname, '..');
const FUENTE_DE_VERDAD = join('lib', 'site.ts');

function archivosFuente(dir: string): string[] {
  return readdirSync(dir).flatMap((entrada) => {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) return archivosFuente(ruta);
    if (!/\.tsx?$/.test(entrada)) return [];
    if (/\.test\.tsx?$/.test(entrada)) return [];
    return [ruta];
  });
}

const FUENTES = archivosFuente(RAIZ).map((ruta) => ({
  ruta: relative(RAIZ, ruta),
  contenido: readFileSync(ruta, 'utf8'),
}));

describe('guardas del dominio publico', () => {
  it('solo site.ts lee NEXT_PUBLIC_SITE_URL', () => {
    const infractores = FUENTES.filter(
      (f) =>
        f.contenido.includes('NEXT_PUBLIC_SITE_URL') &&
        f.ruta.split(sep).join(sep) !== FUENTE_DE_VERDAD,
    ).map((f) => f.ruta);

    expect(infractores).toEqual([]);
  });

  it('ningun archivo hardcodea un dominio del Circulo fuera de site.ts', () => {
    const dominio = /https:\/\/(www\.)?(ckmendoza|kinesiologosmza|circulokinesiologos)\.com\.ar/;

    const infractores = FUENTES.filter(
      (f) => dominio.test(f.contenido) && f.ruta.split(sep).join(sep) !== FUENTE_DE_VERDAD,
    ).map((f) => f.ruta);

    expect(infractores).toEqual([]);
  });

  /**
   * La guarda anterior solo miraba URLs `https://`, y por eso dejo pasar
   * `mailto:presidencia@kinesiologosmza.com` en el Footer y en la pagina
   * institucional: el dominio sin `.ar` no existe, asi que todo visitante que
   * escribio desde el sitio recibio un rebote.
   */
  it('ningun archivo hardcodea la casilla institucional fuera de site.ts', () => {
    const casilla = /[\w.+-]+@(?:www\.)?kinesiologosmza\.com(?:\.ar)?/;

    const infractores = FUENTES.filter(
      (f) => casilla.test(f.contenido) && f.ruta.split(sep).join(sep) !== FUENTE_DE_VERDAD,
    ).map((f) => f.ruta);

    expect(infractores).toEqual([]);
  });

  it('no queda ninguna referencia a los dominios muertos del proyecto', () => {
    // kinesiologosmza.com SIN .ar, ckmendoza.* y circulokinesiologos.*:
    // ninguno de los tres esta registrado.
    const muertos = /ckmendoza\.|circulokinesiologos\.|kinesiologosmza\.com(?!\.ar)/;

    const infractores = FUENTES.filter((f) => muertos.test(f.contenido)).map((f) => f.ruta);

    expect(infractores).toEqual([]);
  });
});
