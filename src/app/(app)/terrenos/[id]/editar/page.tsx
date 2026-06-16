import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getTerrenoById } from "@/lib/queries";
import { TerrenoForm } from "@/components/terrenos/TerrenoForm";

export const metadata: Metadata = {
  title: "Editar Terreno | HouseUp Banco de Terrenos",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarTerrenoPage({ params }: PageProps) {
  const profile = await requireProfile();

  // Brokers nunca editam terrenos — nem os próprios.
  if (profile.role === "broker") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const terreno = await getTerrenoById(id);
  if (!terreno) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Editar Terreno</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {terreno.bairro} · {terreno.endereco}
        </p>
      </div>

      <TerrenoForm profile={profile} terreno={terreno} />
    </div>
  );
}
