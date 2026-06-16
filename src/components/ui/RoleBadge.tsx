import { ROLE_BADGE_CLASSES, ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        ROLE_BADGE_CLASSES[role],
        className
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
