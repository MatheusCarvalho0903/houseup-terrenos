"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, UserPlus, X } from "lucide-react";
import toast from "react-hot-toast";
import { ROLE_LABELS } from "@/lib/constants";
import type { UserRole } from "@/lib/types";

const ROLES: UserRole[] = ["broker", "manager", "admin"];

export function InviteUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState<UserRole>("broker");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  if (!open) return null;

  function reset() {
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirm(false);
    setRole("broker");
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter ao menos 6 caracteres.");
      return;
    }

    setIsPending(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, password, role }),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg = json?.error ?? "Erro inesperado. Tente novamente.";
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success("Usuário criado com sucesso.");
      handleClose();
      router.refresh();
    } finally {
      setIsPending(false);
    }
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

        <h3 className="mt-4 text-base font-semibold text-ink">Novo usuário</h3>
        <p className="mt-1 text-sm text-ink-secondary">
          Crie o acesso diretamente. O usuário poderá fazer login com as credenciais informadas.
        </p>

        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
          <div>
            <label className="label-base" htmlFor="create-name">
              Nome completo
            </label>
            <input
              id="create-name"
              className="input-base"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex.: Ana Souza"
              required
            />
          </div>

          <div>
            <label className="label-base" htmlFor="create-email">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="create-email"
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
            <label className="label-base" htmlFor="create-password">
              Senha
            </label>
            <div className="relative">
              <input
                id="create-password"
                type={showPassword ? "text" : "password"}
                className="input-base pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-ink"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="label-base" htmlFor="create-confirm-password">
              Confirmar senha
            </label>
            <div className="relative">
              <input
                id="create-confirm-password"
                type={showConfirm ? "text" : "password"}
                className="input-base pr-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-ink"
                aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="label-base" htmlFor="create-role">
              Perfil de acesso
            </label>
            <select
              id="create-role"
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
              Criar usuário
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
