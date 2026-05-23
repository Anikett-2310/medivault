import type { DiagnosticBooking, DoseLog, Medicine, Reminder } from "@/backend";
import { createActor } from "@/backend";
import { BookingStatus } from "@/backend";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { ExportProgressModal } from "@/components/exports/ExportProgressModal";
import {
  useMyDoseLogs,
  useMyMedicines,
  useMyReminders,
} from "@/hooks/useBackend";
import {
  type ExportFilters,
  type ExportLogEntry,
  addPdfFooter,
  addPdfTable,
  createPdfDocument,
  downloadCsv,
  exportToPdf,
  generateCsv,
  getExportLogs,
  logExport,
} from "@/lib/exportUtils";
import { getMedicineStatus } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Download,
  FileText,
  Filter,
  FlaskConical,
  History,
  Loader2,
  Pill,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

// ── constants ─────────────────────────────────────────────────────────────────
const GLASS =
  "bg-[var(--color-bg-elevated)] backdrop-blur-sm border border-[var(--color-border-base)] rounded-xl";
const TABS = [
  { id: "medicines", label: "Medicine Inventory", icon: Pill },
  { id: "doses", label: "Adherence History", icon: CheckCircle2 },
  { id: "reminders", label: "Reminder Logs", icon: Bell },
  { id: "diagnostics", label: "Diagnostic Bookings", icon: FlaskConical },
] as const;
type TabId = (typeof TABS)[number]["id"];

// ── booking status label ──────────────────────────────────────────────────────
const BOOKING_LABELS: Record<BookingStatus, string> = {
  [BookingStatus.Booked]: "Booked",
  [BookingStatus.Confirmed]: "Confirmed",
  [BookingStatus.InProgress]: "In Progress",
  [BookingStatus.Completed]: "Completed",
  [BookingStatus.ReportUploaded]: "Report Ready",
};

// ── hooks ─────────────────────────────────────────────────────────────────────
function useMyDiagnosticBookings() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<DiagnosticBooking[]>({
    queryKey: ["myDiagnosticBookings"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyDiagnosticBookings();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

// ── filter helpers ────────────────────────────────────────────────────────────
function inDateRange(ts: bigint, from?: string, to?: string): boolean {
  if (!from && !to) return true;
  const d = new Date(Number(ts));
  if (from && d < new Date(from)) return false;
  if (to) {
    const end = new Date(to);
    end.setDate(end.getDate() + 1);
    if (d >= end) return false;
  }
  return true;
}

function fmt(ts: bigint): string {
  return new Date(Number(ts)).toLocaleDateString();
}
function fmtTime(ts: bigint): string {
  return new Date(Number(ts)).toLocaleString();
}

// ── FilterBar ─────────────────────────────────────────────────────────────────
interface FilterBarProps {
  tab: TabId;
  filters: ExportFilters;
  onChange: (f: ExportFilters) => void;
  onClear: () => void;
}
function FilterBar({ tab, filters, onChange, onClear }: FilterBarProps) {
  const hasFilters =
    !!filters.fromDate ||
    !!filters.toDate ||
    !!filters.status ||
    !!filters.medicineName;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Filter size={13} />
        <span>Filters</span>
      </div>

      {(tab === "medicines" ||
        tab === "doses" ||
        tab === "reminders" ||
        tab === "diagnostics") && (
        <>
          <input
            type="date"
            value={filters.fromDate ?? ""}
            onChange={(e) =>
              onChange({ ...filters, fromDate: e.target.value || undefined })
            }
            className="px-2 py-1 text-xs rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-foreground focus:outline-none focus:border-sky-500/50"
            placeholder="From"
            data-ocid="reports.filter.from_date_input"
          />
          <input
            type="date"
            value={filters.toDate ?? ""}
            onChange={(e) =>
              onChange({ ...filters, toDate: e.target.value || undefined })
            }
            className="px-2 py-1 text-xs rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-foreground focus:outline-none focus:border-sky-500/50"
            placeholder="To"
            data-ocid="reports.filter.to_date_input"
          />
        </>
      )}

      {tab === "medicines" && (
        <input
          type="text"
          value={filters.medicineName ?? ""}
          onChange={(e) =>
            onChange({ ...filters, medicineName: e.target.value || undefined })
          }
          placeholder="Filter by medicine…"
          className="px-2 py-1 text-xs rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 w-40"
          data-ocid="reports.filter.medicine_name_input"
        />
      )}

      {tab === "diagnostics" && (
        <select
          value={filters.status ?? ""}
          onChange={(e) =>
            onChange({ ...filters, status: e.target.value || undefined })
          }
          className="px-2 py-1 text-xs rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-foreground focus:outline-none focus:border-sky-500/50"
          data-ocid="reports.filter.status_select"
        >
          <option value="">All statuses</option>
          {Object.values(BookingStatus).map((s) => (
            <option key={s} value={s} className="bg-card">
              {BOOKING_LABELS[s]}
            </option>
          ))}
        </select>
      )}

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          data-ocid="reports.filter.clear_button"
        >
          <X size={11} /> Clear
        </button>
      )}
    </div>
  );
}

