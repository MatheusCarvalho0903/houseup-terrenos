import { TERRENO_FOTOS_BUCKET } from "@/lib/constants";

/**
 * Monta a URL pública de uma foto a partir do storage_path salvo no banco.
 * O bucket `terreno-fotos` é público para leitura (ver supabase/schema.sql).
 */
export function getTerrenoFotoUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${TERRENO_FOTOS_BUCKET}/${storagePath}`;
}
