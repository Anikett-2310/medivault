import { formatLastSynced, useOfflineQueue } from "@/hooks/useOfflineQueue";
import { useOfflineStore } from "@/store/offline";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function OfflineBanner() {
  const isOnline = useOfflineStore((s) => s.isOnline);
  const hasUpdate = useOfflineStore((s) => s.hasUpdate);
  const lastSyncedAt = useOfflineStore((s) => s.lastSyncedAt);
  const { processQueue } = useOfflineQueue();

  // Track if we just came back online to show the green banner briefly
  const [justReconnected, setJustReconnected] = useState(false);
  const [visible, setVisible] = useState(false);
  const [retrying, setRetrying] = useState(false);
  // Tick every 30s so relative timestamp stays fresh
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Track previous online state
  useEffect(() => {
    if (!isOnline) {
      setJustReconnected(false);
      setVisible(true);
    } else if (visible) {
      // Was showing offline banner → now back online
      setJustReconnected(true);
      setVisible(false);
      const timer = setTimeout(() => setJustReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, visible]);

  const handleRetry = async () => {
    if (navigator.onLine) {
      setRetrying(true);
      await processQueue();
      setRetrying(false);
    } else {
      setRetrying(true);
      setTimeout(() => setRetrying(false), 800);
    }
  };

  const lastSyncedText = lastSyncedAt
    ? `Last synced: ${formatLastSynced(lastSyncedAt)}`
    : "Never synced";

  // New version available strip — shown above everything
  const updateStrip = hasUpdate ? (
    <div
      role="alert"
      aria-live="polite"
      data-ocid="pwa.update.banner"
      className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between gap-3 px-4 py-2
        alert-banner-warning backdrop-blur-md border-b
        text-sm"
    >
      <span className="flex items-center gap-2 flex-1 min-w-0">
        <span className="w-2 h-2 rounded-full bg-[var(--color-status-warning)] flex-shrink-0 animate-pulse" />
        <span className="truncate">
          New version available — refresh to update.
        </span>
      </span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        data-ocid="pwa.update.refresh.button"
        className="flex-shrink-0 px-3 py-1 rounded-full
          bg-[var(--color-status-warning)]/30 hover:bg-[var(--color-status-warning)]/40 border border-[var(--color-status-warning)]/40
          text-[var(--color-status-warning)] text-xs font-semibold transition-colors touch-target"
        aria-label="Refresh to apply update"
      >
        Refresh
      </button>
    </div>
  ) : null;

  // Offline banner
  if (!isOnline) {
    return (
      <>
        {updateStrip}
        <div
          role="alert"
          aria-live="assertive"
          data-ocid="offline.banner"
          className={`fixed left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 py-2.5
            alert-banner-danger backdrop-blur-md border-b
            text-sm
            translate-y-0 transition-transform duration-300 ease-out
            ${hasUpdate ? "top-9" : "top-0"}`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <WifiOff
              size={15}
              className="flex-shrink-0 text-[var(--color-status-danger)]"
            />
            <span className="truncate">
              You're offline — viewing cached data.{" "}
              <span className="opacity-70">{lastSyncedText}.</span>
            </span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full
              bg-[var(--color-status-danger)]/30 hover:bg-[var(--color-status-danger)]/40 border border-[var(--color-status-danger)]/40
              text-[var(--color-status-danger)] text-xs font-medium transition-colors touch-target
              disabled:opacity-60"
            data-ocid="offline.retry.button"
            aria-label="Retry connection"
          >
            <RefreshCw size={11} className={retrying ? "animate-spin" : ""} />
            Retry
          </button>
        </div>
      </>
    );
  }

  // Briefly show green "Back online" banner
  if (justReconnected) {
    return (
      <>
        {updateStrip}
        <output
          aria-live="polite"
          data-ocid="online.banner"
          className={`fixed left-0 right-0 z-50 flex items-center gap-2 px-4 py-2.5
            alert-banner-success backdrop-blur-md border-b
            text-sm
            translate-y-0 transition-transform duration-300 ease-out
            ${hasUpdate ? "top-9" : "top-0"}`}
        >
          <Wifi
            size={15}
            className="flex-shrink-0 text-[var(--color-status-success)]"
          />
          <span>Back online — syncing...</span>
        </output>
      </>
    );
  }

  // Only the update strip if applicable
  return updateStrip;
}

export default OfflineBanner;
