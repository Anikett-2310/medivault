import { ExportButton } from "@/components/exports/ExportButton";
import { ExportProgressModal } from "@/components/exports/ExportProgressModal";
import { useLabDiagnosticBookings } from "@/hooks/useBackend";
import { logExport } from "@/lib/exportAudit";
import { downloadCsv, generateCsv } from "@/lib/exportCsv";
import {
  addPdfFooter,
  addPdfTable,
  createPdfDocument,
  exportToPdf,
} from "@/lib/exportPdf";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

type DiagnosticBooking = {
  id: string;
  testType: string;
  status: string;
  preferredDate: string;
  createdAt: bigint;
  statusHistory: Array<{ status: string; timestamp: bigint; note?: string }>;
  reportUrl?: string;
  reportUploadedAt?: bigint;
};

const GLASS =
  "bg-[var(--color-bg-surface)] backdrop-blur-md border border-[var(--color-border-subtle)] rounded-xl";

const STATUS_COLORS: Record<string, string> = {
  Completed:
    "bg-[var(--color-status-success)]/20 text-[var(--color-status-success)] border-[var(--color-status-success)]/30",
  "In Progress":
    "bg-[var(--color-role-diagnostic)]/20 text-[var(--color-role-diagnostic)] border-[var(--color-role-diagnostic)]/30",
  "Report Uploaded":
    "bg-[var(--color-accent-teal)]/20 text-[var(--color-accent-teal)] border-[var(--color-accent-teal)]/30",
  Booked:
    "bg-[var(--color-accent-amber)]/20 text-[var(--color-accent-amber)] border-[var(--color-accent-amber)]/30",
  Confirmed:
    "bg-[var(--color-status-info)]/20 text-[var(--color-status-info)] border-[var(--color-status-info)]/30",
  Cancelled:
    "bg-[var(--color-status-danger)]/20 text-[var(--color-status-danger)] border-[var(--color-status-danger)]/30",
};

const STATUS_ICONS: Record<string, string> = {
  Booked: "📋",
  Confirmed: "✅",
  "Sample Collected": "🧪",
  "In Progress": "⚙️",
  "Report Uploaded": "📄",
  Completed: "🏁",
  Cancelled: "❌",
};

function statusBadge(status: string) {
  const cls =
    STATUS_COLORS[status] ??
    "bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]";
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}
    >
      {status}
    </span>
  );
}

