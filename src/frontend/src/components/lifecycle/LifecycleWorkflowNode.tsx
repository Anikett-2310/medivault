import type { ActivityEventView } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";

export type NodeStatus = "completed" | "active" | "pending" | "warning";

const ROLE_ACCENT: Record<string, string> = {
  Patient: "var(--color-role-patient)",
  Pharmacy: "var(--color-role-pharmacy)",
  Hospital: "var(--color-role-hospital)",
  Diagnostic: "var(--color-role-diagnostic)",
  Admin: "var(--color-role-admin)",
};

const ROLE_BADGE_CLASS: Record<string, string> = {
  Patient:
    "bg-[var(--color-role-patient)]/15 text-[var(--color-role-patient)] border-[var(--color-role-patient)]/30",
  Pharmacy:
    "bg-[var(--color-role-pharmacy)]/15 text-[var(--color-role-pharmacy)] border-[var(--color-role-pharmacy)]/30",
  Hospital:
    "bg-[var(--color-role-hospital)]/15 text-[var(--color-role-hospital)] border-[var(--color-role-hospital)]/30",
  Diagnostic:
    "bg-[var(--color-role-diagnostic)]/15 text-[var(--color-role-diagnostic)] border-[var(--color-role-diagnostic)]/30",
  Admin:
    "bg-[var(--color-role-admin)]/15 text-[var(--color-role-admin)] border-[var(--color-role-admin)]/30",
};

const STATUS_CONFIG = {
  completed: {
    ring: "ring-2 ring-[var(--color-status-success)]/50",
    iconBg: "bg-[var(--color-status-success)]/15",
    iconColor: "text-[var(--color-status-success)]",
    dot: "bg-[var(--color-status-success)]",
    label: "Completed",
    labelClass: "text-[var(--color-status-success)]",
    StatusIcon: CheckCircle2,
  },
  active: {
    ring: "ring-2 ring-[var(--color-status-info)]/50",
    iconBg: "bg-[var(--color-status-info)]/15",
    iconColor: "text-[var(--color-status-info)]",
    dot: "bg-[var(--color-status-info)] animate-pulse [will-change:transform]",
    label: "Active",
    labelClass: "text-[var(--color-status-info)]",
    StatusIcon: Activity,
  },
  warning: {
    ring: "ring-2 ring-[var(--color-status-warning)]/50",
    iconBg: "bg-[var(--color-status-warning)]/15",
    iconColor: "text-[var(--color-status-warning)]",
    dot: "bg-[var(--color-status-warning)] animate-pulse [will-change:transform]",
    label: "Warning",
    labelClass: "text-[var(--color-status-warning)]",
    StatusIcon: AlertTriangle,
  },
  pending: {
    ring: "ring-1 ring-[var(--color-border-base)]",
    iconBg: "bg-[var(--color-bg-muted)]",
    iconColor: "text-[var(--color-text-muted)]",
    dot: "bg-[var(--color-border-base)]",
    label: "Pending",
    labelClass: "text-[var(--color-text-muted)]",
    StatusIcon: Clock,
  },
} as const;

interface LifecycleWorkflowNodeProps {
  /** Icon component for this stage */
  icon: React.ComponentType<{ size?: number; className?: string }>;
  /** Stage name */
  stageName: string;
  /** Status of this stage */
  status: NodeStatus;
  /** Primary actor role (from the first event) */
  actorRole?: string;
  /** Timestamp of the latest event in this stage */
  latestTimestamp?: bigint;
  /** Number of events in this stage */
  eventCount: number;
  /** Whether the events list is expanded */
  isExpanded: boolean;
  /** Toggle expand/collapse */
  onToggle: () => void;
  /** Doses missed count — shows adherence warning badge if > 0 */
  dosesAdherenceMissed?: number;
  /** Pharmacy source name from metadata */
  pharmacySource?: string;
  /** Events to render in expanded drawer */
  events: ActivityEventView[];
  /** Stage accent color (CSS variable reference string) */
  accentColor: string;
}

