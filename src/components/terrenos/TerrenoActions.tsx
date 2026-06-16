"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Check, X as XIcon, Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { aprovarTerreno, rejeitarTerreno } from "@/actions/aprovacoes";
import { deleteTerreno } from "@/actions/terrenos";
import type { TerrenoStatus, UserRole } from "@/lib/types";

export function TerrenoActions({
  id,
  status,
  role,
}: {
  id: string;
  status: TerrenoStatus;
  role: UserRole;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<"reject" | "delete" | null>(null);

  if (role === "broker") return null;

  const isPendente = status === "pendente";

  function handleApprove() {
    startTransition(async () => {
      const result = await aprovarTerreno(id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Terreno aprovado com sucesso.");
        router.refresh();
      }
    });
  }

  function handleReject() {
    startTransition(async () => {
      const result = await rejeitarTerreno(id);
      setModal(null);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Terreno rejeitado e removido do banco.");
        router.push("/aprovacoes");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTerreno(id);
      setModal(null);
      if (result?.error) toast.error(result.error);
      // deleteTerreno redireciona para /dashboard em caso de sucesso.
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        <Link href={`/terrenos/${id}/editar`} className="btn-secondary">
          <Pencil className="h-4 w-4" />
          Editar
        </Link>

        {isPendente && (
          <>
            <button onClick={handleApprove} disabled={isPending} className="btn-success">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Aprovar
            </button>
            <button onClick={() => setModal("reject")} disabled={isPending} className="btn-danger">
              <XIcon className="h-4 w-4" />
              Rejeitar
            </button>
          </>
        )}

        <button onClick={() => setModal("delete")} disabled={isPending} className="btn-secondary text-red-600 hover:bg-red-50">
          <Trash2 className="h-4 w-4" />
          Excluir
        </button>
      </div>

      <ConfirmModal
        open={modal === "reject"}
        title="Rejeitar terreno"
        description="O cadastro e as fotos enviadas serão removidos permanentemente. O corretor poderá reenviar o terreno corrigido."
        confirmLabel="Rejeitar"
        tone="danger"
        isLoading={isPending}
        onConfirm={handleReject}
        onCancel={() => setModal(null)}
      />

      <ConfirmModal
        open={modal === "delete"}
        title="Excluir terreno"
        description="Esta ação é permanente e removerá o terreno e todas as suas fotos do banco de terrenos."
        confirmLabel="Excluir"
        tone="danger"
        isLoading={isPending}
        onConfirm={handleDelete}
        onCancel={() => setModal(null)}
      />
    </>
  );
}
