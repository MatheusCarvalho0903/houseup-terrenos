import type { UserRole } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: "dashboard" | "approvals" | "users" | "account";
  allowed: UserRole[];
  showBadge?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "dashboard",
    allowed: ["admin", "manager", "broker"],
  },
  {
    href: "/aprovacoes",
    label: "Aprovações",
    icon: "approvals",
    allowed: ["admin", "manager"],
    showBadge: true,
  },
  {
    href: "/usuarios",
    label: "Usuários",
    icon: "users",
    allowed: ["admin"],
  },
  {
    href: "/conta",
    label: "Minha Conta",
    icon: "account",
    allowed: ["admin", "manager", "broker"],
  },
];
