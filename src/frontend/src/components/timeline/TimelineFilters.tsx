import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type AuditLogFilters,
  DEFAULT_AUDIT_FILTERS,
} from "@/hooks/useAuditLog";
import useDebounce from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";

type DatePreset = AuditLogFilters["datePreset"];

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "24h", label: "Last 24h" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "all", label: "All Time" },
];

const ROLE_OPTIONS: { value: AuditLogFilters["role"]; label: string }[] = [
  { value: "all", label: "All Roles" },
  { value: "Patient", label: "Patient" },
  { value: "Pharmacy", label: "Pharmacy" },
  { value: "Hospital", label: "Hospital" },
  { value: "Diagnostic", label: "Diagnostic" },
  { value: "Admin", label: "Admin" },
];

const SEVERITY_OPTIONS: {
  value: AuditLogFilters["severity"];
  label: string;
}[] = [
  { value: "all", label: "All Severity" },
  { value: "critical", label: "Critical" },
  { value: "alert", label: "Alert" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
];

interface TimelineFiltersProps {
  filters: AuditLogFilters;
  onChange: (f: AuditLogFilters) => void;
  totalCount: number;
  isLoading: boolean;
}

export function TimelineFilters({
  filters,
  onChange,
  totalCount,
  isLoading,
}: TimelineFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search);
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onChange({ ...filters, search: debouncedSearch });
    }
  }, [debouncedSearch, filters, onChange]);

  const clearAll = () => {
    setLocalSearch("");
    onChange({ ...DEFAULT_AUDIT_FILTERS });
  };

  const hasActive =
    filters.search.length > 0 ||
    filters.role !== "all" ||
    filters.severity !== "all" ||
    filters.datePreset !== "all" ||
    filters.fromDate !== "" ||
    filters.toDate !== "";

  return (
    <div
      className="sticky top-0 z-20 backdrop-blur-xl bg-card/80 border-b border-[var(--color-border-base)] px-4 py-3 space-y-3"
      data-ocid="timeline.filters"
    >
      {/* Row 1: search + count + clear */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <Input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search events, medicines, actors…"
            className="pl-9 h-9 bg-[var(--color-bg-elevated)] border-[var(--color-border-base)] text-sm focus:border-primary/50"
            data-ocid="timeline.search_input"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => setLocalSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] whitespace-nowrap">
          <SlidersHorizontal size={13} />
          <span>
            {isLoading
              ? "…"
              : `${totalCount} event${totalCount !== 1 ? "s" : ""}`}
          </span>
        </div>
        {hasActive && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-8 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-status-danger)] px-2"
            data-ocid="timeline.clear_filters"
          >
            <X size={13} className="mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Row 2: date presets, role, severity, date range */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Date presets */}
        {DATE_PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange({ ...filters, datePreset: p.value })}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150",
              filters.datePreset === p.value
                ? "bg-primary/20 text-primary border-primary/40"
                : "bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] border-[var(--color-border-base)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]",
            )}
            data-ocid={`timeline.date_preset.${p.value}`}
          >
            {p.label}
          </button>
        ))}

        <span className="w-px h-4 bg-[var(--color-border-base)] mx-1" />

        {/* Role dropdown */}
        <Select
          value={filters.role}
          onValueChange={(val) =>
            onChange({ ...filters, role: val as AuditLogFilters["role"] })
          }
        >
          <SelectTrigger
            className="h-7 text-xs bg-[var(--color-bg-elevated)] border-[var(--color-border-base)] w-32"
            data-ocid="timeline.role_filter"
          >
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((r) => (
              <SelectItem key={r.value} value={r.value} className="text-xs">
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Severity dropdown */}
        <Select
          value={filters.severity}
          onValueChange={(val) =>
            onChange({
              ...filters,
              severity: val as AuditLogFilters["severity"],
            })
          }
        >
          <SelectTrigger
            className="h-7 text-xs bg-[var(--color-bg-elevated)] border-[var(--color-border-base)] w-32"
            data-ocid="timeline.severity_filter"
          >
            <SelectValue placeholder="All Severity" />
          </SelectTrigger>
          <SelectContent>
            {SEVERITY_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value} className="text-xs">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* From date */}
        <input
          type="date"
          value={filters.fromDate}
          onChange={(e) => onChange({ ...filters, fromDate: e.target.value })}
          className="h-7 px-2 text-xs rounded-md bg-[var(--color-bg-elevated)] border border-[var(--color-border-base)] text-[var(--color-text-secondary)] focus:outline-none focus:border-primary/50"
          aria-label="From date"
          data-ocid="timeline.from_date"
        />
        <span className="text-xs text-[var(--color-text-muted)]">to</span>
        <input
          type="date"
          value={filters.toDate}
          onChange={(e) => onChange({ ...filters, toDate: e.target.value })}
          className="h-7 px-2 text-xs rounded-md bg-[var(--color-bg-elevated)] border border-[var(--color-border-base)] text-[var(--color-text-secondary)] focus:outline-none focus:border-primary/50"
          aria-label="To date"
          data-ocid="timeline.to_date"
        />
      </div>
    </div>
  );
}
