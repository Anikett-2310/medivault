import { cn } from "@/lib/utils";
import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  isDestructive?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = "Delete",
  isDestructive = true,
}: ConfirmDialogProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <dialog
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent"
      aria-labelledby="confirm-dialog-title"
      open
      data-ocid="confirm_dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--color-bg-overlay)] backdrop-blur-sm"
        onClick={onCancel}
        onKeyDown={(e) => e.key === "Enter" && onCancel()}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "relative glass-card rounded-2xl p-6 w-full max-w-md shadow-2xl",
          "border border-[var(--color-border-base)] animate-in fade-in zoom-in-95 duration-200",
        )}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-ocid="confirm_dialog.close_button"
        >
          <X size={16} />
        </button>

        {/* Icon + title */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
              isDestructive
                ? "bg-[color-mix(in_oklch,var(--color-status-danger)_15%,transparent)]"
                : "bg-[color-mix(in_oklch,var(--color-accent-primary,var(--color-role-hospital))_15%,transparent)]",
            )}
          >
            <AlertTriangle
              size={20}
              className={
                isDestructive
                  ? "text-[var(--color-status-danger)]"
                  : "text-[var(--color-accent-primary,var(--color-role-hospital))]"
              }
            />
          </div>
          <div>
            <h2
              id="confirm-dialog-title"
              className="font-display font-bold text-foreground text-lg"
            >
              {title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-4 text-sm font-semibold rounded-xl border border-border text-foreground/80 hover:bg-muted hover:text-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-ocid="confirm_dialog.cancel_button"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "h-9 px-4 text-sm font-semibold rounded-xl text-white transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              isDestructive
                ? "bg-rose-600 hover:bg-rose-500 focus-visible:ring-rose-500"
                : "gradient-brand focus-visible:ring-blue-500",
            )}
            data-ocid="confirm_dialog.confirm_button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
