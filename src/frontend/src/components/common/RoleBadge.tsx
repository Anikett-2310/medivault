import { cn } from "@/lib/utils";

const ROLE_CONFIG: Record<
  string,
  { label: string; cls: string; icon: string }
> = {
  Patient: {
    label: "Patient",
    cls: "bg-[var(--color-role-patient)]/15 text-[var(--color-role-patient)] border-[var(--color-role-patient)]/30",
    icon: "🧑‍⚕️",
  },
  Pharmacy: {
    label: "Pharmacy",
    cls: "bg-[var(--color-role-pharmacy)]/15 text-[var(--color-role-pharmacy)] border-[var(--color-role-pharmacy)]/30",
    icon: "💊",
  },
  Hospital: {
    label: "Hospital",
    cls: "bg-[var(--color-role-hospital)]/15 text-[var(--color-role-hospital)] border-[var(--color-role-hospital)]/30",
    icon: "🏥",
  },
  Lab: {
    label: "Laboratory",
    cls: "bg-[var(--color-role-diagnostic)]/15 text-[var(--color-role-diagnostic)] border-[var(--color-role-diagnostic)]/30",
    icon: "🔬",
  },
  Admin: {
    label: "Admin",
    cls: "bg-[var(--color-role-admin)]/15 text-[var(--color-role-admin)] border-[var(--color-role-admin)]/30",
    icon: "🛡️",
  },
};

interface RoleBadgeProps {
  role?: string;
  size?: "sm" | "md";
  className?: string;
}

export function RoleBadge({ role, size = "md", className }: RoleBadgeProps) {
  const cfg = ROLE_CONFIG[role ?? ""] ?? {
    label: role ?? "Unknown",
    cls: "bg-muted text-muted-foreground border-border",
    icon: "👤",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        cfg.cls,
        className,
      )}
    >
      <span className={size === "sm" ? "text-[10px]" : "text-xs"}>
        {cfg.icon}
      </span>
      {cfg.label}
    </span>
  );
}

export { ROLE_CONFIG };
