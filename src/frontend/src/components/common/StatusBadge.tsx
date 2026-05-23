import { cn } from "@/lib/utils";
import type { MedicineStatus } from "@/types";

interface StatusBadgeProps {
  status: MedicineStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config: Record<
    MedicineStatus,
    { label: string; cls: string; dot: string }
  > = {
    Safe: {
      label: "Safe",
      cls: "bg-[var(--color-status-success)]/15 text-[var(--color-status-success)] border-[var(--color-status-success)]/30",
      dot: "bg-[var(--color-status-success)]",
    },
    ExpiringSoon: {
      label: "Expiring Soon",
      cls: "bg-[var(--color-status-warning)]/15 text-[var(--color-status-warning)] border-[var(--color-status-warning)]/30",
      dot: "bg-[var(--color-status-warning)]",
    },
    Expired: {
      label: "Expired",
      cls: "bg-[var(--color-status-danger)]/15 text-[var(--color-status-danger)] border-[var(--color-status-danger)]/30",
      dot: "bg-[var(--color-status-danger)]",
    },
  };
  const { label, cls, dot } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border fade-in-up",
        cls,
        className,
      )}
      aria-label={`Expiry status: ${label}`}
    >
      <span
        className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0 pulse-glow", dot)}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
}
