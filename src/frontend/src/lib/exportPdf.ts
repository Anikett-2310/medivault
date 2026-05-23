/**
 * MediVault PDF Generator
 * Clean, healthcare-style A4 PDFs using jsPDF.
 * White background, minimal blue accents — professional & printable.
 * Fully offline-compatible (no network calls).
 */
import type { ExportConfig } from "@/lib/exportTypes";
import type { jsPDF as JsPDFType } from "jspdf";

// ── Palette — white-background healthcare style ───────────────────────────────
const C = {
  headerBg: [37, 99, 235] as const, // blue-600 — clean header bar
  headerText: [255, 255, 255] as const,
  accentLine: [59, 130, 246] as const, // blue-500
  titleText: [15, 23, 42] as const, // near-black
  mutedText: [100, 116, 139] as const, // slate-500
  tableHeaderBg: [239, 246, 255] as const, // blue-50
  tableHeaderText: [30, 58, 138] as const, // blue-900
  rowAlt: [248, 250, 252] as const, // slate-50
  rowBase: [255, 255, 255] as const, // white
  rowBorder: [226, 232, 240] as const, // slate-200
  bodyText: [30, 41, 59] as const, // slate-800
  footerText: [148, 163, 184] as const, // slate-400
  footerLine: [203, 213, 225] as const, // slate-300
};

const MARGIN = 14;
const ROW_H = 8;
const HEADER_H = 9;
/** Force page break after this many rows to avoid clipped tables */
export const CHUNK_SIZE = 45;

// ── Header ────────────────────────────────────────────────────────────────────

function drawHeader(
  doc: JsPDFType,
  title: string,
  role: string,
  filters: ExportConfig["filters"],
  userName?: string,
): number {
  const W = doc.internal.pageSize.getWidth();

  // Header background bar — clean solid blue
  doc.setFillColor(...C.headerBg);
  doc.rect(0, 0, W, 30, "F");

  // Brand name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...C.headerText);
  doc.text("MediVault", MARGIN, 13);

  // Tagline
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(186, 230, 253); // blue-200
  doc.text("Smart Medicine Lifecycle Management", MARGIN, 19);

  // Role label (top-right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.headerText);
  doc.text(role.toUpperCase(), W - MARGIN, 12, { align: "right" });

  // Timestamp (top-right)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(186, 230, 253);
  doc.text(`Generated: ${new Date().toLocaleString()}`, W - MARGIN, 19, {
    align: "right",
  });

  if (userName) {
    doc.text(`By: ${userName}`, W - MARGIN, 24.5, { align: "right" });
  }

  // Accent separator line under header
  doc.setFillColor(...C.accentLine);
  doc.rect(0, 30, W, 1, "F");

  // Report title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...C.titleText);
  doc.text(title, MARGIN, 42);

  // Filter summary
  const parts: string[] = [];
  if (filters.dateRange?.start) parts.push(`From: ${filters.dateRange.start}`);
  if (filters.dateRange?.end) parts.push(`To: ${filters.dateRange.end}`);
  if (filters.status) parts.push(`Status: ${filters.status}`);
  if (filters.medicineName) parts.push(`Medicine: ${filters.medicineName}`);
  if (filters.search) parts.push(`Search: ${filters.search}`);

  let contentY = 50;
  if (parts.length > 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...C.mutedText);
    doc.text(`Filters: ${parts.join(" | ")}`, MARGIN, 50);
    contentY = 56;
  }

  // Thin divider under filters
  doc.setDrawColor(...C.accentLine);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, contentY, W - MARGIN, contentY);

  return contentY + 4;
}

// ── Table rendering ───────────────────────────────────────────────────────────

function drawTableHeader(
  doc: JsPDFType,
  headers: string[],
  colW: number,
  usableW: number,
  y: number,
): void {
  doc.setFillColor(...C.tableHeaderBg);
  doc.rect(MARGIN, y, usableW, HEADER_H, "F");

  // Top border accent
  doc.setDrawColor(...C.accentLine);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, MARGIN + usableW, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.tableHeaderText);
  headers.forEach((h, i) => {
    doc.text(h, MARGIN + i * colW + 2.5, y + 6);
  });
}

/**
 * Adds a table to the PDF.
 * Supports chunked rendering — pass `startRow` and `endRow` for partial batches.
 * Returns the Y position after the last rendered row.
 */
