import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { cn } from "@/lib/utils";
import { useOfflineStore } from "@/store/offline";

interface ConnectivityStatusWidgetProps {
  className?: string;
}

export function ConnectivityStatusWidget({
  className,
}: ConnectivityStatusWidgetProps) {
  const isOnline = useOfflineStore((s) => s.isOnline);
  const { pendingCount } = useOfflineQueue();

  const showPending = isOnline && pendingCount > 0;

  return (
    <output
      aria-label={isOnline ? "Online" : "Offline"}
      data-ocid="connectivity.status.widget"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        "border transition-colors duration-300",
        isOnline
          ? "bg-[var(--color-status-success)]/10 border-[var(--color-status-success)]/20 text-[var(--color-status-success)]"
          : "bg-[var(--color-status-danger)]/10 border-[var(--color-status-danger)]/20 text-[var(--color-status-danger)]",
        className,
      )}
    >
      {/* Connectivity dot */}
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full flex-shrink-0",
          isOnline
            ? "bg-[var(--color-status-success)] animate-pulse"
            : "bg-[var(--color-status-danger)]",
        )}
      />
      <span>{isOnline ? "Online" : "Offline"}</span>

      {/* Pending queue count — only shown when online with queued items */}
      {showPending && (
        <>
          <span className="opacity-40">·</span>
          <span
            className="text-amber-400"
            aria-label={`${pendingCount} pending sync action${pendingCount !== 1 ? "s" : ""}`}
            data-ocid="connectivity.pending.count"
          >
            {pendingCount} pending
          </span>
        </>
      )}
    </output>
  );
}

export default ConnectivityStatusWidget;
