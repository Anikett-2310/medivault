import { cn } from "@/lib/utils";

interface LifecycleConnectorProps {
  active?: boolean;
  isLast?: boolean;
  className?: string;
}

/**
 * Blueprint-style vertical connector line between lifecycle stage nodes.
 * Renders a thin left-aligned rail with a dot at bottom.
 */
export function LifecycleConnector({
  active = false,
  isLast = false,
  className,
}: LifecycleConnectorProps) {
  if (isLast) return null;

  return (
    <div
      className={cn("relative ml-[19px] flex flex-col items-center", className)}
      aria-hidden="true"
    >
      {/* Vertical rail */}
      <div
        className={cn(
          "w-px h-10 transition-colors duration-200",
          active
            ? "bg-[var(--color-border-strong)]"
            : "bg-[var(--color-border-muted)]",
        )}
        style={{
          backgroundImage: active
            ? undefined
            : "repeating-linear-gradient(to bottom, var(--color-border-muted) 0, var(--color-border-muted) 4px, transparent 4px, transparent 8px)",
          background: active ? undefined : "none",
        }}
      />
      {/* Bottom connector node dot */}
      <div
        className={cn(
          "w-1.5 h-1.5 rounded-full mt-0.5 transition-colors duration-200",
          active
            ? "bg-[var(--color-border-strong)]"
            : "bg-[var(--color-border-muted)]",
        )}
      />
    </div>
  );
}
