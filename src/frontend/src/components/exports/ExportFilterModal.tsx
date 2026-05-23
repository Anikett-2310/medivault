import { Button } from "@/components/common/Button";
import { cn } from "@/lib/utils";
import { Filter, Loader2, X } from "lucide-react";
import { useState } from "react";

export type ExportFilters = {
  fromDate?: string;
  toDate?: string;
  status?: string;
  medicineName?: string;
};

interface ExportFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (filters: ExportFilters) => void;
  title: string;
  availableFilters: {
    dateRange?: boolean;
    statusFilter?: string[];
    medicineFilter?: boolean;
  };
  isExporting: boolean;
}

export function ExportFilterModal({
  isOpen,
  onClose,
  onExport,
  title,
  availableFilters,
  isExporting,
}: ExportFilterModalProps) {
  const [filters, setFilters] = useState<ExportFilters>({});

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onExport(filters);
  }

  function setField<K extends keyof ExportFilters>(
    key: K,
    value: ExportFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  }

  const hasFilters =
    (availableFilters.dateRange ?? false) ||
    (availableFilters.statusFilter?.length ?? 0) > 0 ||
    (availableFilters.medicineFilter ?? false);

  return (
    <dialog
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent p-0 max-w-none w-full h-full m-0"
      aria-labelledby="export-filter-title"
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
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-base)] px-6 py-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-blue-400" />
            <h2
              id="export-filter-title"
              className="text-base font-semibold text-[var(--color-text-primary)]"
            >
              {title}
            </h2>
          </div>
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
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {hasFilters ? (
            <>
              {availableFilters.dateRange && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="ef-from"
                      className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1"
                    >
                      From Date
                    </label>
                    <input
                      id="ef-from"
                      type="date"
                      value={filters.fromDate ?? ""}
                      onChange={(e) => setField("fromDate", e.target.value)}
                      className={inputCls}
                      data-ocid="export_filter.from_date"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="ef-to"
                      className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1"
                    >
                      To Date
                    </label>
                    <input
                      id="ef-to"
                      type="date"
                      value={filters.toDate ?? ""}
                      onChange={(e) => setField("toDate", e.target.value)}
                      min={filters.fromDate}
                      className={inputCls}
                      data-ocid="export_filter.to_date"
                    />
                  </div>
                </div>
              )}

              {(availableFilters.statusFilter?.length ?? 0) > 0 && (
                <div>
                  <label
                    htmlFor="ef-status"
                    className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1"
                  >
                    Status
                  </label>
                  <select
                    id="ef-status"
                    value={filters.status ?? ""}
                    onChange={(e) => setField("status", e.target.value)}
                    className={cn(inputCls, "cursor-pointer")}
                    data-ocid="export_filter.status_select"
                  >
                    <option value="">All statuses</option>
                    {availableFilters.statusFilter!.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {availableFilters.medicineFilter && (
                <div>
                  <label
                    htmlFor="ef-med"
                    className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1"
                  >
                    Medicine Name
                  </label>
                  <input
                    id="ef-med"
                    type="text"
                    placeholder="Filter by medicine name…"
                    value={filters.medicineName ?? ""}
                    onChange={(e) => setField("medicineName", e.target.value)}
                    className={inputCls}
                    data-ocid="export_filter.medicine_input"
                  />
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-[var(--color-text-secondary)]">
              No additional filters available for this export.
            </p>
          )}

          {/* Row count note */}
          <p className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-xs text-blue-300">
            Export will include data matching your filters.
          </p>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={onClose}
              disabled={isExporting}
              data-ocid="export_filter.cancel_button"
            >
              Cancel
            </Button>
            <button
              type="submit"
              disabled={isExporting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition-all hover:bg-blue-500 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              data-ocid="export_filter.confirm_button"
            >
              {isExporting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Preparing…
                </>
              ) : (
                "Confirm Export"
              )}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

const inputCls =
  "w-full rounded-lg border border-[var(--color-border-base)] bg-[var(--color-bg-muted)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/40 transition-colors";
