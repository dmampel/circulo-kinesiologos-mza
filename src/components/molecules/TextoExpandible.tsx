/**
 * Texto recortado a 3 líneas con "Ver más / Ver menos". Sin JS: un checkbox
 * oculto + `peer-checked`, así las tarjetas siguen siendo Server Components.
 */
// ponytail: el botón aparece por largo de texto, no por overflow real (eso pide JS). Ajustar el umbral si queda corto/largo.
const UMBRAL_CARACTERES = 120;

export default function TextoExpandible({ id, texto, className = "" }: { id: string; texto: string; className?: string }) {
  const parrafo = "text-sm text-slate-500 leading-relaxed whitespace-pre-line";

  if (texto.length <= UMBRAL_CARACTERES && !texto.includes("\n")) {
    return <p className={`${parrafo} ${className}`}>{texto}</p>;
  }

  const inputId = `ver-mas-${id}`;
  const boton =
    "cursor-pointer text-xs font-bold text-blue-600 hover:text-blue-700 mt-1 rounded peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500";

  return (
    <div className={className}>
      <input type="checkbox" id={inputId} className="peer sr-only" />
      <p className={`${parrafo} line-clamp-3 peer-checked:line-clamp-none`}>{texto}</p>
      <label htmlFor={inputId} className={`${boton} inline-block peer-checked:hidden`}>Ver más</label>
      <label htmlFor={inputId} className={`${boton} hidden peer-checked:inline-block`}>Ver menos</label>
    </div>
  );
}
