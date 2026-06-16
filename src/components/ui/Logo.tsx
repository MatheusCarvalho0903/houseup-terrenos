import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "light" | "dark";
  className?: string;
  showTagline?: boolean;
}

/**
 * Wordmark da HouseUp. `light` (texto branco) para fundos navy, `dark` para
 * fundos claros.
 */
export function Logo({ variant = "dark", className, showTagline = false }: LogoProps) {
  const isLight = variant === "light";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <svg
        width="38"
        height="38"
        viewBox="0 0 38 38"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <rect width="38" height="38" rx="10" fill={isLight ? "#FFFFFF" : "#1A2E4A"} />
        <path
          d="M19 9L29 17.5V29H23V21H15V29H9V17.5L19 9Z"
          fill={isLight ? "#1A2E4A" : "#FFFFFF"}
        />
        <path d="M19 9L29 17.5L26.5 19.6L19 13.3L11.5 19.6L9 17.5L19 9Z" fill="#4FA3E0" />
      </svg>
      <div className="flex flex-col leading-tight">
        <span
          className={cn(
            "text-lg font-bold tracking-tight",
            isLight ? "text-white" : "text-navy-900"
          )}
        >
          House<span className="text-brand-light">Up</span>
        </span>
        {showTagline && (
          <span
            className={cn(
              "text-[11px] font-medium uppercase tracking-wider",
              isLight ? "text-white/60" : "text-ink-secondary"
            )}
          >
            Banco de Terrenos
          </span>
        )}
      </div>
    </div>
  );
}
