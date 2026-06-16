import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getAllProfiles } from "@/lib/queries";
import { UserTable } from "@/components/usuarios/UserTable";
import { InviteUserButton } from "@/components/usuarios/InviteUserButton";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = {
  title: "Usuários | HouseUp Banco de Terrenos",
};

export default async function UsuariosPage() {
  const profile = await requireRole(["admin"]);
  const profiles = await getAllProfiles();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Usuários</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Gerencie os acessos de colaboradores e corretores parceiros.
          </p>
        </div>
        <InviteUserButton />
      </div>

      {profiles.length === 0 ? (
        <EmptyState title="Nenhum usuário encontrado" />
      ) : (
        <UserTable profiles={profiles} currentUserId={profile.id} />
      )}
    </div>
  );
}
