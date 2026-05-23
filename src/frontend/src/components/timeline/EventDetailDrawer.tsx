import type { ActivityEventView } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { deriveSeverityLabel } from "@/hooks/useAuditLog";
import { useAuth } from "@/hooks/useAuth";
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
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  ExternalLink,
  FlaskConical,
  Hash,
  Info,
  Package,
  Shield,
  User,
  XCircle,
  Zap,
} from "lucide-react";

const CATEGORY_COLORS = {
  success: "text-[var(--color-status-success)]",
  info: "text-[var(--color-status-info)]",
  warning: "text-[var(--color-status-warning)]",
  danger: "text-[var(--color-status-danger)]",
};

const SEVERITY_BADGE: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  critical: {
    bg: "bg-[var(--color-status-danger)]/15 border border-[var(--color-status-danger)]/40",
    text: "text-[var(--color-status-danger)]",
    label: "Critical",
  },
  alert: {
    bg: "bg-[var(--color-accent-amber)]/15 border border-[var(--color-accent-amber)]/40",
    text: "text-[var(--color-accent-amber)]",
    label: "Alert",
  },
  warning: {
    bg: "bg-[var(--color-status-warning)]/15 border border-[var(--color-status-warning)]/40",
    text: "text-[var(--color-status-warning)]",
    label: "Warning",
  },
  info: {
    bg: "bg-[var(--color-status-info)]/15 border border-[var(--color-status-info)]/40",
    text: "text-[var(--color-status-info)]",
    label: "Info",
  },
};

const ROLE_ACCENT: Record<string, string> = {
  Patient: "var(--color-role-patient)",
  Pharmacy: "var(--color-role-pharmacy)",
  Hospital: "var(--color-role-hospital)",
  Diagnostic: "var(--color-role-diagnostic)",
  Admin: "var(--color-role-admin)",
};

const CATEGORY_BG = {
  success:
    "bg-[var(--color-status-success)]/10 border-[var(--color-status-success)]/20",
  info: "bg-[var(--color-status-info)]/10 border-[var(--color-status-info)]/20",
  warning:
    "bg-[var(--color-status-warning)]/10 border-[var(--color-status-warning)]/20",
  danger:
    "bg-[var(--color-status-danger)]/10 border-[var(--color-status-danger)]/20",
};

const CATEGORY_ICONS = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  danger: XCircle,
};

function parseMetadata(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null)
      return parsed as Record<string, string>;
  } catch {}
  return {};
}

function MetaRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[var(--color-border-muted)] last:border-0">
      <div className="flex items-center gap-1.5 min-w-[120px] text-xs text-muted-foreground">
        {Icon && <Icon size={12} />}
        {label}
      </div>
      <span className="text-sm text-foreground flex-1 break-words">
        {value}
      </span>
    </div>
  );
}

interface EventDetailDrawerProps {
  event: ActivityEventView | null;
  open: boolean;
  onClose: () => void;
  userPrincipal?: string;
}

