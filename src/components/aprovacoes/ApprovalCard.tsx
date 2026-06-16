"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, X as XIcon, Loader2, LandPlot, Maximize, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { aprovarTerreno, rejeitarTerreno } from "@/actions/aprovacoes";
import { formatArea, formatCurrency, formatDate } from "@/lib/utils";
import { getTerrenoFotoUrl } from "@/lib/storage";
import type { TerrenoComRelacoes } from "@/lib/types";

export function ApprovalCard({ terreno }: { terreno: TerrenoComRelacoes }) {
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const capa = terreno.fotos[0];

  function handleApprove() {
    startTransition(async () => {
      const result = await aprovarTerreno(terreno.id);
      if (result?.error) toast.error(result.error);
      else toast.success(`Terreno em ${terreno.bairro} aprovado.`);
    });
  }

  function handleReject() {
    startTransition(async () => {
      const result = await rejeitarTerreno(terreno.id);
      setRejectOpen(false);
      if (result?.error) toast.error(result.error);
      else toast.success("Terreno rejeitado e removido.");
    });
  }

  return (
    <div className="card-base flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
      <Link
        href={`/terrenos/${terreno.id}`}
        className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl bg-surface-muted sm:h-24 sm:w-32"
      >
        {capa ? (
          <Image src={getTerrenoFotoUrl(capa.storage_path)} alt={terreno.bairro} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <LandPlot className="h-8 w-8 text-gray-300" />
          </div>
        )}
      </Link>

      <div className="flex-1">
        <Link href={`/terrenos/${terreno.id}`} className="hover:underline">
          <p className="text-sm font-semibold text-ink">{terreno.bairro}</p>
        </Link>
        <p className="text-xs text-ink-secondary">{terreno.endereco}</p>

        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-ink-secondary">
          <span className="flex items-center gap-1.5">
            <Maximize className="h-3.5 w-3.5" />
            {formatArea(terreno.area_m2)}
          </span>
          <span className="font-semibold text-navy-900">{formatCurrency(terreno.valor)}</span>
          <span>
            Enviado por <strong className="text-ink">{terreno.criado_por?.full_name ?? "—"}</strong> em{" "}
            {formatDate(terreno.created_at)}
          </span>
        </div>

        {terreno.observacoes && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-surface-muted px-3 py-2 text-xs text-ink-secondary">
            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p className="line-clamp-2">{terreno.observacoes}</p>
          </div>
        )}
      </div>

      <div className="flex shrink-0 gap-2 sm:flex-col">
        <button onClick={handleApprove} disabled={isPending} className="btn-success flex-1 sm:flex-none">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Aprovar
        </button>
        <button
          onClick={() => setRejectOpen(true)}
          disabled={isPending}
          className="btn-danger flex-1 sm:flex-none"
        >
          <XIcon className="h-4 w-4" />
          Rejeitar
        </button>
      </div>

      <ConfirmModal
        open={rejectOpen}
        title="Rejeitar terreno"
        description={`O cadastro de "${terreno.bairro}" e suas fotos serão removidos permanentemente.`}
        confirmLabel="Rejeitar"
        tone="danger"
        isLoading={isPending}
        onConfirm={handleReject}
        onCancel={() => setRejectOpen(false)}
      />
    </div>
  );
}
