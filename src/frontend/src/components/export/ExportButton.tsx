import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useState } from "react";

interface ExportButtonProps {
  onExportPdf: () => void | Promise<void>;
  onExportCsv: () => void;
  isExporting?: boolean;
  className?: string;
}

export function ExportButton({
  onExportPdf,
  onExportCsv,
  isExporting = false,
  className,
}: ExportButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handlePdf = async () => {
    setMenuOpen(false);
    await onExportPdf();
  };

  const handleCsv = () => {
    setMenuOpen(false);
    onExportCsv();
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setMenuOpen((o) => !o)}
        disabled={isExporting}
        className="gap-2 border-border/60 hover:border-primary/40 hover:bg-primary/5"
        data-ocid="export.toggle_button"
      >
        {isExporting ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Download size={14} />
        )}
        <span>Export</span>
      </Button>

      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setMenuOpen(false);
            }}
          />
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1.5 z-20 w-44 rounded-xl glass-card border border-border/60 shadow-lg overflow-hidden">
            <button
              type="button"
              onClick={handlePdf}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 transition-colors"
              data-ocid="export.pdf_button"
            >
              <FileText
                size={14}
                className="text-[var(--color-accent-primary)]"
              />
              Export as PDF
            </button>
            <button
              type="button"
              onClick={handleCsv}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 transition-colors"
              data-ocid="export.csv_button"
            >
              <FileSpreadsheet
                size={14}
                className="text-[var(--color-status-success)]"
              />
              Export as CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
}
