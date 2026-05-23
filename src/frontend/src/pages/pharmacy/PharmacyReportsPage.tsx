import { ExportButton } from "@/components/exports/ExportButton";
import type { ExportFilters as FilterValues } from "@/components/exports/ExportFilterModal";
import { ExportFilterModal } from "@/components/exports/ExportFilterModal";
import { ExportProgressModal } from "@/components/exports/ExportProgressModal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useExpiryStats,
  usePharmacyInventory,
  usePharmacyOrders,
  usePharmacySyncLogs,
} from "@/hooks/useBackend";
import { logExport } from "@/lib/exportAudit";
import { downloadCsv, generateCsv } from "@/lib/exportCsv";
import {
  addPdfFooter,
  addPdfTable,
  createPdfDocument,
  exportToPdf,
} from "@/lib/exportPdf";
import {
  INVENTORY_STATUS_META,
  getInventoryStatus,
  getMedicineStatus,
} from "@/types";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  RefreshCw,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────────────
type TabId = "inventory" | "expiry" | "sales" | "sync" | "lowstock";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "inventory", label: "Inventory Report", icon: <Package size={14} /> },
  {
    id: "expiry",
    label: "Expiry Risk Report",
    icon: <AlertTriangle size={14} />,
  },
  { id: "sales", label: "Sales History", icon: <ShoppingCart size={14} /> },
  { id: "sync", label: "Sync History", icon: <RefreshCw size={14} /> },
  {
    id: "lowstock",
    label: "Low Stock Report",
    icon: <AlertTriangle size={14} />,
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmtDate(ts: bigint): string {
  if (!ts) return "—";
  return new Date(Number(ts)).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysUntilExpiry(ts: bigint): number {
  return Math.ceil((Number(ts) - Date.now()) / (24 * 60 * 60 * 1000));
}

function inDateRange(ts: bigint, from?: string, to?: string): boolean {
  const d = Number(ts);
  if (from && d < new Date(from).getTime()) return false;
  if (to && d > new Date(to).getTime() + 86400000) return false;
  return true;
}

// ─── Sub-components ─────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="space-y-2 mt-4">
      {[1, 2, 3, 4].map((n) => (
        <Skeleton key={n} className="h-10 w-full rounded-lg" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-muted-foreground"
      data-ocid="pharmacy_reports.empty_state"
    >
      <Package size={32} className="mb-3 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta =
    INVENTORY_STATUS_META[status as keyof typeof INVENTORY_STATUS_META];
  if (meta) {
    return (
      <Badge className={`text-[10px] px-1.5 py-0 border ${meta.badge}`}>
        {meta.label}
      </Badge>
    );
  }
  // Generic status
  const colorMap: Record<string, string> = {
    Success: "badge-success",
    Duplicate: "badge-warning",
    Failed: "badge-danger",
    Pending: "badge-warning",
    Shipped: "badge-info",
    Delivered: "badge-success",
    Cancelled: "badge-danger",
  };
  const cls =
    colorMap[status] ?? "bg-muted/40 text-muted-foreground border-border";
  return (
    <Badge className={`text-[10px] px-1.5 py-0 border ${cls}`}>{status}</Badge>
  );
}

// ─── Stat Summary Cards ──────────────────────────────────────────────────────
function ReportSummaryBar({
  tab,
  inventoryCount,
  expiryCount,
  ordersCount,
  syncCount,
  lowStockCount,
}: {
  tab: TabId;
  inventoryCount: number;
  expiryCount: number;
  ordersCount: number;
  syncCount: number;
  lowStockCount: number;
}) {
  const cards = [
    {
      id: "inventory" as TabId,
      label: "Total Items",
      value: inventoryCount,
      icon: <Package size={14} />,
      color: "text-indigo-400",
    },
    {
      id: "expiry" as TabId,
      label: "Expiry Risks",
      value: expiryCount,
      icon: <AlertTriangle size={14} />,
      color: "text-orange-400",
    },
    {
      id: "sales" as TabId,
      label: "Orders",
      value: ordersCount,
      icon: <ShoppingCart size={14} />,
      color: "text-cyan-400",
    },
    {
      id: "sync" as TabId,
      label: "Syncs",
      value: syncCount,
      icon: <RefreshCw size={14} />,
      color: "text-purple-400",
    },
    {
      id: "lowstock" as TabId,
      label: "Low Stock",
      value: lowStockCount,
      icon: <AlertTriangle size={14} />,
      color: "text-red-400",
    },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      {cards.map((c) => (
        <div
          key={c.id}
          className={`glass-card rounded-xl p-3 border ${
            tab === c.id ? "border-primary/40 bg-primary/5" : "border-border/40"
          } transition-colors`}
        >
          <div className={`flex items-center gap-1.5 mb-1 ${c.color}`}>
            {c.icon}
            <span className="text-xs font-medium">{c.label}</span>
          </div>
          <p className="text-xl font-display font-bold text-foreground">
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function PharmacyReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("inventory");
  const [isExporting, setIsExporting] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [pendingExportType, setPendingExportType] = useState<
    "pdf" | "csv" | null
  >(null);
  const [pdfProgress, setPdfProgress] = useState({
    isOpen: false,
    progress: 0,
    currentRow: 0,
    totalRows: 0,
  });

  const { data: inventory = [], isLoading: invLoading } =
    usePharmacyInventory();
  const { data: orders = [], isLoading: ordLoading } = usePharmacyOrders();
  const { data: syncLogs = [], isLoading: syncLoading } = usePharmacySyncLogs();
  const { data: expiryStats } = useExpiryStats();

  const isLoading = invLoading || ordLoading || syncLoading;

  // ── Derived Data ────────────────────────────────────────────────────────
  const inventoryWithStatus = useMemo(
    () =>
      inventory.map((item) => ({
        ...item,
        status: getInventoryStatus(
          item.expiryDate,
          item.stockQuantity,
          item.minThreshold,
        ),
      })),
    [inventory],
  );

  const expiryRiskItems = useMemo(
    () =>
      inventoryWithStatus.filter(
        (i) => i.status === "ExpiringSoon" || i.status === "Expired",
      ),
    [inventoryWithStatus],
  );

  const lowStockItems = useMemo(
    () =>
      inventoryWithStatus.filter(
        (i) => i.status === "LowStock" || i.status === "CriticalStock",
      ),
    [inventoryWithStatus],
  );

  // ── Stats ────────────────────────────────────────────────────────────────
  const expiryRiskCount = useMemo(() => {
    if (expiryStats)
      return Number(expiryStats.expiringSoon) + Number(expiryStats.expired);
    return expiryRiskItems.length;
  }, [expiryStats, expiryRiskItems]);

  const syncSuccessCount = useMemo(
    () => syncLogs.filter((l) => l.status === "Success").length,
    [syncLogs],
  );

  // ── Export Triggers ──────────────────────────────────────────────────────
  const handleExportPdf = () => {
    setPendingExportType("pdf");
    setFilterModalOpen(true);
  };
  const handleExportCsv = () => {
    setPendingExportType("csv");
    setFilterModalOpen(true);
  };

  const handleFilteredExport = async (filters: FilterValues) => {
    setFilterModalOpen(false);
    setIsExporting(true);
    const _exportId = `pharmacy-${activeTab}-${Date.now()}`;
    try {
      if (pendingExportType === "pdf") {
        await runPdfExport(activeTab, filters);
      } else {
        runCsvExport(activeTab, filters);
      }
      logExport({
        userId: "pharmacy-user",
        userRole: "Pharmacy",
        exportType: TABS.find((t) => t.id === activeTab)?.label ?? activeTab,
        fileFormat: pendingExportType === "pdf" ? "pdf" : "csv",
        filters: filters as Record<string, string>,
        success: true,
        rowCount: 0,
      });
      toast.success(
        `${pendingExportType?.toUpperCase()} exported successfully`,
      );
    } catch (err) {
      logExport({
        userId: "pharmacy-user",
        userRole: "Pharmacy",
        exportType: TABS.find((t) => t.id === activeTab)?.label ?? activeTab,
        fileFormat: pendingExportType === "pdf" ? "pdf" : "csv",
        filters: filters as Record<string, string>,
        success: false,
        rowCount: 0,
        errorMessage: String(err),
      });
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
      setPendingExportType(null);
    }
  };

  // ── PDF Generators ───────────────────────────────────────────────────────
  const runPdfExport = async (tab: TabId, filters: FilterValues) => {
    const tabLabel = TABS.find((t) => t.id === tab)?.label ?? tab;

    // Show progress modal for large datasets
    const allItems =
      tab === "inventory"
        ? inventoryWithStatus
        : tab === "expiry"
          ? expiryRiskItems
          : tab === "lowstock"
            ? lowStockItems
            : tab === "sales"
              ? orders
              : syncLogs;
    if (allItems.length >= 50) {
      setPdfProgress({
        isOpen: true,
        progress: 20,
        currentRow: 0,
        totalRows: allItems.length,
      });
    }

    const doc = await createPdfDocument(tabLabel, "Pharmacy", filters);
    const startY =
      filters.fromDate || filters.toDate || filters.status ? 60 : 54;

    if (tab === "inventory") {
      const filtered = inventoryWithStatus.filter((i) => {
        if (filters.status && i.status !== filters.status) return false;
        if (
          filters.medicineName &&
          !i.medicineName
            .toLowerCase()
            .includes(filters.medicineName.toLowerCase())
        )
          return false;
        return true;
      });
      const headers = [
        "Medicine Name",
        "Category",
        "Stock Qty",
        "Min Threshold",
        "Status",
        "Expiry Date",
        "Last Updated",
      ];
      const rows = filtered.map((i) => [
        i.medicineName,
        i.category,
        String(i.stockQuantity),
        String(i.minThreshold),
        INVENTORY_STATUS_META[i.status]?.label ?? i.status,
        fmtDate(i.expiryDate),
        fmtDate(i.lastUpdated),
      ]);
      addPdfTable(doc, headers, rows, startY);
    } else if (tab === "expiry") {
      const filtered = expiryRiskItems.filter((i) => {
        if (
          filters.medicineName &&
          !i.medicineName
            .toLowerCase()
            .includes(filters.medicineName.toLowerCase())
        )
          return false;
        return true;
      });
      const headers = [
        "Medicine Name",
        "Expiry Date",
        "Days Until Expiry",
        "Status",
      ];
      const rows = filtered.map((i) => [
        i.medicineName,
        fmtDate(i.expiryDate),
        String(daysUntilExpiry(i.expiryDate)),
        INVENTORY_STATUS_META[i.status]?.label ?? i.status,
      ]);
      addPdfTable(doc, headers, rows, startY);
    } else if (tab === "sales") {
      const filtered = orders.filter((o) => {
        if (!inDateRange(o.orderDate, filters.fromDate, filters.toDate))
          return false;
        if (filters.status && o.status !== filters.status) return false;
        if (
          filters.medicineName &&
          !o.medicineName
            .toLowerCase()
            .includes(filters.medicineName.toLowerCase())
        )
          return false;
        return true;
      });
      const headers = ["Order ID", "Medicine", "Qty", "Status", "Date"];
      const rows = filtered.map((o) => [
        o.id.slice(0, 12),
        o.medicineName,
        String(o.quantity),
        o.status,
        fmtDate(o.orderDate),
      ]);
      addPdfTable(doc, headers, rows, startY);
    } else if (tab === "sync") {
      const filtered = syncLogs.filter((l) => {
        if (!inDateRange(l.syncedAt, filters.fromDate, filters.toDate))
          return false;
        if (filters.status && l.status !== filters.status) return false;
        if (
          filters.medicineName &&
          !l.medicineName
            .toLowerCase()
            .includes(filters.medicineName.toLowerCase())
        )
          return false;
        return true;
      });
      const headers = [
        "Patient Phone",
        "Medicine",
        "Batch#",
        "Qty",
        "Status",
        "Synced At",
      ];
      const rows = filtered.map((l) => [
        l.patientPrincipal?.toString().slice(0, 14) ?? "—",
        l.medicineName,
        l.batchNumber,
        String(l.quantity),
        l.status,
        fmtDate(l.syncedAt),
      ]);
      addPdfTable(doc, headers, rows, startY);
    } else if (tab === "lowstock") {
      const filtered = lowStockItems.filter((i) => {
        if (
          filters.medicineName &&
          !i.medicineName
            .toLowerCase()
            .includes(filters.medicineName.toLowerCase())
        )
          return false;
        return true;
      });
      const headers = [
        "Medicine Name",
        "Category",
        "Stock Qty",
        "Min Threshold",
        "Status",
        "Expiry Date",
      ];
      const rows = filtered.map((i) => [
        i.medicineName,
        i.category,
        String(i.stockQuantity),
        String(i.minThreshold),
        INVENTORY_STATUS_META[i.status]?.label ?? i.status,
        fmtDate(i.expiryDate),
      ]);
      addPdfTable(doc, headers, rows, startY);
    }

    addPdfFooter(doc);
    setPdfProgress((p) => ({ ...p, isOpen: false }));
    exportToPdf(
      `medivault-pharmacy-${tab}-${new Date().toISOString().slice(0, 10)}.pdf`,
      doc,
    );
  };

  // ── CSV Generators ───────────────────────────────────────────────────────
  const runCsvExport = (tab: TabId, filters: FilterValues) => {
    let csvContent = "";
    const filename = `medivault-pharmacy-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;

    if (tab === "inventory") {
      const filtered = inventoryWithStatus.filter((i) => {
        if (filters.status && i.status !== filters.status) return false;
        if (
          filters.medicineName &&
          !i.medicineName
            .toLowerCase()
            .includes(filters.medicineName.toLowerCase())
        )
          return false;
        return true;
      });
      csvContent = generateCsv(
        [
          "Medicine Name",
          "Category",
          "Stock Qty",
          "Min Threshold",
          "Status",
          "Expiry Date",
          "Last Updated",
        ],
        filtered.map((i) => [
          i.medicineName,
          i.category,
          Number(i.stockQuantity),
          Number(i.minThreshold),
          INVENTORY_STATUS_META[i.status]?.label ?? i.status,
          fmtDate(i.expiryDate),
          fmtDate(i.lastUpdated),
        ]),
      );
    } else if (tab === "expiry") {
      const filtered = expiryRiskItems.filter((i) => {
        if (
          filters.medicineName &&
          !i.medicineName
            .toLowerCase()
            .includes(filters.medicineName.toLowerCase())
        )
          return false;
        return true;
      });
      csvContent = generateCsv(
        ["Medicine Name", "Expiry Date", "Days Until Expiry", "Status"],
        filtered.map((i) => [
          i.medicineName,
          fmtDate(i.expiryDate),
          daysUntilExpiry(i.expiryDate),
          INVENTORY_STATUS_META[i.status]?.label ?? i.status,
        ]),
      );
    } else if (tab === "sales") {
      const filtered = orders.filter((o) => {
        if (!inDateRange(o.orderDate, filters.fromDate, filters.toDate))
          return false;
        if (filters.status && o.status !== filters.status) return false;
        if (
          filters.medicineName &&
          !o.medicineName
            .toLowerCase()
            .includes(filters.medicineName.toLowerCase())
        )
          return false;
        return true;
      });
      csvContent = generateCsv(
        ["Order ID", "Medicine", "Qty", "Status", "Date"],
        filtered.map((o) => [
          o.id,
          o.medicineName,
          Number(o.quantity),
          o.status,
          fmtDate(o.orderDate),
        ]),
      );
    } else if (tab === "sync") {
      const filtered = syncLogs.filter((l) => {
        if (!inDateRange(l.syncedAt, filters.fromDate, filters.toDate))
          return false;
        if (filters.status && l.status !== filters.status) return false;
        if (
          filters.medicineName &&
          !l.medicineName
            .toLowerCase()
            .includes(filters.medicineName.toLowerCase())
        )
          return false;
        return true;
      });
      csvContent = generateCsv(
        [
          "Patient Principal",
          "Medicine",
          "Batch#",
          "Qty",
          "Status",
          "Synced At",
        ],
        filtered.map((l) => [
          l.patientPrincipal?.toString() ?? "",
          l.medicineName,
          l.batchNumber,
          Number(l.quantity),
          l.status,
          fmtDate(l.syncedAt),
        ]),
      );
    } else if (tab === "lowstock") {
      const filtered = lowStockItems.filter((i) => {
        if (
          filters.medicineName &&
          !i.medicineName
            .toLowerCase()
            .includes(filters.medicineName.toLowerCase())
        )
          return false;
        return true;
      });
      csvContent = generateCsv(
        [
          "Medicine Name",
          "Category",
          "Stock Qty",
          "Min Threshold",
          "Status",
          "Expiry Date",
        ],
        filtered.map((i) => [
          i.medicineName,
          i.category,
          Number(i.stockQuantity),
          Number(i.minThreshold),
          INVENTORY_STATUS_META[i.status]?.label ?? i.status,
          fmtDate(i.expiryDate),
        ]),
      );
    }
    downloadCsv(filename, csvContent);
  };

  // ── Filter config per tab ────────────────────────────────────────────────
  const filterConfig: Record<
    TabId,
    {
      available: ("dateRange" | "status" | "medicineName")[];
      statusOptions?: { value: string; label: string }[];
    }
  > = {
    inventory: {
      available: ["status", "medicineName"],
      statusOptions: [
        { value: "Safe", label: "Safe" },
        { value: "LowStock", label: "Low Stock" },
        { value: "ExpiringSoon", label: "Expiring Soon" },
        { value: "Expired", label: "Expired" },
        { value: "CriticalStock", label: "Critical" },
      ],
    },
    expiry: { available: ["medicineName"] },
    sales: {
      available: ["dateRange", "status", "medicineName"],
      statusOptions: [
        { value: "Pending", label: "Pending" },
        { value: "Shipped", label: "Shipped" },
        { value: "Delivered", label: "Delivered" },
        { value: "Cancelled", label: "Cancelled" },
      ],
    },
    sync: {
      available: ["dateRange", "status", "medicineName"],
      statusOptions: [
        { value: "Success", label: "Success" },
        { value: "Duplicate", label: "Duplicate" },
        { value: "Failed", label: "Failed" },
      ],
    },
    lowstock: { available: ["medicineName"] },
  };

  // ── Table Renderers ──────────────────────────────────────────────────────
  const renderTable = () => {
    if (isLoading) return <TableSkeleton />;

    if (activeTab === "inventory") {
      if (!inventoryWithStatus.length)
        return <EmptyState message="No inventory items found." />;
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40">
                {[
                  "Medicine Name",
                  "Category",
                  "Stock",
                  "Min",
                  "Status",
                  "Expiry",
                  "Updated",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left py-2.5 px-3 text-muted-foreground font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inventoryWithStatus.map((item, i) => (
                <tr
                  key={item.id}
                  className="border-b border-border/20 hover:bg-muted/30 transition-colors"
                  data-ocid={`pharmacy_reports.inventory.item.${i + 1}`}
                >
                  <td className="py-2.5 px-3 font-medium text-foreground">
                    {item.medicineName}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    {item.category}
                  </td>
                  <td className="py-2.5 px-3 text-foreground">
                    {String(item.stockQuantity)}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    {String(item.minThreshold)}
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    {fmtDate(item.expiryDate)}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    {fmtDate(item.lastUpdated)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === "expiry") {
      if (!expiryRiskItems.length)
        return (
          <EmptyState message="No expiry risk items found. Inventory looks healthy!" />
        );
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40">
                {[
                  "Medicine Name",
                  "Expiry Date",
                  "Days Until Expiry",
                  "Status",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left py-2.5 px-3 text-muted-foreground font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expiryRiskItems.map((item, i) => {
                const days = daysUntilExpiry(item.expiryDate);
                return (
                  <tr
                    key={item.id}
                    className="border-b border-border/20 hover:bg-muted/30 transition-colors"
                    data-ocid={`pharmacy_reports.expiry.item.${i + 1}`}
                  >
                    <td className="py-2.5 px-3 font-medium text-foreground">
                      {item.medicineName}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {fmtDate(item.expiryDate)}
                    </td>
                    <td
                      className={`py-2.5 px-3 font-semibold ${
                        days < 0
                          ? "text-red-600 dark:text-red-400"
                          : days < 15
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-amber-600 dark:text-yellow-400"
                      }`}
                    >
                      {days < 0 ? `${Math.abs(days)}d ago` : `${days}d`}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === "sales") {
      if (!orders.length)
        return <EmptyState message="No sales orders found." />;
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40">
                {["Order ID", "Medicine", "Qty", "Status", "Date"].map((h) => (
                  <th
                    key={h}
                    className="text-left py-2.5 px-3 text-muted-foreground font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => (
                <tr
                  key={order.id}
                  className="border-b border-border/20 hover:bg-muted/30 transition-colors"
                  data-ocid={`pharmacy_reports.sales.item.${i + 1}`}
                >
                  <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                    {order.id.slice(0, 12)}…
                  </td>
                  <td className="py-2.5 px-3 font-medium text-foreground">
                    {order.medicineName}
                  </td>
                  <td className="py-2.5 px-3 text-foreground">
                    {String(order.quantity)}
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    {fmtDate(order.orderDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === "sync") {
      if (!syncLogs.length)
        return <EmptyState message="No sync history found." />;
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40">
                {[
                  "Patient",
                  "Medicine",
                  "Batch#",
                  "Qty",
                  "Status",
                  "Synced At",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left py-2.5 px-3 text-muted-foreground font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {syncLogs.map((log, i) => (
                <tr
                  key={log.id}
                  className="border-b border-border/20 hover:bg-muted/30 transition-colors"
                  data-ocid={`pharmacy_reports.sync.item.${i + 1}`}
                >
                  <td className="py-2.5 px-3 font-mono text-[10px] text-muted-foreground">
                    {log.patientPrincipal?.toString().slice(0, 14) ?? "—"}…
                  </td>
                  <td className="py-2.5 px-3 font-medium text-foreground">
                    {log.medicineName}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    {log.batchNumber}
                  </td>
                  <td className="py-2.5 px-3 text-foreground">
                    {String(log.quantity)}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      {log.status === "Success" ? (
                        <CheckCircle2
                          size={11}
                          className="text-emerald-600 dark:text-emerald-400"
                        />
                      ) : log.status === "Failed" ? (
                        <XCircle
                          size={11}
                          className="text-red-600 dark:text-red-400"
                        />
                      ) : (
                        <Clock
                          size={11}
                          className="text-amber-600 dark:text-yellow-400"
                        />
                      )}
                      <StatusBadge status={log.status} />
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    {fmtDate(log.syncedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === "lowstock") {
      if (!lowStockItems.length)
        return (
          <EmptyState message="No low stock items found. Inventory is well-stocked!" />
        );
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40">
                {[
                  "Medicine Name",
                  "Category",
                  "Stock",
                  "Min Threshold",
                  "Status",
                  "Expiry",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left py-2.5 px-3 text-muted-foreground font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lowStockItems.map((item, i) => (
                <tr
                  key={item.id}
                  className="border-b border-border/20 hover:bg-muted/30 transition-colors"
                  data-ocid={`pharmacy_reports.lowstock.item.${i + 1}`}
                >
                  <td className="py-2.5 px-3 font-medium text-foreground">
                    {item.medicineName}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    {item.category}
                  </td>
                  <td
                    className={`py-2.5 px-3 font-semibold ${
                      item.status === "CriticalStock"
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-amber-600 dark:text-yellow-400"
                    }`}
                  >
                    {String(item.stockQuantity)}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    {String(item.minThreshold)}
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    {fmtDate(item.expiryDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  const activeTabLabel =
    TABS.find((t) => t.id === activeTab)?.label ?? activeTab;

  return (
    <div className="p-6 space-y-6" data-ocid="pharmacy_reports.page">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Reports &amp; Exports
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Generate, filter, and download pharmacy reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 text-sm rounded bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
            data-ocid="pharmacy_reports.print_button"
          >
            Print
          </button>
          <ExportButton
            onExportPdf={handleExportPdf}
            onExportCsv={handleExportCsv}
            isExporting={isExporting}
            data-ocid="pharmacy_reports.export_button"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <ReportSummaryBar
        tab={activeTab}
        inventoryCount={inventory.length}
        expiryCount={expiryRiskCount}
        ordersCount={orders.length}
        syncCount={syncLogs.length}
        lowStockCount={lowStockItems.length}
      />

      {/* Tab Bar */}
      <div
        className="flex flex-wrap gap-1 glass-card rounded-xl p-1 border border-border/30"
        role="tablist"
        data-ocid="pharmacy_reports.tabs"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
              activeTab === tab.id
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
            data-ocid={`pharmacy_reports.${tab.id}.tab`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Panel */}
      <div
        className="glass-card rounded-2xl border border-border/40 overflow-hidden"
        data-ocid="pharmacy_reports.table.panel"
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <div>
            <h2 className="font-display font-semibold text-sm text-foreground">
              {activeTabLabel}
            </h2>
            {!isLoading && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeTab === "inventory" &&
                  `${inventoryWithStatus.length} items`}
                {activeTab === "expiry" &&
                  `${expiryRiskItems.length} at-risk items`}
                {activeTab === "sales" && `${orders.length} orders`}
                {activeTab === "sync" &&
                  `${syncLogs.length} sync events · ${syncSuccessCount} succeeded`}
                {activeTab === "lowstock" &&
                  `${lowStockItems.length} items below threshold`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 text-sm rounded bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
              data-ocid="pharmacy_reports.panel.print_button"
            >
              Print
            </button>
            <ExportButton
              onExportPdf={handleExportPdf}
              onExportCsv={handleExportCsv}
              isExporting={isExporting}
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="px-2 py-2 min-h-[260px]">{renderTable()}</div>
      </div>

      {/* Export Progress Modal */}
      <ExportProgressModal
        isOpen={pdfProgress.isOpen}
        progress={pdfProgress.progress}
        currentRow={pdfProgress.currentRow}
        totalRows={pdfProgress.totalRows}
        onCancel={() => setPdfProgress((p) => ({ ...p, isOpen: false }))}
      />

      {/* Export Filter Modal */}
      <ExportFilterModal
        isOpen={filterModalOpen}
        onClose={() => {
          setFilterModalOpen(false);
          setPendingExportType(null);
        }}
        onExport={handleFilteredExport}
        title={`Export ${activeTabLabel} as ${pendingExportType?.toUpperCase() ?? ""}`}
        availableFilters={{
          dateRange: filterConfig[activeTab].available.includes("dateRange"),
          statusFilter: filterConfig[activeTab].statusOptions?.map(
            (o) => o.value,
          ),
          medicineFilter:
            filterConfig[activeTab].available.includes("medicineName"),
        }}
        isExporting={isExporting}
      />
    </div>
  );
}
