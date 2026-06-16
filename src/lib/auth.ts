import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

/**
 * Busca o usuário autenticado + seu profile de aplicação. Retorna null se
 * não houver sessão válida.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();

  return profile ?? null;
}

/**
 * Garante que existe uma sessão + profile ativo; caso contrário redireciona
 * para /login. Uso em Server Components/Pages protegidas.
 */
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();

  if (!profile || !profile.active) {
    redirect("/login");
  }

  return profile;
}

/** Garante que o profile tem uma das roles permitidas; senão redireciona. */
export async function requireRole(allowed: UserRole[]): Promise<Profile> {
  const profile = await requireProfile();

  if (!allowed.includes(profile.role)) {
    redirect("/dashboard");
  }

  return profile;
}
