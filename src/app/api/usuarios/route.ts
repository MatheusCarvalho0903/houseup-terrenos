import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/types";

const VALID_ROLES: UserRole[] = ["admin", "manager", "broker"];

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json(
      { error: "Sessão expirada. Faça login novamente." },
      { status: 401 }
    );
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role, active")
    .eq("id", userData.user.id)
    .single();

  if (!callerProfile?.active || callerProfile.role !== "admin") {
    return NextResponse.json(
      { error: "Apenas administradores podem gerenciar usuários." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { email, fullName, password, role } = body as {
    email: string;
    fullName: string;
    password: string;
    role: UserRole;
  };

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Informe um email válido." }, { status: 400 });
  }
  if (!fullName?.trim()) {
    return NextResponse.json({ error: "Informe o nome completo." }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "A senha deve ter ao menos 6 caracteres." },
      { status: 400 }
    );
  }
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Perfil de acesso inválido." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName.trim() },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: authData.user.id,
    full_name: fullName.trim(),
    email: email.trim(),
    role,
    active: true,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json(
      { error: "Sessão expirada. Faça login novamente." },
      { status: 401 }
    );
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role, active")
    .eq("id", userData.user.id)
    .single();

  if (!callerProfile?.active || callerProfile.role !== "admin") {
    return NextResponse.json(
      { error: "Apenas administradores podem gerenciar usuários." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const userId = body?.userId;

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "ID do usuário inválido." }, { status: 400 });
  }

  if (userId === userData.user.id) {
    return NextResponse.json(
      { error: "Você não pode excluir sua própria conta." },
      { status: 400 }
    );
  }

  const admin = createAdminSupabaseClient();

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Remove do profiles (no-op se cascade já deletou)
  await admin.from("profiles").delete().eq("id", userId);

  return NextResponse.json({ success: true });
}
