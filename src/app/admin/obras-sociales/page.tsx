import { getObrasSociales } from "./actions";
import ClientObrasSociales from "./ClientObrasSociales";

export const dynamic = "force-dynamic";

export default async function ObrasSocialesPage() {
  const obras = await getObrasSociales();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Obras Sociales y Convenios</h1>
        <p className="text-slate-500 font-medium">Gestioná las obras sociales activas y su orden de aparición.</p>
      </div>

      <ClientObrasSociales initialObras={obras} />
    </div>
  );
}
