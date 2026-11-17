export const MAX_TELEFONOS_ADICIONALES = 5;
const MAX_LARGO = 30;

/** Normaliza la lista de teléfonos extra: recorta, descarta vacíos/duplicados y topea cantidad y largo. */
export function limpiarTelefonos(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const vistos = new Set<string>();
  for (const t of raw) {
    if (typeof t !== "string") continue;
    const limpio = t.trim().slice(0, MAX_LARGO);
    if (limpio) vistos.add(limpio);
  }
  return [...vistos].slice(0, MAX_TELEFONOS_ADICIONALES);
}
