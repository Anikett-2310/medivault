import { createActor } from "@/backend";
import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  useMyMedicines,
  useMyProfile,
  useMyReminders,
  useReminderMutation,
} from "@/hooks/useBackend";
import type { Reminder } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  Bell,
  BellOff,
  Clock,
  Lock,
  MessageSquare,
  Mic,
  MicOff,
  Plus,
  Send,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// Production guard — Telegram diagnostic warnings are dev-only
const isDev = import.meta.env.DEV;

// ─── Reminder Service ─────────────────────────────────────────────────────────
class ReminderService {
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  schedule(
    id: string,
    reminderTime: string,
    medicineName: string,
    dosage: string,
    voiceEnabled: boolean,
    telegramCallback?: () => void,
  ) {
    this.cancel(id);
    const [hours, minutes] = reminderTime.split(":").map(Number);
    const now = new Date();
    const next = new Date();
    next.setHours(hours, minutes, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const ms = next.getTime() - now.getTime();

    const timer = setTimeout(() => {
      this.fire(medicineName, dosage, voiceEnabled);
      // Phase 2: Telegram hook fires AFTER existing reminder — does not affect existing flow
      if (telegramCallback) {
        try {
          telegramCallback();
        } catch (e) {
          if (isDev)
            console.warn("[MediVault] Telegram callback failed silently", e);
        }
      }
    }, ms);
    this.timers.set(id, timer);
  }

  private fire(medicineName: string, dosage: string, voiceEnabled: boolean) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("MediVault Reminder", {
        body: `Time to take ${medicineName} — ${dosage}`,
        icon: "/favicon.ico",
      });
    }
    if (voiceEnabled && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(
        `Reminder: Time to take ${medicineName}, ${dosage}`,
      );
      utterance.rate = 0.9;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  }

  cancel(id: string) {
    const t = this.timers.get(id);
    if (t) {
      clearTimeout(t);
      this.timers.delete(id);
    }
  }

  cancelAll() {
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
  }

  // Phase 2 hook: swap fire() with a real Telegram bot call via backend
  // async sendTelegram(chatId: string, message: string) { ... }
}

const reminderService = new ReminderService();

type AddForm = {
  medicineId: string;
  reminderTime: string;
  voiceEnabled: boolean;
};

