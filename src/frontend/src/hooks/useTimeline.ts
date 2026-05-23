import {
  ActivityEventType,
  type ActivityEventView,
  createActor,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

export type DateGroup = "today" | "yesterday" | "thisWeek" | "earlier";

export interface TimelineFiltersState {
  search: string;
  eventTypes: ActivityEventType[];
  datePreset: "24h" | "7d" | "30d" | "all";
}

export interface GroupedTimeline {
  today: ActivityEventView[];
  yesterday: ActivityEventView[];
  thisWeek: ActivityEventView[];
  earlier: ActivityEventView[];
}

const PAGE_SIZE = 20;

function useBackendActor() {
  return useActor(createActor);
}

function groupByDate(events: ActivityEventView[]): GroupedTimeline {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const yesterdayStart = todayStart - 86400000;
  const weekStart = todayStart - 6 * 86400000;

  const grouped: GroupedTimeline = {
    today: [],
    yesterday: [],
    thisWeek: [],
    earlier: [],
  };
  for (const ev of events) {
    const ts = Number(ev.timestamp) / 1_000_000; // ns → ms
    if (ts >= todayStart) grouped.today.push(ev);
    else if (ts >= yesterdayStart) grouped.yesterday.push(ev);
    else if (ts >= weekStart) grouped.thisWeek.push(ev);
    else grouped.earlier.push(ev);
  }
  return grouped;
}

function filterEvents(
  events: ActivityEventView[],
  filters: TimelineFiltersState,
  _userPrincipal?: string,
): ActivityEventView[] {
  const now = Date.now();
  const cutoffMs: Record<TimelineFiltersState["datePreset"], number> = {
    "24h": now - 86400000,
    "7d": now - 7 * 86400000,
    "30d": now - 30 * 86400000,
    all: 0,
  };
  const cutoff = cutoffMs[filters.datePreset];

  return events.filter((ev) => {
    const ts = Number(ev.timestamp) / 1_000_000;
    if (cutoff > 0 && ts < cutoff) return false;

    if (filters.eventTypes.length > 0) {
      const evKey = Object.keys(ev.eventType)[0] as ActivityEventType;
      if (!filters.eventTypes.includes(evKey)) return false;
    }

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      const label = getEventLabel(ev).toLowerCase();
      const meta = ev.metadata ?? "";
      const rid = ev.resourceId ?? "";
      if (!label.includes(q) && !meta.includes(q) && !rid.includes(q))
        return false;
    }

    return true;
  });
}

export function getEventLabel(ev: ActivityEventView): string {
  const key = Object.keys(ev.eventType)[0] as ActivityEventType;
  const labels: Record<ActivityEventType, string> = {
    MedicineAddedManually: "Medicine Added Manually",
    MedicineSyncedFromPharmacy: "Medicine Synced from Pharmacy",
    MedicineSyncedToPatient: "Medicine Synced to Patient",
    MedicineSold: "Medicine Sold",
    QRScanCompleted: "QR Scan Completed",
    ReminderCreated: "Reminder Created",
    ReminderCompleted: "Reminder Completed",
    ReminderMissed: "Reminder Missed",
    DoseMarkedTaken: "Dose Marked as Taken",
    DiagnosticBooked: "Diagnostic Test Booked",
    ReportViewedDownloaded: "Report Viewed / Downloaded",
    ReportUploaded: "Report Uploaded",
    ReportCompleted: "Report Completed",
    ConsentGranted: "Consent Granted",
    ConsentRevoked: "Consent Revoked",
    ConsentAccessGranted: "Consent Access Granted",
    ConsentAccessRevoked: "Consent Access Revoked",
    TelegramConnected: "Telegram Connected",
    TelegramDisconnected: "Telegram Disconnected",
    InventoryItemAdded: "Inventory Item Added",
    InventoryStatusChanged: "Inventory Status Changed",
    CSVUploaded: "CSV Uploaded",
    RestockFulfilled: "Restock Fulfilled",
    ExpiryAlertTriggered: "Expiry Alert Triggered",
    ExpiryWarningTriggered: "Expiry Warning Triggered",
    HospitalMedicineAdded: "Medicine Added (Hospital)",
    HospitalInventoryUpdated: "Hospital Inventory Updated",
    PatientAdherenceViewed: "Patient Adherence Viewed",
    BookingReceived: "Booking Received",
    BookingAccepted: "Booking Accepted",
    SampleCollected: "Sample Collected",
    TestProcessingStarted: "Test Processing Started",
    UserCreated: "User Created",
    RoleChanged: "Role Changed",
    SystemAlert: "System Alert",
    EcosystemSyncStats: "Ecosystem Sync Statistics",
  };
  return labels[key] ?? key;
}

