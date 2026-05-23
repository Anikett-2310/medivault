import type { ExportFilters } from "@/components/exports/ExportFilterModal";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  Rows3,
  X,
} from "lucide-react";

interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  rowCount: number;
  filters: ExportFilters;
  format: "PDF" | "CSV";
  isExporting: boolean;
}

export function ExportPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  rowCount,
  filters,
  format,
  isExporting,
}: ExportPreviewModalProps) {
  if (!isOpen) return null;

  const filterItems: { label: string; value: string }[] = [];
  if (filters.fromDate)
    filterItems.push({ label: "From", value: filters.fromDate });
  if (filters.toDate) filterItems.push({ label: "To", value: filters.toDate });
  if (filters.status)
    filterItems.push({ label: "Status", value: filters.status });
  if (filters.medicineName)
    filterItems.push({ label: "Medicine", value: filters.medicineName });

  const isPdf = format === "PDF";

  return (
    <dialog
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent p-0 max-w-none w-full h-full m-0"
      aria-labelledby="export-preview-title"
      open
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--color-bg-overlay)] backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="presentation"
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-base)] px-6 py-4">
          <h2
            id="export-preview-title"
            className="text-base font-semibold text-[var(--color-text-primary)]"
          >
            Export Preview
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Title + format badge */}
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-[var(--color-text-primary)] leading-snug">
              {title}
            </p>
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold shrink-0",
                isPdf
                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
              )}
            >
              {isPdf ? <FileText size={11} /> : <FileSpreadsheet size={11} />}
              {format}
            </span>
          </div>

          {/* Row count */}
          <div className="flex items-center gap-2 rounded-lg bg-[var(--color-bg-muted)] border border-[var(--color-border-base)] px-3 py-2">
            <Rows3 size={14} className="text-blue-400 shrink-0" />
            <span className="text-sm text-[var(--color-text-secondary)]">
              <span className="font-semibold text-[var(--color-text-primary)]">
                {rowCount}
              </span>{" "}
              records to export
            </span>
          </div>

          {/* Filter summary */}
          {filterItems.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
                <Filter size={11} />
                Applied Filters
              </div>
              <div className="space-y-1">
                {filterItems.map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-md bg-[var(--color-bg-muted)] px-3 py-1.5"
                  >
                    <Calendar
                      size={11}
                      className="text-[var(--color-text-secondary)]"
                    />
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      {label}:
                    </span>
                    <span className="text-xs text-[var(--color-text-primary)] font-medium">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-[var(--color-text-secondary)] italic">
              No filters applied — exporting all data.
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
              data-ocid="export_preview.cancel_button"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isExporting}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow transition-all",
                "hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0",
                isPdf
                  ? "bg-red-600 hover:bg-red-500"
                  : "bg-emerald-600 hover:bg-emerald-500",
              )}
              data-ocid="export_preview.confirm_button"
            >
              {isExporting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Download size={14} />
                  Download {format}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
