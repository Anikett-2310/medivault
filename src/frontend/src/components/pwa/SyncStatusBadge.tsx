import { formatLastSynced, useOfflineQueue } from "@/hooks/useOfflineQueue";
import { cn } from "@/lib/utils";
import { useOfflineStore } from "@/store/offline";
import { Loader2 } from "lucide-react";

interface SyncStatusBadgeProps {
  className?: string;
}

export function SyncStatusBadge({ className }: SyncStatusBadgeProps) {
  const isSyncing = useOfflineStore((s) => s.isSyncing);
  const syncError = useOfflineStore((s) => s.syncError);
  const lastSyncedAt = useOfflineStore((s) => s.lastSyncedAt);
  const { pendingCount, processQueue } = useOfflineQueue();

  const handleClick = () => {
    if (syncError || pendingCount > 0) {
      processQueue();
    }
  };

  let dotColor = "bg-[var(--color-status-success)]";
  let label = `Synced ${formatLastSynced(lastSyncedAt)}`;
  let isClickable = false;
  let title = "All changes synced";

  if (isSyncing) {
    dotColor = "bg-[var(--color-status-info)]";
    label = "Syncing...";
    title = "Syncing changes to backend";
  } else if (syncError) {
    dotColor = "bg-[var(--color-status-danger)]";
    label = "Sync failed";
    isClickable = true;
    title = syncError;
  } else if (pendingCount > 0) {
    dotColor = "bg-[var(--color-status-warning)]";
    label = `${pendingCount} pending`;
    isClickable = true;
    title = `${pendingCount} action${pendingCount !== 1 ? "s" : ""} waiting to sync — click to retry`;
  }

  return (
    <button
      type="button"
      onClick={isClickable ? handleClick : undefined}
      title={title}
      aria-label={title}
      data-ocid="sync.status.badge"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs",
        "bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-muted-foreground",
        "transition-colors duration-200",
        isClickable &&
          "cursor-pointer hover:bg-[var(--color-bg-muted)] hover:text-foreground",
        !isClickable && "cursor-default",
        className,
      )}
    >
      {isSyncing ? (
        <Loader2
          size={10}
          className="animate-spin text-[var(--color-status-info)] flex-shrink-0"
        />
      ) : (
        <span
          className={cn(
            "w-2 h-2 rounded-full flex-shrink-0 transition-colors",
            dotColor,
            !isSyncing && pendingCount === 0 && !syncError && "animate-pulse",
          )}
        />
      )}
      <span>{label}</span>
    </button>
  );
}

export default SyncStatusBadge;
