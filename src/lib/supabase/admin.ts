import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

/**
 * Cliente Supabase com a Service Role Key — ignora RLS por completo.
 * NUNCA importar este módulo em código que roda no browser. Uso restrito a
 * Server Actions/Route Handlers que precisam da Admin API (ex.: convidar
 * usuários, ativar/desativar contas).
 */
export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY e NEXT_PUBLIC_SUPABASE_URL são obrigatórias para o cliente admin."
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
