/**
 * MediVault Export — Shared TypeScript types
 * Single source of truth for all export-related interfaces.
 */

export type ExportFormat = "pdf" | "csv" | "print";

export interface ExportFilter {
  dateRange?: { start: string; end: string };
  status?: string;
  role?: string;
  search?: string;
  medicineName?: string;
}

export interface ExportColumnConfig {
  /** key in the data object */
  key: string;
  /** human-readable column header */
  label: string;
}

export interface ExportConfig<T = Record<string, unknown>> {
  /** Report title shown in PDF header and modal */
  title: string;
  /** Role label: 'Patient', 'Pharmacy', etc. */
  role: string;
  /** Column definitions for table rendering */
  columns: ExportColumnConfig[];
  /** Raw data array to export */
  data: T[];
  /** Active filters for display in PDF / preview */
  filters: ExportFilter;
  /** Optional: name of the person exporting */
  userName?: string;
}

export interface ExportAuditEntry {
  id: string;
  userId: string;
  userRole: string;
  exportType: string;
  /** All filters that were active when the export was triggered */
  filters: Record<string, unknown>;
  timestamp: string; // ISO string
  fileFormat: "pdf" | "csv" | "print";
  rowCount: number;
  success: boolean;
  errorMessage?: string;
  filename?: string;
  fileSizeBytes?: number;
}
