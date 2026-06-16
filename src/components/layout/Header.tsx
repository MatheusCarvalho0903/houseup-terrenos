import Link from "next/link";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { logoutAction } from "@/actions/auth";
import type { Profile } from "@/lib/types";

export function Header({ profile, pendingCount }: { profile: Profile; pendingCount: number }) {
  const showPendingBadge = profile.role !== "broker" && pendingCount > 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-100 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3 lg:hidden">
        <Logo />
      </div>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-3 sm:gap-4">
        {showPendingBadge && (
          <Link
            href="/aprovacoes"
            className="hidden items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 sm:flex"
          >
            <span className="flex h-2 w-2 rounded-full bg-red-500" />
            {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
          </Link>
        )}

        <div className="flex items-center gap-2.5">
          <div className="hidden flex-col items-end sm:flex">
            <span className="text-sm font-semibold text-ink">{profile.full_name}</span>
            <RoleBadge role={profile.role} className="mt-0.5" />
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-800 text-sm font-bold text-white">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
        </div>

        <form action={logoutAction} className="hidden lg:block">
          <button
            type="submit"
            aria-label="Sair"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-secondary transition duration-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </form>
      </div>
    </header>
  );
}
