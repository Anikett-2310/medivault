import {
  type AuditQueryFilters,
  type ExportAuditEntry,
  clearAuditLog,
  getAuditEntries,
  getExportLogs,
  saveAuditEntry,
} from "@/lib/exportAudit";
import { useCallback, useState } from "react";

export function useExportAudit() {
  const [exportHistory, setExportHistory] = useState<ExportAuditEntry[]>(() =>
    getExportLogs(),
  );

  /** Log an export event and refresh local state. Returns the saved entry. */
  const logExport = useCallback(
    (entry: Omit<ExportAuditEntry, "id" | "timestamp">): ExportAuditEntry => {
      const saved = saveAuditEntry(entry);
      setExportHistory(getExportLogs());
      return saved;
    },
    [],
  );

  /**
   * Returns filtered audit entries without mutating exportHistory state.
   * Useful for building searchable history tables.
   */
  const getExportHistory = useCallback(
    (filters: AuditQueryFilters = {}): ExportAuditEntry[] =>
      getAuditEntries(filters),
    [],
  );

  /** Clears all audit entries and resets local state. */
  const clearHistory = useCallback(() => {
    clearAuditLog();
    setExportHistory([]);
  }, []);

  /**
   * Multi-field search across exportType, userRole, and fileFormat.
   * Supports optional role, fileType, and date range filters.
   */
  const searchLogs = useCallback(
    (
      query: string,
      opts?: {
        role?: string;
        fileType?: string;
        fromDate?: string;
        toDate?: string;
      },
    ): ExportAuditEntry[] => {
      let entries = getExportLogs();

      // Multi-field text search
      if (query.trim()) {
        const q = query.toLowerCase();
        entries = entries.filter(
          (e) =>
            e.exportType.toLowerCase().includes(q) ||
            e.userRole.toLowerCase().includes(q) ||
            e.fileFormat.toLowerCase().includes(q) ||
            (e.userId ?? "").toLowerCase().includes(q),
        );
      }

      // Role filter
      if (opts?.role) {
        entries = entries.filter((e) => e.userRole === opts.role);
      }

      // File type filter
      if (opts?.fileType) {
        entries = entries.filter(
          (e) => e.fileFormat.toLowerCase() === opts.fileType!.toLowerCase(),
        );
      }

      // Date range
      if (opts?.fromDate) {
        const from = new Date(opts.fromDate).getTime();
        entries = entries.filter(
          (e) => new Date(e.timestamp).getTime() >= from,
        );
      }
      if (opts?.toDate) {
        const to = new Date(opts.toDate).getTime() + 86_400_000;
        entries = entries.filter((e) => new Date(e.timestamp).getTime() <= to);
      }

      return entries;
    },
    [],
  );

  return {
    /** Full audit history, newest first. Reactive — updates after logExport. */
    exportHistory,
    logExport,
    getExportHistory,
    clearHistory,
    logs: exportHistory,
    clearLogs: clearHistory,
    searchLogs,
  };
}
