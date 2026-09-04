import { EMAIL_INSTITUCIONAL } from "@/lib/site";

/**
 * El mail institucional como enlace.
 *
 * Estaba escrito a mano en el Footer y en la pagina institucional, en las dos
 * con `break-all`: esa clase parte la palabra en cualquier caracter, asi que en
 * columnas angostas el dominio quedaba cortado al medio
 * ("...kinesiologosmza.c / om.ar"). Se veia recien cuando la casilla paso de
 * `presidencia@` a `administracion@` y la direccion crecio tres letras.
 *
 * `break-words` parte la direccion solo si no entra de ninguna forma, y el
 * <wbr/> despues de la arroba le ofrece al navegador el unico punto de corte
 * que se lee bien: usuario arriba, dominio entero abajo.
 */
export function EmailInstitucional({ className = "" }: { className?: string }) {
  const [usuario, dominio] = EMAIL_INSTITUCIONAL.split("@");

  return (
    <a href={`mailto:${EMAIL_INSTITUCIONAL}`} className={`break-words ${className}`}>
      {usuario}@<wbr />
      {dominio}
    </a>
  );
}
