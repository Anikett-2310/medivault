import { SkeletonCard } from "@/components/common/SkeletonCard";
import { ExportProgressModal } from "@/components/exports/ExportProgressModal";
import {
  useExpiryStats,
  useInventoryStats,
  usePharmacySyncLogs,
  useSystemStats,
} from "@/hooks/useBackend";
import { type ExportLogEntry, getExportLogs } from "@/lib/exportAudit";
import { logExport } from "@/lib/exportAudit";
import { downloadCsv, generateCsv } from "@/lib/exportCsv";
import {
  addPdfFooter,
  addPdfTable,
  createPdfDocument,
  exportToPdf,
} from "@/lib/exportPdf";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  CheckCircle,
  ClipboardList,
  Download,
  FileText,
  RefreshCw,
  Search,
  Shield,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const GLASS = "bg-muted backdrop-blur-md border border-border rounded-xl";

type Tab = "analytics" | "ecosystem" | "roles" | "sync" | "audit";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "analytics",
    label: "Platform Analytics",
    icon: <BarChart3 size={15} />,
  },
  {
    id: "ecosystem",
    label: "Ecosystem Activity",
    icon: <TrendingUp size={15} />,
  },
  { id: "roles", label: "Role Statistics", icon: <Users size={15} /> },
  { id: "sync", label: "Sync Metrics", icon: <RefreshCw size={15} /> },
  { id: "audit", label: "Export Audit Log", icon: <Shield size={15} /> },
];

function StatusBadge({ success }: { success: boolean }) {
  return success ? (
    <span className="badge-success inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold">
      <CheckCircle size={10} /> Success
    </span>
  ) : (
    <span className="badge-danger inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold">
      <XCircle size={10} /> Failed
    </span>
  );
}

