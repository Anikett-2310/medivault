/**
 * ExportProgressModal — overlay shown during large PDF generation (50+ rows).
 * Shows animated progress bar, row counter, and a Cancel button.
 * Should NOT be shown for CSV exports or small datasets under 50 rows.
 */
import { cn } from "@/lib/utils";
import { FileText, X } from "lucide-react";

interface ExportProgressModalProps {
  isOpen: boolean;
  /** Progress value 0–100 */
  progress: number;
  currentRow: number;
  totalRows: number;
  onCancel: () => void;
}

export function ExportProgressModal({
  isOpen,
  progress,
  currentRow,
  totalRows,
  onCancel,
}: ExportProgressModalProps) {
  if (!isOpen) return null;

  const pct = Math.min(100, Math.max(0, progress));

  return (
    <dialog
      open
      className="fixed inset-0 z-[60] flex items-center justify-center m-0 p-0 max-w-none max-h-none w-full h-full bg-transparent border-none"
      aria-labelledby="export-progress-title"
      data-ocid="export_progress.dialog"
    >
      {/* Backdrop — blocks interaction */}
      <div className="absolute inset-0 bg-[var(--color-bg-overlay)] backdrop-blur-sm" />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-sm mx-4 rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            {/* Animated icon */}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
              <FileText size={18} className="text-blue-400 animate-pulse" />
            </div>
            <div>
              <h2
                id="export-progress-title"
                className="text-sm font-semibold text-foreground"
              >
                Generating PDF…
              </h2>
              <p className="text-xs text-muted-foreground">
                {totalRows > 0
                  ? `Row ${currentRow.toLocaleString()} of ${totalRows.toLocaleString()}`
                  : "Preparing export…"}
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-6 pb-2">
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${pct}%` }}
              role="progressbar"
              tabIndex={0}
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Export progress"
              data-ocid="export_progress.bar"
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {pct < 100 ? `${pct.toFixed(0)}% complete` : "Finalizing…"}
            </span>
            {totalRows > 0 && (
              <span className="text-xs text-muted-foreground">
                ~{Math.ceil((totalRows - currentRow) / 45)} page
                {Math.ceil((totalRows - currentRow) / 45) !== 1 ? "s" : ""}{" "}
                remaining
              </span>
            )}
          </div>
        </div>

        {/* Separator */}
        <div className="mx-6 my-3 border-t border-border/40" />

        {/* Footer — Cancel */}
        <div className="px-6 pb-5 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium",
              "border border-border/60 bg-background text-foreground",
              "hover:bg-muted transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            )}
            data-ocid="export_progress.cancel_button"
          >
            <X size={14} />
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );
}
