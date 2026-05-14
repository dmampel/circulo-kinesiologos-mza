export const CARGOS_AUTORIDADES = [
  { nombre: "Presidente", orden: 1 },
  { nombre: "Vicepresidente", orden: 2 },
  { nombre: "Secretario/a", orden: 3 },
  { nombre: "Prosecretario/a", orden: 4 },
  { nombre: "Tesorero/a", orden: 5 },
  { nombre: "Protesorero/a", orden: 6 },
  { nombre: "Vocal Titular 1°", orden: 7 },
  { nombre: "Vocal Titular 2°", orden: 8 },
  { nombre: "Vocal Titular 3°", orden: 9 },
  { nombre: "Vocal Suplente 1°", orden: 10 },
  { nombre: "Vocal Suplente 2°", orden: 11 },
  { nombre: "Revisor de Cuentas Titular 1°", orden: 12 },
  { nombre: "Revisor de Cuentas Titular 2°", orden: 13 },
  { nombre: "Revisor de Cuentas Suplente", orden: 14 },
  { nombre: "Asesor Letrado", orden: 15 },
  { nombre: "Asesor Contable", orden: 16 },
] as const;

export type CargoAutoridad = typeof CARGOS_AUTORIDADES[number]["nombre"];
