import type { ActivityEventView } from "@/backend";
import { useMedicineLcChain } from "@/hooks/useTimeline";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

const LIFECYCLE_STAGES = [
  { key: "synced", label: "Synced" },
  { key: "inventory", label: "In Inventory" },
  { key: "reminders", label: "Reminders" },
  { key: "doses", label: "Doses Logged" },
  { key: "adherence", label: "Adherence" },
];

function getStageFills(events: ActivityEventView[]) {
  const keys = events.map((e) => Object.keys(e.eventType)[0]);
  const hasSynced = keys.some((k) =>
    ["MedicineSyncedFromPharmacy", "MedicineAddedManually"].includes(k),
  );
  const hasInventory = hasSynced;
  const hasReminders = keys.some((k) =>
    ["ReminderCreated", "ReminderCompleted"].includes(k),
  );
  const hasDoses = keys.some((k) => ["DoseMarkedTaken"].includes(k));
  const hasAdherence = hasDoses;
  return [hasSynced, hasInventory, hasReminders, hasDoses, hasAdherence];
}

interface LifecycleInlinePreviewProps {
  medicineId: string;
  medicineName?: string;
}

export function LifecycleInlinePreview({
  medicineId,
  medicineName,
}: LifecycleInlinePreviewProps) {
  const navigate = useNavigate();
  const { data: chainEvents, isLoading } = useMedicineLcChain(medicineId);

  const fills = chainEvents ? getStageFills(chainEvents) : [];
  const activeIndex = fills.lastIndexOf(true);

  return (
    <div className="space-y-2" data-ocid="lifecycle_preview.widget">
      {medicineName && (
        <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider truncate">
          {medicineName}
        </p>
      )}
      <div className="flex items-center gap-0">
        {isLoading
          ? LIFECYCLE_STAGES.map((s) => (
              <div key={s.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className="w-3.5 h-3.5 rounded-full bg-[var(--color-bg-muted)] animate-pulse" />
                  <span className="text-[9px] text-[var(--color-text-muted)]/40">
                    {s.label}
                  </span>
                </div>
                <div className="flex-1 h-px bg-[var(--color-border-muted)] mx-1" />
              </div>
            ))
          : LIFECYCLE_STAGES.map((s, i) => {
              const filled = fills[i] ?? false;
              const isLast = i === LIFECYCLE_STAGES.length - 1;
              const isCurrent = i === activeIndex;
              return (
                <div key={s.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div
                      className={cn(
                        "w-3.5 h-3.5 rounded-full border transition-all duration-[var(--duration-slow)]",
                        filled && !isCurrent
                          ? "bg-[var(--color-status-success)] border-[var(--color-status-success)]"
                          : isCurrent
                            ? "bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)] shadow-[0_0_5px_oklch(var(--color-brand-primary)/0.4)]"
                            : "bg-transparent border-[var(--color-border-base)]",
                      )}
                    />
                    <span
                      className={cn(
                        "text-[8px] whitespace-nowrap leading-none",
                        filled
                          ? "text-[var(--color-status-success)]"
                          : isCurrent
                            ? "text-[var(--color-brand-primary)]"
                            : "text-[var(--color-text-muted)]/40",
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={cn(
                        "flex-1 h-px mx-0.5 transition-all duration-[var(--duration-slow)]",
                        filled && (fills[i + 1] ?? false)
                          ? "bg-[var(--color-status-success)]/50"
                          : isCurrent
                            ? "bg-[var(--color-brand-primary)]/30"
                            : "bg-[var(--color-border-muted)]",
                      )}
                    />
                  )}
                </div>
              );
            })}
      </div>
      <button
        type="button"
        onClick={() => navigate({ to: "/lifecycle", search: { medicineId } })}
        className="flex items-center gap-1 text-[10px] text-[var(--color-accent-teal)]/70 hover:text-[var(--color-accent-teal)] transition-colors duration-[var(--duration-base)]"
        data-ocid="lifecycle_preview.view_full.link"
      >
        Full lifecycle <ChevronRight size={9} />
      </button>
    </div>
  );
}