export type EventCategory = "success" | "info" | "warning" | "danger";

export function getEventCategory(ev: ActivityEventView): EventCategory {
  const key = String(Object.keys(ev.eventType)[0]) as ActivityEventType;
  const danger: ActivityEventType[] = [
    ActivityEventType.ReminderMissed,
    ActivityEventType.ExpiryAlertTriggered,
    ActivityEventType.ExpiryWarningTriggered,
    ActivityEventType.InventoryStatusChanged,
  ];
  const warning: ActivityEventType[] = [
    ActivityEventType.ConsentRevoked,
    ActivityEventType.ConsentAccessRevoked,
    ActivityEventType.TelegramDisconnected,
    ActivityEventType.SystemAlert,
  ];
  const success: ActivityEventType[] = [
    ActivityEventType.MedicineSyncedFromPharmacy,
    ActivityEventType.MedicineSyncedToPatient,
    ActivityEventType.ReminderCompleted,
    ActivityEventType.DoseMarkedTaken,
    ActivityEventType.ReportCompleted,
    ActivityEventType.ReportUploaded,
    ActivityEventType.ConsentGranted,
    ActivityEventType.ConsentAccessGranted,
    ActivityEventType.TelegramConnected,
    ActivityEventType.RestockFulfilled,
    ActivityEventType.BookingAccepted,
  ];
  if (danger.includes(key)) return "danger";
  if (warning.includes(key)) return "warning";
  if (success.includes(key)) return "success";
  return "info";
}

export function isEventUnread(
  ev: ActivityEventView,
  principalId: string | undefined,
): boolean {
  if (!principalId) return false;
  return !ev.readBy.some((p) => p.toString() === principalId);
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useTimelineQuery(filters: TimelineFiltersState) {
  const { actor, isFetching } = useBackendActor();
  const [offset, setOffset] = useState(0);
  const [allEvents, setAllEvents] = useState<ActivityEventView[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data: _initialData, isLoading } = useQuery<ActivityEventView[]>({
    queryKey: ["timeline", 0],
    queryFn: async () => {
      if (!actor) return [];
      const results = await actor.getMyTimeline(BigInt(0), BigInt(PAGE_SIZE));
      setAllEvents(results);
      setHasMore(results.length === PAGE_SIZE);
      setOffset(PAGE_SIZE);
      return results;
    },
    enabled: !!actor && !isFetching,
    staleTime: 60 * 1000,
  });

  const loadMore = async () => {
    if (!actor || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const more = await actor.getMyTimeline(BigInt(offset), BigInt(PAGE_SIZE));
      setAllEvents((prev) => [...prev, ...more]);
      setHasMore(more.length === PAGE_SIZE);
      setOffset((prev) => prev + PAGE_SIZE);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const filtered = useMemo(
    () => filterEvents(allEvents, filters),
    [allEvents, filters],
  );

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  return {
    grouped,
    totalCount: filtered.length,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    allEvents,
  };
}

export function useMarkEventRead() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.markEventRead(id);
      if ("err" in result) throw new Error(result.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["timeline"] });
    },
  });
}

export function useMedicineLcChain(medicineId: string | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<ActivityEventView[]>({
    queryKey: ["lcChain", medicineId],
    queryFn: async () => {
      if (!actor || !medicineId) return [];
      return actor.getMedicineLcChain(medicineId);
    },
    enabled: !!actor && !isFetching && !!medicineId,
    staleTime: 2 * 60 * 1000,
  });
}
