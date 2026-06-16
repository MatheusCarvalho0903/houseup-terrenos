import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { TerrenoForm } from "@/components/terrenos/TerrenoForm";

export const metadata: Metadata = {
  title: "Cadastrar Terreno | HouseUp Banco de Terrenos",
};

export default async function NovoTerrenoPage() {
  const profile = await requireProfile();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Cadastrar Terreno</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Preencha os dados abaixo para adicionar um novo terreno ao banco.
        </p>
      </div>

      <TerrenoForm profile={profile} />
    </div>
  );
}
