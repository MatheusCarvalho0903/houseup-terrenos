"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardCheck, Users, UserCircle, LogOut } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { NAV_ITEMS } from "./nav-items";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth";

const ICONS = {
  dashboard: LayoutDashboard,
  approvals: ClipboardCheck,
  users: Users,
  account: UserCircle,
};

export function Sidebar({ role, pendingCount }: { role: UserRole; pendingCount: number }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.allowed.includes(role));

  return (
    <aside className="hidden w-64 flex-col border-r border-gray-100 bg-white lg:flex">
      <div className="flex h-16 items-center border-b border-gray-100 px-6">
        <Logo />
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-4">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition duration-200",
                active
                  ? "bg-brand/10 text-brand"
                  : "text-ink-secondary hover:bg-surface-muted hover:text-ink"
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </span>
              {item.showBadge && pendingCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-4">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-secondary transition duration-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