function SectionHeader({
  title,
  subtitle,
  onExportPdf,
  onExportCsv,
  exporting,
}: {
  title: string;
  subtitle: string;
  onExportPdf: () => void;
  onExportCsv: () => void;
  exporting: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <div>
        <h2 className="font-display font-bold text-lg gradient-text">
          {title}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExportCsv}
          disabled={exporting}
          data-ocid="admin.reports.export_csv_button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-[var(--color-bg-muted)] border border-border text-foreground transition-colors disabled:opacity-50"
        >
          <FileText size={13} /> CSV
        </button>
        <button
          type="button"
          onClick={onExportPdf}
          disabled={exporting}
          data-ocid="admin.reports.export_pdf_button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary transition-colors disabled:opacity-50"
        >
          <Download size={13} /> {exporting ? "Exporting…" : "PDF"}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          data-ocid="admin.reports.print_button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-[var(--color-bg-muted)] border border-border text-foreground transition-colors"
        >
          Print
        </button>
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("analytics");
  const [auditSearch, setAuditSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const [pdfProgress, setPdfProgress] = useState({
    isOpen: false,
    progress: 0,
    currentRow: 0,
    totalRows: 0,
  });

  const { data: stats, isLoading: loadingStats } = useSystemStats();
  const { data: expiryStats, isLoading: loadingExpiry } = useExpiryStats();
  const { data: inventoryStats, isLoading: loadingInv } = useInventoryStats();
  const { data: syncLogs, isLoading: loadingSyncs } = usePharmacySyncLogs();

  const auditLogs: ExportLogEntry[] = useMemo(() => getExportLogs(), []);

  // Derive per-role active user counts from stats
  const roleRows = useMemo(() => {
    return (stats?.usersByRole ?? []).map(([role, count]) => ({
      role,
      count: Number(count),
    }));
  }, [stats]);

  // Per-pharmacy sync metrics
  const syncMetrics = useMemo(() => {
    if (!syncLogs) return [];
    const map = new Map<
      string,
      { success: number; failed: number; duplicate: number; total: number }
    >();
    for (const log of syncLogs) {
      const key = `${log.pharmacyPrincipal.toString().slice(0, 16)}…`;
      const existing = map.get(key) ?? {
        success: 0,
        failed: 0,
        duplicate: 0,
        total: 0,
      };
      existing.total += 1;
      if (log.status === "Success") existing.success += 1;
      else if (log.status === "Failed") existing.failed += 1;
      else existing.duplicate += 1;
      map.set(key, existing);
    }
    return Array.from(map.entries()).map(([pharmacy, m]) => ({
      pharmacy,
      ...m,
      rate: m.total > 0 ? Math.round((m.success / m.total) * 100) : 0,
    }));
  }, [syncLogs]);

  const filteredAuditLogs = useMemo(() => {
    if (!auditSearch.trim()) return auditLogs;
    const q = auditSearch.toLowerCase();
    return auditLogs.filter(
      (l) =>
        l.userId.toLowerCase().includes(q) ||
        l.userRole.toLowerCase().includes(q) ||
        l.exportType.toLowerCase().includes(q) ||
        (l.fileFormat as string).toLowerCase().includes(q),
    );
  }, [auditLogs, auditSearch]);

  const ecosystemStats = useMemo(() => {
    const total = syncLogs?.length ?? 0;
    const success = syncLogs?.filter((s) => s.status === "Success").length ?? 0;
    const failed = syncLogs?.filter((s) => s.status === "Failed").length ?? 0;
    const duplicate =
      syncLogs?.filter((s) => s.status === "Duplicate").length ?? 0;
    return { total, success, failed, duplicate };
  }, [syncLogs]);

  // ── Export helpers ──────────────────────────────────────────────────
  async function handleExportPdf(
    tabLabel: string,
    headers: string[],
    rows: string[][],
    filename: string,
  ) {
    setExporting(true);
    if (rows.length >= 50)
      setPdfProgress({
        isOpen: true,
        progress: 20,
        currentRow: 0,
        totalRows: rows.length,
      });
    try {
      const doc = await createPdfDocument(
        `Admin Report — ${tabLabel}`,
        "Admin",
        {},
      );
      addPdfTable(doc, headers, rows, 60);
      addPdfFooter(doc);
      exportToPdf(filename, doc);
      logExport({
        userId: "admin",
        userRole: "Admin",
        exportType: tabLabel,
        fileFormat: "pdf",
        filters: {},
        success: true,
        rowCount: rows.length,
      });
      toast.success("PDF exported successfully");
    } catch (err) {
      logExport({
        userId: "admin",
        userRole: "Admin",
        exportType: tabLabel,
        fileFormat: "pdf",
        filters: {},
        success: false,
        rowCount: 0,
        errorMessage: String(err),
      });
      toast.error("PDF export failed");
    } finally {
      setExporting(false);
      setPdfProgress((p) => ({ ...p, isOpen: false }));
    }
  }

  function handleExportCsv(
    tabLabel: string,
    headers: string[],
    rows: (string | number)[][],
    filename: string,
  ) {
    try {
      downloadCsv(filename, generateCsv(headers, rows));
      logExport({
        userId: "admin",
        userRole: "Admin",
        exportType: tabLabel,
        fileFormat: "csv",
        filters: {},
        success: true,
        rowCount: rows.length,
      });
      toast.success("CSV exported successfully");
    } catch (err) {
      logExport({
        userId: "admin",
        userRole: "Admin",
        exportType: tabLabel,
        fileFormat: "csv",
        filters: {},
        success: false,
        rowCount: 0,
        errorMessage: String(err),
      });
      toast.error("CSV export failed");
    }
  }

  // ── Tab: Platform Analytics ─────────────────────────────────────────
  function exportAnalyticsPdf() {
    const headers = ["Metric", "Value"];
    const rows: string[][] = [
      ["Total Users", String(Number(stats?.totalUsers ?? 0))],
      ["Total Medicines", String(Number(stats?.totalMedicines ?? 0))],
      ["Total Orders", String(Number(stats?.totalOrders ?? 0))],
      ["Safe Medicines", String(Number(expiryStats?.safe ?? 0))],
      ["Expiring Soon", String(Number(expiryStats?.expiringSoon ?? 0))],
      ["Expired", String(Number(expiryStats?.expired ?? 0))],
      ...(inventoryStats ?? []).map(([cat, cnt]) => [
        `Inventory — ${cat}`,
        String(Number(cnt)),
      ]),
    ];
    handleExportPdf(
      "Platform Analytics",
      headers,
      rows,
      `admin-analytics-${Date.now()}.pdf`,
    );
  }
  function exportAnalyticsCsv() {
    const headers = ["Metric", "Value"];
    const rows: (string | number)[][] = [
      ["Total Users", Number(stats?.totalUsers ?? 0)],
      ["Total Medicines", Number(stats?.totalMedicines ?? 0)],
      ["Total Orders", Number(stats?.totalOrders ?? 0)],
      ["Safe Medicines", Number(expiryStats?.safe ?? 0)],
      ["Expiring Soon", Number(expiryStats?.expiringSoon ?? 0)],
      ["Expired", Number(expiryStats?.expired ?? 0)],
    ];
    handleExportCsv(
      "Platform Analytics",
      headers,
      rows,
      `admin-analytics-${Date.now()}.csv`,
    );
  }

  // ── Tab: Ecosystem Activity ─────────────────────────────────────────
  function exportEcosystemPdf() {
    const headers = ["Pharmacy", "Medicine", "Status", "Synced At"];
    const rows: string[][] = (syncLogs ?? []).map((l) => [
      `${l.pharmacyPrincipal.toString().slice(0, 14)}…`,
      l.medicineName,
      l.status,
      new Date(Number(l.syncedAt) / 1_000_000).toLocaleString(),
    ]);
    handleExportPdf(
      "Ecosystem Activity",
      headers,
      rows,
      `admin-ecosystem-${Date.now()}.pdf`,
    );
  }
  function exportEcosystemCsv() {
    const headers = ["Pharmacy", "Medicine", "Quantity", "Status", "Synced At"];
    const rows: (string | number)[][] = (syncLogs ?? []).map((l) => [
      l.pharmacyPrincipal.toString(),
      l.medicineName,
      Number(l.quantity),
      l.status,
      new Date(Number(l.syncedAt) / 1_000_000).toLocaleString(),
    ]);
    handleExportCsv(
      "Ecosystem Activity",
      headers,
      rows,
      `admin-ecosystem-${Date.now()}.csv`,
    );
  }

  // ── Tab: Role Statistics ────────────────────────────────────────────
  function exportRolesPdf() {
    const headers = ["Role", "Active Users"];
    const rows = roleRows.map((r) => [r.role, String(r.count)]);
    handleExportPdf(
      "Role Statistics",
      headers,
      rows,
      `admin-roles-${Date.now()}.pdf`,
    );
  }
  function exportRolesCsv() {
    const headers = ["Role", "Active Users"];
    const rows: (string | number)[][] = roleRows.map((r) => [r.role, r.count]);
    handleExportCsv(
      "Role Statistics",
      headers,
      rows,
      `admin-roles-${Date.now()}.csv`,
    );
  }

  // ── Tab: Sync Metrics ───────────────────────────────────────────────
  function exportSyncPdf() {
    const headers = [
      "Pharmacy",
      "Total",
      "Success",
      "Failed",
      "Duplicate",
      "Success Rate",
    ];
    const rows = syncMetrics.map((m) => [
      m.pharmacy,
      String(m.total),
      String(m.success),
      String(m.failed),
      String(m.duplicate),
      `${m.rate}%`,
    ]);
    handleExportPdf(
      "Sync Metrics",
      headers,
      rows,
      `admin-sync-${Date.now()}.pdf`,
    );
  }
  function exportSyncCsv() {
    const headers = [
      "Pharmacy",
      "Total",
      "Success",
      "Failed",
      "Duplicate",
      "Success Rate %",
    ];
    const rows: (string | number)[][] = syncMetrics.map((m) => [
      m.pharmacy,
      m.total,
      m.success,
      m.failed,
      m.duplicate,
      m.rate,
    ]);
    handleExportCsv(
      "Sync Metrics",
      headers,
      rows,
      `admin-sync-${Date.now()}.csv`,
    );
  }

  // ── Tab: Export Audit Log ───────────────────────────────────────────
  function exportAuditPdf() {
    const headers = [
      "User",
      "Role",
      "Export Type",
      "File Type",
      "Timestamp",
      "Status",
    ];
    const rows = filteredAuditLogs.map((l) => [
      `${l.userId.slice(0, 14)}…`,
      l.userRole,
      l.exportType,
      l.fileFormat,
      new Date(l.timestamp).toLocaleString(),
      String(l.success ? "Success" : "Failed"),
    ]);
    handleExportPdf(
      "Export Audit Log",
      headers,
      rows,
      `admin-audit-${Date.now()}.pdf`,
    );
  }
  function exportAuditCsv() {
    const headers = [
      "User",
      "Role",
      "Export Type",
      "File Type",
      "Filters",
      "Timestamp",
      "Status",
    ];
    const rows: (string | number)[][] = filteredAuditLogs.map((l) => [
      l.userId,
      l.userRole,
      l.exportType,
      l.fileFormat,
      JSON.stringify(l.filters),
      new Date(l.timestamp).toLocaleString(),
      String(l.success ? "Success" : "Failed"),
    ]);
    handleExportCsv(
      "Export Audit Log",
      headers,
      rows,
      `admin-audit-${Date.now()}.csv`,
    );
  }

  const isLoading = loadingStats || loadingExpiry || loadingInv;

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-bold">
          Reports &amp; Exports <span className="gradient-text">📋</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Platform reporting, analytics exports, and full audit trail
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(GLASS, "p-1 flex gap-1 overflow-x-auto")}
        role="tablist"
        aria-label="Report sections"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            data-ocid={`admin.reports.${t.id}_tab`}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
              activeTab === t.id
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </motion.div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(GLASS, "p-5")}
      >
        {/* ── Platform Analytics ─── */}
        {activeTab === "analytics" && (
          <>
            <SectionHeader
              title="Platform Analytics"
              subtitle="User counts, medicine totals, inventory summary"
              onExportPdf={exportAnalyticsPdf}
              onExportCsv={exportAnalyticsCsv}
              exporting={exporting}
            />
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[0, 1, 2].map((i) => (
                  <SkeletonCard key={i} lines={2} />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
                  {[
                    {
                      label: "Total Users",
                      value: Number(stats?.totalUsers ?? 0),
                      color: "text-orange-300",
                    },
                    {
                      label: "Medicines",
                      value: Number(stats?.totalMedicines ?? 0),
                      color: "text-primary",
                    },
                    {
                      label: "Orders",
                      value: Number(stats?.totalOrders ?? 0),
                      color: "text-purple-300",
                    },
                    {
                      label: "Safe Stock",
                      value: Number(expiryStats?.safe ?? 0),
                      color: "text-[var(--color-status-success)]",
                    },
                    {
                      label: "Expiring Soon",
                      value: Number(expiryStats?.expiringSoon ?? 0),
                      color: "text-[var(--color-status-warning)]",
                    },
                    {
                      label: "Expired",
                      value: Number(expiryStats?.expired ?? 0),
                      color: "text-[var(--color-status-danger)]",
                    },
                  ].map((s, i) => (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="p-4 rounded-xl bg-muted border border-border text-center"
                    >
                      <p
                        className={cn(
                          "font-display text-2xl font-bold",
                          s.color,
                        )}
                      >
                        {s.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {s.label}
                      </p>
                    </motion.div>
                  ))}
                </div>
                {(inventoryStats ?? []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Inventory by Category
                    </p>
                    <div className="overflow-x-auto">
                      <table
                        className="w-full text-sm"
                        data-ocid="admin.reports.analytics.table"
                      >
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">
                              Category
                            </th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">
                              Count
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(inventoryStats ?? []).map(([cat, cnt], i) => (
                            <tr
                              key={cat}
                              className={cn(
                                "border-b border-border/40",
                                i % 2 === 0 ? "bg-muted/20" : "",
                              )}
                              data-ocid={`admin.reports.analytics.item.${i + 1}`}
                            >
                              <td className="py-2 px-3 text-foreground">
                                {cat}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                                {Number(cnt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Ecosystem Activity ─── */}
        {activeTab === "ecosystem" && (
          <>
            <SectionHeader
              title="Ecosystem Activity"
              subtitle="Medicine sync events across all pharmacies"
              onExportPdf={exportEcosystemPdf}
              onExportCsv={exportEcosystemCsv}
              exporting={exporting}
            />
            {loadingSyncs ? (
              <SkeletonCard lines={5} />
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  {[
                    {
                      label: "Total Syncs",
                      value: ecosystemStats.total,
                      color: "text-primary",
                    },
                    {
                      label: "Successful",
                      value: ecosystemStats.success,
                      color: "text-[var(--color-status-success)]",
                    },
                    {
                      label: "Failed",
                      value: ecosystemStats.failed,
                      color: "text-[var(--color-status-danger)]",
                    },
                    {
                      label: "Duplicate",
                      value: ecosystemStats.duplicate,
                      color: "text-[var(--color-status-warning)]",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="p-3 rounded-xl bg-muted border border-border text-center"
                    >
                      <p
                        className={cn(
                          "font-display text-xl font-bold",
                          s.color,
                        )}
                      >
                        {s.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <table
                    className="w-full text-sm"
                    data-ocid="admin.reports.ecosystem.table"
                  >
                    <thead>
                      <tr className="border-b border-border">
                        {[
                          "Pharmacy",
                          "Medicine",
                          "Qty",
                          "Status",
                          "Synced At",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(syncLogs ?? []).length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-8 text-center text-muted-foreground text-sm"
                            data-ocid="admin.reports.ecosystem.empty_state"
                          >
                            No sync events recorded yet.
                          </td>
                        </tr>
                      ) : (
                        (syncLogs ?? []).slice(0, 50).map((l, i) => (
                          <tr
                            key={l.id}
                            className={cn(
                              "border-b border-border/40",
                              i % 2 === 0 ? "bg-muted/20" : "",
                            )}
                            data-ocid={`admin.reports.ecosystem.item.${i + 1}`}
                          >
                            <td className="py-2 px-3 font-mono text-xs text-muted-foreground truncate max-w-[120px]">
                              {`${l.pharmacyPrincipal.toString().slice(0, 14)}…`}
                            </td>
                            <td className="py-2 px-3 text-foreground">
                              {l.medicineName}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                              {Number(l.quantity)}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={cn(
                                  l.status === "Success"
                                    ? "badge-success"
                                    : l.status === "Failed"
                                      ? "badge-danger"
                                      : "badge-warning",
                                )}
                              >
                                {l.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-xs text-muted-foreground">
                              {new Date(
                                Number(l.syncedAt) / 1_000_000,
                              ).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {/* ── Role Statistics ─── */}
        {activeTab === "roles" && (
          <>
            <SectionHeader
              title="Role Statistics"
              subtitle="Active user distribution by role"
              onExportPdf={exportRolesPdf}
              onExportCsv={exportRolesCsv}
              exporting={exporting}
            />
            {loadingStats ? (
              <SkeletonCard lines={4} />
            ) : (
              <div className="overflow-x-auto">
                <table
                  className="w-full text-sm"
                  data-ocid="admin.reports.roles.table"
                >
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">
                        Role
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">
                        Active Users
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">
                        Share %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="py-8 text-center text-muted-foreground text-sm"
                          data-ocid="admin.reports.roles.empty_state"
                        >
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      roleRows.map((r, i) => {
                        const total = roleRows.reduce((a, x) => a + x.count, 0);
                        const pct =
                          total > 0 ? Math.round((r.count / total) * 100) : 0;
                        return (
                          <tr
                            key={r.role}
                            className={cn(
                              "border-b border-border/40",
                              i % 2 === 0 ? "bg-muted/20" : "",
                            )}
                            data-ocid={`admin.reports.roles.item.${i + 1}`}
                          >
                            <td className="py-3 px-3">
                              <span className="inline-flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary/60" />
                                <span className="font-medium text-foreground">
                                  {r.role}
                                </span>
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                              {r.count}
                            </td>
                            <td className="py-3 px-3 text-right text-muted-foreground">
                              {pct}%
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── Sync Metrics ─── */}
        {activeTab === "sync" && (
          <>
            <SectionHeader
              title="Sync Metrics"
              subtitle="Per-pharmacy medicine sync success rates and failure counts"
              onExportPdf={exportSyncPdf}
              onExportCsv={exportSyncCsv}
              exporting={exporting}
            />
            {loadingSyncs ? (
              <SkeletonCard lines={5} />
            ) : (
              <div className="overflow-x-auto">
                <table
                  className="w-full text-sm"
                  data-ocid="admin.reports.sync.table"
                >
                  <thead>
                    <tr className="border-b border-border">
                      {[
                        "Pharmacy",
                        "Total",
                        "Success",
                        "Failed",
                        "Duplicate",
                        "Success Rate",
                      ].map((h) => (
                        <th
                          key={h}
                          className={cn(
                            "py-2 px-3 text-xs font-semibold text-muted-foreground",
                            h === "Pharmacy" ? "text-left" : "text-right",
                          )}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {syncMetrics.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-muted-foreground text-sm"
                          data-ocid="admin.reports.sync.empty_state"
                        >
                          No sync data available.
                        </td>
                      </tr>
                    ) : (
                      syncMetrics.map((m, i) => (
                        <tr
                          key={m.pharmacy}
                          className={cn(
                            "border-b border-border/40",
                            i % 2 === 0 ? "bg-muted/20" : "",
                          )}
                          data-ocid={`admin.reports.sync.item.${i + 1}`}
                        >
                          <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                            {m.pharmacy}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-foreground">
                            {m.total}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-[var(--color-status-success)]">
                            {m.success}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-[var(--color-status-danger)]">
                            {m.failed}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-[var(--color-status-warning)]">
                            {m.duplicate}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={cn(
                                "font-semibold",
                                m.rate >= 80
                                  ? "text-[var(--color-status-success)]"
                                  : m.rate >= 50
                                    ? "text-[var(--color-status-warning)]"
                                    : "text-[var(--color-status-danger)]",
                              )}
                            >
                              {m.rate}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── Export Audit Log ─── */}
        {activeTab === "audit" && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="font-display font-bold text-lg gradient-text">
                  Export Audit Log
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Full export history — {filteredAuditLogs.length} records
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Search logs…"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    data-ocid="admin.reports.audit.search_input"
                    className="pl-7 pr-3 py-1.5 rounded-lg text-xs bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 w-44"
                  />
                </div>
                <button
                  type="button"
                  onClick={exportAuditCsv}
                  disabled={exporting}
                  data-ocid="admin.reports.audit.export_csv_button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-[var(--color-bg-muted)] border border-border text-foreground transition-colors disabled:opacity-50"
                >
                  <FileText size={13} /> CSV
                </button>
                <button
                  type="button"
                  onClick={exportAuditPdf}
                  disabled={exporting}
                  data-ocid="admin.reports.audit.export_pdf_button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary transition-colors disabled:opacity-50"
                >
                  <Download size={13} /> {exporting ? "Exporting…" : "PDF"}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table
                className="w-full text-sm"
                data-ocid="admin.reports.audit.table"
              >
                <thead>
                  <tr className="border-b border-border">
                    {[
                      "User Principal",
                      "Role",
                      "Export Type",
                      "File Type",
                      "Filters",
                      "Timestamp",
                      "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center"
                        data-ocid="admin.reports.audit.empty_state"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <ClipboardList
                            size={32}
                            className="text-muted-foreground/40"
                          />
                          <p className="text-muted-foreground text-sm">
                            {auditSearch
                              ? "No matching export logs."
                              : "No export activity yet. Logs appear after first export."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((l, i) => (
                      <tr
                        key={l.id}
                        className={cn(
                          "border-b border-border/40",
                          i % 2 === 0 ? "bg-muted/20" : "",
                        )}
                        data-ocid={`admin.reports.audit.item.${i + 1}`}
                      >
                        <td
                          className="py-2 px-3 font-mono text-xs text-muted-foreground max-w-[140px] truncate"
                          title={l.userId}
                        >
                          {l.userId.length > 18
                            ? `${l.userId.slice(0, 18)}…`
                            : l.userId}
                        </td>
                        <td className="py-2 px-3 text-foreground text-xs">
                          {l.userRole}
                        </td>
                        <td className="py-2 px-3 text-foreground text-xs">
                          {l.exportType}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={cn(
                              l.fileFormat === "pdf"
                                ? "badge-info"
                                : "badge-success",
                            )}
                          >
                            {l.fileFormat.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-xs text-muted-foreground max-w-[140px] truncate">
                          {Object.keys(l.filters).length > 0 ? (
                            Object.entries(l.filters)
                              .map(([k, v]) => `${k}:${v}`)
                              .join(", ")
                          ) : (
                            <span className="italic opacity-50">none</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(l.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2 px-3">
                          <StatusBadge success={l.success} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </motion.div>
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
