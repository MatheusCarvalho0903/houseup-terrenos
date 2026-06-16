"use client";

import { useState, useTransition } from "react";
import { Loader2, Mail, UserPlus, X } from "lucide-react";
import toast from "react-hot-toast";
import { inviteUserAction } from "@/actions/usuarios";
import { ROLE_LABELS } from "@/lib/constants";
import type { UserRole } from "@/lib/types";

const ROLES: UserRole[] = ["broker", "manager", "admin"];

export function InviteUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("broker");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  function reset() {
    setEmail("");
    setFullName("");
    setRole("broker");
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await inviteUserAction(email, fullName, role);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(`Convite enviado para ${email}.`);
      handleClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
            <UserPlus className="h-5 w-5" />
          </div>
          <button onClick={handleClose} className="text-gray-400 transition hover:text-ink" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <h3 className="mt-4 text-base font-semibold text-ink">Convidar usuário</h3>
        <p className="mt-1 text-sm text-ink-secondary">
          Um email de convite será enviado para o acesso ao sistema.
        </p>

        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
          <div>
            <label className="label-base" htmlFor="invite-name">
              Nome completo
            </label>
            <input
              id="invite-name"
              className="input-base"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex.: Ana Souza"
              required
            />
          </div>

          <div>
            <label className="label-base" htmlFor="invite-email">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="invite-email"
                type="email"
                className="input-base pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pessoa@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="label-base" htmlFor="invite-role">
              Perfil de acesso
            </label>
            <select
              id="invite-role"
              className="input-base"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="mt-1 flex justify-end gap-3">
            <button type="button" onClick={handleClose} disabled={isPending} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar convite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
