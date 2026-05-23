import type { ConsentAuditEntry, UserProfile } from "@/backend";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { ExportButton } from "@/components/exports/ExportButton";
import { ExportFilterModal } from "@/components/exports/ExportFilterModal";
import type { ExportFilters } from "@/components/exports/ExportFilterModal";
import { ExportProgressModal } from "@/components/exports/ExportProgressModal";
import {
  useAllUsersForHospital,
  useConsentedPatients,
  usePharmacyInventory,
} from "@/hooks/useBackend";
import { logExport } from "@/lib/exportAudit";
import { downloadCsv, generateCsv } from "@/lib/exportCsv";
import {
  addPdfFooter,
  addPdfTable,
  createPdfDocument,
  exportToPdf,
} from "@/lib/exportPdf";
import { cn } from "@/lib/utils";
import { INVENTORY_STATUS_META, getInventoryStatus } from "@/types";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileBarChart,
  Package,
  ShieldCheck,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const GLASS =
  "bg-[var(--color-bg-elevated)] backdrop-blur-sm border border-[var(--color-border-base)] rounded-xl";

type TabId =
  | "adherence"
  | "consent-audit"
  | "inventory"
  | "expiry-alerts"
  | "compliance";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "adherence",
    label: "Patient Adherence",
    icon: <Activity size={15} />,
  },
  {
    id: "consent-audit",
    label: "Consent Audit Log",
    icon: <ShieldCheck size={15} />,
  },
  {
    id: "inventory",
    label: "Inventory Report",
    icon: <Package size={15} />,
  },
  {
    id: "expiry-alerts",
    label: "Expiry Alerts",
    icon: <AlertTriangle size={15} />,
  },
  {
    id: "compliance",
    label: "Compliance Summary",
    icon: <ClipboardList size={15} />,
  },
];

/** Milliseconds → human-readable date */
function fmtDate(ts: bigint): string {
  return new Date(Number(ts)).toLocaleDateString();
}

/** Apply date-range filter to a timestamp */
function inDateRange(ts: bigint, filters: ExportFilters): boolean {
  const msTs = Number(ts);
  if (filters.fromDate) {
    const from = new Date(filters.fromDate).getTime();
    if (msTs < from) return false;
  }
  if (filters.toDate) {
    const to = new Date(filters.toDate).getTime() + 86_400_000;
    if (msTs > to) return false;
  }
  return true;
}

/** Derive a simple adherence score from a UserProfile (demo-safe: use id hash) */
function mockAdherenceScore(patient: UserProfile): number {
  let hash = 0;
  for (let i = 0; i < patient.id.length; i++)
    hash = (hash * 31 + patient.id.charCodeAt(i)) & 0xffffff;
  return 60 + (hash % 41); // 60–100
}

function AdherenceBadge({ score }: { score: number }) {
  const cls =
    score >= 80
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : score >= 60
        ? "bg-yellow-500/15 text-yellow-300 border-yellow-500/30"
        : "bg-red-500/15 text-red-300 border-red-500/30";
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-xs font-semibold border",
        cls,
      )}
    >
      {score}%
    </span>
  );
}

// ─── Sub-sections ──────────────────────────────────────────────────────────

