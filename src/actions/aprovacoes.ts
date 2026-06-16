"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TERRENO_FOTOS_BUCKET } from "@/lib/constants";

export interface AprovacaoActionResult {
  error?: string;
}

/** Aprova um terreno pendente, definindo o status final escolhido (default: disponível). */
export async function aprovarTerreno(
  id: string,
  novoStatus: "disponivel" | "em_negociacao" | "vendido" = "disponivel"
): Promise<AprovacaoActionResult> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("terrenos").update({ status: novoStatus }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/aprovacoes");
  revalidatePath("/dashboard");
  revalidatePath(`/terrenos/${id}`);
  return {};
}

/**
 * Rejeita um terreno pendente. Como o enum de status não prevê um estado
 * "rejeitado", a rejeição remove definitivamente o cadastro (e suas fotos)
 * do banco de terrenos — o corretor pode reenviar o terreno corrigido.
 */
export async function rejeitarTerreno(id: string): Promise<AprovacaoActionResult> {
  const supabase = await createServerSupabaseClient();

  const { data: fotos } = await supabase.from("terreno_fotos").select("storage_path").eq("terreno_id", id);
  if (fotos && fotos.length > 0) {
    await supabase.storage.from(TERRENO_FOTOS_BUCKET).remove(fotos.map((f) => f.storage_path));
  }

  const { error } = await supabase.from("terrenos").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/aprovacoes");
  revalidatePath("/dashboard");
  return {};
}