function AddReminderModal({
  medicines,
  onSave,
  onClose,
  loading,
  existingReminders,
}: {
  medicines: Array<{ id: string; name: string; dosage: string }>;
  onSave: (f: AddForm) => void;
  onClose: () => void;
  loading: boolean;
  existingReminders: Reminder[];
}) {
  const [form, setForm] = useState<AddForm>({
    medicineId: "",
    reminderTime: "08:00",
    voiceEnabled: false,
  });
  const [timeError, setTimeError] = useState("");

  const validateAndSave = () => {
    if (!form.medicineId) return;
    const duplicate = existingReminders.some(
      (r) =>
        r.medicineId === form.medicineId &&
        r.reminderTime === form.reminderTime,
    );
    if (duplicate) {
      setTimeError("A reminder already exists for this time");
      return;
    }
    setTimeError("");
    onSave(form);
  };

  return (
    <dialog
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg-overlay)] backdrop-blur-sm p-4 m-0 max-w-none w-full h-full border-0"
      aria-labelledby="add-reminder-title"
      open
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3
            id="add-reminder-title"
            className="text-lg font-semibold text-foreground flex items-center gap-2"
          >
            <Bell size={18} className="text-primary" /> Add Reminder
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="reminder-medicine-select">Medicine</Label>
            <Select
              value={form.medicineId}
              onValueChange={(v) => {
                setForm((f) => ({ ...f, medicineId: v }));
                setTimeError("");
              }}
            >
              <SelectTrigger id="reminder-medicine-select" className="mt-1">
                <SelectValue placeholder="Select medicine..." />
              </SelectTrigger>
              <SelectContent>
                {medicines.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} — {m.dosage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="reminder-time">Reminder Time</Label>
            <Input
              id="reminder-time"
              type="time"
              value={form.reminderTime}
              onChange={(e) => {
                setForm((f) => ({ ...f, reminderTime: e.target.value }));
                setTimeError("");
              }}
              className={`mt-1 ${timeError ? "border-[var(--color-status-danger)]/50" : ""}`}
              data-ocid="reminder.time_input"
            />
            {timeError && (
              <p
                className="mt-1 text-xs text-[var(--color-status-danger)] flex items-center gap-1"
                role="alert"
                data-ocid="reminder.time_input.field_error"
              >
                <XCircle size={11} className="shrink-0" />
                {timeError}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <Mic size={16} className="text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Voice Reminder
                </p>
                <p className="text-xs text-muted-foreground">
                  Speak the reminder aloud
                </p>
              </div>
            </div>
            <Switch
              id="voice-toggle-add"
              checked={form.voiceEnabled}
              onCheckedChange={(v) =>
                setForm((f) => ({ ...f, voiceEnabled: v }))
              }
              data-ocid="reminder.voice.toggle"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              data-ocid="reminder.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={!form.medicineId || loading}
              onClick={validateAndSave}
              data-ocid="reminder.add_button"
            >
              {loading ? "Saving..." : "Add Reminder"}
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

function getReminderBorderClass(r: Reminder): string {
  if (!r.isEnabled) return "border-l-4 border-l-border";
  const now = new Date();
  const [hours, minutes] = r.reminderTime.split(":").map(Number);
  const reminderDate = new Date();
  reminderDate.setHours(hours, minutes, 0, 0);
  if (reminderDate < now)
    return "border-l-4 border-l-[var(--color-status-danger)]";
  const diffMs = reminderDate.getTime() - now.getTime();
  if (diffMs <= 60 * 60 * 1000)
    return "border-l-4 border-l-[var(--color-status-warning)]";
  return "border-l-4 border-l-[var(--color-status-success)]";
}

export default function RemindersPage() {
  const { data: medicines = [] } = useMyMedicines();
  const { data: reminders = [], isLoading } = useMyReminders();
  const { create, update, remove } = useReminderMutation();
  const { data: myProfile } = useMyProfile();
  const { actor } = useActor(createActor);
  const [showAdd, setShowAdd] = useState(false);
  const [notifPermission, setNotifPermission] =
    useState<NotificationPermission>("default");
  const [hasTelegramConnected, setHasTelegramConnected] = useState(false);
  const _manualSectionRef = useRef<HTMLDivElement>(null);
  // Per-reminder telegram toggle: reminderId -> enabled
  const [telegramToggles, setTelegramToggles] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
      if (Notification.permission === "default") {
        Notification.requestPermission().then((p) => {
          setNotifPermission(p);
          if (p === "denied") {
            toast.warning(
              "Browser notifications blocked — reminders will still play a voice alert if supported",
            );
          }
        });
      }
    }
  }, []);

  // Derive Telegram connection status from user profile
  useEffect(() => {
    if (myProfile) {
      const connected =
        typeof myProfile.telegramChatId === "string" &&
        myProfile.telegramChatId.trim().length > 0;
      setHasTelegramConnected(connected);
    }
  }, [myProfile]);

  // Schedule active reminders — depends only on reminder/medicine data
  useEffect(() => {
    reminderService.cancelAll();
    for (const r of reminders) {
      if (r.isEnabled) {
        const med = medicines.find((m) => m.id === r.medicineId);
        if (med) {
          reminderService.schedule(
            r.id,
            r.reminderTime,
            med.name,
            med.dosage,
            r.voiceEnabled,
          );
        }
      }
    }
    return () => reminderService.cancelAll();
  }, [reminders, medicines]);

  // Telegram callbacks — separate effect; does NOT reschedule timers
  useEffect(() => {
    if (!hasTelegramConnected || !actor) return;
    const chatId = myProfile?.telegramChatId;
    if (!chatId) return;
    // Re-register Telegram callbacks for enabled reminders that have the toggle on
    for (const r of reminders) {
      if (r.isEnabled && (telegramToggles[r.id] ?? false)) {
        const med = medicines.find((m) => m.id === r.medicineId);
        if (med) {
          reminderService.schedule(
            r.id,
            r.reminderTime,
            med.name,
            med.dosage,
            r.voiceEnabled,
            () => {
              actor
                .sendTestTelegramMessage(chatId)
                .then((res) => {
                  if (res.__kind__ === "err") {
                    if (isDev)
                      console.warn(
                        "[MediVault] Telegram reminder failed:",
                        res.err,
                      );
                  }
                })
                .catch(
                  (e) =>
                    isDev && console.warn("[MediVault] Telegram call error", e),
                );
            },
          );
        }
      }
    }
  }, [
    hasTelegramConnected,
    telegramToggles,
    myProfile,
    actor,
    reminders,
    medicines,
  ]);

  const handleAdd = (form: AddForm) => {
    create.mutate(form, {
      onSuccess: (res) => {
        if (res.__kind__ === "ok") {
          toast.success("Reminder created");
          setShowAdd(false);
        } else toast.error(`Failed: ${res.err}`);
      },
      onError: (err) => {
        const msg = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Create reminder failed: ${msg}`, {
          action: { label: "Retry", onClick: () => handleAdd(form) },
        });
      },
    });
  };

  const handleToggleEnabled = (r: Reminder) => {
    update.mutate(
      {
        id: r.id,
        reminderTime: r.reminderTime,
        isEnabled: !r.isEnabled,
        voiceEnabled: r.voiceEnabled,
      },
      {
        onSuccess: (res) => {
          if (res.__kind__ === "err") toast.error(res.err);
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : "Unknown error";
          toast.error(`Update reminder failed: ${msg}`);
        },
      },
    );
  };

  const handleToggleVoice = (r: Reminder) => {
    update.mutate(
      {
        id: r.id,
        reminderTime: r.reminderTime,
        isEnabled: r.isEnabled,
        voiceEnabled: !r.voiceEnabled,
      },
      {
        onSuccess: (res) => {
          if (res.__kind__ === "err") toast.error(res.err);
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : "Unknown error";
          toast.error(`Update reminder failed: ${msg}`);
        },
      },
    );
  };

  const handleDelete = (id: string) => {
    remove.mutate(id, {
      onSuccess: () => toast.success("Reminder deleted"),
      onError: (err) => {
        const msg = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Delete reminder failed: ${msg}`, {
          action: { label: "Retry", onClick: () => handleDelete(id) },
        });
      },
    });
  };

  const handleTelegramToggle = (reminderId: string, value: boolean) => {
    setTelegramToggles((prev) => ({ ...prev, [reminderId]: value }));
  };

  const enabledCount = reminders.filter((r) => r.isEnabled).length;

  return (
    <div
      className="p-6 space-y-6 bg-[var(--color-bg-base)] min-h-screen"
      data-ocid="reminders.page"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reminders</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {enabledCount} active reminder{enabledCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          className="gap-2"
          data-ocid="reminders.add_button"
        >
          <Plus size={16} /> Add Reminder
        </Button>
      </div>

      {/* Notification permission banner */}
      {notifPermission !== "granted" && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--color-status-warning)]/30 bg-[var(--color-status-warning)]/10 p-4">
          <Bell
            size={18}
            className="text-[var(--color-status-warning)] shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-status-warning)]">
              Enable browser notifications
            </p>
            <p className="text-xs text-[var(--color-status-warning)]/70 mt-0.5">
              Allow notifications to receive medication reminders
            </p>
          </div>
          {notifPermission === "default" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-[var(--color-status-warning)]/40 text-[var(--color-status-warning)] hover:bg-[var(--color-status-warning)]/10"
              onClick={() =>
                Notification.requestPermission().then((p) =>
                  setNotifPermission(p),
                )
              }
              data-ocid="reminders.enable_notifications_button"
            >
              Enable
            </Button>
          )}
        </div>
      )}

      {/* Reminders List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="panel-depth-2 rounded-xl h-20 animate-pulse"
            />
          ))}
        </div>
      ) : reminders.length === 0 ? (
        <EmptyState
          icon={<BellOff />}
          title="No reminders set"
          description="Add a reminder to stay on track with your medications."
          action={{
            label: "Add First Reminder",
            onClick: () => setShowAdd(true),
          }}
          contextualHint="Reminders are set per medicine to help you maintain your dosage schedule. The system tracks completions, snoozes, and missed doses to build your adherence record."
          data-ocid="reminders.empty_state"
        />
      ) : (
        <div className="space-y-3">
          {reminders.map((r, idx) => {
            const med = medicines.find((m) => m.id === r.medicineId);
            return (
              <div
                key={r.id}
                className={`panel-depth-2 rounded-xl p-4 transition-all ${getReminderBorderClass(r)} ${
                  r.isEnabled
                    ? "border-primary/30 bg-primary/5"
                    : "border-border opacity-60"
                }`}
                data-ocid={`reminders.item.${idx + 1}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                        r.isEnabled ? "bg-primary/20" : "bg-muted/40"
                      }`}
                    >
                      <Bell
                        size={22}
                        className={
                          r.isEnabled ? "text-primary" : "text-muted-foreground"
                        }
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {med?.name ?? "Unknown Medicine"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock size={11} className="text-muted-foreground" />
                        <span className="text-2xl font-bold text-foreground">
                          {r.reminderTime}
                        </span>
                        {med && (
                          <Badge
                            variant="outline"
                            className="text-xs py-0 px-1.5"
                          >
                            {med.dosage}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleVoice(r)}
                      className={`p-1.5 rounded-lg transition-colors ${r.voiceEnabled ? "text-[var(--color-accent-teal)] bg-[var(--color-accent-teal)]/10" : "text-muted-foreground hover:text-foreground"}`}
                      aria-label={
                        r.voiceEnabled ? "Disable voice" : "Enable voice"
                      }
                      data-ocid={`reminders.voice_toggle.${idx + 1}`}
                    >
                      {r.voiceEnabled ? (
                        <Mic size={15} />
                      ) : (
                        <MicOff size={15} />
                      )}
                    </button>
                    {/* Telegram toggle — only visible when Telegram is connected */}
                    {hasTelegramConnected ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleTelegramToggle(
                            r.id,
                            !(telegramToggles[r.id] ?? false),
                          )
                        }
                        className={`p-1.5 rounded-lg transition-colors ${
                          telegramToggles[r.id]
                            ? "text-[var(--color-role-hospital)] bg-[var(--color-role-hospital)]/20 ring-1 ring-[var(--color-role-hospital)]/30"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        aria-label={
                          telegramToggles[r.id]
                            ? "Disable Telegram reminder"
                            : "Enable Telegram reminder"
                        }
                        title={
                          telegramToggles[r.id]
                            ? "Telegram reminder on"
                            : "Also notify via Telegram"
                        }
                        data-ocid={`reminders.telegram_toggle.${idx + 1}`}
                      >
                        <Send size={15} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="p-1.5 rounded-lg text-muted-foreground/30 cursor-not-allowed"
                        aria-label="Connect Telegram in Settings to enable"
                        title="Connect Telegram in Settings to enable"
                        data-ocid={`reminders.telegram_toggle.${idx + 1}`}
                      >
                        <Send size={15} />
                      </button>
                    )}
                    <Switch
                      id={`reminder-enabled-${r.id}`}
                      checked={r.isEnabled}
                      onCheckedChange={() => handleToggleEnabled(r)}
                      data-ocid={`reminders.toggle.${idx + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 rounded-lg text-[var(--color-status-danger)]/60 hover:text-[var(--color-status-danger)] hover:bg-[var(--color-status-danger)]/10 transition-colors"
                      aria-label="Delete reminder"
                      data-ocid={`reminders.delete_button.${idx + 1}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Phase 2 Placeholder */}
      <div className="glassmorphism border border-border rounded-xl p-5 opacity-70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center shrink-0">
            <Lock size={16} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground">
                WhatsApp Notifications
              </p>
              <Badge className="bg-[var(--color-role-diagnostic)]/20 text-[var(--color-role-diagnostic)] border-[var(--color-role-diagnostic)]/30 text-xs">
                Phase 2
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Receive reminders via WhatsApp even when the app is closed
            </p>
          </div>
          <MessageSquare
            size={18}
            className="text-muted-foreground/40 shrink-0"
          />
        </div>
      </div>

      {showAdd && (
        <AddReminderModal
          medicines={medicines}
          onSave={handleAdd}
          onClose={() => setShowAdd(false)}
          loading={create.isPending}
          existingReminders={reminders}
        />
      )}
    </div>
  );
}