function ConsentNote() {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 border border-blue-500/20 px-4 py-2.5 text-xs text-blue-300">
      <ShieldCheck size={14} className="shrink-0" />
      Showing only patients who have granted consent
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className={cn(
        GLASS,
        "flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground",
      )}
      data-ocid="hospital_reports.empty_state"
    >
      <FileBarChart size={40} className="opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function HospitalReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("adherence");
  const [filterOpen, setFilterOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [pdfProgress, setPdfProgress] = useState({
    isOpen: false,
    progress: 0,
    currentRow: 0,
    totalRows: 0,
  });

  const { data: consentedPatients, isLoading: loadingConsented } =
    useConsentedPatients();
  const { isLoading: loadingUsers } = useAllUsersForHospital();
  const { data: inventory, isLoading: loadingInventory } =
    usePharmacyInventory();

  // Patients with adherence consent
  const adherencePatients =
    consentedPatients?.filter((c) => c.consent.adherenceSharing) ?? [];
  // All consented patients (for compliance + consent audit)
  const allConsentedPatients = consentedPatients ?? [];

  // Consent audit: flatten all consent audit trail entries across patients
  const consentAuditEntries: Array<{
    patient: UserProfile;
    entry: ConsentAuditEntry;
  }> =
    allConsentedPatients
      .flatMap((c) =>
        c.consent.auditTrail.map((entry) => ({ patient: c.patient, entry })),
      )
      .sort((a, b) => Number(b.entry.timestamp) - Number(a.entry.timestamp)) ??
    [];

  // Expiry-at-risk inventory
  const expiryAlerts =
    inventory?.filter((item) => {
      const status = getInventoryStatus(
        item.expiryDate,
        item.stockQuantity,
        item.minThreshold,
      );
      return status === "ExpiringSoon" || status === "Expired";
    }) ?? [];

  const isLoading = loadingConsented || loadingUsers || loadingInventory;

  // ── Export helpers ──────────────────────────────────────────────────────

  async function handleExportPdf(filters: ExportFilters) {
    setIsExporting(true);
    try {
      let pdfHeaders: string[] = [];
      let pdfRows: string[][] = [];
      let reportTitle = "";
      let filename = "";

      if (activeTab === "adherence") {
        reportTitle = "Patient Adherence Summary";
        filename = `hospital-adherence-${Date.now()}.pdf`;
        pdfHeaders = [
          "Patient ID",
          "Name",
          "Medicine",
          "Adherence %",
          "Last Dose",
          "Status",
        ];
        pdfRows = adherencePatients
          .filter((c) => inDateRange(c.consent.lastUpdated, filters))
          .map((c) => {
            const score = mockAdherenceScore(c.patient);
            return [
              c.patient.id.slice(0, 12),
              c.patient.name,
              "Multiple",
              `${score}%`,
              fmtDate(c.consent.lastUpdated),
              score >= 80 ? "Good" : score >= 60 ? "Fair" : "Poor",
            ];
          });
      } else if (activeTab === "consent-audit") {
        reportTitle = "Consent Audit Log";
        filename = `hospital-consent-audit-${Date.now()}.pdf`;
        pdfHeaders = [
          "Patient ID",
          "Patient Name",
          "Consent Type",
          "Action",
          "Timestamp",
        ];
        pdfRows = consentAuditEntries
          .filter((e) => inDateRange(e.entry.timestamp, filters))
          .map((e) => [
            e.patient.id.slice(0, 12),
            e.patient.name,
            e.entry.field,
            e.entry.action,
            fmtDate(e.entry.timestamp),
          ]);
      } else if (activeTab === "inventory") {
        reportTitle = "Inventory Report";
        filename = `hospital-inventory-${Date.now()}.pdf`;
        pdfHeaders = [
          "Medicine",
          "Category",
          "Stock",
          "Min",
          "Max",
          "Expiry",
          "Status",
        ];
        pdfRows =
          inventory
            ?.filter((item) =>
              filters.medicineName
                ? item.medicineName
                    .toLowerCase()
                    .includes(filters.medicineName.toLowerCase())
                : true,
            )
            .map((item) => [
              item.medicineName,
              item.category,
              String(item.stockQuantity),
              String(item.minThreshold),
              String(item.maxThreshold),
              fmtDate(item.expiryDate),
              INVENTORY_STATUS_META[
                getInventoryStatus(
                  item.expiryDate,
                  item.stockQuantity,
                  item.minThreshold,
                )
              ].label,
            ]) ?? [];
      } else if (activeTab === "expiry-alerts") {
        reportTitle = "Expiry Alerts";
        filename = `hospital-expiry-alerts-${Date.now()}.pdf`;
        pdfHeaders = ["Medicine", "Category", "Stock", "Expiry Date", "Status"];
        pdfRows = expiryAlerts.map((item) => [
          item.medicineName,
          item.category,
          String(item.stockQuantity),
          fmtDate(item.expiryDate),
          INVENTORY_STATUS_META[
            getInventoryStatus(
              item.expiryDate,
              item.stockQuantity,
              item.minThreshold,
            )
          ].label,
        ]);
      } else {
        reportTitle = "Compliance Summary";
        filename = `hospital-compliance-${Date.now()}.pdf`;
        pdfHeaders = [
          "Patient ID",
          "Name",
          "Adherence",
          "Prescription",
          "Diagnostic",
          "Status",
        ];
        pdfRows = allConsentedPatients
          .filter((c) => inDateRange(c.consent.lastUpdated, filters))
          .map((c) => [
            c.patient.id.slice(0, 12),
            c.patient.name,
            c.consent.adherenceSharing ? "Granted" : "Revoked",
            c.consent.prescriptionSharing ? "Granted" : "Revoked",
            c.consent.diagnosticAccess ? "Granted" : "Revoked",
            c.consent.adherenceSharing && c.consent.prescriptionSharing
              ? "Compliant"
              : "Partial",
          ]);
      }

      if (pdfRows.length >= 50)
        setPdfProgress({
          isOpen: true,
          progress: 20,
          currentRow: 0,
          totalRows: pdfRows.length,
        });
      const doc = await createPdfDocument(reportTitle, "Hospital", filters);
      const startY = filters.fromDate || filters.toDate ? 60 : 56;
      addPdfTable(doc, pdfHeaders, pdfRows, startY);
      addPdfFooter(doc);
      exportToPdf(filename, doc);
      setPdfProgress((p) => ({ ...p, isOpen: false }));

      logExport({
        userId: "hospital-user",
        userRole: "Hospital",
        exportType: reportTitle,
        fileFormat: "pdf",
        filters: Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v != null) as [
            string,
            string,
          ][],
        ),
        success: true,
        rowCount: pdfRows.length,
      });
      toast.success(`PDF exported: ${reportTitle}`);
    } catch (err) {
      logExport({
        userId: "hospital-user",
        userRole: "Hospital",
        exportType: activeTab,
        fileFormat: "pdf",
        filters: {},
        success: false,
        rowCount: 0,
        errorMessage: String(err),
      });
      toast.error("Export failed. Please try again.");
      setPdfProgress((p) => ({ ...p, isOpen: false }));
    } finally {
      setIsExporting(false);
      setFilterOpen(false);
    }
  }

  function handleExportCsv() {
    setIsExporting(true);
    try {
      let csvHeaders: string[] = [];
      let csvRows: string[][] = [];
      let filename = "";
      let exportType = "";

      if (activeTab === "adherence") {
        exportType = "Patient Adherence Summary";
        filename = `hospital-adherence-${Date.now()}.csv`;
        csvHeaders = [
          "Patient ID",
          "Name",
          "Email",
          "Adherence %",
          "Consent Updated",
          "Status",
        ];
        csvRows = adherencePatients.map((c) => {
          const score = mockAdherenceScore(c.patient);
          return [
            c.patient.id,
            c.patient.name,
            c.patient.email,
            `${score}%`,
            fmtDate(c.consent.lastUpdated),
            score >= 80 ? "Good" : score >= 60 ? "Fair" : "Poor",
          ];
        });
      } else if (activeTab === "consent-audit") {
        exportType = "Consent Audit Log";
        filename = `hospital-consent-audit-${Date.now()}.csv`;
        csvHeaders = [
          "Patient ID",
          "Patient Name",
          "Consent Field",
          "Action",
          "Timestamp",
        ];
        csvRows = consentAuditEntries.map((e) => [
          e.patient.id,
          e.patient.name,
          e.entry.field,
          e.entry.action,
          fmtDate(e.entry.timestamp),
        ]);
      } else if (activeTab === "inventory") {
        exportType = "Inventory Report";
        filename = `hospital-inventory-${Date.now()}.csv`;
        csvHeaders = [
          "Medicine",
          "Category",
          "Stock",
          "Min Threshold",
          "Max Threshold",
          "Expiry Date",
          "Status",
        ];
        csvRows =
          inventory?.map((item) => [
            item.medicineName,
            item.category,
            String(item.stockQuantity),
            String(item.minThreshold),
            String(item.maxThreshold),
            fmtDate(item.expiryDate),
            INVENTORY_STATUS_META[
              getInventoryStatus(
                item.expiryDate,
                item.stockQuantity,
                item.minThreshold,
              )
            ].label,
          ]) ?? [];
      } else if (activeTab === "expiry-alerts") {
        exportType = "Expiry Alerts";
        filename = `hospital-expiry-alerts-${Date.now()}.csv`;
        csvHeaders = ["Medicine", "Category", "Stock", "Expiry Date", "Status"];
        csvRows = expiryAlerts.map((item) => [
          item.medicineName,
          item.category,
          String(item.stockQuantity),
          fmtDate(item.expiryDate),
          INVENTORY_STATUS_META[
            getInventoryStatus(
              item.expiryDate,
              item.stockQuantity,
              item.minThreshold,
            )
          ].label,
        ]);
      } else {
        exportType = "Compliance Summary";
        filename = `hospital-compliance-${Date.now()}.csv`;
        csvHeaders = [
          "Patient ID",
          "Name",
          "Email",
          "Adherence",
          "Prescription",
          "Diagnostic",
          "Compliance",
        ];
        csvRows = allConsentedPatients.map((c) => [
          c.patient.id,
          c.patient.name,
          c.patient.email,
          c.consent.adherenceSharing ? "Granted" : "Revoked",
          c.consent.prescriptionSharing ? "Granted" : "Revoked",
          c.consent.diagnosticAccess ? "Granted" : "Revoked",
          c.consent.adherenceSharing && c.consent.prescriptionSharing
            ? "Compliant"
            : "Partial",
        ]);
      }

      const csv = generateCsv(csvHeaders, csvRows);
      downloadCsv(filename, csv);

      logExport({
        userId: "hospital-user",
        userRole: "Hospital",
        exportType,
        fileFormat: "csv",
        filters: {},
        success: true,
        rowCount: csvRows.length,
      });
      toast.success(`CSV exported: ${exportType}`);
    } catch (err) {
      logExport({
        userId: "hospital-user",
        userRole: "Hospital",
        exportType: activeTab,
        fileFormat: "csv",
        filters: {},
        success: false,
        rowCount: 0,
        errorMessage: String(err),
      });
      toast.error("CSV export failed.");
    } finally {
      setIsExporting(false);
    }
  }

  // ── Rendering ────────────────────────────────────────────────────────────

  const isPatientTab = activeTab === "adherence" || activeTab === "compliance";

  const filterConfig = {
    adherence: { dateRange: true as const },
    "consent-audit": { dateRange: true as const },
    inventory: { dateRange: false, medicineFilter: true as const },
    "expiry-alerts": { dateRange: true as const },
    compliance: { dateRange: true as const },
  }[activeTab];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Hospital Reports <span className="text-purple-400">📋</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Export adherence, consent, inventory and compliance data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 text-sm rounded bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] transition-colors"
          >
            Print
          </button>
          <ExportButton
            onExportPdf={() => setFilterOpen(true)}
            onExportCsv={handleExportCsv}
            isExporting={isExporting}
            data-ocid="hospital_reports.export_button"
          />
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Report sections"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
              activeTab === tab.id
                ? "bg-purple-500/20 text-purple-200 border-purple-500/40 shadow-sm"
                : "bg-[var(--color-bg-surface)] text-muted-foreground border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-elevated)] hover:text-foreground",
            )}
            data-ocid={`hospital_reports.${tab.id}.tab`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Consent notice for patient-data tabs */}
      {isPatientTab && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <ConsentNote />
        </motion.div>
      )}

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {isLoading ? (
          <SkeletonCard lines={5} showIcon={false} className="h-64" />
        ) : (
          <TabContent
            activeTab={activeTab}
            adherencePatients={adherencePatients.map((c) => ({
              patient: c.patient,
              consent: c.consent,
              score: mockAdherenceScore(c.patient),
            }))}
            consentAuditEntries={consentAuditEntries}
            inventory={inventory ?? []}
            expiryAlerts={expiryAlerts}
            allConsentedPatients={allConsentedPatients}
          />
        )}
      </motion.div>

      {/* Summary cards */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[
            {
              label: "Consented Patients",
              value: allConsentedPatients.length,
              icon: <Users size={16} />,
              color: "bg-blue-500/20 text-blue-300",
            },
            {
              label: "Adherence Reports",
              value: adherencePatients.length,
              icon: <Activity size={16} />,
              color: "bg-emerald-500/20 text-emerald-300",
            },
            {
              label: "Inventory Items",
              value: inventory?.length ?? 0,
              icon: <Package size={16} />,
              color: "bg-purple-500/20 text-purple-300",
            },
            {
              label: "Expiry Alerts",
              value: expiryAlerts.length,
              icon: <AlertTriangle size={16} />,
              color: "bg-orange-500/20 text-orange-300",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={cn(GLASS, "p-4 flex items-center gap-3")}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  s.color,
                )}
              >
                {s.icon}
              </div>
              <div>
                <p className="text-xl font-display font-bold text-foreground">
                  {s.value}
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Export Filter Modal */}
      <ExportFilterModal
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        onExport={handleExportPdf}
        title={`Export ${TABS.find((t) => t.id === activeTab)?.label}`}
        availableFilters={filterConfig}
        isExporting={isExporting}
      />
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

