export const CARGOS_AUTORIDADES = [
  { nombre: "Presidente", orden: 1 },
  { nombre: "Vicepresidente", orden: 2 },
  { nombre: "Secretario/a General", orden: 3 },
  { nombre: "Secretario/a de Actas", orden: 4 },
  { nombre: "Tesorero/a", orden: 5 },
  { nombre: "Vocal Titular 1°", orden: 6 },
  { nombre: "Vocal Titular 2°", orden: 7 },
  { nombre: "Vocal Titular 3°", orden: 8 },
  { nombre: "Vocal Suplente 1°", orden: 9 },
  { nombre: "Vocal Suplente 2°", orden: 10 },
  { nombre: "Revisor de Cuentas Titular 1°", orden: 11 },
  { nombre: "Revisor de Cuentas Titular 2°", orden: 12 },
  { nombre: "Revisor de Cuentas Suplente", orden: 13 },
  { nombre: "Tribunal de Ética - Titular 1º", orden: 14 },
  { nombre: "Tribunal de Ética - Titular 2º", orden: 15 },
  { nombre: "Tribunal de Ética - Titular 3º", orden: 16 },
] as const;

export type CargoAutoridad = typeof CARGOS_AUTORIDADES[number]["nombre"];