function fmtNano(ns: bigint | undefined): string {
  if (!ns) return "—";
  return new Date(Number(ns) / 1_000_000).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtNanoTime(ns: bigint | undefined): string {
  if (!ns) return "—";
  const d = new Date(Number(ns) / 1_000_000);
  return `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

function turnaround(b: DiagnosticBooking): number {
  const end = b.reportUploadedAt ?? b.createdAt;
  return Math.floor((Number(end) - Number(b.createdAt)) / (86400 * 1e9));
}

const TABS = [
  "Booking History",
  "Completed Tests",
  "Patient Test Timelines",
  "Turnaround Metrics",
] as const;
type Tab = (typeof TABS)[number];

export default function LabReportsPage() {
  const { data: bookings = [], isLoading } = useLabDiagnosticBookings() as {
    data: DiagnosticBooking[];
    isLoading: boolean;
  };
  const [activeTab, setActiveTab] = useState<Tab>("Booking History");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isExporting, setIsExporting] = useState(false);
  const [pdfProgress, setPdfProgress] = useState({
    isOpen: false,
    progress: 0,
    currentRow: 0,
    totalRows: 0,
  });

  const allStatuses = useMemo(() => {
    const s = new Set(bookings.map((b) => b.status));
    return ["All", ...Array.from(s)];
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    if (statusFilter === "All") return bookings;
    return bookings.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter]);

  const completedBookings = useMemo(
    () =>
      bookings.filter((b) =>
        ["Completed", "Report Uploaded"].includes(b.status),
      ),
    [bookings],
  );

  const avgTurnaround = useMemo(() => {
    if (!completedBookings.length) return 0;
    const sum = completedBookings.reduce((a, b) => a + turnaround(b), 0);
    return Math.round((sum / completedBookings.length) * 10) / 10;
  }, [completedBookings]);

  const completionRate = useMemo(() => {
    if (!bookings.length) return 0;
    return Math.round((completedBookings.length / bookings.length) * 100);
  }, [bookings, completedBookings]);

  // ── PDF helpers ──────────────────────────────────────────────────
  async function handlePdfExport() {
    setIsExporting(true);
    try {
      if (activeTab === "Booking History") {
        if (filteredBookings.length >= 50)
          setPdfProgress({
            isOpen: true,
            progress: 20,
            currentRow: 0,
            totalRows: filteredBookings.length,
          });
        const doc = await createPdfDocument(
          "Lab Booking History Report",
          "Lab",
          {
            status: statusFilter,
          },
        );
        addPdfTable(
          doc,
          ["Booking ID", "Test Type", "Status", "Preferred Date", "Created At"],
          filteredBookings.map((b) => [
            b.id,
            b.testType,
            b.status,
            b.preferredDate,
            fmtNano(b.createdAt),
          ]),
          40,
        );
        addPdfFooter(doc);
        exportToPdf("lab-booking-history.pdf", doc);
        setPdfProgress((p) => ({ ...p, isOpen: false }));
        logExport({
          userId: "lab-user",
          userRole: "Lab",
          exportType: "Booking History",
          fileFormat: "pdf",
          filters: { status: statusFilter },
          success: true,
          rowCount: filteredBookings.length,
        });
      } else if (activeTab === "Completed Tests") {
        if (completedBookings.length >= 50)
          setPdfProgress({
            isOpen: true,
            progress: 20,
            currentRow: 0,
            totalRows: completedBookings.length,
          });
        const doc = await createPdfDocument(
          "Lab Completed Tests Report",
          "Lab",
          {},
        );
        addPdfTable(
          doc,
          ["Booking ID", "Test Type", "Completed Date", "Turnaround Days"],
          completedBookings.map((b) => [
            b.id,
            b.testType,
            fmtNano(b.reportUploadedAt ?? b.createdAt),
            String(turnaround(b)),
          ]),
          40,
        );
        addPdfFooter(doc);
        exportToPdf("lab-completed-tests.pdf", doc);
        setPdfProgress((p) => ({ ...p, isOpen: false }));
        logExport({
          userId: "lab-user",
          userRole: "Lab",
          exportType: "Completed Tests",
          fileFormat: "pdf",
          filters: {},
          success: true,
          rowCount: completedBookings.length,
        });
      } else if (activeTab === "Turnaround Metrics") {
        const doc = await createPdfDocument(
          "Lab Turnaround Metrics",
          "Lab",
          {},
        );
        addPdfTable(
          doc,
          ["Metric", "Value"],
          [
            ["Total Bookings", String(bookings.length)],
            ["Completed Tests", String(completedBookings.length)],
            ["Avg Turnaround (days)", String(avgTurnaround)],
            ["Completion Rate", `${completionRate}%`],
          ],
          40,
        );
        addPdfFooter(doc);
        exportToPdf("lab-turnaround-metrics.pdf", doc);
        setPdfProgress((p) => ({ ...p, isOpen: false }));
        logExport({
          userId: "lab-user",
          userRole: "Lab",
          exportType: "Turnaround Metrics",
          fileFormat: "pdf",
          filters: {},
          success: true,
          rowCount: 4,
        });
      }
    } catch {
      setPdfProgress((p) => ({ ...p, isOpen: false }));
      logExport({
        userId: "lab-user",
        userRole: "Lab",
        exportType: activeTab,
        fileFormat: "pdf",
        filters: {},
        success: false,
        rowCount: 0,
      });
    } finally {
      setIsExporting(false);
    }
  }

  // ── CSV helpers ──────────────────────────────────────────────────
  function handleCsvExport() {
    setIsExporting(true);
    try {
      if (activeTab === "Booking History") {
        const csv = generateCsv(
          ["Booking ID", "Test Type", "Status", "Preferred Date", "Created At"],
          filteredBookings.map((b) => [
            b.id,
            b.testType,
            b.status,
            b.preferredDate,
            fmtNano(b.createdAt),
          ]),
        );
        downloadCsv("lab-booking-history.csv", csv);
        logExport({
          userId: "lab-user",
          userRole: "Lab",
          exportType: "Booking History",
          fileFormat: "csv",
          filters: { status: statusFilter },
          success: true,
          rowCount: filteredBookings.length,
        });
      } else if (activeTab === "Completed Tests") {
        const csv = generateCsv(
          ["Booking ID", "Test Type", "Completed Date", "Turnaround Days"],
          completedBookings.map((b) => [
            b.id,
            b.testType,
            fmtNano(b.reportUploadedAt ?? b.createdAt),
            String(turnaround(b)),
          ]),
        );
        downloadCsv("lab-completed-tests.csv", csv);
        logExport({
          userId: "lab-user",
          userRole: "Lab",
          exportType: "Completed Tests",
          fileFormat: "csv",
          filters: {},
          success: true,
          rowCount: completedBookings.length,
        });
      } else if (activeTab === "Turnaround Metrics") {
        const csv = generateCsv(
          ["Metric", "Value"],
          [
            ["Total Bookings", String(bookings.length)],
            ["Completed Tests", String(completedBookings.length)],
            ["Avg Turnaround (days)", String(avgTurnaround)],
            ["Completion Rate", `${completionRate}%`],
          ],
        );
        downloadCsv("lab-turnaround-metrics.csv", csv);
        logExport({
          userId: "lab-user",
          userRole: "Lab",
          exportType: "Turnaround Metrics",
          fileFormat: "csv",
          filters: {},
          success: true,
          rowCount: 4,
        });
      }
    } catch {
      logExport({
        userId: "lab-user",
        userRole: "Lab",
        exportType: activeTab,
        fileFormat: "csv",
        filters: {},
        success: false,
        rowCount: 0,
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="min-h-full bg-[var(--color-bg-base)] p-6 md:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-[var(--color-text-primary)]">
              Lab Reports &amp; Export
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Booking history, completed tests, patient timelines, and
              turnaround analytics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 text-sm rounded bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] transition-colors"
            >
              Print
            </button>
            <ExportButton
              onExportPdf={handlePdfExport}
              onExportCsv={handleCsvExport}
              isExporting={isExporting}
              data-ocid="lab.reports.export_button"
            />
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-wrap gap-2 mb-6"
        data-ocid="lab.reports.tab"
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            data-ocid={`lab.reports.${tab.toLowerCase().replace(/ /g, "_")}.tab`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 border ${
              activeTab === tab
                ? "bg-[var(--color-role-diagnostic)]/20 text-[var(--color-role-diagnostic)] border-[var(--color-role-diagnostic)]/30"
                : "bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`${GLASS} p-8 flex items-center justify-center gap-3`}
          data-ocid="lab.reports.loading_state"
        >
          <div className="w-5 h-5 rounded-full border-2 border-[var(--color-role-diagnostic)] border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground">
            Loading diagnostic data…
          </span>
        </motion.div>
      )}

      {/* ── Tab: Booking History ── */}
      {!isLoading && activeTab === "Booking History" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${GLASS} overflow-hidden`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-[var(--color-border-subtle)]">
            <h2 className="font-semibold text-[var(--color-text-primary)]">
              Booking History
              <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                ({filteredBookings.length} records)
              </span>
            </h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              data-ocid="lab.reports.status_filter.select"
              className="text-sm bg-[var(--color-bg-surface)] border border-[var(--color-border-base)] text-[var(--color-text-primary)] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
            >
              {allStatuses.map((s) => (
                <option key={s} value={s} className="bg-[var(--color-bg-base)]">
                  {s}
                </option>
              ))}
            </select>
          </div>

          {filteredBookings.length === 0 ? (
            <div
              className="px-5 py-12 text-center text-sm text-muted-foreground"
              data-ocid="lab.reports.booking_history.empty_state"
            >
              No bookings found for the selected status.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      "Booking ID",
                      "Test Type",
                      "Status",
                      "Preferred Date",
                      "Created At",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b, i) => (
                    <tr
                      key={b.id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      data-ocid={`lab.reports.booking_history.item.${i + 1}`}
                    >
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                        {b.id.slice(0, 12)}…
                      </td>
                      <td className="px-5 py-3 text-foreground/80">
                        {b.testType}
                      </td>
                      <td className="px-5 py-3">{statusBadge(b.status)}</td>
                      <td className="px-5 py-3 text-foreground/70">
                        {b.preferredDate}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {fmtNano(b.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Tab: Completed Tests ── */}
      {!isLoading && activeTab === "Completed Tests" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${GLASS} overflow-hidden`}
        >
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">
              Completed Tests
              <span className="ml-2 text-xs text-muted-foreground">
                ({completedBookings.length} records)
              </span>
            </h2>
          </div>

          {completedBookings.length === 0 ? (
            <div
              className="px-5 py-12 text-center text-sm text-muted-foreground"
              data-ocid="lab.reports.completed_tests.empty_state"
            >
              No completed tests yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      "Booking ID",
                      "Test Type",
                      "Completed Date",
                      "Turnaround Days",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {completedBookings.map((b, i) => (
                    <tr
                      key={b.id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      data-ocid={`lab.reports.completed_tests.item.${i + 1}`}
                    >
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                        {b.id.slice(0, 12)}…
                      </td>
                      <td className="px-5 py-3 text-foreground/80">
                        {b.testType}
                      </td>
                      <td className="px-5 py-3 text-[var(--color-text-secondary)]">
                        {fmtNano(b.reportUploadedAt ?? b.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-status-success)]/20 text-[var(--color-status-success)] border border-[var(--color-status-success)]/30">
                          {turnaround(b)}d
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Tab: Patient Test Timelines ── */}
      {!isLoading && activeTab === "Patient Test Timelines" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {bookings.length === 0 ? (
            <div
              className={`${GLASS} px-5 py-12 text-center text-sm text-muted-foreground`}
              data-ocid="lab.reports.timelines.empty_state"
            >
              No booking timelines available.
            </div>
          ) : (
            bookings.map((b, bi) => (
              <div
                key={b.id}
                className={GLASS}
                data-ocid={`lab.reports.timelines.item.${bi + 1}`}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-subtle)]">
                  <div>
                    <p className="font-semibold text-[var(--color-text-primary)] text-sm">
                      {b.testType}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] font-mono mt-0.5">
                      {b.id.slice(0, 16)}…
                    </p>
                  </div>
                  {statusBadge(b.status)}
                </div>
                <div className="px-5 py-4 space-y-3">
                  {(b.statusHistory ?? []).length === 0 ? (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      No status history recorded.
                    </p>
                  ) : (
                    (b.statusHistory ?? []).map((ev, ei) => (
                      <div
                        key={`${ev.status}-${ei}`}
                        className="flex items-start gap-3"
                      >
                        <span className="text-base leading-none mt-0.5">
                          {STATUS_ICONS[ev.status] ?? "🔵"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">
                            {ev.status}
                          </p>
                          {ev.note && (
                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">
                              {ev.note}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-[var(--color-text-muted)] shrink-0">
                          {fmtNanoTime(ev.timestamp)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </motion.div>
      )}

      {/* ── Tab: Turnaround Metrics ── */}
      {!isLoading && activeTab === "Turnaround Metrics" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            data-ocid="lab.reports.metrics.card"
          >
            {[
              {
                label: "Total Bookings",
                value: bookings.length,
                unit: "",
                color: "from-purple-500/30 to-indigo-500/30",
                border: "border-purple-500/30",
              },
              {
                label: "Completed Tests",
                value: completedBookings.length,
                unit: "",
                color: "from-emerald-500/30 to-teal-500/30",
                border: "border-emerald-500/30",
              },
              {
                label: "Avg Turnaround",
                value: avgTurnaround,
                unit: "days",
                color: "from-blue-500/30 to-cyan-500/30",
                border: "border-blue-500/30",
              },
              {
                label: "Completion Rate",
                value: completionRate,
                unit: "%",
                color: "from-amber-500/30 to-orange-500/30",
                border: "border-amber-500/30",
              },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-[var(--color-bg-surface)] backdrop-blur-md border border-[var(--color-border-subtle)] rounded-xl p-5"
                data-ocid={`lab.reports.metric.item.${i + 1}`}
              >
                <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                  {card.label}
                </p>
                <p className="text-3xl font-bold text-[var(--color-text-primary)]">
                  {card.value}
                  <span className="text-sm font-normal text-[var(--color-text-secondary)] ml-1">
                    {card.unit}
                  </span>
                </p>
              </motion.div>
            ))}
          </div>

          {bookings.length === 0 && (
            <div
              className={`${GLASS} px-5 py-12 text-center text-sm text-muted-foreground`}
              data-ocid="lab.reports.metrics.empty_state"
            >
              No booking data available for metrics.
            </div>
          )}
        </motion.div>
      )}
      <ExportProgressModal
        isOpen={pdfProgress.isOpen}
        progress={pdfProgress.progress}
        currentRow={pdfProgress.currentRow}
        totalRows={pdfProgress.totalRows}
        onCancel={() => setPdfProgress((p) => ({ ...p, isOpen: false }))}
      />
    </div>
  );
}
