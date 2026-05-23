import { createActor } from "@/backend";
import type { ConsentAuditEntry, ConsentRecord, UserProfile } from "@/backend";
import { PWASettingsSection } from "@/components/pwa/PWASettingsSection";
import { useMyProfile } from "@/hooks/useBackend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Eye,
  FileText,
  Loader2,
  Lock,
  Send,
  Settings,
  Shield,
  XCircle,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

type ToastState = { type: "success" | "error"; message: string } | null;

function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (type: "success" | "error", message: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ type, message });
      timerRef.current = setTimeout(() => setToast(null), 3500);
    },
    [],
  );

  return { toast, showToast };
}

function maskChatId(chatId: string): string {
  if (chatId.length <= 4) return chatId;
  return `${"*".repeat(chatId.length - 4)}${chatId.slice(-4)}`;
}

function TelegramIntegrationCard({ profile }: { profile: UserProfile }) {
  const { actor } = useActor(createActor);
  const { toast, showToast } = useToast();
  const queryClient = useQueryClient();

  const [chatIdInput, setChatIdInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [telegramEnabled, setTelegramEnabled] = useState(
    profile.telegramEnabled,
  );
  const [currentChatId, setCurrentChatId] = useState(
    profile.telegramChatId ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const isConnected = currentChatId.length > 0;

  const handleSave = useCallback(async () => {
    const trimmed = chatIdInput.trim();
    if (!/^\d+$/.test(trimmed)) {
      setInputError("Chat ID must be at least 5 numeric digits");
      return;
    }
    if (trimmed.length < 5) {
      setInputError("Chat ID must be at least 5 numeric digits");
      return;
    }
    if (!actor) return;
    setIsSaving(true);
    setInputError("");
    try {
      const res = await actor.updateTelegramSettings(
        chatIdInput,
        telegramEnabled,
      );
      if (res.__kind__ === "ok") {
        setCurrentChatId(chatIdInput);
        setChatIdInput("");
        setShowForm(false);
        showToast("success", "Telegram connected successfully!");
        queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      } else {
        showToast("error", `Failed to save: ${res.err}`);
      }
    } catch {
      showToast("error", "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  }, [actor, chatIdInput, telegramEnabled, showToast, queryClient]);

  const handleDisconnect = useCallback(async () => {
    if (!actor) return;
    setIsDisconnecting(true);
    try {
      const res = await actor.updateTelegramSettings(null, false);
      if (res.__kind__ === "ok") {
        setCurrentChatId("");
        setTelegramEnabled(false);
        showToast("success", "Telegram disconnected.");
        queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      } else {
        showToast("error", `Failed: ${res.err}`);
      }
    } catch {
      showToast("error", "An unexpected error occurred.");
    } finally {
      setIsDisconnecting(false);
    }
  }, [actor, showToast, queryClient]);

  const handleToggleEnabled = useCallback(
    async (enabled: boolean) => {
      if (!actor || !isConnected) return;
      setTelegramEnabled(enabled);
      try {
        const res = await actor.updateTelegramSettings(currentChatId, enabled);
        if (res.__kind__ === "ok") {
          showToast(
            "success",
            enabled
              ? "Telegram reminders enabled."
              : "Telegram reminders disabled.",
          );
        } else {
          setTelegramEnabled(!enabled);
          showToast("error", `Failed to update: ${res.err}`);
        }
      } catch {
        setTelegramEnabled(!enabled);
        showToast("error", "An unexpected error occurred.");
      }
    },
    [actor, currentChatId, isConnected, showToast],
  );

  const handleSendTest = useCallback(async () => {
    if (!actor || !currentChatId) return;
    setIsTesting(true);
    try {
      const res = await actor.sendTestTelegramMessage(currentChatId);
      if (res.__kind__ === "ok") {
        showToast("success", "Test notification sent! Check your Telegram.");
      } else {
        showToast(
          "error",
          "Failed to send test. Check your chat ID or bot token.",
        );
      }
    } catch {
      showToast(
        "error",
        "Failed to send test. Check your chat ID or bot token.",
      );
    } finally {
      setIsTesting(false);
    }
  }, [actor, currentChatId, showToast]);

  return (
    <div className="relative bg-[var(--color-bg-elevated)] backdrop-blur-md rounded-2xl border border-[var(--color-border-base)] shadow-xl overflow-hidden">
      {/* Toast */}
      {toast && (
        <div
          className={`absolute top-4 right-4 z-10 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg transition-all duration-300 ${
            toast.type === "success"
              ? "status-indicator-success text-[oklch(var(--color-status-success))]"
              : "status-indicator-danger text-[oklch(var(--color-status-danger))]"
          }`}
          data-ocid="settings.toast"
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={15} />
          ) : (
            <XCircle size={15} />
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-role-patient)]/30 to-[var(--color-role-diagnostic)]/30 border border-[var(--color-border-base)] flex items-center justify-center">
            <Send size={18} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Telegram Notifications
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Receive medicine reminders via Telegram
            </p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
            isConnected
              ? "status-indicator-success text-[oklch(var(--color-status-success))]"
              : "bg-[var(--color-bg-elevated)] text-muted-foreground border-[var(--color-border-base)]"
          }`}
          data-ocid="settings.telegram.status_badge"
        >
          {isConnected ? "● Connected" : "○ Not Connected"}
        </span>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Connected state info */}
        {isConnected && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)]">
            <div className="w-8 h-8 rounded-lg status-indicator-success flex items-center justify-center flex-shrink-0">
              <CheckCircle2
                size={15}
                className="text-[oklch(var(--color-status-success))]"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Chat ID</p>
              <p className="text-xs text-muted-foreground font-mono">
                {maskChatId(currentChatId)}
              </p>
            </div>
          </div>
        )}

        {/* Enable toggle */}
        {isConnected && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Enable Telegram Reminders
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Send medicine reminders to your Telegram
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleEnabled(!telegramEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                telegramEnabled
                  ? "bg-[var(--color-role-patient)]"
                  : "bg-[var(--color-bg-muted)]"
              }`}
              aria-label="Toggle Telegram reminders"
              data-ocid="settings.telegram.enabled_toggle"
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  telegramEnabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          {!isConnected && !showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[var(--color-role-patient)] hover:opacity-90 text-white transition-all duration-200 shadow-lg"
              data-ocid="settings.telegram.connect_button"
            >
              <Send size={14} />
              Connect Telegram
            </button>
          )}

          {isConnected && (
            <>
              <button
                type="button"
                onClick={handleSendTest}
                disabled={isTesting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-muted)] text-foreground border border-[var(--color-border-base)] transition-all duration-200 disabled:opacity-50"
                data-ocid="settings.telegram.test_button"
              >
                {isTesting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                {isTesting ? "Sending…" : "Send Test Notification"}
              </button>

              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium status-indicator-danger hover:opacity-80 transition-all duration-200 disabled:opacity-50"
                data-ocid="settings.telegram.disconnect_button"
              >
                {isDisconnecting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <XCircle size={14} />
                )}
                Disconnect
              </button>
            </>
          )}
        </div>

        {/* Connect form */}
        {showForm && !isConnected && (
          <div
            className="space-y-3 p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)]"
            data-ocid="settings.telegram.connect_form"
          >
            <p className="text-sm font-medium text-foreground">
              Enter your Telegram Chat ID
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={chatIdInput}
              onChange={(e) => {
                const val = e.target.value;
                setChatIdInput(val);
                const trimmed = val.trim();
                if (trimmed && (!/^\d+$/.test(trimmed) || trimmed.length < 5)) {
                  setInputError("Chat ID must be at least 5 numeric digits");
                } else {
                  setInputError("");
                }
              }}
              placeholder="e.g. 123456789"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-base)] text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-role-patient)]/50 focus:border-[var(--color-role-patient)]/50 transition-all"
              data-ocid="settings.telegram.chatid_input"
            />
            {inputError && (
              <p
                className="text-xs text-[oklch(var(--color-status-danger))] flex items-center gap-1"
                data-ocid="settings.telegram.chatid_input.field_error"
              >
                <XCircle size={12} />
                {inputError}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              To get your Chat ID: message{" "}
              <span className="text-cyan-400 font-mono">@userinfobot</span> on
              Telegram, then paste the ID here.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !chatIdInput.trim() || !!inputError}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[var(--color-role-patient)] hover:opacity-90 text-white transition-all disabled:opacity-50"
                data-ocid="settings.telegram.save_button"
              >
                {isSaving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : null}
                {isSaving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setChatIdInput("");
                  setInputError("");
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-muted)] text-foreground border border-[var(--color-border-base)] transition-all"
                data-ocid="settings.telegram.cancel_button"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Setup instructions (when disconnected) */}
        {!isConnected && (
          <div className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              How to connect
            </p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Search for the MediVault bot on Telegram</li>
              <li>
                Send <span className="font-mono text-primary">/start</span> to
                the bot
              </li>
              <li>
                Message{" "}
                <span className="font-mono text-primary">@userinfobot</span> to
                get your Chat ID
              </li>
              <li>Paste your Chat ID above and click Connect</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Consent Toggle ──────────────────────────────────────────────────────────
interface ConsentToggleProps {
  label: string;
  description: string;
  affectsNote: string;
  icon: React.ReactNode;
  enabled: boolean;
  timestamp: bigint | null;
  loading: boolean;
  onChange: (value: boolean) => void;
  ocid: string;
}

function ConsentToggle({
  label,
  description,
  affectsNote,
  icon,
  enabled,
  timestamp,
  loading,
  onChange,
  ocid,
}: ConsentToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-[var(--color-border-subtle)] flex items-center justify-center flex-shrink-0 mt-0.5">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          <p className="text-xs text-cyan-400/70 mt-1">
            <span className="font-medium">Affects:</span> {affectsNote}
          </p>
          {timestamp !== null && (
            <p className="text-xs text-muted-foreground/60 mt-1">
              Last changed:{" "}
              {new Date(Number(timestamp) / 1_000_000).toLocaleString()}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {loading && (
          <Loader2 size={13} className="animate-spin text-cyan-400" />
        )}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={label}
          disabled={loading}
          onClick={() => onChange(!enabled)}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-40 ${
            enabled
              ? "bg-gradient-to-r from-cyan-500 to-violet-500"
              : "bg-[var(--color-bg-muted)]"
          }`}
          data-ocid={ocid}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ${
              enabled ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

// ─── Privacy & Consent Card ───────────────────────────────────────────────────
function PrivacyConsentCard() {
  const { actor, isFetching } = useActor(createActor);
  const { toast, showToast } = useToast();
  const [showHistory, setShowHistory] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [updatingField, setUpdatingField] = useState<string | null>(null);

  const {
    data: consent,
    isLoading: consentLoading,
    refetch: refetchConsent,
  } = useQuery<ConsentRecord | null>({
    queryKey: ["myConsent"],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getMyConsent();
      return result ?? null;
    },
    enabled: !!actor && !isFetching,
  });

  const {
    data: auditTrail,
    isLoading: auditLoading,
    refetch: refetchAudit,
  } = useQuery<ConsentAuditEntry[]>({
    queryKey: ["consentAudit"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getConsentAuditTrail();
    },
    enabled: !!actor && !isFetching && showHistory,
  });

  const handleToggle = useCallback(
    async (
      field: "adherenceSharing" | "prescriptionSharing" | "diagnosticAccess",
      newValue: boolean,
    ) => {
      if (!actor || !consent) return;
      setUpdatingField(field);
      try {
        const updated = {
          adherenceSharing:
            field === "adherenceSharing" ? newValue : consent.adherenceSharing,
          prescriptionSharing:
            field === "prescriptionSharing"
              ? newValue
              : consent.prescriptionSharing,
          diagnosticAccess:
            field === "diagnosticAccess" ? newValue : consent.diagnosticAccess,
        };
        const res = await actor.updateConsent(
          updated.adherenceSharing,
          updated.prescriptionSharing,
          updated.diagnosticAccess,
        );
        if (res.__kind__ === "ok") {
          showToast("success", "Consent preferences updated.");
          refetchConsent();
          if (showHistory) refetchAudit();
        } else {
          showToast("error", `Update failed: ${res.err}`);
        }
      } catch {
        showToast("error", "An unexpected error occurred.");
      } finally {
        setUpdatingField(null);
      }
    },
    [actor, consent, showToast, refetchConsent, showHistory, refetchAudit],
  );

  const handleRevokeAll = useCallback(async () => {
    if (!actor) return;
    setRevoking(true);
    try {
      const res = await actor.revokeAllConsent();
      if (res.__kind__ === "ok") {
        showToast("success", "All consent revoked. Your data is private.");
        refetchConsent();
        if (showHistory) refetchAudit();
      } else {
        showToast("error", `Revoke failed: ${res.err}`);
      }
    } catch {
      showToast("error", "An unexpected error occurred.");
    } finally {
      setRevoking(false);
    }
  }, [actor, showToast, refetchConsent, showHistory, refetchAudit]);

  const handleToggleHistory = useCallback(() => {
    setShowHistory((prev) => !prev);
  }, []);

  const isAnyConsentOn = consent
    ? consent.adherenceSharing ||
      consent.prescriptionSharing ||
      consent.diagnosticAccess
    : false;

  return (
    <div className="relative bg-[var(--color-bg-elevated)] backdrop-blur-md rounded-2xl border border-[var(--color-border-base)] shadow-xl overflow-hidden">
      {/* Toast */}
      {toast && (
        <div
          className={`absolute top-4 right-4 z-10 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg transition-all duration-300 ${
            toast.type === "success"
              ? "status-indicator-success text-[oklch(var(--color-status-success))]"
              : "status-indicator-danger text-[oklch(var(--color-status-danger))]"
          }`}
          data-ocid="consent.toast"
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={15} />
          ) : (
            <XCircle size={15} />
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-role-diagnostic)]/30 to-[var(--color-role-hospital)]/30 border border-[var(--color-border-base)] flex items-center justify-center">
            <Lock size={18} className="text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Privacy &amp; Consent
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Control what healthcare providers can see
            </p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
            isAnyConsentOn
              ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
              : "bg-[var(--color-bg-elevated)] text-muted-foreground border-[var(--color-border-base)]"
          }`}
          data-ocid="consent.status_badge"
        >
          {isAnyConsentOn ? "Sharing Active" : "All Private"}
        </span>
      </div>

      <div className="px-6 py-2">
        {consentLoading ? (
          <div className="space-y-4 py-4" data-ocid="consent.loading_state">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-[var(--color-bg-surface)] rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Info banner */}
            <div className="flex items-start gap-2 p-3 my-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <AlertTriangle
                size={14}
                className="text-violet-400 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-violet-300/90">
                These controls determine what hospital and diagnostic providers
                can access. Changes take effect immediately.
              </p>
            </div>

            {/* Toggles */}
            <div
              className="divide-y divide-[var(--color-border-subtle)]"
              data-ocid="consent.toggles"
            >
              <ConsentToggle
                label="Share Adherence Data"
                description="Your dose logs and adherence score"
                affectsNote="Hospital can view your medication adherence analytics"
                icon={<Activity size={15} className="text-cyan-400" />}
                enabled={consent?.adherenceSharing ?? false}
                timestamp={consent?.lastUpdated ?? null}
                loading={updatingField === "adherenceSharing"}
                onChange={(v) => handleToggle("adherenceSharing", v)}
                ocid="consent.adherence_toggle"
              />
              <ConsentToggle
                label="Share Prescription History"
                description="Your medicine records and dosage history"
                affectsNote="Hospital can view prescriptions and medicine lifecycle"
                icon={<ClipboardList size={15} className="text-indigo-400" />}
                enabled={consent?.prescriptionSharing ?? false}
                timestamp={consent?.lastUpdated ?? null}
                loading={updatingField === "prescriptionSharing"}
                onChange={(v) => handleToggle("prescriptionSharing", v)}
                ocid="consent.prescription_toggle"
              />
              <ConsentToggle
                label="Allow Diagnostic Report Access"
                description="Lab test results and diagnostic reports"
                affectsNote="Hospital can view your diagnostic reports from labs"
                icon={<Eye size={15} className="text-purple-400" />}
                enabled={consent?.diagnosticAccess ?? false}
                timestamp={consent?.lastUpdated ?? null}
                loading={updatingField === "diagnosticAccess"}
                onChange={(v) => handleToggle("diagnosticAccess", v)}
                ocid="consent.diagnostic_toggle"
              />
            </div>

            {/* Revoke all */}
            {isAnyConsentOn && (
              <div className="pt-3 pb-2">
                <button
                  type="button"
                  onClick={handleRevokeAll}
                  disabled={revoking}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium status-indicator-danger hover:opacity-80 transition-all duration-200 disabled:opacity-50"
                  data-ocid="consent.revoke_all_button"
                >
                  {revoking ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <XCircle size={14} />
                  )}
                  {revoking ? "Revoking…" : "Revoke All Consent"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Consent History */}
      <div className="border-t border-[var(--color-border-subtle)]">
        <button
          type="button"
          onClick={handleToggleHistory}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-[var(--color-bg-surface)] transition-colors duration-150"
          data-ocid="consent.history_toggle"
        >
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Consent History
            </span>
            {auditTrail && auditTrail.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--color-bg-elevated)] text-muted-foreground border border-[var(--color-border-subtle)]">
                {auditTrail.length}
              </span>
            )}
          </div>
          {showHistory ? (
            <ChevronUp size={15} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={15} className="text-muted-foreground" />
          )}
        </button>

        {showHistory && (
          <div className="px-6 pb-5">
            {auditLoading ? (
              <div
                className="space-y-2"
                data-ocid="consent.history.loading_state"
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 bg-[var(--color-bg-surface)] rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : auditTrail && auditTrail.length > 0 ? (
              <div className="space-y-2" data-ocid="consent.history.list">
                {[...auditTrail]
                  .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
                  .map((entry, idx) => (
                    <div
                      key={`${String(entry.field)}-${String(entry.timestamp)}-${idx}`}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)]"
                      data-ocid={`consent.history.item.${idx + 1}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            background:
                              entry.action === "enabled"
                                ? "oklch(var(--color-status-success))"
                                : "oklch(var(--color-status-danger))",
                          }}
                        />
                        <span className="text-xs font-medium text-foreground truncate">
                          {entry.field}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs border flex-shrink-0 ${
                            entry.action === "enabled"
                              ? "status-indicator-success text-[oklch(var(--color-status-success))]"
                              : "status-indicator-danger text-[oklch(var(--color-status-danger))]"
                          }`}
                        >
                          {entry.action}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {new Date(
                          Number(entry.timestamp) / 1_000_000,
                        ).toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div
                className="text-center py-6 text-sm text-muted-foreground"
                data-ocid="consent.history.empty_state"
              >
                No consent changes recorded yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useMyProfile();

  return (
    <div className="min-h-full bg-[var(--color-bg-base)] p-6 md:p-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Settings size={22} className="text-cyan-400" />
          <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-[var(--color-role-patient)] to-[var(--color-accent-primary)] bg-clip-text text-transparent">
            Settings
          </h1>
        </div>
        <p className="text-sm text-muted-foreground ml-9">
          Manage your account, notifications and privacy preferences
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile card */}
        <div className="bg-[var(--color-bg-elevated)] backdrop-blur-md rounded-2xl border border-[var(--color-border-base)] shadow-xl overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--color-border-subtle)]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border border-[var(--color-border-base)] flex items-center justify-center">
              <Shield size={18} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Profile</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your account information
              </p>
            </div>
          </div>
          <div className="px-6 py-5">
            {isLoading ? (
              <div
                className="space-y-3"
                data-ocid="settings.profile.loading_state"
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-5 bg-[var(--color-bg-elevated)] rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : profile ? (
              <dl className="space-y-3" data-ocid="settings.profile.card">
                <div className="flex items-center justify-between py-2 border-b border-[var(--color-border-subtle)]">
                  <dt className="text-sm text-muted-foreground">Name</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {profile.name}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[var(--color-border-subtle)]">
                  <dt className="text-sm text-muted-foreground">Email</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {profile.email || "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[var(--color-border-subtle)]">
                  <dt className="text-sm text-muted-foreground">Role</dt>
                  <dd>
                    <span className="badge-blue">{String(profile.role)}</span>
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2">
                  <dt className="text-sm text-muted-foreground">
                    Member since
                  </dt>
                  <dd className="text-sm font-medium text-foreground">
                    {new Date(
                      Number(profile.registrationDate) / 1_000_000,
                    ).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            ) : (
              <p
                className="text-sm text-muted-foreground"
                data-ocid="settings.profile.error_state"
              >
                Could not load profile.
              </p>
            )}
          </div>
        </div>

        {/* Privacy & Consent section */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">
            Privacy &amp; Consent
          </h2>
          <PrivacyConsentCard />
        </div>

        {/* Notifications section */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">
            Notifications
          </h2>
          {isLoading ? (
            <div
              className="bg-[var(--color-bg-elevated)] backdrop-blur-md rounded-2xl border border-[var(--color-border-base)] h-32 animate-pulse"
              data-ocid="settings.telegram.loading_state"
            />
          ) : profile ? (
            <TelegramIntegrationCard profile={profile} />
          ) : null}
        </div>

        {/* Reports & Exports section */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">
            Reports &amp; Exports
          </h2>
          <div className="bg-[var(--color-bg-elevated)] backdrop-blur-md rounded-2xl border border-[var(--color-border-base)] shadow-xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--color-border-subtle)]">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan-500/30 border border-[var(--color-border-base)] flex items-center justify-center">
                <ClipboardList size={18} className="text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Export History
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  View and audit your past data exports
                </p>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-muted-foreground mb-4">
                Access your complete export audit log — every PDF and CSV export
                is recorded for healthcare compliance.
              </p>
              <button
                type="button"
                onClick={() => navigate({ to: "/export-history" })}
                data-ocid="settings.reports.view_export_history_button"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-sm font-medium hover:bg-purple-500/30 transition-colors duration-200"
              >
                <ClipboardList size={16} />
                View Export History
              </button>
            </div>
          </div>
        </div>

        {/* App & Offline section */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">
            App &amp; Offline
          </h2>
          <PWASettingsSection />
        </div>
      </div>
    </div>
  );
}