// ─── Tab Content ────────────────────────────────────────────────────────────

type AdherenceRow = {
  patient: UserProfile;
  consent: import("@/backend").ConsentRecord;
  score: number;
};

type ConsentAuditRow = {
  patient: UserProfile;
  entry: ConsentAuditEntry;
};

interface TabContentProps {
  activeTab: TabId;
  adherencePatients: AdherenceRow[];
  consentAuditEntries: ConsentAuditRow[];
  inventory: import("@/backend").InventoryItem[];
  expiryAlerts: import("@/backend").InventoryItem[];
  allConsentedPatients: Array<{
    patient: UserProfile;
    consent: import("@/backend").ConsentRecord;
  }>;
}

function TabContent({
  activeTab,
  adherencePatients,
  consentAuditEntries,
  inventory,
  expiryAlerts,
  allConsentedPatients,
}: TabContentProps) {
  if (activeTab === "adherence") {
    if (adherencePatients.length === 0)
      return (
        <EmptyState message="No patients have granted adherence sharing consent." />
      );
    return (
      <div className={cn(GLASS, "overflow-x-auto")}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {[
                "Patient",
                "Email",
                "Adherence %",
                "Consent Updated",
                "Status",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {adherencePatients.map((row, i) => (
              <tr
                key={row.patient.id}
                className="hover:bg-muted/50 transition-colors"
                data-ocid={`hospital_reports.adherence.item.${i + 1}`}
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {row.patient.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.patient.email}
                </td>
                <td className="px-4 py-3">
                  <AdherenceBadge score={row.score} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(
                    Number(row.consent.lastUpdated),
                  ).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-semibold border",
                      row.score >= 80
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : row.score >= 60
                          ? "bg-yellow-500/15 text-yellow-300 border-yellow-500/30"
                          : "bg-red-500/15 text-red-300 border-red-500/30",
                    )}
                  >
                    {row.score >= 80
                      ? "Good"
                      : row.score >= 60
                        ? "Fair"
                        : "Poor"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (activeTab === "consent-audit") {
    if (consentAuditEntries.length === 0)
      return (
        <EmptyState message="No consent audit entries found. Entries appear when patients update consent settings." />
      );
    return (
      <div className={cn(GLASS, "overflow-x-auto")}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Patient", "Consent Field", "Action", "Timestamp"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {consentAuditEntries.map((row, i) => (
              <tr
                key={`${row.patient.id}-${i}`}
                className="hover:bg-muted/50 transition-colors"
                data-ocid={`hospital_reports.consent_audit.item.${i + 1}`}
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {row.patient.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.entry.field}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-semibold border",
                      row.entry.action.toLowerCase().includes("grant")
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : "bg-red-500/15 text-red-300 border-red-500/30",
                    )}
                  >
                    {row.entry.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(Number(row.entry.timestamp)).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (activeTab === "inventory") {
    if (inventory.length === 0)
      return <EmptyState message="No inventory items found." />;
    return (
      <div className={cn(GLASS, "overflow-x-auto")}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Medicine", "Category", "Stock", "Min", "Expiry", "Status"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {inventory.map((item, i) => {
              const status = getInventoryStatus(
                item.expiryDate,
                item.stockQuantity,
                item.minThreshold,
              );
              const meta = INVENTORY_STATUS_META[status];
              return (
                <tr
                  key={item.id}
                  className="hover:bg-muted/50 transition-colors"
                  data-ocid={`hospital_reports.inventory.item.${i + 1}`}
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {item.medicineName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.category}
                  </td>
                  <td className="px-4 py-3 text-foreground tabular-nums">
                    {String(item.stockQuantity)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {String(item.minThreshold)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(Number(item.expiryDate)).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-semibold border",
                        meta.badge,
                      )}
                    >
                      {meta.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (activeTab === "expiry-alerts") {
    if (expiryAlerts.length === 0)
      return (
        <EmptyState message="No expiry alerts. All inventory items are safe." />
      );
    return (
      <div className="space-y-3">
        {expiryAlerts.map((item, i) => {
          const status = getInventoryStatus(
            item.expiryDate,
            item.stockQuantity,
            item.minThreshold,
          );
          const meta = INVENTORY_STATUS_META[status];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                GLASS,
                "p-4 flex items-center gap-4",
                meta.border,
                meta.bg,
              )}
              data-ocid={`hospital_reports.expiry_alert.item.${i + 1}`}
            >
              <span
                className={cn("w-2.5 h-2.5 rounded-full shrink-0", meta.dot)}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {item.medicineName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.category} · Stock: {String(item.stockQuantity)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">
                  Expires{" "}
                  {new Date(Number(item.expiryDate)).toLocaleDateString()}
                </p>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-semibold border",
                    meta.badge,
                  )}
                >
                  {meta.label}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  }

  // compliance tab
  if (allConsentedPatients.length === 0)
    return (
      <EmptyState message="No consented patients. Patients must grant consent before compliance data is visible." />
    );

  return (
    <div className={cn(GLASS, "overflow-x-auto")}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {[
              "Patient",
              "Adherence",
              "Prescription",
              "Diagnostic",
              "Compliance",
            ].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {allConsentedPatients.map((row, i) => {
            const isCompliant =
              row.consent.adherenceSharing && row.consent.prescriptionSharing;
            return (
              <tr
                key={row.patient.id}
                className="hover:bg-muted/50 transition-colors"
                data-ocid={`hospital_reports.compliance.item.${i + 1}`}
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {row.patient.name}
                </td>
                <td className="px-4 py-3">
                  <ConsentBadge granted={row.consent.adherenceSharing} />
                </td>
                <td className="px-4 py-3">
                  <ConsentBadge granted={row.consent.prescriptionSharing} />
                </td>
                <td className="px-4 py-3">
                  <ConsentBadge granted={row.consent.diagnosticAccess} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      isCompliant ? "badge-success" : "badge-warning",
                    )}
                  >
                    {isCompliant ? "Compliant" : "Partial"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ConsentBadge({ granted }: { granted: boolean }) {
  return (
    <span className={cn(granted ? "badge-success" : "badge-danger")}>
      {granted ? <CheckCircle2 size={10} /> : null}
      {granted ? "Granted" : "Revoked"}
    </span>
  );
}
