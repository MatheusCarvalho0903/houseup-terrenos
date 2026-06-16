import Image from "next/image";
import Link from "next/link";
import { LandPlot, Maximize, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatArea, formatCurrency } from "@/lib/utils";
import { getTerrenoFotoUrl } from "@/lib/storage";
import type { TerrenoComRelacoes } from "@/lib/types";

export function TerrenoCard({ terreno }: { terreno: TerrenoComRelacoes }) {
  const capa = terreno.fotos[0];

  return (
    <Link
      href={`/terrenos/${terreno.id}`}
      className="card-base group flex flex-col overflow-hidden"
    >
      <div className="relative h-44 w-full overflow-hidden bg-surface-muted">
        {capa ? (
          <Image
            src={getTerrenoFotoUrl(capa.storage_path)}
            alt={`Foto de ${terreno.bairro}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <LandPlot className="h-10 w-10 text-gray-300" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <StatusBadge status={terreno.status} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div>
          <p className="text-sm font-semibold text-ink">{terreno.bairro}</p>
          <p className="truncate text-xs text-ink-secondary">{terreno.endereco}</p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-ink-secondary">
          <Maximize className="h-3.5 w-3.5" />
          {formatArea(terreno.area_m2)}
        </div>

        <p className="text-lg font-bold text-navy-900">{formatCurrency(terreno.valor)}</p>

        <div className="mt-auto flex items-center justify-between pt-2 text-sm font-semibold text-brand">
          Ver detalhes
          <ArrowRight className="h-4 w-4 transition duration-200 group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
