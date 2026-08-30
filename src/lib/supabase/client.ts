import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

/**
 * Cliente de Supabase para uso en el navegador (rol `anon`).
 * No persiste sesión: este proyecto no usa Supabase Auth en el cliente.
 * Único uso actual: subir archivos directamente a Storage vía
 * `uploadToSignedUrl`, contra URLs firmadas emitidas por el servidor
 * (ver `src/app/registro/actions.ts` → `prepararSubidaSolicitud`).
 */
export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
