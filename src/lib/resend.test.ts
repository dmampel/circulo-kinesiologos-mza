import { describe, it, expect } from 'vitest';
import { problemasDeConfigMail } from './resend';

const OK = {
  RESEND_API_KEY: 're_una_key_de_verdad',
  RESEND_FROM_EMAIL: 'no-reply@kinesiologosmza.com.ar',
  INSTITUTIONAL_EMAIL: 'presidencia@kinesiologosmza.com.ar',
};

const BASE = 'https://www.kinesiologosmza.com.ar';

describe('problemasDeConfigMail', () => {
  it('no reporta nada cuando esta todo bien', () => {
    expect(problemasDeConfigMail(OK, BASE)).toEqual([]);
  });

  it('reporta cada variable que falta', () => {
    expect(problemasDeConfigMail({}, BASE)).toEqual([
      'RESEND_API_KEY',
      'RESEND_FROM_EMAIL',
      'INSTITUTIONAL_EMAIL',
    ]);
  });

  it('trata el placeholder re_... como si no estuviera', () => {
    expect(problemasDeConfigMail({ ...OK, RESEND_API_KEY: 're_...' }, BASE))
      .toEqual(['RESEND_API_KEY']);
  });

  it('rechaza direcciones sin arroba', () => {
    expect(problemasDeConfigMail({ ...OK, RESEND_FROM_EMAIL: 'kinesiologosmza.com.ar' }, BASE))
      .toEqual(['RESEND_FROM_EMAIL']);
  });

  /**
   * El caso real: `presidencia@kinesiologosmza.com` (sin .ar) y
   * `admin@circulokinesiologos.com`. Dominios que no existen, mails que se
   * pierden en silencio. El dominio del remitente y del destinatario
   * institucional tiene que ser el mismo del sitio.
   */
  it('detecta el dominio equivocado por un typo', () => {
    expect(problemasDeConfigMail({ ...OK, INSTITUTIONAL_EMAIL: 'presidencia@kinesiologosmza.com' }, BASE))
      .toEqual(['INSTITUTIONAL_EMAIL']);
  });

  it('detecta un dominio ajeno', () => {
    expect(problemasDeConfigMail({ ...OK, RESEND_FROM_EMAIL: 'admin@circulokinesiologos.com' }, BASE))
      .toEqual(['RESEND_FROM_EMAIL']);
  });

  it('acepta el dominio del sitio con o sin www', () => {
    expect(problemasDeConfigMail(OK, 'https://kinesiologosmza.com.ar')).toEqual([]);
  });

  it('acepta subdominios del dominio del sitio', () => {
    expect(problemasDeConfigMail({ ...OK, RESEND_FROM_EMAIL: 'no-reply@send.kinesiologosmza.com.ar' }, BASE))
      .toEqual([]);
  });

  it('ignora mayusculas y espacios', () => {
    expect(problemasDeConfigMail({ ...OK, RESEND_FROM_EMAIL: '  No-Reply@Kinesiologosmza.COM.AR  ' }, BASE))
      .toEqual([]);
  });

  it('acumula varios problemas a la vez', () => {
    expect(problemasDeConfigMail({ RESEND_API_KEY: 're_ok', RESEND_FROM_EMAIL: 'x@otro.com' }, BASE))
      .toEqual(['RESEND_FROM_EMAIL', 'INSTITUTIONAL_EMAIL']);
  });
});
