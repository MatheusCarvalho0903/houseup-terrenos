import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getTerrenosList } from "@/lib/queries";
import { ApprovalCard } from "@/components/aprovacoes/ApprovalCard";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = {
  title: "Aprovações | HouseUp Banco de Terrenos",
};

export default async function AprovacoesPage() {
  await requireRole(["admin", "manager"]);
  const pendentes = await getTerrenosList({ status: ["pendente"] });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Aprovações</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {pendentes.length > 0
            ? `${pendentes.length} terreno${pendentes.length > 1 ? "s" : ""} aguardando aprovação.`
            : "Nenhum terreno aguardando aprovação."}
        </p>
      </div>

      {pendentes.length === 0 ? (
        <EmptyState
          title="Tudo em dia!"
          description="Não há terrenos pendentes de aprovação no momento."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {pendentes.map((terreno) => (
            <ApprovalCard key={terreno.id} terreno={terreno} />
          ))}
        </div>
      )}
    </div>
  );
}
