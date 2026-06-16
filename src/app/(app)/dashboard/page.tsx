import type { Metadata } from "next";
import { LandPlot, CheckCircle2, Handshake, Clock } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { getTerrenoKpis, getTerrenosList } from "@/lib/queries";
import { TerrenoCard } from "@/components/terrenos/TerrenoCard";
import { TerrenoFiltersBar } from "@/components/terrenos/TerrenoFiltersBar";
import { KpiCard } from "@/components/ui/KpiCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import type { TerrenoFilters, TerrenoStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Dashboard | HouseUp Banco de Terrenos",
};

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const profile = await requireProfile();
  const params = await searchParams;

  const filters: TerrenoFilters = {
    bairro: params.bairro,
    status: params.status ? (params.status.split(",") as TerrenoStatus[]) : undefined,
    precoMin: params.precoMin ? Number(params.precoMin) : undefined,
    precoMax: params.precoMax ? Number(params.precoMax) : undefined,
    areaMin: params.areaMin ? Number(params.areaMin) : undefined,
    areaMax: params.areaMax ? Number(params.areaMax) : undefined,
  };

  const [terrenos, kpis] = await Promise.all([
    getTerrenosList(filters),
    getTerrenoKpis(profile.role),
  ]);

  const hasFilters = Object.values(params).some(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Banco de Terrenos</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Olá, {profile.full_name.split(" ")[0]} — confira os terrenos cadastrados.
        </p>
      </div>

      {kpis && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard label="Total de terrenos" value={kpis.total} icon={LandPlot} tone="default" />
          <KpiCard label="Disponíveis" value={kpis.disponiveis} icon={CheckCircle2} tone="success" />
          <KpiCard label="Em negociação" value={kpis.emNegociacao} icon={Handshake} tone="warning" />
          <KpiCard label="Pendentes de aprovação" value={kpis.pendentes} icon={Clock} tone="danger" />
        </div>
      )}

      <div className="mb-6">
        <TerrenoFiltersBar />
      </div>

      {terrenos.length === 0 ? (
        <EmptyState
          title="Nenhum terreno encontrado"
          description={
            hasFilters
              ? "Tente ajustar os filtros para encontrar o que procura."
              : "Ainda não há terrenos cadastrados. Clique em “Cadastrar Terreno” para começar."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {terrenos.map((terreno) => (
            <TerrenoCard key={terreno.id} terreno={terreno} />
          ))}
        </div>
      )}

      <FloatingActionButton href="/terrenos/novo" label="Cadastrar Terreno" />
    </div>
  );
}
