import { useWorkflowChain } from "@/hooks/useLifecycle";
import { Link } from "@tanstack/react-router";
import { Activity, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface LifecycleInlinePreviewProps {
  medicineId: string;
  medicineName?: string;
}

export function LifecycleInlinePreview({
  medicineId,
  medicineName,
}: LifecycleInlinePreviewProps) {
  const { data: chain, isLoading } = useWorkflowChain(medicineId);

  if (isLoading) {
    return (
      <div className="mt-2 h-6 rounded bg-[var(--color-bg-muted)] animate-pulse" />
    );
  }

  if (!chain?.stages.length) return null;

  const completed = chain.stages.filter(
    (s) => s.status.toLowerCase() === "completed",
  ).length;
  const total = chain.stages.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const hasWarning = chain.stages.some(
    (s) =>
      s.status.toLowerCase() === "warning" ||
      s.status.toLowerCase() === "at_risk",
  );
  const totalEvents = chain.stages.reduce((s, st) => s + st.events.length, 0);

  return (
    <Link
      to="/lifecycle"
      search={{ medicineId }}
      className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-muted)] hover:border-[var(--color-border-base)] transition-colors group"
      data-ocid="lifecycle.inline_preview"
      aria-label={`View lifecycle for ${medicineName ?? medicineId}`}
    >
      <div className="w-6 h-6 rounded-md bg-[var(--color-role-patient)]/15 flex items-center justify-center flex-shrink-0">
        <Activity size={11} className="text-[var(--color-role-patient)]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">
            Lifecycle
          </span>
          {hasWarning ? (
            <AlertTriangle
              size={10}
              className="text-[var(--color-status-warning)]"
            />
          ) : pct === 100 ? (
            <CheckCircle
              size={10}
              className="text-[var(--color-status-success)]"
            />
          ) : (
            <Clock size={10} className="text-[var(--color-text-muted)]" />
          )}
          <span className="text-[10px] text-[var(--color-text-tertiary)]">
            {totalEvents} event{totalEvents !== 1 ? "s" : ""}
          </span>
        </div>
        {/* Mini progress bar */}
        <div className="w-full h-1 bg-[var(--color-bg-muted)] rounded-full mt-1 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 bg-[var(--color-role-patient)]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="text-[10px] font-mono text-[var(--color-text-muted)] flex-shrink-0">
        {pct}%
      </span>
    </Link>
  );
}