export function addPdfTable(
  doc: JsPDFType,
  headers: string[],
  rows: string[][],
  startY: number,
  onProgress?: (rendered: number, total: number) => void,
): number {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const usableW = W - MARGIN * 2;
  const colW = usableW / Math.max(headers.length, 1);

  let y = startY;
  drawTableHeader(doc, headers, colW, usableW, y);
  y += HEADER_H;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  rows.forEach((row, ri) => {
    // Page break
    if (y + ROW_H > H - 18) {
      doc.addPage();
      y = 20;
      drawTableHeader(doc, headers, colW, usableW, y);
      y += HEADER_H;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
    }

    // Alternating row fill
    const [fillR, fillG, fillB] = ri % 2 === 0 ? C.rowBase : C.rowAlt;
    doc.setFillColor(fillR, fillG, fillB);
    doc.rect(MARGIN, y, usableW, ROW_H, "F");

    // Row bottom border
    doc.setDrawColor(...C.rowBorder);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y + ROW_H, MARGIN + usableW, y + ROW_H);

    doc.setTextColor(...C.bodyText);
    row.forEach((cell, ci) => {
      const text = String(cell ?? "");
      const maxChars = Math.max(Math.floor(colW / 1.8), 6);
      const truncated =
        text.length > maxChars ? `${text.slice(0, maxChars - 1)}…` : text;
      doc.text(truncated, MARGIN + ci * colW + 2.5, y + 5.5);
    });

    y += ROW_H;
    onProgress?.(ri + 1, rows.length);
  });

  // Table bottom border
  doc.setDrawColor(...C.accentLine);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, W - MARGIN, y);

  return y + 4;
}

// ── Footer ────────────────────────────────────────────────────────────────────

/** Adds footer with page numbers to every page. Call AFTER all content is written. */
export function addPdfFooter(doc: JsPDFType): void {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const total = doc.getNumberOfPages();
  const ts = new Date().toLocaleString();

  for (let i = 1; i <= total; i++) {
    doc.setPage(i);

    doc.setDrawColor(...C.footerLine);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, H - 12, W - MARGIN, H - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.footerText);
    doc.text(`MediVault Confidential  |  ${ts}`, MARGIN, H - 7);
    doc.text(`Page ${i} of ${total}`, W - MARGIN, H - 7, { align: "right" });
  }
}

// ── High-level builder ────────────────────────────────────────────────────────

export type PdfProgressCallback = (rendered: number, total: number) => void;

/**
 * Builds a complete A4 PDF from an ExportConfig.
 * Supports chunked rendering with progress callbacks for large datasets.
 * Returns the jsPDF instance (caller should call exportToPdf() or doc.save()).
 */
export async function buildPdf(
  config: ExportConfig,
  onProgress?: PdfProgressCallback,
): Promise<{ doc: JsPDFType; fileSizeBytes: number }> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const headers = config.columns.map((c) => c.label);
  const rows = config.data.map((item) =>
    config.columns.map((c) => {
      const val = (item as Record<string, unknown>)[c.key];
      return val == null ? "" : String(val);
    }),
  );

  const contentStartY = drawHeader(
    doc,
    config.title,
    config.role,
    config.filters,
    config.userName,
  );

  // Chunked rendering — page-break every CHUNK_SIZE rows
  let renderedSoFar = 0;
  let currentY = contentStartY;

  for (let offset = 0; offset < rows.length; offset += CHUNK_SIZE) {
    const chunk = rows.slice(offset, offset + CHUNK_SIZE);
    if (offset > 0) {
      doc.addPage();
      currentY = 20;
    }
    currentY = addPdfTable(doc, headers, chunk, currentY, (done) => {
      renderedSoFar = offset + done;
      onProgress?.(renderedSoFar, rows.length);
    });
  }

  addPdfFooter(doc);

  const blob = doc.output("blob");
  return { doc, fileSizeBytes: blob.size };
}

/**
 * Convenience: creates a PDF from ExportConfig and triggers browser download.
 * Returns file size in bytes.
 */
export async function generateAndDownloadPdf(
  config: ExportConfig,
  filename: string,
  onProgress?: PdfProgressCallback,
): Promise<number> {
  const { doc, fileSizeBytes } = await buildPdf(config, onProgress);
  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
  return fileSizeBytes;
}

/** Triggers browser download of any jsPDF doc. Returns file size. */
export function exportToPdf(filename: string, doc: JsPDFType): number {
  const blob = doc.output("blob");
  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
  return blob.size;
}

/** Convenience wrapper: async createPdfDocument for backward compat. */
export async function createPdfDocument(
  title: string,
  role: string,
  filters: ExportConfig["filters"],
  userName?: string,
): Promise<JsPDFType> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  drawHeader(doc, title, role, filters, userName);
  return doc;
}
