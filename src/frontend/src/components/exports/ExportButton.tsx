import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ExportButtonProps {
  onExportPdf: () => void;
  onExportCsv: () => void;
  isExporting: boolean;
  className?: string;
}

export function ExportButton({
  onExportPdf,
  onExportCsv,
  isExporting,
  className,
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      {/* Primary export button */}
      <button
        type="button"
        onClick={() => !isExporting && setIsOpen((p) => !p)}
        disabled={isExporting}
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition-all hover:bg-blue-500 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        data-ocid="export.primary_button"
      >
        {isExporting ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Download size={14} />
        )}
        Export
        <ChevronDown
          size={14}
          className={cn(
            "transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && !isExporting && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-44 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] shadow-xl backdrop-blur-lg overflow-hidden"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onExportPdf();
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-muted)] hover:text-foreground"
            data-ocid="export.pdf_option"
          >
            <FileText size={14} className="text-red-400" />
            Download PDF
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onExportCsv();
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-muted)] hover:text-foreground"
            data-ocid="export.csv_option"
          >
            <FileSpreadsheet size={14} className="text-emerald-400" />
            Download CSV
          </button>
        </div>
      )}
    </div>
  );
}
