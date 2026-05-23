/**
 * MediVault CSV Builder
 * Accepts column configs + data, produces RFC-4180 CSV, triggers download.
 * Handles special chars, embedded newlines, and quotes correctly.
 * No chunking needed — the Blob API handles large data natively.
 */
import type { ExportColumnConfig } from "@/lib/exportTypes";

// ── Cell escaping ─────────────────────────────────────────────────────────────

/** Escapes a CSV cell value per RFC 4180. */
function escapeCell(value: unknown): string {
  const str = value == null ? "" : String(value);
  // Must quote if contains: comma, double-quote, newline, carriage return
  if (/[,"\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ── Core builders ─────────────────────────────────────────────────────────────

/**
 * Builds a CSV string from an array of column configs and typed data.
 * Column labels become headers; column keys are used to extract values.
 */
export function buildCsvFromConfig<T = Record<string, unknown>>(
  columns: ExportColumnConfig[],
  data: T[],
): string {
  const headerRow = columns.map((c) => escapeCell(c.label)).join(",");
  const dataRows = data.map((item) =>
    columns
      .map((c) => escapeCell((item as Record<string, unknown>)[c.key]))
      .join(","),
  );
  return [headerRow, ...dataRows].join("\r\n");
}

/**
 * Builds a CSV string from raw headers and rows arrays.
 * Useful for ad-hoc data not backed by a typed model.
 */
export function generateCsv(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
): string {
  const headerRow = headers.map(escapeCell).join(",");
  const dataRows = rows.map((row) => row.map(escapeCell).join(","));
  return [headerRow, ...dataRows].join("\r\n");
}

// ── Filename helper ───────────────────────────────────────────────────────────

/**
 * Produces a standardised filename: role-reporttype-YYYY-MM-DD.csv
 * e.g. "pharmacy-inventory-2026-05-20.csv"
 */
export function buildCsvFilename(role: string, reportType: string): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  return `${slug(role)}-${slug(reportType)}-${date}.csv`;
}

// ── Download ──────────────────────────────────────────────────────────────────

/**
 * Creates a UTF-8 BOM Blob from CSV content and triggers a browser download.
 * Returns the file size in bytes.
 */
export function downloadCsv(filename: string, csvContent: string): number {
  const bom = "\uFEFF"; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([bom + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    filename.endsWith(".csv") ? filename : `${filename}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
  return blob.size;
}

/**
 * High-level convenience: build CSV from column config + data, then download.
 * Returns file size in bytes.
 */
export function exportToCsv<T = Record<string, unknown>>(
  columns: ExportColumnConfig[],
  data: T[],
  filename: string,
): number {
  const csv = buildCsvFromConfig(columns, data);
  return downloadCsv(filename, csv);
}
