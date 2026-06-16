import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile, Terreno, TerrenoComRelacoes, TerrenoFilters, TerrenoFoto, UserRole } from "@/lib/types";

interface TerrenoRow extends Terreno {
  terreno_fotos: TerrenoFoto[];
}

/** Lista terrenos aplicando filtros de busca; RLS garante a visibilidade por role. */
export async function getTerrenosList(filters: TerrenoFilters): Promise<TerrenoComRelacoes[]> {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("terrenos")
    .select("*, terreno_fotos(id, terreno_id, storage_path, ordem, created_at)")
    .order("created_at", { ascending: false });

  if (filters.bairro) {
    query = query.ilike("bairro", `%${filters.bairro}%`);
  }
  if (filters.status && filters.status.length > 0) {
    query = query.in("status", filters.status);
  }
  if (filters.precoMin !== undefined) {
    query = query.gte("valor", filters.precoMin);
  }
  if (filters.precoMax !== undefined) {
    query = query.lte("valor", filters.precoMax);
  }
  if (filters.areaMin !== undefined) {
    query = query.gte("area_m2", filters.areaMin);
  }
  if (filters.areaMax !== undefined) {
    query = query.lte("area_m2", filters.areaMax);
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as TerrenoRow[]).map((row) => ({
    ...row,
    fotos: [...row.terreno_fotos].sort((a, b) => a.ordem - b.ordem),
  }));
}

/** Busca um terreno por id (com fotos e nomes de quem cadastrou/aprovou). RLS aplica visibilidade. */
export async function getTerrenoById(id: string): Promise<TerrenoComRelacoes | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("terrenos")
    .select("*, terreno_fotos(id, terreno_id, storage_path, ordem, created_at)")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const row = data as TerrenoRow;
  const profilesMap = await getProfilesMap([row.created_by, row.approved_by]);

  return {
    ...row,
    fotos: [...row.terreno_fotos].sort((a, b) => a.ordem - b.ordem),
    criado_por: row.created_by ? profilesMap.get(row.created_by) ?? null : null,
    aprovado_por: row.approved_by ? profilesMap.get(row.approved_by) ?? null : null,
  };
}

/** KPIs do dashboard (admin/manager): total, disponíveis, em negociação, pendentes. */
export async function getTerrenoKpis(role: UserRole) {
  if (role === "broker") return null;

  const supabase = await createServerSupabaseClient();
  const countByStatus = async (status?: Terreno["status"]) => {
    let q = supabase.from("terrenos").select("id", { count: "exact", head: true });
    if (status) q = q.eq("status", status);
    const { count } = await q;
    return count ?? 0;
  };

  const [total, disponiveis, emNegociacao, pendentes] = await Promise.all([
    countByStatus(),
    countByStatus("disponivel"),
    countByStatus("em_negociacao"),
    countByStatus("pendente"),
  ]);

  return { total, disponiveis, emNegociacao, pendentes };
}

/** Contagem de terrenos pendentes de aprovação (visível para admin/manager). */
export async function getPendingTerrenosCount(role: UserRole): Promise<number> {
  if (role === "broker") return 0;

  const supabase = await createServerSupabaseClient();
  const { count } = await supabase
    .from("terrenos")
    .select("id", { count: "exact", head: true })
    .eq("status", "pendente");

  return count ?? 0;
}

/** Lista todos os profiles (apenas admin, via RLS), mais recentes primeiro. */
export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Mapa id → profile resumido, usado para exibir "cadastrado por"/"aprovado por". */
export async function getProfilesMap(
  ids: (string | null)[]
): Promise<Map<string, Pick<Profile, "id" | "full_name">>> {
  const uniqueIds = Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
  const map = new Map<string, Pick<Profile, "id" | "full_name">>();

  if (uniqueIds.length === 0) return map;

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("profiles").select("id, full_name").in("id", uniqueIds);

  data?.forEach((p) => map.set(p.id, p));
  return map;
}