// ── ExportBar ────────────────────────────────────────────────────────────────
interface ExportBarProps {
  rowCount: number;
  isExporting: boolean;
  onPdf: () => void;
  onCsv: () => void;
}
function ExportBar({ rowCount, isExporting, onPdf, onCsv }: ExportBarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground">
        {rowCount} record{rowCount !== 1 ? "s" : ""}
      </span>
      <button
        type="button"
        onClick={onPdf}
        disabled={isExporting || rowCount === 0}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-sky-600/20 border border-sky-500/30 text-sky-300 hover:bg-sky-600/30 transition-colors disabled:opacity-50"
        data-ocid="reports.export_pdf.button"
      >
        {isExporting ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <FileText size={12} />
        )}
        Export PDF
      </button>
      <button
        type="button"
        onClick={onCsv}
        disabled={isExporting || rowCount === 0}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 transition-colors disabled:opacity-50"
        data-ocid="reports.export_csv.button"
      >
        {isExporting ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Download size={12} />
        )}
        Export CSV
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="px-3 py-1.5 text-sm rounded-lg bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-elevated)] text-foreground font-medium transition-colors print:hidden"
      >
        Print
      </button>
    </div>
  );
}

// ── AuditPanel ────────────────────────────────────────────────────────────────
function AuditPanel() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const logs: ExportLogEntry[] = useMemo(() => {
    const all = getExportLogs();
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(
      (l) =>
        l.exportType.toLowerCase().includes(q) ||
        l.fileFormat.toLowerCase().includes(q) ||
        l.exportType.toLowerCase().includes(q),
    );
  }, [search]); // re-compute when search changes

  return (
    <div className={`${GLASS} overflow-hidden`} data-ocid="reports.audit_panel">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--color-bg-surface)] transition-colors"
        data-ocid="reports.audit_panel.toggle_button"
      >
        <div className="flex items-center gap-2.5">
          <History size={16} className="text-purple-400" />
          <span className="text-sm font-semibold text-foreground">
            Recent Exports
          </span>
          {logs.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold">
              {logs.length}
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search exports…"
                className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-purple-500/50"
                data-ocid="reports.audit.search_input"
              />

              {logs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No export history yet. Exports appear here after you download.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground text-left">
                        <th className="pb-2 pr-3 font-medium">Time</th>
                        <th className="pb-2 pr-3 font-medium">Report</th>
                        <th className="pb-2 pr-3 font-medium">Type</th>
                        <th className="pb-2 pr-3 font-medium">Filters</th>
                        <th className="pb-2 pr-3 font-medium">Size</th>
                        <th className="pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-subtle)]">
                      {logs.slice(0, 20).map((l, i) => (
                        <tr
                          key={l.id}
                          data-ocid={`reports.audit.item.${i + 1}`}
                        >
                          <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">
                            {new Date(l.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2 pr-3 text-foreground">
                            {l.exportType}
                          </td>
                          <td className="py-2 pr-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                l.fileFormat === "pdf"
                                  ? "bg-sky-500/20 text-sky-300"
                                  : "bg-emerald-500/20 text-emerald-300"
                              }`}
                            >
                              {l.fileFormat}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-muted-foreground max-w-[140px] truncate">
                            {String(JSON.stringify(l.filters || {})) !== "{}"
                              ? String(JSON.stringify(l.filters || {}))
                              : "—"}
                          </td>
                          <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">
                            {(l.fileSizeBytes ?? 0) > 1024
                              ? `${((l.fileSizeBytes ?? 0) / 1024).toFixed(1)} KB`
                              : `${l.fileSizeBytes ?? 0} B`}
                          </td>
                          <td className="py-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                l.success === true
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-red-500/20 text-red-300"
                              }`}
                            >
                              {l.success ? "success" : "failed"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── MedicinesTab ──────────────────────────────────────────────────────────────
function MedicinesTab({
  medicines,
  filters,
}: { medicines: Medicine[]; filters: ExportFilters }) {
  const rows = useMemo(
    () =>
      medicines.filter((m) => {
        if (!inDateRange(m.createdAt, filters.fromDate, filters.toDate))
          return false;
        if (
          filters.medicineName &&
          !m.name.toLowerCase().includes(filters.medicineName.toLowerCase())
        )
          return false;
        return true;
      }),
    [medicines, filters],
  );

  if (!rows.length)
    return (
      <p
        className="text-sm text-muted-foreground text-center py-8"
        data-ocid="reports.medicines.empty_state"
      >
        No medicines match the current filters.
      </p>
    );

  return (
    <div className="overflow-x-auto" data-ocid="reports.medicines.table">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground border-b border-[var(--color-border-subtle)]">
            <th className="pb-2 pr-4 font-medium">#</th>
            <th className="pb-2 pr-4 font-medium">Medicine</th>
            <th className="pb-2 pr-4 font-medium">Category</th>
            <th className="pb-2 pr-4 font-medium">Dosage</th>
            <th className="pb-2 pr-4 font-medium">Frequency</th>
            <th className="pb-2 pr-4 font-medium">Expiry</th>
            <th className="pb-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border-subtle)]">
          {rows.map((m, i) => {
            const status = getMedicineStatus(m.expiryDate);
            const statusCls =
              status === "Safe"
                ? "bg-emerald-500/15 text-emerald-300"
                : status === "ExpiringSoon"
                  ? "bg-orange-500/15 text-orange-300"
                  : "bg-red-500/15 text-red-300";
            return (
              <tr key={m.id} data-ocid={`reports.medicines.item.${i + 1}`}>
                <td className="py-2.5 pr-4 text-muted-foreground">{i + 1}</td>
                <td className="py-2.5 pr-4 font-medium text-foreground">
                  {m.name}
                </td>
                <td className="py-2.5 pr-4 text-muted-foreground">
                  {m.category}
                </td>
                <td className="py-2.5 pr-4 text-muted-foreground">
                  {m.dosage}
                </td>
                <td className="py-2.5 pr-4 text-muted-foreground">
                  {m.frequency}
                </td>
                <td className="py-2.5 pr-4 text-muted-foreground">
                  {fmt(m.expiryDate)}
                </td>
                <td className="py-2.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCls}`}
                  >
                    {status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── DosesTab ──────────────────────────────────────────────────────────────────
function DosesTab({
  logs,
  medicines,
  filters,
}: { logs: DoseLog[]; medicines: Medicine[]; filters: ExportFilters }) {
  const medMap = useMemo(
    () => Object.fromEntries(medicines.map((m) => [m.id, m.name])),
    [medicines],
  );
  const rows = useMemo(
    () =>
      logs.filter((l) =>
        inDateRange(l.takenAt, filters.fromDate, filters.toDate),
      ),
    [logs, filters],
  );

  if (!rows.length)
    return (
      <p
        className="text-sm text-muted-foreground text-center py-8"
        data-ocid="reports.doses.empty_state"
      >
        No dose logs match the current filters.
      </p>
    );

  return (
    <div className="overflow-x-auto" data-ocid="reports.doses.table">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground border-b border-[var(--color-border-subtle)]">
            <th className="pb-2 pr-4 font-medium">#</th>
            <th className="pb-2 pr-4 font-medium">Medicine</th>
            <th className="pb-2 pr-4 font-medium">Taken At</th>
            <th className="pb-2 font-medium">On Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border-subtle)]">
          {rows.map((l, i) => (
            <tr key={l.id} data-ocid={`reports.doses.item.${i + 1}`}>
              <td className="py-2.5 pr-4 text-muted-foreground">{i + 1}</td>
              <td className="py-2.5 pr-4 font-medium text-foreground">
                {medMap[l.medicineId] ?? "Unknown"}
              </td>
              <td className="py-2.5 pr-4 text-muted-foreground">
                {fmtTime(l.takenAt)}
              </td>
              <td className="py-2.5">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    l.isOnTime
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-red-500/15 text-red-300"
                  }`}
                >
                  {l.isOnTime ? "Yes" : "No"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── RemindersTab ──────────────────────────────────────────────────────────────
function RemindersTab({
  reminders,
  medicines,
  filters,
}: { reminders: Reminder[]; medicines: Medicine[]; filters: ExportFilters }) {
  const medMap = useMemo(
    () => Object.fromEntries(medicines.map((m) => [m.id, m.name])),
    [medicines],
  );
  const rows = useMemo(
    () =>
      reminders.filter((r) =>
        inDateRange(r.createdAt, filters.fromDate, filters.toDate),
      ),
    [reminders, filters],
  );

  if (!rows.length)
    return (
      <p
        className="text-sm text-muted-foreground text-center py-8"
        data-ocid="reports.reminders.empty_state"
      >
        No reminders match the current filters.
      </p>
    );

  return (
    <div className="overflow-x-auto" data-ocid="reports.reminders.table">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground border-b border-[var(--color-border-subtle)]">
            <th className="pb-2 pr-4 font-medium">#</th>
            <th className="pb-2 pr-4 font-medium">Medicine</th>
            <th className="pb-2 pr-4 font-medium">Time</th>
            <th className="pb-2 pr-4 font-medium">Enabled</th>
            <th className="pb-2 font-medium">Voice</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border-subtle)]">
          {rows.map((r, i) => (
            <tr key={r.id} data-ocid={`reports.reminders.item.${i + 1}`}>
              <td className="py-2.5 pr-4 text-muted-foreground">{i + 1}</td>
              <td className="py-2.5 pr-4 font-medium text-foreground">
                {medMap[r.medicineId] ?? "Unknown"}
              </td>
              <td className="py-2.5 pr-4 text-muted-foreground">
                {r.reminderTime}
              </td>
              <td className="py-2.5 pr-4">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.isEnabled
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-[var(--color-bg-muted)] text-muted-foreground"
                  }`}
                >
                  {r.isEnabled ? "Active" : "Paused"}
                </span>
              </td>
              <td className="py-2.5">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.voiceEnabled
                      ? "bg-purple-500/15 text-purple-300"
                      : "bg-[var(--color-bg-muted)] text-muted-foreground"
                  }`}
                >
                  {r.voiceEnabled ? "On" : "Off"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── DiagnosticsTab ────────────────────────────────────────────────────────────
function DiagnosticsTab({
  bookings,
  filters,
}: { bookings: DiagnosticBooking[]; filters: ExportFilters }) {
  const rows = useMemo(
    () =>
      bookings.filter((b) => {
        if (!inDateRange(b.createdAt, filters.fromDate, filters.toDate))
          return false;
        if (filters.status && b.status !== filters.status) return false;
        return true;
      }),
    [bookings, filters],
  );

  if (!rows.length)
    return (
      <p
        className="text-sm text-muted-foreground text-center py-8"
        data-ocid="reports.diagnostics.empty_state"
      >
        No bookings match the current filters.
      </p>
    );

  return (
    <div className="overflow-x-auto" data-ocid="reports.diagnostics.table">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground border-b border-[var(--color-border-subtle)]">
            <th className="pb-2 pr-4 font-medium">#</th>
            <th className="pb-2 pr-4 font-medium">Test Type</th>
            <th className="pb-2 pr-4 font-medium">Preferred Date</th>
            <th className="pb-2 pr-4 font-medium">Booked On</th>
            <th className="pb-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border-subtle)]">
          {rows.map((b, i) => {
            const statusMeta: Record<string, string> = {
              Booked: "badge-blue",
              Confirmed: "badge-teal",
              InProgress: "badge-warning",
              Completed: "badge-success",
              ReportUploaded: "badge-purple",
            };
            const statusKey = b.status as string;
            const cls = statusMeta[statusKey] ?? "badge-neutral";
            return (
              <tr key={b.id} data-ocid={`reports.diagnostics.item.${i + 1}`}>
                <td className="py-2.5 pr-4 text-muted-foreground">{i + 1}</td>
                <td className="py-2.5 pr-4 font-medium text-foreground">
                  {b.testType}
                </td>
                <td className="py-2.5 pr-4 text-muted-foreground">
                  {b.preferredDate}
                </td>
                <td className="py-2.5 pr-4 text-muted-foreground">
                  {fmt(b.createdAt)}
                </td>
                <td className="py-2.5">
                  <span className={cls}>
                    {BOOKING_LABELS[b.status] ?? statusKey}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function PatientReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("medicines");
  const [filters, setFilters] = useState<ExportFilters>({});
  const [isExporting, setIsExporting] = useState(false);
  const [pdfProgress, setPdfProgress] = useState({
    isOpen: false,
    progress: 0,
    currentRow: 0,
    totalRows: 0,
  });

  const { data: medicines = [], isLoading: medsLoading } = useMyMedicines();
  const { data: doseLogs = [], isLoading: logsLoading } = useMyDoseLogs();
  const { data: reminders = [], isLoading: remindersLoading } =
    useMyReminders();
  const { data: bookings = [], isLoading: bookingsLoading } =
    useMyDiagnosticBookings();

  const isLoading =
    medsLoading || logsLoading || remindersLoading || bookingsLoading;

  const medMap = useMemo(
    () => Object.fromEntries(medicines.map((m) => [m.id, m.name])),
    [medicines],
  );

  // ── filtered row count ────────────────────────────────────────────────────
  const rowCount = useMemo(() => {
    if (activeTab === "medicines")
      return medicines.filter((m) => {
        if (!inDateRange(m.createdAt, filters.fromDate, filters.toDate))
          return false;
        if (
          filters.medicineName &&
          !m.name.toLowerCase().includes(filters.medicineName.toLowerCase())
        )
          return false;
        return true;
      }).length;
    if (activeTab === "doses")
      return doseLogs.filter((l) =>
        inDateRange(l.takenAt, filters.fromDate, filters.toDate),
      ).length;
    if (activeTab === "reminders")
      return reminders.filter((r) =>
        inDateRange(r.createdAt, filters.fromDate, filters.toDate),
      ).length;
    return bookings.filter((b) => {
      if (!inDateRange(b.createdAt, filters.fromDate, filters.toDate))
        return false;
      if (filters.status && b.status !== filters.status) return false;
      return true;
    }).length;
  }, [activeTab, medicines, doseLogs, reminders, bookings, filters]);

  // ── tab label ─────────────────────────────────────────────────────────────
  const tabLabel = TABS.find((t) => t.id === activeTab)?.label ?? "Report";

  // ── PDF export ────────────────────────────────────────────────────────────
  const handlePdf = useCallback(async () => {
    setIsExporting(true);
    if (rowCount >= 50)
      setPdfProgress({
        isOpen: true,
        progress: 20,
        currentRow: 0,
        totalRows: rowCount,
      });
    const filename = `MediVault_Patient_${tabLabel.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
    try {
      const doc = await createPdfDocument(
        `Patient ${tabLabel}`,
        "Patient",
        filters,
      );
      let y = 62;

      if (activeTab === "medicines") {
        const rows = medicines
          .filter((m) => {
            if (!inDateRange(m.createdAt, filters.fromDate, filters.toDate))
              return false;
            if (
              filters.medicineName &&
              !m.name.toLowerCase().includes(filters.medicineName.toLowerCase())
            )
              return false;
            return true;
          })
          .map((m) => [
            m.name,
            m.category,
            m.dosage,
            m.frequency,
            fmt(m.expiryDate),
            getMedicineStatus(m.expiryDate),
          ]);
        y = addPdfTable(
          doc,
          ["Medicine", "Category", "Dosage", "Frequency", "Expiry", "Status"],
          rows,
          y,
        );
      } else if (activeTab === "doses") {
        const rows = doseLogs
          .filter((l) =>
            inDateRange(l.takenAt, filters.fromDate, filters.toDate),
          )
          .map((l) => [
            medMap[l.medicineId] ?? "Unknown",
            fmtTime(l.takenAt),
            l.isOnTime ? "Yes" : "No",
          ]);
        y = addPdfTable(doc, ["Medicine", "Taken At", "On Time"], rows, y);
      } else if (activeTab === "reminders") {
        const rows = reminders
          .filter((r) =>
            inDateRange(r.createdAt, filters.fromDate, filters.toDate),
          )
          .map((r) => [
            medMap[r.medicineId] ?? "Unknown",
            r.reminderTime,
            r.isEnabled ? "Active" : "Paused",
            r.voiceEnabled ? "On" : "Off",
          ]);
        y = addPdfTable(doc, ["Medicine", "Time", "Enabled", "Voice"], rows, y);
      } else {
        const rows = bookings
          .filter((b) => {
            if (!inDateRange(b.createdAt, filters.fromDate, filters.toDate))
              return false;
            if (filters.status && b.status !== filters.status) return false;
            return true;
          })
          .map((b) => [
            b.testType,
            b.preferredDate,
            fmt(b.createdAt),
            BOOKING_LABELS[b.status] ?? String(b.status),
          ]);
        y = addPdfTable(
          doc,
          ["Test Type", "Preferred Date", "Booked On", "Status"],
          rows,
          y,
        );
      }

      addPdfFooter(doc);
      const size = exportToPdf(filename, doc);
      logExport({
        userId: "patient",
        userRole: "Patient",
        exportType: tabLabel,
        fileFormat: "pdf",
        filters: filters as Record<string, unknown>,
        success: true,
        filename,
        fileSizeBytes: size,
        rowCount: 0,
      });
      toast.success("PDF exported successfully!");
    } catch (err) {
      logExport({
        userId: "patient",
        userRole: "Patient",
        exportType: tabLabel,
        fileFormat: "pdf",
        filters: filters as Record<string, unknown>,
        success: false,
        filename,
        fileSizeBytes: 0,
        rowCount: 0,
        errorMessage: String(err),
      });
      toast.error("PDF export failed. Please try again.");
    } finally {
      setPdfProgress((p) => ({ ...p, isOpen: false }));
      setIsExporting(false);
    }
  }, [
    activeTab,
    filters,
    medicines,
    doseLogs,
    reminders,
    bookings,
    medMap,
    tabLabel,
    rowCount,
  ]);

  // ── CSV export ────────────────────────────────────────────────────────────
  const handleCsv = useCallback(async () => {
    setIsExporting(true);
    const filename = `MediVault_Patient_${tabLabel.replace(/\s+/g, "_")}_${Date.now()}.csv`;
    try {
      let csv = "";
      if (activeTab === "medicines") {
        const headers = [
          "Medicine",
          "Category",
          "Dosage",
          "Frequency",
          "Expiry Date",
          "Status",
        ];
        const rows = medicines
          .filter((m) => {
            if (!inDateRange(m.createdAt, filters.fromDate, filters.toDate))
              return false;
            if (
              filters.medicineName &&
              !m.name.toLowerCase().includes(filters.medicineName.toLowerCase())
            )
              return false;
            return true;
          })
          .map((m) => [
            m.name,
            m.category,
            m.dosage,
            m.frequency,
            fmt(m.expiryDate),
            getMedicineStatus(m.expiryDate),
          ]);
        csv = generateCsv(headers, rows);
      } else if (activeTab === "doses") {
        const headers = ["Medicine", "Taken At", "On Time"];
        const rows = doseLogs
          .filter((l) =>
            inDateRange(l.takenAt, filters.fromDate, filters.toDate),
          )
          .map((l) => [
            medMap[l.medicineId] ?? "Unknown",
            fmtTime(l.takenAt),
            l.isOnTime ? "Yes" : "No",
          ]);
        csv = generateCsv(headers, rows);
      } else if (activeTab === "reminders") {
        const headers = ["Medicine", "Reminder Time", "Enabled", "Voice"];
        const rows = reminders
          .filter((r) =>
            inDateRange(r.createdAt, filters.fromDate, filters.toDate),
          )
          .map((r) => [
            medMap[r.medicineId] ?? "Unknown",
            r.reminderTime,
            r.isEnabled ? "Active" : "Paused",
            r.voiceEnabled ? "On" : "Off",
          ]);
        csv = generateCsv(headers, rows);
      } else {
        const headers = ["Test Type", "Preferred Date", "Booked On", "Status"];
        const rows = bookings
          .filter((b) => {
            if (!inDateRange(b.createdAt, filters.fromDate, filters.toDate))
              return false;
            if (filters.status && b.status !== filters.status) return false;
            return true;
          })
          .map((b) => [
            b.testType,
            b.preferredDate,
            fmt(b.createdAt),
            BOOKING_LABELS[b.status] ?? String(b.status),
          ]);
        csv = generateCsv(headers, rows);
      }

      const size = downloadCsv(filename, csv);
      logExport({
        userId: "patient",
        userRole: "Patient",
        exportType: tabLabel,
        fileFormat: "csv",
        filters: filters as Record<string, unknown>,
        success: true,
        filename,
        fileSizeBytes: size,
        rowCount: 0,
      });
      toast.success("CSV exported successfully!");
    } catch (err) {
      logExport({
        userId: "patient",
        userRole: "Patient",
        exportType: tabLabel,
        fileFormat: "csv",
        filters: filters as Record<string, unknown>,
        success: false,
        filename,
        fileSizeBytes: 0,
        rowCount: 0,
        errorMessage: String(err),
      });
      toast.error("CSV export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [
    activeTab,
    filters,
    medicines,
    doseLogs,
    reminders,
    bookings,
    medMap,
    tabLabel,
  ]);

  return (
    <div className="p-6 space-y-6" data-ocid="reports.page">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
            <ClipboardList size={18} className="text-sky-400" />
          </div>
          <div>
            <h1 className="gradient-text font-display font-bold text-2xl leading-tight">
              Reports
            </h1>
            <p className="text-muted-foreground text-xs mt-0.5">
              Export and review your health data
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        data-ocid="reports.tabs"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setActiveTab(tab.id);
                setFilters({});
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-sky-500/20 border border-sky-500/30 text-sky-300"
                  : "bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-muted-foreground hover:bg-[var(--color-bg-muted)] hover:text-foreground"
              }`}
              data-ocid={`reports.${tab.id}.tab`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main panel */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className={`${GLASS} p-5 space-y-4`}
        data-ocid="reports.main_panel"
      >
        {/* Controls row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterBar
            tab={activeTab}
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters({})}
          />
          <ExportBar
            rowCount={rowCount}
            isExporting={isExporting}
            onPdf={handlePdf}
            onCsv={handleCsv}
          />
        </div>

        {/* Progress indicator */}
        {isExporting && (
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500/10 border border-sky-500/20"
            data-ocid="reports.export.loading_state"
          >
            <Loader2 size={13} className="animate-spin text-sky-400" />
            <span className="text-xs text-sky-300 font-medium">
              Generating export…
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-[var(--color-border-subtle)]" />

        {/* Table content */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((n) => (
              <SkeletonCard key={n} lines={1} />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-data`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              {activeTab === "medicines" && (
                <MedicinesTab medicines={medicines} filters={filters} />
              )}
              {activeTab === "doses" && (
                <DosesTab
                  logs={doseLogs}
                  medicines={medicines}
                  filters={filters}
                />
              )}
              {activeTab === "reminders" && (
                <RemindersTab
                  reminders={reminders}
                  medicines={medicines}
                  filters={filters}
                />
              )}
              {activeTab === "diagnostics" && (
                <DiagnosticsTab bookings={bookings} filters={filters} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>

      {/* Audit panel */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <AuditPanel />
      </motion.div>

      {/* Info note */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)]">
        <Calendar size={14} className="text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          All exports are generated locally in your browser — no data is sent to
          external servers. PDFs include MediVault branding and are suitable for
          sharing with healthcare providers.
        </p>
      </div>
      <ExportProgressModal
        isOpen={pdfProgress.isOpen}
        progress={pdfProgress.progress}
        currentRow={pdfProgress.currentRow}
        totalRows={pdfProgress.totalRows}
        onCancel={() => setPdfProgress((p) => ({ ...p, isOpen: false }))}
      />
    </div>
  );
}