export function EventDetailDrawer({
  event,
  open,
  onClose,
  userPrincipal,
}: EventDetailDrawerProps) {
  const markRead = useMarkEventRead();

  if (!event) return null;

  const category = getEventCategory(event);
  const label = getEventLabel(event);
  const unread = isEventUnread(event, userPrincipal);
  const CatIcon = CATEGORY_ICONS[category];
  const ts = new Date(Number(event.timestamp) / 1_000_000);
  const meta = parseMetadata(event.metadata);
  const role = event.eventActor.role;
  const roleLabel = typeof role === "string" ? role : Object.keys(role)[0];
  const severity = deriveSeverityLabel(event);
  const severityStyle = SEVERITY_BADGE[severity] ?? SEVERITY_BADGE.info;
  const roleAccentColor = ROLE_ACCENT[roleLabel] ?? "var(--color-text-muted)";
  const actorShort = event.eventActor.principalId.toString().slice(0, 12);

  // Downstream impact from metadata
  const medicineName =
    meta.medicineName ?? meta.medicine_name ?? meta.name ?? null;
  const downstreamAction =
    meta.downstreamAction ??
    meta.downstream_action ??
    meta.impact ??
    meta.action ??
    null;

  const handleMarkRead = () => {
    markRead.mutate(event.id);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[440px] bg-[var(--color-bg-elevated)] backdrop-blur-xl border-l border-[var(--color-border-base)] p-0 flex flex-col"
        data-ocid="timeline.event_detail.sheet"
      >
        {/* Header */}
        <div
          className={cn(
            "px-6 pt-6 pb-4 border-b border-[var(--color-border-base)]",
            CATEGORY_BG[category],
          )}
        >
          <SheetHeader className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className={cn(
                    "p-2 rounded-lg bg-[var(--color-bg-surface)] flex-shrink-0",
                    CATEGORY_COLORS[category],
                  )}
                >
                  <CatIcon size={18} />
                </div>
                <SheetTitle className="text-base font-semibold text-foreground leading-snug">
                  {label}
                </SheetTitle>
              </div>
              {/* Severity badge */}
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1",
                  severityStyle.bg,
                  severityStyle.text,
                )}
                aria-label={`Severity: ${severityStyle.label}`}
              >
                <AlertTriangle size={9} />
                {severityStyle.label}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Actor role chip with role accent color */}
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border"
                style={{
                  background: `color-mix(in oklch, ${roleAccentColor} 15%, transparent)`,
                  color: roleAccentColor,
                  borderColor: `color-mix(in oklch, ${roleAccentColor} 40%, transparent)`,
                }}
              >
                <User size={9} />
                {roleLabel}
              </span>
              {unread && (
                <Badge className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-status-info)]/15 text-[var(--color-status-info)] border-[var(--color-status-info)]/30">
                  Unread
                </Badge>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock size={11} />
                {formatDistanceToNow(ts, { addSuffix: true })}
              </span>
            </div>
          </SheetHeader>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-1">
            <MetaRow
              label="Timestamp"
              icon={Calendar}
              value={format(ts, "PPpp")}
            />
            <MetaRow label="Event ID" icon={Hash} value={event.id} />
            {event.resourceId && (
              <MetaRow
                label="Resource ID"
                icon={Package}
                value={event.resourceId}
              />
            )}

            {/* Parsed metadata fields */}
            {Object.keys(meta).length > 0 && (
              <>
                <Separator className="my-3 bg-[var(--color-border-muted)]" />
                <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">
                  Context
                </p>
                {Object.entries(meta).map(([k, v]) => (
                  <MetaRow
                    key={k}
                    label={k
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                    value={String(v)}
                  />
                ))}
              </>
            )}

            {/* Actor section with role accent */}
            <Separator className="my-3 bg-[var(--color-border-muted)]" />
            <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">
              Actor
            </p>
            <div className="flex items-center gap-3 py-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: `color-mix(in oklch, ${roleAccentColor} 15%, transparent)`,
                  color: roleAccentColor,
                }}
              >
                <Shield size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-foreground truncate">
                  {actorShort}…
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5"
                  style={{
                    background: `color-mix(in oklch, ${roleAccentColor} 12%, transparent)`,
                    color: roleAccentColor,
                  }}
                >
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Downstream Impact */}
        {(medicineName ?? downstreamAction) && (
          <div className="px-6 py-3 border-t border-[var(--color-border-base)] bg-[var(--color-bg-surface)]">
            <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2 flex items-center gap-1">
              <Zap size={9} />
              Downstream Impact
            </p>
            <div className="space-y-1.5">
              {medicineName && (
                <div className="flex items-center gap-2">
                  <Package
                    size={11}
                    className="text-[var(--color-text-muted)] flex-shrink-0"
                  />
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    <span className="text-[var(--color-text-muted)] mr-1">
                      Medicine:
                    </span>
                    {medicineName}
                  </span>
                </div>
              )}
              {downstreamAction && (
                <div className="flex items-start gap-2">
                  <Activity
                    size={11}
                    className="text-[var(--color-text-muted)] flex-shrink-0 mt-0.5"
                  />
                  <span className="text-xs text-[var(--color-text-secondary)] leading-snug">
                    <span className="text-[var(--color-text-muted)] mr-1">
                      Action:
                    </span>
                    {downstreamAction}
                  </span>
                </div>
              )}
              {event.resourceId && !medicineName && (
                <div className="flex items-center gap-2">
                  <Hash
                    size={11}
                    className="text-[var(--color-text-muted)] flex-shrink-0"
                  />
                  <span className="text-xs text-[var(--color-text-muted)] font-mono truncate">
                    Resource: {event.resourceId.slice(0, 20)}…
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--color-border-base)] flex items-center gap-3">
          {unread && (
            <Button
              type="button"
              size="sm"
              onClick={handleMarkRead}
              disabled={markRead.isPending}
              className="flex-1 bg-[var(--color-status-info)]/15 text-[var(--color-status-info)] border border-[var(--color-status-info)]/30 hover:bg-[var(--color-status-info)]/25 text-xs"
              data-ocid="timeline.mark_read.button"
            >
              <CheckCircle size={13} className="mr-1.5" />
              {markRead.isPending ? "Marking…" : "Mark as Read"}
            </Button>
          )}
          {event.resourceId && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex-1 text-xs border-[var(--color-border-base)] hover:border-[var(--color-border-strong)]"
              onClick={() => {
                window.history.pushState(
                  {},
                  "",
                  `/lifecycle?medicineId=${event.resourceId}`,
                );
                window.dispatchEvent(new PopStateEvent("popstate"));
                onClose();
              }}
              data-ocid="timeline.view_lifecycle.button"
            >
              <Activity size={13} className="mr-1.5" />
              View Lifecycle
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-xs text-muted-foreground"
            data-ocid="timeline.event_detail.close_button"
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
