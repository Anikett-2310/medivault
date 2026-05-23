import type { ActivityEventView } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { deriveSeverityLabel } from "@/hooks/useAuditLog";
import {
  getEventCategory,
  getEventLabel,
  isEventUnread,
} from "@/hooks/useTimeline";
import { useMarkEventRead } from "@/hooks/useTimeline";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Clock,
  FlaskConical,
  Info,
  Package,
  Pill,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { LifecycleInlinePreview } from "./LifecycleInlinePreview";

export type EventCategory = "success" | "info" | "warning" | "danger";

const BORDER_COLORS: Record<EventCategory, string> = {
  success: "border-l-[var(--color-status-success)]",
  info: "border-l-[var(--color-status-info)]",
  warning: "border-l-[var(--color-status-warning)]",
  danger: "border-l-[var(--color-status-danger)]",
};

const ICON_COLORS: Record<EventCategory, string> = {
  success:
    "text-[var(--color-status-success)] bg-[var(--color-status-success)]/12",
  info: "text-[var(--color-status-info)] bg-[var(--color-status-info)]/12",
  warning:
    "text-[var(--color-status-warning)] bg-[var(--color-status-warning)]/12",
  danger:
    "text-[var(--color-status-danger)] bg-[var(--color-status-danger)]/12",
};

const CATEGORY_ICONS: Record<
  EventCategory,
  React.ComponentType<{ size?: number }>
> = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  danger: XCircle,
};

function getEventIcon(
  ev: ActivityEventView,
): React.ComponentType<{ size?: number }> {
  const key = Object.keys(ev.eventType)[0];
  const map: Record<string, React.ComponentType<{ size?: number }>> = {
    MedicineSyncedFromPharmacy: RefreshCw,
    MedicineSyncedToPatient: RefreshCw,
    MedicineAddedManually: Pill,
    MedicineSold: Package,
    ReminderCreated: Clock,
    ReminderCompleted: CheckCircle,
    ReminderMissed: XCircle,
    DoseMarkedTaken: Activity,
    DiagnosticBooked: FlaskConical,
    ReportUploaded: ShieldCheck,
    ReportCompleted: CheckCircle,
    ConsentGranted: UserCheck,
    ConsentRevoked: XCircle,
    ExpiryAlertTriggered: AlertTriangle,
    ExpiryWarningTriggered: AlertTriangle,
    QRScanCompleted: Zap,
  };
  return map[key] ?? Info;
}

function getEventDescription(ev: ActivityEventView): string {
  try {
    const meta = ev.metadata
      ? (JSON.parse(ev.metadata) as Record<string, string>)
      : {};
    const key = Object.keys(ev.eventType)[0];
    if (key === "MedicineSyncedFromPharmacy" && meta.pharmacyName)
      return `Synced from ${meta.pharmacyName}`;
    if (key === "MedicineSyncedToPatient" && meta.patientPhone)
      return `Synced to patient (${meta.patientPhone})`;
    if (key === "ReminderCompleted" && meta.medicineName)
      return `${meta.medicineName} — dose reminder completed`;
    if (key === "DoseMarkedTaken" && meta.medicineName)
      return `Marked dose taken for ${meta.medicineName}`;
    if (key === "DiagnosticBooked" && meta.testType)
      return `${meta.testType} test booked`;
    if (key === "ReportUploaded" && meta.testType)
      return `${meta.testType} report uploaded`;
    if (meta.medicineName) return meta.medicineName;
    if (meta.description) return meta.description;
  } catch {}
  return "";
}

interface TimelineEventCardProps {
  event: ActivityEventView;
  userPrincipal?: string;
  onClick: (ev: ActivityEventView) => void;
  index: number;
}

