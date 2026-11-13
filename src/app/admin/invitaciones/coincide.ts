const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/**
 * Cada palabra de la búsqueda tiene que aparecer en algún campo. Antes se
 * buscaba el texto entero dentro de UN campo, y "Mariam Taichure" no matchea
 * ni con el nombre ("Marta Mariam") ni con el apellido ("Taichure") por separado.
 */
export function coincide(
  profesional: { apellido: string; nombre: string; matricula: string; email: string | null },
  busqueda: string
) {
  const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return true;
  const texto = normalizar(
    [profesional.apellido, profesional.nombre, profesional.matricula, profesional.email ?? ""].join(" ")
  );
  return palabras.every((palabra) => texto.includes(palabra));
}
