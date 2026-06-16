import { requireProfile } from "@/lib/auth";
import { getPendingTerrenosCount } from "@/lib/queries";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const pendingCount = await getPendingTerrenosCount(profile.role);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar role={profile.role} pendingCount={pendingCount} />

      <div className="flex min-h-screen flex-1 flex-col">
        <Header profile={profile} pendingCount={pendingCount} />
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      </div>

      <BottomNav role={profile.role} pendingCount={pendingCount} />
    </div>
  );
}
