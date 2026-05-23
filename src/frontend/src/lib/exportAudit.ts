/**
 * MediVault Export Audit Logger
 * Persists export events to localStorage (max 200, FIFO eviction).
 * Every export — PDF, CSV, or print — logs user, role, type, filters, and outcome.
 */
import type { ExportAuditEntry } from "@/lib/exportTypes";

export type { ExportAuditEntry };

const STORAGE_KEY = "exportAuditLog";
const MAX_ENTRIES = 200;

export interface AuditQueryFilters {
  dateRange?: { start: string; end: string };
  exportType?: string;
  fileFormat?: "pdf" | "csv" | "print";
  role?: string;
  success?: boolean;
}

function generateId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadEntries(): ExportAuditEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ExportAuditEntry[]) : [];
  } catch {
    return [];
  }
}

function persistEntries(entries: ExportAuditEntry[]): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(entries.slice(0, MAX_ENTRIES)),
    );
  } catch {
    // Storage quota exceeded — trim to half and retry
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(entries.slice(0, Math.floor(MAX_ENTRIES / 2))),
      );
    } catch {
      // Best-effort — silent fail
    }
  }
}

/**
 * Saves an export audit entry to localStorage.
 * Automatically assigns id and timestamp.
 * Returns the completed entry.
 */
export function saveAuditEntry(
  entry: Omit<ExportAuditEntry, "id" | "timestamp">,
): ExportAuditEntry {
  // Normalize legacy field names for backward compatibility
  const normalized = entry as Record<string, unknown>;
  if (!("fileFormat" in entry) && "fileType" in normalized)
    normalized.fileFormat = normalized.fileType;
  if (!("filters" in entry) && "filtersApplied" in normalized)
    normalized.filters = normalized.filtersApplied;
  if (!("success" in entry) && "status" in normalized)
    normalized.success = normalized.status === "success";
  if (!("rowCount" in entry)) normalized.rowCount = 0;

  const full: ExportAuditEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };
  const existing = loadEntries();
  persistEntries([full, ...existing]);
  return full;
}

/** Backward-compat alias — same as saveAuditEntry */
export const logExport = saveAuditEntry;

/**
 * Returns audit entries filtered by the provided criteria.
 * All filters are AND-combined. Pass an empty object to get all entries.
 */
export function getAuditEntries(
  filters: AuditQueryFilters = {},
): ExportAuditEntry[] {
  let entries = loadEntries();

  if (filters.role) {
    entries = entries.filter((e) => e.userRole === filters.role);
  }
  if (filters.exportType) {
    const q = filters.exportType.toLowerCase();
    entries = entries.filter((e) => e.exportType.toLowerCase().includes(q));
  }
  if (filters.fileFormat) {
    entries = entries.filter((e) => e.fileFormat === filters.fileFormat);
  }
  if (filters.success !== undefined) {
    entries = entries.filter((e) => e.success === filters.success);
  }
  if (filters.dateRange?.start) {
    const from = new Date(filters.dateRange.start).getTime();
    entries = entries.filter((e) => new Date(e.timestamp).getTime() >= from);
  }
  if (filters.dateRange?.end) {
    const to = new Date(filters.dateRange.end).getTime() + 86_400_000; // inclusive day
    entries = entries.filter((e) => new Date(e.timestamp).getTime() <= to);
  }

  return entries;
}

/** Returns all stored audit entries (newest first). */
export function getExportLogs(): ExportAuditEntry[] {
  return loadEntries();
}

/** Clears all stored audit entries. */
export function clearAuditLog(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Backward-compat alias */
export const clearExportLogs = clearAuditLog;
export type { ExportAuditEntry as ExportLogEntry };
