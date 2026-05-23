import { EmptyState } from "@/components/common/EmptyState";
import { useExportAudit } from "@/hooks/useExportAudit";
import type { ExportLogEntry } from "@/lib/exportAudit";
import { downloadCsv, generateCsv } from "@/lib/exportCsv";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Download,
  Filter,
  History,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

const PAGE_SIZE = 25;

const ROLES = ["Patient", "Pharmacy", "Hospital", "Lab", "Admin"] as const;
const FILE_TYPES = ["pdf", "csv", "print"] as const;
const STATUSES = ["success", "failed"] as const;
function StatusPill({ status }: { status: boolean }) {
  if (status) {
    return (
      <span className="badge-success">
        <CheckCircle2 size={10} />
        Success
      </span>
    );
  }
  return (
    <span className="badge-danger">
      <XCircle size={10} />
      Failed
    </span>
  );
}

function FileTypeBadge({ type }: { type: ExportLogEntry["fileFormat"] }) {
  const isPdf = type === "pdf";
  return <span className={isPdf ? "badge-purple" : "badge-info"}>{type}</span>;
}

function formatBytes(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFilters(filters: Record<string, string>): string {
  const entries = Object.entries(filters).filter(([, v]) => v && v !== "all");
  if (entries.length === 0) return "None";
  return entries.map(([k, v]) => `${k}: ${v}`).join(", ");
}

function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <dialog
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      data-ocid="export_history.confirm_dialog"
    >
      <div
        className="absolute inset-0 bg-[var(--color-bg-overlay)] backdrop-blur-sm"
        onClick={onCancel}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onCancel();
        }}
        aria-hidden="true"
      />
      <div className="relative bg-[var(--color-bg-surface)] border border-[var(--color-border-base)] rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div>
            <h3
              id="confirm-dialog-title"
              className="font-semibold text-foreground"
            >
              Clear Export History
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              This cannot be undone.
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          All export audit logs will be permanently deleted from this device.
          Are you sure you want to continue?
        </p>
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-muted)] text-foreground border border-[var(--color-border-base)] transition-all"
            data-ocid="export_history.cancel_button"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-all"
            data-ocid="export_history.confirm_button"
          >
            Clear All
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default function ExportHistoryPage() {
  const navigate = useNavigate();
  const { logs, clearLogs, searchLogs } = useExportAudit();

  // Filters
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);

  // Confirm dialog
  const [showConfirm, setShowConfirm] = useState(false);

  const filtered = useMemo(() => {
    return searchLogs(query, {
      role: roleFilter || undefined,
      fileType: fileTypeFilter || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    }).filter(
      (e) =>
        !statusFilter || (statusFilter === "success" ? e.success : !e.success),
    );
  }, [
    query,
    roleFilter,
    fileTypeFilter,
    statusFilter,
    fromDate,
    toDate,
    searchLogs,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const hasActiveFilters = !!(
    query ||
    roleFilter ||
    fileTypeFilter ||
    statusFilter ||
    fromDate ||
    toDate
  );

  function clearFilters() {
    setQuery("");
    setRoleFilter("");
    setFileTypeFilter("");
    setStatusFilter("");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  function handleClearHistory() {
    clearLogs();
    setShowConfirm(false);
    setPage(1);
  }

  function handleExportAuditCsv() {
    const headers = [
      "Date/Time",
      "User ID",
      "Role",
      "Export Type",
      "File Type",
      "Filters Applied",
      "Status",
      "Filename",
      "File Size",
    ];
    const rows = logs.map((e) => [
      formatDateTime(e.timestamp),
      e.userId,
      e.userRole,
      e.exportType,
      e.fileFormat,
      formatFilters(e.filters as Record<string, string>),
      e.success ? "success" : "failed",
      e.fileSizeBytes != null ? formatBytes(e.fileSizeBytes) : "—",
      e.errorMessage ?? "",
    ]);
    const csv = generateCsv(headers, rows);
    downloadCsv(
      `medivault-export-audit-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
    );
  }

  return (
    <div
      className="min-h-screen bg-[var(--color-bg-base)] p-4 md:p-8"
      data-ocid="export_history.page"
    >
      <ConfirmDialog
        open={showConfirm}
        onConfirm={handleClearHistory}
        onCancel={() => setShowConfirm(false)}
      />

      {/* Header */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          data-ocid="export_history.back_button"
        >
          <ArrowLeft size={15} />
          Back
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[color-mix(in_oklch,var(--color-role-diagnostic)_20%,transparent)] border border-[var(--color-border-base)] flex items-center justify-center shadow-lg">
              <History size={20} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-[var(--color-role-diagnostic)]">
                Export History
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {logs.length} total audit record{logs.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportAuditCsv}
              disabled={logs.length === 0}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 transition-all disabled:opacity-40"
              data-ocid="export_history.export_csv_button"
            >
              <Download size={14} />
              Export Audit CSV
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              disabled={logs.length === 0}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-all disabled:opacity-40"
              data-ocid="export_history.clear_button"
            >
              <Trash2 size={14} />
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="sticky top-0 z-20 mb-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by export type, filename, role…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-bg-elevated)] backdrop-blur-md border border-[var(--color-border-base)] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              data-ocid="export_history.search_input"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              showFilters || hasActiveFilters
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                : "bg-[var(--color-bg-elevated)] text-foreground border-[var(--color-border-base)] hover:bg-[var(--color-bg-muted)]"
            }`}
            aria-expanded={showFilters}
            data-ocid="export_history.filter_toggle"
          >
            <Filter size={14} />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="bg-[var(--color-bg-elevated)] backdrop-blur-md rounded-2xl border border-[var(--color-border-base)] p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Role */}
            <div className="space-y-1.5">
              <label
                htmlFor="filter-role"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Role
              </label>
              <select
                id="filter-role"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-2 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-base)] text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                data-ocid="export_history.role_filter"
              >
                <option value="">All Roles</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* File type */}
            <div className="space-y-1.5">
              <label
                htmlFor="filter-filetype"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                File Type
              </label>
              <select
                id="filter-filetype"
                value={fileTypeFilter}
                onChange={(e) => {
                  setFileTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-2 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-base)] text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                data-ocid="export_history.filetype_filter"
              >
                <option value="">All Types</option>
                {FILE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label
                htmlFor="filter-status"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Status
              </label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-2 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-base)] text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                data-ocid="export_history.status_filter"
              >
                <option value="">All Statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* From date */}
            <div className="space-y-1.5">
              <label
                htmlFor="filter-from"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                From
              </label>
              <input
                id="filter-from"
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-2 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-base)] text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                data-ocid="export_history.from_date_input"
              />
            </div>

            {/* To date */}
            <div className="space-y-1.5">
              <label
                htmlFor="filter-to"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                To
              </label>
              <input
                id="filter-to"
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-2 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-base)] text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                data-ocid="export_history.to_date_input"
              />
            </div>

            {/* Clear filters */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-sm font-medium bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-muted)] text-foreground border border-[var(--color-border-base)] transition-all disabled:opacity-40"
                data-ocid="export_history.clear_filters_button"
              >
                <X size={13} />
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results summary */}
      {hasActiveFilters && (
        <p className="text-xs text-muted-foreground mb-3">
          Showing {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          {filtered.length !== logs.length && ` of ${logs.length} total`}
        </p>
      )}

      {/* Table */}
      {pageItems.length === 0 ? (
        <EmptyState
          icon={<ClipboardList />}
          title={hasActiveFilters ? "No matching exports" : "No exports yet"}
          description={
            hasActiveFilters
              ? "Try adjusting your filters or clearing the search."
              : "Your export history will appear here after your first PDF or CSV export."
          }
          action={
            hasActiveFilters
              ? { label: "Clear filters", onClick: clearFilters }
              : undefined
          }
          data-ocid="export_history.empty_state"
        />
      ) : (
        <div className="bg-[var(--color-bg-elevated)] backdrop-blur-md rounded-2xl border border-[var(--color-border-base)] shadow-xl overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm" data-ocid="export_history.table">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    <Clock size={11} className="inline mr-1.5 opacity-70" />
                    Date / Time
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Export Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    File
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider max-w-[180px]">
                    Filters
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Filename
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Size
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {pageItems.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-[var(--color-bg-surface)] transition-colors"
                    data-ocid={`export_history.item.${(currentPage - 1) * PAGE_SIZE + idx + 1}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-foreground/80 text-xs">
                      {formatDateTime(entry.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-foreground/90">
                        {entry.userRole}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-foreground/80">
                        {entry.exportType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <FileTypeBadge type={entry.fileFormat} />
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      <span
                        className="text-xs text-muted-foreground truncate block"
                        title={formatFilters(
                          entry.filters as Record<string, string>,
                        )}
                      >
                        {formatFilters(entry.filters as Record<string, string>)}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <span
                        className="text-xs font-mono text-foreground/70 truncate block"
                        title={entry.errorMessage ?? ""}
                      >
                        {entry.errorMessage ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                      {formatBytes(entry.fileSizeBytes)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusPill status={entry.success} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-[var(--color-border-subtle)]">
            {pageItems.map((entry, idx) => (
              <div
                key={entry.id}
                className="p-4 space-y-2"
                data-ocid={`export_history.item.${(currentPage - 1) * PAGE_SIZE + idx + 1}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileTypeBadge type={entry.fileFormat} />
                    <StatusPill status={entry.success} />
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDateTime(entry.timestamp)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {entry.exportType}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {entry.userRole}
                  </span>
                </div>
                <p
                  className="text-xs font-mono text-foreground/60 truncate"
                  title={entry.exportType}
                >
                  {entry.exportType}
                </p>
                {formatFilters(entry.filters as Record<string, string>) !==
                  "None" && (
                  <p className="text-[11px] text-muted-foreground">
                    Filters:{" "}
                    {formatFilters(entry.filters as Record<string, string>)}
                  </p>
                )}
                {entry.errorMessage && (
                  <p className="text-[11px] text-red-400">
                    {entry.errorMessage}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages} · {filtered.length} records
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-muted)] border border-[var(--color-border-base)] text-foreground transition-all disabled:opacity-40"
              data-ocid="export_history.pagination_prev"
            >
              <ChevronLeft size={15} />
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-muted)] border border-[var(--color-border-base)] text-foreground transition-all disabled:opacity-40"
              data-ocid="export_history.pagination_next"
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
