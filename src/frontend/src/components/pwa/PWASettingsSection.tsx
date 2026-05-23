import { formatLastSynced, useOfflineQueue } from "@/hooks/useOfflineQueue";
import { type SyncLogEntry, useOfflineStore } from "@/store/offline";
import {
  AlertCircle,
  CheckCircle,
  Download,
  Info,
  RefreshCw,
  Smartphone,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SyncStatusBadge } from "./SyncStatusBadge";

const ACTION_LABELS: Record<string, string> = {
  ADD_MEDICINE: "Medicine Added",
  UPDATE_REMINDER: "Reminder Updated",
  UPDATE_SETTINGS: "Settings Changed",
  SYNC_MEDICINE: "Medicine Synced",
  CREATE_BOOKING: "Booking Created",
};

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

function SyncLogRow({ entry }: { entry: SyncLogEntry }) {
  const isSuccess = entry.status === "success";
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-elevated)] transition-colors duration-150"
      data-ocid="pwa.settings.sync_log.item"
    >
      {isSuccess ? (
        <CheckCircle
          size={13}
          className="text-[var(--color-accent-teal)] flex-shrink-0"
        />
      ) : (
        <XCircle
          size={13}
          className="text-[var(--color-status-danger)] flex-shrink-0"
        />
      )}
      <span className="flex-1 text-xs text-foreground truncate">
        {ACTION_LABELS[entry.actionType] ?? entry.actionType}
      </span>
      <span
        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
          isSuccess
            ? "bg-[var(--color-status-success)]/12 text-[var(--color-accent-teal)]"
            : "bg-[var(--color-status-danger)]/12 text-[var(--color-status-danger)]"
        }`}
      >
        {isSuccess ? "Success" : "Failed"}
      </span>
      <span className="text-[10px] text-muted-foreground flex-shrink-0">
        {formatRelativeTime(entry.timestamp)}
      </span>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWASettingsSection() {
  // Install state
  const [isStandalone] = useState(
    () => window.matchMedia("(display-mode: standalone)").matches,
  );
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const [installSupported, setInstallSupported] = useState(false);

  // Storage state — real quota via navigator.storage.estimate()
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageQuota, setStorageQuota] = useState(0);
  const [storageLoaded, setStorageLoaded] = useState(false);

  // Sync state
  const lastSyncedAt = useOfflineStore((s) => s.lastSyncedAt);
  const clearAll = useOfflineStore((s) => s.clearAll);
  const syncLog = useOfflineStore((s) => s.syncLog);
  const { pendingCount, processQueue } = useOfflineQueue();
  const [isSyncing, setIsSyncing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  useEffect(() => {
    if (isStandalone) return;
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setInstallSupported(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isStandalone]);

  useEffect(() => {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      navigator.storage
        .estimate()
        .then(({ usage, quota }) => {
          setStorageUsed(usage ?? 0);
          setStorageQuota(quota ?? 0);
          setStorageLoaded(true);
        })
        .catch(() => setStorageLoaded(true));
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    setInstalling(true);
    await deferredPrompt.current.prompt();
    const result = await deferredPrompt.current.userChoice;
    if (result.outcome === "accepted") {
      setInstallSupported(false);
    }
    setInstalling(false);
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    await processQueue();
    setIsSyncing(false);
  };

  const handleClearData = () => {
    if (
      window.confirm("Clear all offline data? Unsynced changes will be lost.")
    ) {
      clearAll();
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CACHE" });
      }
      // Refresh storage estimate after clearing
      if ("storage" in navigator && "estimate" in navigator.storage) {
        navigator.storage.estimate().then(({ usage, quota }) => {
          setStorageUsed(usage ?? 0);
          setStorageQuota(quota ?? 0);
        });
      }
      setClearSuccess(true);
      setTimeout(() => setClearSuccess(false), 3000);
    }
  };

  const usedMB = (storageUsed / 1_048_576).toFixed(1);
  const quotaMB = (storageQuota / 1_048_576).toFixed(0);
  const usagePercent =
    storageQuota > 0 ? Math.min((storageUsed / storageQuota) * 100, 100) : 0;

  return (
    <div
      className="bg-[var(--color-bg-surface)] backdrop-blur-md rounded-2xl border border-[var(--color-border-subtle)] shadow-xl overflow-hidden"
      data-ocid="pwa.settings.section"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--color-border-subtle)]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent-teal)]/30 to-[var(--color-role-hospital)]/30 border border-[var(--color-border-base)] flex items-center justify-center">
          <Smartphone size={18} className="text-[var(--color-accent-teal)]" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">App &amp; Offline</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage installation, caching, and offline behavior
          </p>
        </div>
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* A. Install App */}
        {!isStandalone && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Install App
            </p>
            <button
              type="button"
              onClick={handleInstall}
              disabled={!installSupported || installing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50
                bg-[var(--color-status-success)] hover:bg-[var(--color-status-success)]/90
                text-white border border-[var(--color-border-subtle)] shadow-lg"
              data-ocid="pwa.settings.install_button"
            >
              <Download size={15} />
              {installing
                ? "Installing…"
                : installSupported
                  ? "Install MediVault"
                  : "Already installed or not supported"}
            </button>
            <p className="text-xs text-muted-foreground">
              Install for the best experience — faster loading, offline access,
              home screen icon
            </p>
          </div>
        )}

        {/* B. Sync Status */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Sync Status
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <SyncStatusBadge />
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium
                bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-muted)] border border-[var(--color-border-subtle)] text-foreground
                transition-all duration-200 disabled:opacity-50"
              data-ocid="pwa.settings.sync_now_button"
            >
              <RefreshCw
                size={12}
                className={isSyncing ? "animate-spin" : ""}
              />
              {isSyncing ? "Syncing…" : "Sync Now"}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 ? (
              <>
                <AlertCircle
                  size={13}
                  className="text-[var(--color-status-warning)] flex-shrink-0"
                />
                <p className="text-xs text-[var(--color-status-warning)]">
                  {pendingCount} action{pendingCount !== 1 ? "s" : ""} pending
                  sync
                </p>
              </>
            ) : (
              <>
                <CheckCircle
                  size={13}
                  className="text-[var(--color-accent-teal)] flex-shrink-0"
                />
                <p className="text-xs text-[var(--color-accent-teal)]">
                  All changes synced
                </p>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Last synced: {formatLastSynced(lastSyncedAt)}
          </p>
        </div>

        {/* C. Offline Storage */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Offline Storage
          </p>
          {storageLoaded && storageQuota > 0 ? (
            <>
              <p className="text-xs text-muted-foreground">
                Storage used:{" "}
                <span className="text-foreground font-medium">{usedMB} MB</span>
                {" of "}
                <span className="text-foreground font-medium">
                  {quotaMB} MB
                </span>
                {" available"}
              </p>
              <div className="h-1.5 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--color-accent-teal)] to-[var(--color-role-hospital)] rounded-full transition-all duration-700"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {usagePercent.toFixed(1)}% used
              </p>
            </>
          ) : storageLoaded ? (
            <p className="text-xs text-muted-foreground">
              Storage estimate unavailable on this browser.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Checking storage…</p>
          )}
          {clearSuccess && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-[var(--color-accent-teal)] text-xs"
              data-ocid="pwa.settings.clear_success_state"
            >
              <CheckCircle size={13} />
              Offline data cleared successfully.
            </div>
          )}
          <button
            type="button"
            onClick={handleClearData}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium
              bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-[var(--color-status-danger)]
              transition-all duration-200"
            data-ocid="pwa.settings.clear_cache_button"
          >
            <Trash2 size={13} />
            Clear Offline Data
          </button>
        </div>

        {/* D. Offline Mode Explanation */}
        <div
          className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/15 space-y-3"
          data-ocid="pwa.settings.offline_explanation_card"
        >
          <div className="flex items-center gap-2">
            <Info
              size={15}
              className="text-[var(--color-accent-teal)] flex-shrink-0"
            />
            <p className="text-sm font-medium text-foreground">Offline Mode</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            When offline, MediVault loads previously cached data and queues your
            changes. Everything syncs automatically when you reconnect.
          </p>
          <ul className="space-y-1.5">
            {[
              "Dashboard, medicines, and timeline load from cache",
              "New entries are queued and synced when back online",
              "Reminders continue to fire from local storage",
              "Last synced timestamp shows data freshness",
            ].map((point) => (
              <li
                key={point}
                className="flex items-start gap-2 text-xs text-muted-foreground"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/60 flex-shrink-0 mt-1.5" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* E. Sync Log */}
        <div className="space-y-3" data-ocid="pwa.settings.sync_log_section">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Sync Log
          </p>
          {syncLog.length === 0 ? (
            <p
              className="text-xs text-muted-foreground"
              data-ocid="pwa.settings.sync_log.empty_state"
            >
              No sync activity yet. Actions will appear here once you've made
              changes.
            </p>
          ) : (
            <div className="space-y-1.5">
              {syncLog.slice(0, 20).map((entry: SyncLogEntry, idx: number) => (
                <SyncLogRow key={`${entry.actionId}-${idx}`} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
