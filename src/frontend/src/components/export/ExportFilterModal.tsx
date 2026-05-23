import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Loader2, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

export type FilterValues = {
  fromDate?: string;
  toDate?: string;
  status?: string;
  medicineName?: string;
};

export type AvailableFilter = "dateRange" | "status" | "medicineName";

interface StatusOption {
  value: string;
  label: string;
}

interface ExportFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (filters: FilterValues) => void | Promise<void>;
  title: string;
  availableFilters: AvailableFilter[];
  statusOptions?: StatusOption[];
  isExporting?: boolean;
}

export function ExportFilterModal({
  isOpen,
  onClose,
  onExport,
  title,
  availableFilters,
  statusOptions = [],
  isExporting = false,
}: ExportFilterModalProps) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("");
  const [medicineName, setMedicineName] = useState("");

  if (!isOpen) return null;

  const handleExport = async () => {
    const filters: FilterValues = {};
    if (fromDate) filters.fromDate = fromDate;
    if (toDate) filters.toDate = toDate;
    if (status) filters.status = status;
    if (medicineName) filters.medicineName = medicineName;
    await onExport(filters);
  };

  const handleReset = () => {
    setFromDate("");
    setToDate("");
    setStatus("");
    setMedicineName("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-ocid="export_filter.dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--color-bg-overlay)] backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClose();
        }}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md glass-card border border-border/60 rounded-2xl shadow-2xl",
          "animate-in fade-in zoom-in-95 duration-200",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal size={16} className="text-primary" />
            <h2 className="font-display font-bold text-foreground text-sm">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
            data-ocid="export_filter.close_button"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {availableFilters.includes("dateRange") && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  From Date
                </Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-8 text-xs"
                  data-ocid="export_filter.from_date.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">To Date</Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-8 text-xs"
                  data-ocid="export_filter.to_date.input"
                />
              </div>
            </div>
          )}

          {availableFilters.includes("status") && statusOptions.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger
                  className="h-8 text-xs"
                  data-ocid="export_filter.status.select"
                >
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {availableFilters.includes("medicineName") && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Medicine Name
              </Label>
              <Input
                placeholder="Filter by medicine..."
                value={medicineName}
                onChange={(e) => setMedicineName(e.target.value)}
                className="h-8 text-xs"
                data-ocid="export_filter.medicine_name.input"
              />
            </div>
          )}

          {availableFilters.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              No filters available for this report.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/40">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs"
            data-ocid="export_filter.reset_button"
          >
            Reset Filters
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
              data-ocid="export_filter.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="text-xs gap-1.5"
              data-ocid="export_filter.confirm_button"
            >
              {isExporting && <Loader2 size={12} className="animate-spin" />}
              Export
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
