"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { toggleUserActiveAction } from "@/actions/usuarios";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export function UserTable({ profiles, currentUserId }: { profiles: Profile[]; currentUserId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle(profile: Profile) {
    if (profile.id === currentUserId) {
      toast.error("Você não pode desativar sua própria conta.");
      return;
    }

    startTransition(async () => {
      const result = await toggleUserActiveAction(profile.id, !profile.active);
      if (result?.error) toast.error(result.error);
      else toast.success(`${profile.full_name} ${profile.active ? "desativado" : "ativado"}.`);
    });
  }

  return (
    <div className="card-base overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted text-xs uppercase tracking-wide text-ink-secondary">
            <tr>
              <th className="px-5 py-3 font-medium">Nome</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Perfil</th>
              <th className="px-5 py-3 font-medium">Cadastro</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {profiles.map((profile) => (
              <tr key={profile.id} className={cn(!profile.active && "opacity-50")}>
                <td className="px-5 py-3.5 font-medium text-ink">{profile.full_name}</td>
                <td className="px-5 py-3.5 text-ink-secondary">{profile.email}</td>
                <td className="px-5 py-3.5">
                  <RoleBadge role={profile.role} />
                </td>
                <td className="px-5 py-3.5 text-ink-secondary">{formatDate(profile.created_at)}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-medium",
                      profile.active ? "text-green-700" : "text-gray-500"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", profile.active ? "bg-green-600" : "bg-gray-400")} />
                    {profile.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => handleToggle(profile)}
                    disabled={isPending || profile.id === currentUserId}
                    className="text-xs font-semibold text-brand transition hover:underline disabled:cursor-not-allowed disabled:text-gray-300"
                  >
                    {profile.active ? "Desativar" : "Ativar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