export function TimelineEventCard({
  event,
  userPrincipal,
  onClick,
  index,
}: TimelineEventCardProps) {
  const category = getEventCategory(event);
  const label = getEventLabel(event);
  const description = getEventDescription(event);
  const unread = isEventUnread(event, userPrincipal);
  const EventIcon = getEventIcon(event);
  const _CatIcon = CATEGORY_ICONS[category];
  const ts = new Date(Number(event.timestamp) / 1_000_000);
  const markRead = useMarkEventRead();
  const hasResource = !!event.resourceId;

  const handleClick = () => {
    onClick(event);
    if (unread) {
      markRead.mutate(event.id);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      className={cn(
        "relative flex gap-3 px-4 py-3.5 rounded-xl border-l-4 cursor-pointer w-full text-left",
        "card-operational border-[var(--color-border-base)] hover:border-[var(--color-border-strong)] transition-all duration-[var(--duration-base)]",
        "hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]",
        BORDER_COLORS[category],
        unread &&
          "bg-[var(--color-status-info)]/5 border-[var(--color-status-info)]/20",
      )}
      style={{ willChange: "transform" }}
      data-ocid={`timeline.event.${index}`}
      aria-label={label}
    >
      {/* Unread dot */}
      {unread && (
        <span className="absolute top-3.5 right-3.5 w-1.5 h-1.5 rounded-full bg-[var(--color-status-info)]" />
      )}

      {/* Icon */}
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
          ICON_COLORS[category],
        )}
      >
        <EventIcon size={16} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(() => {
              const sev = deriveSeverityLabel(event);
              const sevDotColor: Record<string, string> = {
                critical: "bg-[var(--color-status-danger)]",
                alert: "bg-[var(--color-status-warning)]",
                warning: "bg-[var(--color-status-warning)]/70",
                info: "bg-[var(--color-text-tertiary)]/50",
              };
              const sevTextColor: Record<string, string> = {
                critical:
                  "text-[var(--color-status-danger)] border-[var(--color-status-danger)]/30 bg-[var(--color-status-danger)]/10",
                alert:
                  "text-[var(--color-status-warning)] border-[var(--color-status-warning)]/30 bg-[var(--color-status-warning)]/10",
                warning:
                  "text-[var(--color-status-warning)]/70 border-[var(--color-status-warning)]/20 bg-transparent",
                info: "text-[var(--color-text-tertiary)] border-[var(--color-border-muted)] bg-[var(--color-bg-muted)]",
              };
              return (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border uppercase tracking-wide",
                    sevTextColor[sev] ?? sevTextColor.info,
                  )}
                  aria-label={`Severity: ${sev}`}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      sevDotColor[sev] ?? sevDotColor.info,
                    )}
                  />
                  {sev}
                </span>
              );
            })()}
            <span
              className={cn(
                "text-sm font-medium leading-snug",
                unread
                  ? "text-[var(--color-text-primary)]"
                  : "text-[var(--color-text-primary)]",
              )}
            >
              {label}
            </span>
          </div>
          <time
            className="text-tabular text-[11px] text-[var(--color-text-tertiary)] whitespace-nowrap flex-shrink-0"
            title={format(ts, "PPpp")}
            dateTime={ts.toISOString()}
          >
            {formatDistanceToNow(ts, { addSuffix: true })}
          </time>
        </div>

        {description && (
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-1">
            {description}
          </p>
        )}

        {/* Actor attribution */}
        {(() => {
          const actorRole =
            typeof event.eventActor.role === "string"
              ? event.eventActor.role
              : Object.keys(event.eventActor.role)[0];
          const principalShort = `${event.eventActor.principalId.toString().slice(0, 8)}...`;
          const roleColorMap: Record<string, string> = {
            Patient:
              "text-[var(--color-role-patient)] bg-[var(--color-role-patient)]/10 border-[var(--color-role-patient)]/30",
            Pharmacy:
              "text-[var(--color-role-pharmacy)] bg-[var(--color-role-pharmacy)]/10 border-[var(--color-role-pharmacy)]/30",
            Hospital:
              "text-[var(--color-role-hospital)] bg-[var(--color-role-hospital)]/10 border-[var(--color-role-hospital)]/30",
            Diagnostic:
              "text-[var(--color-role-diagnostic)] bg-[var(--color-role-diagnostic)]/10 border-[var(--color-role-diagnostic)]/30",
            Admin:
              "text-[var(--color-role-admin)] bg-[var(--color-role-admin)]/10 border-[var(--color-role-admin)]/30",
          };
          const roleChipClass =
            roleColorMap[actorRole] ??
            "text-[var(--color-text-tertiary)] bg-[var(--color-bg-muted)] border-[var(--color-border-muted)]";
          return (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
                {principalShort}
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded-md border",
                  roleChipClass,
                )}
              >
                {actorRole}
              </span>
            </div>
          );
        })()}

        <div className="flex items-center gap-2 mt-1">
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-4 border-[var(--color-border-muted)] text-[var(--color-text-tertiary)] bg-[var(--color-bg-muted)]"
          >
            {typeof event.eventActor.role === "string"
              ? event.eventActor.role
              : Object.keys(event.eventActor.role)[0]}
          </Badge>
          {hasResource && (
            <span className="text-[10px] text-[var(--color-accent-teal)] flex items-center gap-0.5">
              <Activity size={9} /> Medicine linked
            </span>
          )}
          <ChevronRight
            size={12}
            className="ml-auto text-[var(--color-text-tertiary)]/50"
          />
        </div>

        {/* Inline lifecycle preview for medicine events */}
        {hasResource && event.resourceId && (
          <LifecycleInlinePreview
            medicineId={event.resourceId}
            medicineName={(() => {
              try {
                const m = event.metadata
                  ? (JSON.parse(event.metadata) as Record<string, string>)
                  : {};
                return m.medicineName;
              } catch {
                return undefined;
              }
            })()}
          />
        )}
      </div>
    </button>
  );
}