function EventRow({ ev }: { ev: ActivityEventView }) {
  const ts = new Date(Number(ev.timestamp) / 1_000_000);
  const role =
    typeof ev.eventActor.role === "string"
      ? ev.eventActor.role
      : Object.keys(ev.eventActor.role)[0];
  const accent = ROLE_ACCENT[role] ?? "var(--color-text-muted)";
  const badgeClass =
    ROLE_BADGE_CLASS[role] ?? "bg-muted text-muted-foreground border-border";
  const key = Object.keys(ev.eventType)[0];

  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-[var(--color-border-muted)] last:border-0">
      <div
        className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
        style={{ background: accent }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-[var(--color-text-primary)] truncate">
            {key.replace(/([A-Z])/g, " $1").trim()}
          </span>
          <Badge
            variant="outline"
            className={cn("text-[9px] px-1.5 py-0 h-4 border", badgeClass)}
          >
            {role}
          </Badge>
        </div>
        <p
          className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5"
          title={format(ts, "PPpp")}
        >
          {formatDistanceToNow(ts, { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

export function LifecycleWorkflowNode({
  icon: Icon,
  stageName,
  status,
  actorRole,
  latestTimestamp,
  eventCount,
  isExpanded,
  onToggle,
  dosesAdherenceMissed = 0,
  pharmacySource,
  events,
  accentColor,
}: LifecycleWorkflowNodeProps) {
  const cfg = STATUS_CONFIG[status];
  const { StatusIcon } = cfg;
  const ts = latestTimestamp
    ? new Date(Number(latestTimestamp) / 1_000_000)
    : null;
  const actorBadgeClass = actorRole
    ? (ROLE_BADGE_CLASS[actorRole] ??
      "bg-muted text-muted-foreground border-border")
    : "";

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-[var(--color-bg-elevated)] transition-all duration-200",
        "hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-active)]",
        cfg.ring,
        status === "pending" && "opacity-60",
      )}
      style={{ willChange: "transform" }}
      data-ocid={`lifecycle.stage.${stageName.toLowerCase().replace(/\s+/g, "_")}`}
    >
      {/* Node header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        aria-expanded={isExpanded}
        disabled={eventCount === 0}
      >
        {/* Stage icon */}
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
            cfg.iconBg,
          )}
          style={{ color: accentColor }}
        >
          <Icon size={17} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
              {stageName}
            </span>
            {/* Status badge */}
            <span className={cn("text-[10px] font-medium", cfg.labelClass)}>
              <StatusIcon size={10} className="inline mr-0.5" />
              {cfg.label}
            </span>
            {/* Event count badge */}
            {eventCount > 0 && (
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 py-0 h-4 ml-auto border-[var(--color-border-base)] text-[var(--color-text-muted)]"
              >
                {eventCount} event{eventCount !== 1 ? "s" : ""}
              </Badge>
            )}
            {/* Adherence warning */}
            {dosesAdherenceMissed > 0 && (
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 py-0 h-4 bg-[var(--color-status-warning)]/10 text-[var(--color-status-warning)] border-[var(--color-status-warning)]/30"
              >
                <AlertTriangle size={8} className="mr-0.5" />
                {dosesAdherenceMissed} missed
              </Badge>
            )}
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-3 mt-1 flex-wrap sm:flex-nowrap">
            {actorRole && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] px-1.5 py-0 h-4 border",
                  actorBadgeClass,
                )}
              >
                {actorRole}
              </Badge>
            )}
            {ts && (
              <span
                className="text-[10px] text-[var(--color-text-tertiary)]"
                title={format(ts, "PPpp")}
              >
                {formatDistanceToNow(ts, { addSuffix: true })}
              </span>
            )}
            {pharmacySource && (
              <span className="text-[10px] text-[var(--color-accent-teal)] truncate max-w-[120px]">
                via {pharmacySource}
              </span>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        {eventCount > 0 && (
          <span className="text-[var(--color-text-muted)] flex-shrink-0">
            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </span>
        )}
      </button>

      {/* Expanded events drawer */}
      {isExpanded && eventCount > 0 && (
        <div className="px-4 pb-4 pt-1 border-t border-[var(--color-border-muted)]">
          <div className="ml-12 space-y-0">
            {events.map((ev) => (
              <EventRow key={ev.id} ev={ev} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
