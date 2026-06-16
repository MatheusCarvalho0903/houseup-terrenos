import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, Ruler, Coins, Link2, CalendarCheck, CalendarPlus, FileText } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { getTerrenoById } from "@/lib/queries";
import { PhotoCarousel } from "@/components/terrenos/PhotoCarousel";
import { TerrenoActions } from "@/components/terrenos/TerrenoActions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatArea, formatCurrency, formatDateTime } from "@/lib/utils";
import { toEmbedMapsUrl } from "@/lib/maps";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const terreno = await getTerrenoById(id);
  return { title: terreno ? `${terreno.bairro} | HouseUp Banco de Terrenos` : "Terreno" };
}

export default async function TerrenoDetailPage({ params }: PageProps) {
  const profile = await requireProfile();
  const { id } = await params;
  const terreno = await getTerrenoById(id);

  if (!terreno) notFound();

  const canSeeInternals = profile.role === "admin" || profile.role === "manager";
  const embedUrl = toEmbedMapsUrl(terreno.link_maps);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <PhotoCarousel fotos={terreno.fotos} alt={terreno.bairro} />

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={terreno.status} size="lg" />
            </div>
            <h1 className="mt-3 text-2xl font-bold text-navy-900">{terreno.bairro}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-secondary">
              <MapPin className="h-4 w-4" />
              {terreno.endereco}
            </p>
          </div>

          <div className="card-base grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
            <InfoItem icon={Ruler} label="Área" value={formatArea(terreno.area_m2)} />
            <InfoItem icon={Coins} label="Valor" value={formatCurrency(terreno.valor)} />
            {terreno.link_maps && (
              <InfoItem
                icon={Link2}
                label="Localização"
                value={
                  <a
                    href={terreno.link_maps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:underline"
                  >
                    Abrir no Google Maps
                  </a>
                }
              />
            )}
          </div>

          {embedUrl && (
            <div className="card-base overflow-hidden p-0">
              <iframe
                src={embedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-64 w-full border-0 sm:h-80"
                title={`Mapa de ${terreno.bairro}`}
              />
            </div>
          )}

          {canSeeInternals && terreno.observacoes && (
            <div className="card-base p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-secondary">
                <FileText className="h-4 w-4" />
                Observações
              </div>
              <p className="whitespace-pre-wrap text-sm text-ink">{terreno.observacoes}</p>
            </div>
          )}

          <div className="card-base flex flex-col gap-2.5 p-5 text-sm text-ink-secondary">
            <div className="flex items-center gap-2">
              <CalendarPlus className="h-4 w-4" />
              Cadastrado por <strong className="text-ink">{terreno.criado_por?.full_name ?? "—"}</strong> em{" "}
              {formatDateTime(terreno.created_at)}
            </div>
            {terreno.approved_at && (
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4" />
                Aprovado por <strong className="text-ink">{terreno.aprovado_por?.full_name ?? "—"}</strong> em{" "}
                {formatDateTime(terreno.approved_at)}
              </div>
            )}
          </div>
        </div>

        <div className="lg:w-64">
          <TerrenoActions id={terreno.id} status={terreno.status} role={profile.role} />
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-ink-secondary">{label}</p>
        <p className="text-sm font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}
