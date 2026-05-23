import type { ActivityEventView } from "@/backend";
import { EmptyState } from "@/components/common/EmptyState";
import { TimelineEventsSkeleton } from "@/components/common/LoadingSpinner";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { EventDetailDrawer } from "@/components/timeline/EventDetailDrawer";
import { TimelineEventCard } from "@/components/timeline/TimelineEventCard";
import { TimelineFilters } from "@/components/timeline/TimelineFilters";
import { Button } from "@/components/ui/button";
import {
  type AuditLogFilters,
  DEFAULT_AUDIT_FILTERS,
  useAuditLog,
} from "@/hooks/useAuditLog";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Activity, Download, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

export default function ActivityTimelinePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as {
    role?: string;
    severity?: string;
    fromDate?: string;
    toDate?: string;
    datePreset?: string;
    search?: string;
  };

  const [filters, setFilters] = useState<AuditLogFilters>(() => ({
    ...DEFAULT_AUDIT_FILTERS,
    role:
      (searchParams.role as AuditLogFilters["role"]) ??
      DEFAULT_AUDIT_FILTERS.role,
    severity:
      (searchParams.severity as AuditLogFilters["severity"]) ??
      DEFAULT_AUDIT_FILTERS.severity,
    fromDate: searchParams.fromDate ?? DEFAULT_AUDIT_FILTERS.fromDate,
    toDate: searchParams.toDate ?? DEFAULT_AUDIT_FILTERS.toDate,
    datePreset:
      (searchParams.datePreset as AuditLogFilters["datePreset"]) ??
      DEFAULT_AUDIT_FILTERS.datePreset,
    search: searchParams.search ?? DEFAULT_AUDIT_FILTERS.search,
  }));

  const [selectedEvent, setSelectedEvent] = useState<ActivityEventView | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Persist filters to URL
  useEffect(() => {
    const params: Record<string, string> = {};
    if (filters.search) params.search = filters.search;
    if (filters.role !== "all") params.role = filters.role;
    if (filters.severity !== "all") params.severity = filters.severity;
    if (filters.datePreset !== "all") params.datePreset = filters.datePreset;
    if (filters.fromDate) params.fromDate = filters.fromDate;
    if (filters.toDate) params.toDate = filters.toDate;
    navigate({ search: params as any, replace: true }).catch(() => {});
  }, [filters, navigate]);

  const { data: events = [], isLoading, refetch } = useAuditLog(filters);

  const handleEventClick = (ev: ActivityEventView) => {
    setSelectedEvent(ev);
    setDrawerOpen(true);
  };

  const handleExport = () => {
    const csv = [
      ["ID", "Event", "Role", "Timestamp", "Resource"].join(","),
      ...events.map((ev) =>
        [
          ev.id,
          Object.keys(ev.eventType)[0],
          typeof ev.eventActor.role === "string"
            ? ev.eventActor.role
            : Object.keys(ev.eventActor.role)[0],
          new Date(Number(ev.timestamp) / 1_000_000).toISOString(),
          ev.resourceId ?? "",
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const userPrincipal = user?.principal?.toString();

  return (
    <div
      className="flex flex-col h-full min-h-screen bg-[var(--color-bg-base)]"
      data-ocid="timeline.page"
    >
      {/* Page header */}
      <div className="px-6 py-5 border-b border-[var(--color-border-base)] bg-card backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-role-patient)]/15 flex items-center justify-center border border-[var(--color-role-patient)]/25">
              <Activity
                size={20}
                className="text-[var(--color-role-patient)]"
              />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-[var(--color-text-primary)]">
                Audit Log
              </h1>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Compliance-grade operational history
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-base)] text-[var(--color-text-secondary)] font-mono">
              {isLoading
                ? "…"
                : `${events.length} event${events.length !== 1 ? "s" : ""}`}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isLoading || events.length === 0}
              className="gap-1.5 text-xs h-8"
              data-ocid="timeline.export_button"
            >
              <Download size={13} /> Export CSV
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="h-8 w-8 p-0"
              data-ocid="timeline.refresh_button"
              aria-label="Refresh"
            >
              <RefreshCw size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky filter bar */}
      <TimelineFilters
        filters={filters}
        onChange={setFilters}
        totalCount={events.length}
        isLoading={isLoading}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <TimelineEventsSkeleton />
        ) : events.length === 0 ? (
          <div className="px-4 py-8">
            <EmptyState
              icon={<Activity />}
              title="No audit events found"
              description="Adjust your filters or wait for new events. All healthcare operations are tracked here."
              contextualHint="Your activity timeline builds automatically as you interact with the platform — logging doses, granting consent, receiving reminders, or generating reports all create traceable audit events."
            />
          </div>
        ) : (
          <div className="py-4 px-4 space-y-2">
            {events.map((ev, i) => (
              <TimelineEventCard
                key={ev.id}
                event={ev}
                userPrincipal={userPrincipal}
                onClick={handleEventClick}
                index={i + 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Event detail drawer */}
      <EventDetailDrawer
        event={selectedEvent}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userPrincipal={userPrincipal}
      />
    </div>
  );
}
