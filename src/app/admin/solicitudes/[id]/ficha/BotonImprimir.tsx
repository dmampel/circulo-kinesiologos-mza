"use client";

import { Printer } from "lucide-react";

/**
 * Dispara el diálogo de impresión del navegador. Desde ahí, "Guardar como PDF"
 * produce el archivo que se le envía a administración — sin dependencias de
 * generación de PDF del lado del servidor.
 */
export default function BotonImprimir() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg"
    >
      <Printer className="mr-2 h-4 w-4" /> Imprimir / Guardar PDF
    </button>
  );
}
