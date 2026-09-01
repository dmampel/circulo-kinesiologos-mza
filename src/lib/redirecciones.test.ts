import { describe, it, expect } from 'vitest';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REDIRECCIONES_LEGADO } from './redirecciones';

const APP = join(__dirname, '..', 'app');

/** Rutas de primer nivel que realmente existen en el App Router. */
const RUTAS_REALES = readdirSync(APP, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith('_') && !e.name.startsWith('('))
  .filter((e) => existsSync(join(APP, e.name, 'page.tsx')))
  .map((e) => `/${e.name}`);

describe('REDIRECCIONES_LEGADO', () => {
  it('redirige /padron al padron nuevo', () => {
    // Google muestra kinesiologosmza.com.ar/padron como PRIMER resultado para
    // "kinesiologos mendoza". Con el sitio en Vercel esa URL daba 404.
    expect(REDIRECCIONES_LEGADO).toContainEqual(
      expect.objectContaining({ source: '/padron', destination: '/profesionales' }),
    );
  });

  it('usa 301 y no 302 en todas', () => {
    // Un 302 no transfiere el posicionamiento: Google sigue apuntando a la
    // URL vieja. Tiene que ser permanente.
    for (const r of REDIRECCIONES_LEGADO) {
      expect(r.permanent, `${r.source} deberia ser permanente`).toBe(true);
    }
  });

  it('apunta siempre a una ruta que existe', () => {
    const rotas = REDIRECCIONES_LEGADO
      .map((r) => r.destination)
      .filter((d) => !RUTAS_REALES.includes(d) && d !== '/');

    expect(rotas).toEqual([]);
  });

  it('no redirige una ruta que el sitio ya sirve', () => {
    const pisadas = REDIRECCIONES_LEGADO
      .map((r) => r.source)
      .filter((s) => RUTAS_REALES.includes(s));

    expect(pisadas).toEqual([]);
  });

  it('no tiene origenes duplicados', () => {
    const origenes = REDIRECCIONES_LEGADO.map((r) => r.source);
    expect(origenes).toEqual([...new Set(origenes)]);
  });
});
