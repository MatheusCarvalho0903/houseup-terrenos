import type { Metadata } from "next";
import { Mail, ShieldCheck, CalendarDays, LogOut } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { logoutAction } from "@/actions/auth";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Minha Conta | HouseUp Banco de Terrenos",
};

export default async function ContaPage() {
  const profile = await requireProfile();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Minha Conta</h1>
        <p className="mt-1 text-sm text-ink-secondary">Suas informações de acesso ao sistema.</p>
      </div>

      <div className="card-base p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-800 text-lg font-bold text-white">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold text-ink">{profile.full_name}</p>
            <RoleBadge role={profile.role} className="mt-1" />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-5 text-sm">
          <div className="flex items-center gap-2.5 text-ink-secondary">
            <Mail className="h-4 w-4" />
            {profile.email}
          </div>
          <div className="flex items-center gap-2.5 text-ink-secondary">
            <ShieldCheck className="h-4 w-4" />
            Conta {profile.active ? "ativa" : "inativa"}
          </div>
          <div className="flex items-center gap-2.5 text-ink-secondary">
            <CalendarDays className="h-4 w-4" />
            Membro desde {formatDate(profile.created_at)}
          </div>
        </div>

        <form action={logoutAction} className="mt-6 border-t border-gray-100 pt-5">
          <button type="submit" className="btn-secondary text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" />
            Sair da conta
          </button>
        </form>
      </div>
    </div>
  );
}
