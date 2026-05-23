/**
 * MediVault Export Utilities — re-export barrel
 * Canonical implementations live in exportPdf.ts, exportCsv.ts, exportAudit.ts.
 * This file is kept for backward compatibility with any existing imports.
 */

// PDF
export {
  buildPdf,
  generateAndDownloadPdf,
  exportToPdf,
  addPdfTable,
  addPdfFooter,
  createPdfDocument,
  CHUNK_SIZE,
} from "@/lib/exportPdf";

// CSV
export {
  buildCsvFromConfig,
  generateCsv,
  downloadCsv,
  buildCsvFilename,
  exportToCsv,
} from "@/lib/exportCsv";

// Audit
export {
  saveAuditEntry,
  logExport,
  getAuditEntries,
  getExportLogs,
  clearAuditLog,
  clearExportLogs,
} from "@/lib/exportAudit";

// Types
export type {
  ExportAuditEntry,
  ExportConfig,
  ExportFilter,
  ExportFormat,
  ExportColumnConfig,
} from "@/lib/exportTypes";

/**
 * Legacy type alias — kept so old code that imports ExportLogEntry from
 * exportUtils.ts continues to compile.
 */
export type { ExportAuditEntry as ExportLogEntry } from "@/lib/exportTypes";

/** Legacy filter shape used by older components */
export interface ExportFilters {
  fromDate?: string;
  toDate?: string;
  status?: string;
  medicineName?: string;
}
