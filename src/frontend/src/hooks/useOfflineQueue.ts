import { useOfflineStore } from "@/store/offline";
import type { OfflineAction } from "@/store/offline";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

export interface UseOfflineQueueResult {
  queue: OfflineAction[];
  pendingCount: number;
  enqueue: typeof useOfflineStore.getState extends () => infer S
    ? S extends { enqueue: infer E }
      ? E
      : never
    : never;
  processQueue: () => Promise<void>;
  clearCompleted: () => void;
}

export function formatLastSynced(ts: number | null): string {
  if (ts === null) return "Never";
  const diffMs = Date.now() - ts;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMs / 3_600_000);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? "s" : ""} ago`;

  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function useOfflineQueue() {
  const queue = useOfflineStore((s) => s.queue);
  const enqueue = useOfflineStore((s) => s.enqueue);
  const clearCompleted = useOfflineStore((s) => s.clearCompleted);
  const updateActionStatus = useOfflineStore((s) => s.updateActionStatus);
  const setSyncing = useOfflineStore((s) => s.setSyncing);
  const setLastSyncedAt = useOfflineStore((s) => s.setLastSyncedAt);
  const setSyncError = useOfflineStore((s) => s.setSyncError);
  const addSyncLogEntry = useOfflineStore((s) => s.addSyncLogEntry);

  const pendingCount = queue.filter(
    (item) => item.status === "pending" || item.status === "failed",
  ).length;

  const processQueue = useCallback(async () => {
    const actionable = queue.filter(
      (item) =>
        (item.status === "pending" || item.status === "failed") &&
        item.retryCount < 3,
    );

    if (actionable.length === 0) return;

    setSyncing(true);
    setSyncError(null);

    for (const action of actionable) {
      try {
        updateActionStatus(action.id, "syncing");

        // Dispatch a custom event for app-layer sync handlers to consume.
        // The handler must call detail.acknowledge() to confirm the action was
        // processed. If no acknowledgment arrives within 5 seconds the action
        // is marked "queued" — meaning it was dispatched but not confirmed by
        // a backend call. This avoids showing "Synced" for fire-and-forget events.
        const acknowledged = await new Promise<boolean>((resolve) => {
          const timeout = setTimeout(() => resolve(false), 5000);
          window.dispatchEvent(
            new CustomEvent("medivault:sync-action", {
              detail: {
                ...action,
                acknowledge: () => {
                  clearTimeout(timeout);
                  resolve(true);
                },
              },
            }),
          );
        });

        if (acknowledged) {
          updateActionStatus(action.id, "success");
          addSyncLogEntry({
            actionId: action.id,
            actionType: action.type,
            status: "success",
          });
          toast.success(
            `${formatActionLabel(action.type)} synced successfully`,
          );
        } else {
          // Action was dispatched but no handler confirmed it — mark as queued
          // (dispatched, awaiting backend confirmation on next sync attempt).
          updateActionStatus(action.id, "pending");
          addSyncLogEntry({
            actionId: action.id,
            actionType: action.type,
            status: "failure",
            errorMessage:
              "No acknowledgment received — action queued for retry",
          });
          toast.info(
            `${formatActionLabel(action.type)} queued — awaiting confirmation`,
          );
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown sync error";
        updateActionStatus(action.id, "failed", message);
        addSyncLogEntry({
          actionId: action.id,
          actionType: action.type,
          status: "failure",
          errorMessage: message,
        });
        // Only show retry toast after max retries exhausted
        const currentRetries =
          (queue.find((q) => q.id === action.id)?.retryCount ?? 0) + 1;
        if (currentRetries >= 3) {
          toast.error(
            `Failed to sync ${formatActionLabel(action.type)} — tap to retry`,
            {
              action: {
                label: "Retry",
                onClick: () => processQueue(),
              },
            },
          );
        }
      }
    }

    setSyncing(false);
    setLastSyncedAt(Date.now());
  }, [
    queue,
    updateActionStatus,
    setSyncing,
    setLastSyncedAt,
    setSyncError,
    addSyncLogEntry,
  ]);

  // Auto-process queue when the connection is restored
  useEffect(() => {
    const handleReconnected = () => {
      processQueue();
    };
    window.addEventListener("medivault:reconnected", handleReconnected);
    return () => {
      window.removeEventListener("medivault:reconnected", handleReconnected);
    };
  }, [processQueue]);

  return { queue, pendingCount, enqueue, processQueue, clearCompleted };
}

function formatActionLabel(type: string): string {
  switch (type) {
    case "ADD_MEDICINE":
      return "medicine";
    case "UPDATE_REMINDER":
      return "reminder";
    case "UPDATE_SETTINGS":
      return "settings";
    case "SYNC_MEDICINE":
      return "medicine sync";
    case "CREATE_BOOKING":
      return "booking";
    default:
      return "action";
  }
}

export default useOfflineQueue;
