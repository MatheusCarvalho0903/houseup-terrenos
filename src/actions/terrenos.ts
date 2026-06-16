"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  ALLOWED_PHOTO_TYPES,
  MAX_PHOTO_SIZE_BYTES,
  MAX_PHOTOS,
  TERRENO_FOTOS_BUCKET,
} from "@/lib/constants";
import { slugifyFileName } from "@/lib/utils";
import type { Database } from "@/lib/types";

export interface TerrenoActionResult {
  error?: string;
  id?: string;
}

interface ParsedFields {
  endereco: string;
  bairro: string;
  linkMaps: string;
  areaM2: string;
  valor: string;
  observacoes: string;
  status?: string;
}

function parseFields(formData: FormData): ParsedFields {
  return {
    endereco: String(formData.get("endereco") ?? "").trim(),
    bairro: String(formData.get("bairro") ?? "").trim(),
    linkMaps: String(formData.get("linkMaps") ?? "").trim(),
    areaM2: String(formData.get("areaM2") ?? ""),
    valor: String(formData.get("valor") ?? ""),
    observacoes: String(formData.get("observacoes") ?? "").trim(),
    status: formData.get("status") ? String(formData.get("status")) : undefined,
  };
}

function validateFields(fields: ParsedFields): string | null {
  if (!fields.endereco) return "Informe o endereço completo.";
  if (!fields.bairro) return "Informe o bairro.";

  const area = Number(fields.areaM2);
  if (!Number.isFinite(area) || area <= 0) return "Informe uma área válida em m².";

  const valor = Number(fields.valor);
  if (!Number.isFinite(valor) || valor < 0) return "Informe um valor válido.";

  if (fields.linkMaps && !/^https?:\/\//i.test(fields.linkMaps)) {
    return "O link do Google Maps deve começar com http:// ou https://.";
  }

  return null;
}

async function uploadPhoto(
  supabase: SupabaseClient<Database>,
  terrenoId: string,
  file: File
): Promise<string> {
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    throw new Error(`Tipo de arquivo não permitido: ${file.name}`);
  }
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    throw new Error(`Arquivo muito grande (máx. 5MB): ${file.name}`);
  }

  const path = `${terrenoId}/${slugifyFileName(file.name)}`;
  const { error } = await supabase.storage.from(TERRENO_FOTOS_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw new Error(`Falha ao enviar a foto "${file.name}": ${error.message}`);
  return path;
}

export async function createTerreno(formData: FormData): Promise<TerrenoActionResult> {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Sessão expirada. Faça login novamente." };

  const fields = parseFields(formData);
  const validationError = validateFields(fields);
  if (validationError) return { error: validationError };

  const newPhotos = formData
    .getAll("newPhotos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (newPhotos.length > MAX_PHOTOS) {
    return { error: `Máximo de ${MAX_PHOTOS} fotos por terreno.` };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  const insertPayload: Database["public"]["Tables"]["terrenos"]["Insert"] = {
    endereco: fields.endereco,
    bairro: fields.bairro,
    area_m2: Number(fields.areaM2),
    valor: Number(fields.valor),
    link_maps: fields.linkMaps || null,
    observacoes: fields.observacoes || null,
  };

  // Brokers nunca definem status manualmente — o trigger do banco já força
  // 'pendente'; aqui só repassamos o valor escolhido quando admin/manager.
  if (profile?.role !== "broker" && fields.status) {
    insertPayload.status = fields.status as Database["public"]["Tables"]["terrenos"]["Row"]["status"];
  }

  const { data: terreno, error: insertError } = await supabase
    .from("terrenos")
    .insert(insertPayload)
    .select("id")
    .single();

  if (insertError || !terreno) {
    return { error: insertError?.message ?? "Não foi possível cadastrar o terreno." };
  }

  for (let i = 0; i < newPhotos.length; i++) {
    try {
      const path = await uploadPhoto(supabase, terreno.id, newPhotos[i]);
      await supabase.from("terreno_fotos").insert({ terreno_id: terreno.id, storage_path: path, ordem: i });
    } catch (err) {
      // O terreno já existe; reportamos o erro de upload sem perder o cadastro.
      revalidatePath("/dashboard");
      return {
        error: err instanceof Error ? err.message : "Terreno criado, mas houve erro ao enviar fotos.",
        id: terreno.id,
      };
    }
  }

  revalidatePath("/dashboard");
  redirect(`/terrenos/${terreno.id}`);
}

export async function updateTerreno(id: string, formData: FormData): Promise<TerrenoActionResult> {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Sessão expirada. Faça login novamente." };

  const fields = parseFields(formData);
  const validationError = validateFields(fields);
  if (validationError) return { error: validationError };

  const updatePayload: Database["public"]["Tables"]["terrenos"]["Update"] = {
    endereco: fields.endereco,
    bairro: fields.bairro,
    area_m2: Number(fields.areaM2),
    valor: Number(fields.valor),
    link_maps: fields.linkMaps || null,
    observacoes: fields.observacoes || null,
  };

  if (fields.status) {
    updatePayload.status = fields.status as Database["public"]["Tables"]["terrenos"]["Row"]["status"];
  }

  const { error: updateError } = await supabase.from("terrenos").update(updatePayload).eq("id", id);
  if (updateError) return { error: updateError.message };

  const newPhotos = formData
    .getAll("newPhotos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const photoOrder: Array<{ type: "existing" | "new"; id?: string }> = formData.get("photoOrder")
    ? JSON.parse(String(formData.get("photoOrder")))
    : [];
  const deletedPaths: string[] = formData.get("deletedPhotoPaths")
    ? JSON.parse(String(formData.get("deletedPhotoPaths")))
    : [];

  if (deletedPaths.length > 0) {
    await supabase.storage.from(TERRENO_FOTOS_BUCKET).remove(deletedPaths);
    await supabase.from("terreno_fotos").delete().eq("terreno_id", id).in("storage_path", deletedPaths);
  }

  let newPhotoCursor = 0;
  for (let ordem = 0; ordem < photoOrder.length; ordem++) {
    const entry = photoOrder[ordem];

    if (entry.type === "existing" && entry.id) {
      await supabase.from("terreno_fotos").update({ ordem }).eq("id", entry.id);
    } else if (entry.type === "new") {
      const file = newPhotos[newPhotoCursor++];
      if (!file) continue;
      try {
        const path = await uploadPhoto(supabase, id, file);
        await supabase.from("terreno_fotos").insert({ terreno_id: id, storage_path: path, ordem });
      } catch (err) {
        revalidatePath(`/terrenos/${id}`);
        return { error: err instanceof Error ? err.message : "Erro ao enviar nova foto." };
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath(`/terrenos/${id}`);
  redirect(`/terrenos/${id}`);
}

export async function deleteTerreno(id: string): Promise<TerrenoActionResult> {
  const supabase = await createServerSupabaseClient();

  const { data: fotos } = await supabase.from("terreno_fotos").select("storage_path").eq("terreno_id", id);
  if (fotos && fotos.length > 0) {
    await supabase.storage.from(TERRENO_FOTOS_BUCKET).remove(fotos.map((f) => f.storage_path));
  }

  const { error } = await supabase.from("terrenos").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
