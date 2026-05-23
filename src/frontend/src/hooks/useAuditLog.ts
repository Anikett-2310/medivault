import {
  type ActivityEventView,
  type AuditSearchQuery,
  createActor,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export type AuditSeverity = "critical" | "alert" | "warning" | "info" | "all";
export type AuditRoleFilter =
  | "Patient"
  | "Pharmacy"
  | "Hospital"
  | "Diagnostic"
  | "Admin"
  | "all";

export interface AuditLogFilters {
  search: string;
  role: AuditRoleFilter;
  severity: AuditSeverity;
  eventType: string;
  datePreset: "24h" | "7d" | "30d" | "all";
  fromDate: string;
  toDate: string;
}

export const DEFAULT_AUDIT_FILTERS: AuditLogFilters = {
  search: "",
  role: "all",
  severity: "all",
  eventType: "",
  datePreset: "all",
  fromDate: "",
  toDate: "",
};

function datePresetToRange(
  preset: AuditLogFilters["datePreset"],
): { from: number; to: number } | null {
  if (preset === "all") return null;
  const to = Date.now();
  const offsets: Record<string, number> = {
    "24h": 86400000,
    "7d": 7 * 86400000,
    "30d": 30 * 86400000,
  };
  return { from: to - (offsets[preset] ?? 0), to };
}

const PAGE_SIZE = 50;

export function useAuditLog(filters: AuditLogFilters) {
  const { actor, isFetching } = useActor(createActor);

  const params = useMemo((): AuditSearchQuery => {
    let fromTs: bigint | undefined;
    let toTs: bigint | undefined;

    if (filters.fromDate) {
      fromTs = BigInt(new Date(filters.fromDate).getTime()) * 1_000_000n;
    } else if (filters.datePreset !== "all") {
      const range = datePresetToRange(filters.datePreset);
      if (range) fromTs = BigInt(range.from) * 1_000_000n;
    }

    if (filters.toDate) {
      toTs = BigInt(new Date(filters.toDate).getTime() + 86400000) * 1_000_000n;
    } else if (filters.datePreset !== "all" && !filters.fromDate) {
      const range = datePresetToRange(filters.datePreset);
      if (range) toTs = BigInt(range.to) * 1_000_000n;
    }

    return {
      searchText:
        filters.search.trim() !== "" ? filters.search.trim() : undefined,
      role: filters.role !== "all" ? filters.role : undefined,
      severity: filters.severity !== "all" ? filters.severity : undefined,
      eventType: filters.eventType !== "" ? filters.eventType : undefined,
      fromTimestamp: fromTs,
      toTimestamp: toTs,
      offset: 0n,
      limit: BigInt(PAGE_SIZE),
    };
  }, [filters]);

  return useQuery<ActivityEventView[]>({
    queryKey: ["auditLog", params],
    queryFn: async () => {
      if (!actor) return [];
      return actor.searchAuditLog(params);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
  });
}

/** Derive severity label for display from event metadata or category. */
export function deriveSeverityLabel(ev: ActivityEventView): AuditSeverity {
  try {
    const meta = ev.metadata
      ? (JSON.parse(ev.metadata) as Record<string, string>)
      : {};
    const s = meta.severity?.toLowerCase();
    if (s === "critical" || s === "alert" || s === "warning" || s === "info")
      return s as AuditSeverity;
  } catch {}
  return "info";
}
