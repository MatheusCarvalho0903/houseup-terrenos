"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/types";

export interface UsuarioActionResult {
  error?: string;
}

/**
 * Garante que quem está chamando a action é um admin ativo. A API de Auth
 * usada para convidar usuários roda com a Service Role Key (que ignora RLS),
 * então essa checagem manual é a única barreira contra uso indevido.
 */
async function assertCallerIsAdmin(): Promise<UsuarioActionResult> {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Sessão expirada. Faça login novamente." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, active")
    .eq("id", userData.user.id)
    .single();

  if (!profile?.active || profile.role !== "admin") {
    return { error: "Apenas administradores podem gerenciar usuários." };
  }

  return {};
}

export async function inviteUserAction(
  email: string,
  fullName: string,
  role: UserRole
): Promise<UsuarioActionResult> {
  const guard = await assertCallerIsAdmin();
  if (guard.error) return guard;

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return { error: "Informe um email válido." };
  }
  if (!fullName.trim()) {
    return { error: "Informe o nome completo." };
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email.trim(), {
    data: { full_name: fullName.trim(), role },
  });

  if (error) return { error: error.message };

  revalidatePath("/usuarios");
  return {};
}

export async function toggleUserActiveAction(
  userId: string,
  active: boolean
): Promise<UsuarioActionResult> {
  const guard = await assertCallerIsAdmin();
  if (guard.error) return guard;

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("profiles").update({ active }).eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/usuarios");
  return {};
}
