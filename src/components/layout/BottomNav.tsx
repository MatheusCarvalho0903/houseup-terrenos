"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardCheck, Users, UserCircle } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS = {
  dashboard: LayoutDashboard,
  approvals: ClipboardCheck,
  users: Users,
  account: UserCircle,
};

export function BottomNav({ role, pendingCount }: { role: UserRole; pendingCount: number }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.allowed.includes(role));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-100 bg-white/95 backdrop-blur lg:hidden">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition duration-200",
              active ? "text-brand" : "text-ink-secondary"
            )}
          >
            <span className="relative">
              <Icon className="h-5 w-5" />
              {item.showBadge && pendingCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </span>
            {item.label === "Minha Conta" ? "Conta" : item.label}
          </Link>
        );
      })}
    </nav>
  );
}
