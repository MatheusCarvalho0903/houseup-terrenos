import { STATUS_BADGE_CLASSES, STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TerrenoStatus } from "@/lib/types";

export function StatusBadge({
  status,
  size = "sm",
  className,
}: {
  status: TerrenoStatus;
  size?: "sm" | "lg";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-4 py-1.5 text-sm",
        STATUS_BADGE_CLASSES[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
