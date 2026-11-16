export interface DomicilioAdicionalInput {
  direccion: string;
  localidadId: string;
}

type ParseResult =
  | { ok: true; items: DomicilioAdicionalInput[] }
  | { ok: false; error: string };

/** Valida el JSON de domicilios adicionales que llega del formulario. */
export function parseDomiciliosAdicionales(
  raw: string | null | undefined,
  localidadesValidas: Set<string>
): ParseResult {
  if (!raw) return { ok: true, items: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Los domicilios adicionales no son válidos." };
  }
  if (!Array.isArray(parsed)) {
    return { ok: false, error: "Los domicilios adicionales no son válidos." };
  }

  const items: DomicilioAdicionalInput[] = [];
  for (const row of parsed) {
    const direccion = String(row?.direccion ?? "").trim();
    const localidadId = String(row?.localidadId ?? "").trim();
    if (!direccion && !localidadId) continue; // fila vacía: se ignora
    if (!direccion || !localidadesValidas.has(localidadId)) {
      return { ok: false, error: "Cada domicilio adicional necesita dirección y una localidad válida." };
    }
    items.push({ direccion, localidadId });
  }
  return { ok: true, items };
}
