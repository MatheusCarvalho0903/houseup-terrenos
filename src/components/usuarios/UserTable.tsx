"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toggleUserActiveAction } from "@/actions/usuarios";
import { formatDate, cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export function UserTable({ profiles, currentUserId }: { profiles: Profile[]; currentUserId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: deleteTarget.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error ?? "Erro ao excluir usuário.");
        return;
      }
      toast.success(`${deleteTarget.full_name} excluído com sucesso.`);
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
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
              {profiles.map((profile) => {
                const isSelf = profile.id === currentUserId;
                return (
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
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            profile.active ? "bg-green-600" : "bg-gray-400"
                          )}
                        />
                        {profile.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-3">
                        <button
                          onClick={() => handleToggle(profile)}
                          disabled={isPending || isSelf}
                          className="text-xs font-semibold text-brand transition hover:underline disabled:cursor-not-allowed disabled:text-gray-300"
                        >
                          {profile.active ? "Desativar" : "Ativar"}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(profile)}
                          disabled={isSelf}
                          title={isSelf ? "Você não pode excluir sua própria conta" : `Excluir ${profile.full_name}`}
                          className="text-red-400 transition hover:text-red-600 disabled:cursor-not-allowed disabled:text-gray-200"
                          aria-label={`Excluir ${profile.full_name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Excluir usuário"
        description={`Tem certeza que deseja excluir o usuário ${deleteTarget?.full_name ?? ""}? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        tone="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
