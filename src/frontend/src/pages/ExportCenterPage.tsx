import { createActor } from "@/backend";
import type { ReportData } from "@/backend";
import { useAuthStore } from "@/store/auth";
import { useActor } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileBarChart,
  FileText,
  Filter,
  FlaskConical,
  History,
  LayoutDashboard,
  List,
  Loader2,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  User,
  XCircle,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useExportAudit } from "@/hooks/useExportAudit";
import type { ExportAuditEntry } from "@/lib/exportAudit";
import { downloadCsv, generateCsv } from "@/lib/exportCsv";
import { useQuery } from "@tanstack/react-query";

// ── Types ──────────────────────────────────────────────────────────────
type TabId = "dashboard" | "reports" | "history" | "scheduled";
type HistoryView = "table" | "timeline";
type UserRole = "Patient" | "Pharmacy" | "Hospital" | "Lab" | "Admin";

type TemplateColorKey = "teal" | "amber" | "blue" | "purple" | "red";

const TEMPLATE_COLOR_MAP: Record<string, TemplateColorKey> = {
  "var(--color-role-patient)": "teal",
  "var(--color-role-pharmacy)": "amber",
  "var(--color-role-hospital)": "blue",
  "var(--color-role-diagnostic)": "purple",
  "var(--color-role-admin)": "red",
};

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  scope: string;
  roles: UserRole[];
  accentVar: string;
  colorKey: TemplateColorKey;
  icon: React.ReactNode;
}

// ── Report templates registry ──────────────────────────────────────────
const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "adherence-history",
    name: "Adherence History",
    description:
      "Complete dose-taking history with on-time rates and missed doses.",
    scope: "All logged doses · Rolling 90 days",
    roles: ["Patient", "Admin"],
    accentVar: "var(--color-role-patient)",
    colorKey: TEMPLATE_COLOR_MAP["var(--color-role-patient)"],
    icon: <Activity size={16} />,
  },
  {
    id: "medicine-inventory",
    name: "Medicine Inventory",
    description:
      "Current medicine list with expiry dates, dosages, and categories.",
    scope: "Active medicines · Real-time snapshot",
    roles: ["Patient", "Admin"],
    accentVar: "var(--color-role-patient)",
    colorKey: TEMPLATE_COLOR_MAP["var(--color-role-patient)"],
    icon: <FileBarChart size={16} />,
  },
  {
    id: "reminder-logs",
    name: "Reminder Logs",
    description:
      "Scheduled reminder activity including triggers, completions, and missed events.",
    scope: "All reminders · Last 30 days",
    roles: ["Patient", "Admin"],
    accentVar: "var(--color-role-patient)",
    colorKey: TEMPLATE_COLOR_MAP["var(--color-role-patient)"],
    icon: <Clock size={16} />,
  },
  {
    id: "lifecycle-summary",
    name: "Lifecycle Summary",
    description:
      "End-to-end medicine journey from pharmacy sale through adherence tracking.",
    scope: "Per-medicine lifecycle · Full history",
    roles: ["Patient", "Admin"],
    accentVar: "var(--color-role-patient)",
    colorKey: TEMPLATE_COLOR_MAP["var(--color-role-patient)"],
    icon: <TrendingUp size={16} />,
  },
  {
    id: "expiry-risk",
    name: "Expiry Risk Report",
    description:
      "Inventory items at risk of expiry within 30, 60, and 90-day windows.",
    scope: "Full pharmacy inventory · Tiered risk",
    roles: ["Pharmacy", "Admin"],
    accentVar: "var(--color-role-pharmacy)",
    colorKey: TEMPLATE_COLOR_MAP["var(--color-role-pharmacy)"],
    icon: <AlertCircle size={16} />,
  },
  {
    id: "inventory-movement",
    name: "Inventory Movement",
    description:
      "Stock changes, restock events, and movement velocity for all SKUs.",
    scope: "Inventory ledger · Last 60 days",
    roles: ["Pharmacy", "Admin"],
    accentVar: "var(--color-role-pharmacy)",
    colorKey: TEMPLATE_COLOR_MAP["var(--color-role-pharmacy)"],
    icon: <BarChart3 size={16} />,
  },
  {
    id: "sync-history",
    name: "Sync History",
    description:
      "Patient sync events with status, batch numbers, and error records.",
    scope: "All sync events · Audit-grade",
    roles: ["Pharmacy", "Admin"],
    accentVar: "var(--color-role-pharmacy)",
    colorKey: TEMPLATE_COLOR_MAP["var(--color-role-pharmacy)"],
    icon: <RefreshCw size={16} />,
  },
  {
    id: "compliance-report",
    name: "Compliance Report",
    description:
      "Patient medication adherence and treatment compliance across all consented records.",
    scope: "Consented patients · 90-day window",
    roles: ["Hospital", "Admin"],
    accentVar: "var(--color-role-hospital)",
    colorKey: TEMPLATE_COLOR_MAP["var(--color-role-hospital)"],
    icon: <ShieldCheck size={16} />,
  },
  {
    id: "consent-report",
    name: "Consent & Access Report",
    description:
      "Consent status, grant/revoke history, and access-level audit trail.",
    scope: "All consent records · Full audit",
    roles: ["Hospital", "Admin"],
    accentVar: "var(--color-role-hospital)",
    colorKey: TEMPLATE_COLOR_MAP["var(--color-role-hospital)"],
    icon: <FileText size={16} />,
  },
  {
    id: "diagnostics-timeline",
    name: "Diagnostics Timeline",
    description:
      "Booking lifecycle, sample collection, report upload, and turnaround metrics.",
    scope: "All bookings · Chronological",
    roles: ["Lab", "Admin"],
    accentVar: "var(--color-role-diagnostic)",
    colorKey: TEMPLATE_COLOR_MAP["var(--color-role-diagnostic)"],
    icon: <FlaskConical size={16} />,
  },
  {
    id: "ecosystem-analytics",
    name: "Ecosystem Analytics",
    description:
      "Platform-wide operational activity, user distribution, and workflow metrics.",
    scope: "All roles · Platform-wide",
    roles: ["Admin"],
    accentVar: "var(--color-role-admin)",
    colorKey: TEMPLATE_COLOR_MAP["var(--color-role-admin)"],
    icon: <Zap size={16} />,
  },
];

// ── Helpers ────────────────────────────────────────────────────────────
function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatBytes(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function groupByDate(
  entries: ExportAuditEntry[],
): Record<string, ExportAuditEntry[]> {
  const groups: Record<string, ExportAuditEntry[]> = {};
  for (const entry of entries) {
    const key = formatDateShort(entry.timestamp);
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }
  return groups;
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  Patient: <User size={11} />,
  Pharmacy: <FileBarChart size={11} />,
  Hospital: <Stethoscope size={11} />,
  Lab: <FlaskConical size={11} />,
  Admin: <ShieldCheck size={11} />,
};

// ── Sub-components ─────────────────────────────────────────────────────
function TabButton({
  id,
  active,
  icon,
  label,
  onClick,
}: {
  id: TabId;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: (id: TabId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      data-ocid={`export_center.tab.${id}`}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
        active
          ? "bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] border-[var(--color-border-accent)] shadow-sm"
          : "bg-transparent text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function KpiSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] p-5 space-y-3 animate-pulse">
      <div className="h-3 w-24 rounded bg-[var(--color-bg-muted)]" />
      <div className="h-8 w-16 rounded bg-[var(--color-bg-muted)]" />
      <div className="h-2 w-32 rounded bg-[var(--color-bg-muted)]" />
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--color-text-secondary)] w-24 shrink-0 truncate">
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full bg-[var(--color-bg-muted)]">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-mono text-[var(--color-text-primary)] w-8 text-right shrink-0">
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ success }: { success: boolean }) {
  if (success) {
    return (
      <span className="badge-success flex items-center gap-1">
        <CheckCircle2 size={10} /> Success
      </span>
    );
  }
  return (
    <span className="badge-danger flex items-center gap-1">
      <XCircle size={10} /> Failed
    </span>
  );
}

function FormatBadge({ fmt }: { fmt: string }) {
  const isPdf = fmt === "pdf";
  return (
    <span className={isPdf ? "badge-purple" : "badge-info"}>
      {fmt.toUpperCase()}
    </span>
  );
}

// ── Report Data Preview Dialog ─────────────────────────────────────────
function ReportPreviewDialog({
  open,
  onClose,
  reportData,
  isLoading,
  templateName,
  colorKey = "blue",
}: {
  open: boolean;
  onClose: () => void;
  reportData: ReportData | null;
  isLoading: boolean;
  templateName: string;
  colorKey?: TemplateColorKey;
}) {
  if (!open) return null;
  return (
    <dialog
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      aria-labelledby="report-preview-title"
      data-ocid="export_center.report_preview.dialog"
    >
      <div
        className="absolute inset-0 bg-[var(--color-bg-overlay)] backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-bg-surface)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-base)] px-6 py-4 bg-[var(--color-bg-elevated)]">
          <div>
            <h2
              id="report-preview-title"
              className="text-sm font-semibold text-[var(--color-text-primary)]"
            >
              {templateName}
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Report Preview
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)] transition-colors"
            aria-label="Close preview"
            data-ocid="export_center.report_preview.close_button"
          >
            <XCircle size={16} />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2
                size={24}
                className="animate-spin text-[var(--color-text-secondary)]"
              />
            </div>
          ) : reportData ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] pb-2 border-b border-[var(--color-border-base)]">
                <Clock size={11} />
                Generated:{" "}
                {formatDateTime(
                  new Date(
                    Number(reportData.generatedAt) / 1_000_000,
                  ).toISOString(),
                )}
              </div>
              {reportData.dataPoints.length === 0 ? (
                <p className="text-sm text-[var(--color-text-secondary)] italic py-4 text-center">
                  No data available for this report type.
                </p>
              ) : (
                <div className="divide-y divide-[var(--color-border-base)]">
                  {reportData.dataPoints.map((point) => (
                    <div
                      key={point.dataLabel}
                      className="py-2.5 flex items-start justify-between gap-4"
                    >
                      <span className="text-xs font-medium text-[var(--color-text-secondary)] shrink-0 w-40">
                        {point.dataLabel}
                      </span>
                      <span className="text-xs text-[var(--color-text-primary)] text-right">
                        {point.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-secondary)] text-center py-8">
              Failed to load report data.
            </p>
          )}
        </div>
        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--color-border-base)] bg-[var(--color-bg-elevated)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)] transition-colors"
            data-ocid="export_center.report_preview.cancel_button"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              toast.info(
                "Use the export buttons in the Report Center to generate the full file.",
              );
              onClose();
            }}
            disabled={isLoading || !reportData}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all disabled:opacity-40 export-template-cta-${colorKey}`}
            data-ocid="export_center.report_preview.confirm_button"
          >
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>
    </dialog>
  );
}

// ── Dashboard Tab ───────────────────────────────────────────────────────
function DashboardTab({ logs }: { logs: ExportAuditEntry[] }) {
  const { actor, isFetching } = useActor(createActor);

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["export-analytics"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getExportAnalytics();
    },
    enabled: !!actor && !isFetching,
  });

  const successRate = analytics
    ? analytics.totalExports > 0n
      ? Math.round(
          (Number(analytics.successCount) / Number(analytics.totalExports)) *
            100,
        )
      : 100
    : null;

  const last7Days = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = logs.filter(
      (l) => new Date(l.timestamp).getTime() >= cutoff,
    );
    if (recent.length === 0) return null;
    const successCount = recent.filter((l) => l.success).length;
    return Math.round((successCount / recent.length) * 100);
  }, [logs]);

  const formatBreakdown = useMemo(() => {
    if (!analytics?.exportsByFormat) return [];
    const total = analytics.exportsByFormat.reduce(
      (a, [, v]) => a + Number(v),
      0,
    );
    return analytics.exportsByFormat.map(([label, val]) => ({
      label: label.toUpperCase(),
      value: Number(val),
      max: total,
    }));
  }, [analytics]);

  const roleBreakdown = useMemo(() => {
    if (!analytics?.exportsByRole) return [];
    const total = analytics.exportsByRole.reduce(
      (a, [, v]) => a + Number(v),
      0,
    );
    return analytics.exportsByRole.map(([label, val]) => ({
      label,
      value: Number(val),
      max: total,
    }));
  }, [analytics]);

  const ROLE_COLORS: Record<string, string> = {
    Patient: "var(--color-role-patient)",
    Pharmacy: "var(--color-role-pharmacy)",
    Hospital: "var(--color-role-hospital)",
    Lab: "var(--color-role-diagnostic)",
    Admin: "var(--color-role-admin)",
  };

  const FORMAT_COLORS: Record<string, string> = {
    PDF: "var(--color-role-diagnostic)",
    CSV: "var(--color-role-patient)",
    PRINT: "var(--color-role-pharmacy)",
  };

  return (
    <div className="space-y-6" data-ocid="export_center.dashboard.section">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          [0, 1, 2, 3].map((i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <div
              className="rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] p-5 space-y-2"
              data-ocid="export_center.kpi.total_exports"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                  Total Exports
                </span>
                <BarChart3
                  size={14}
                  className="text-[var(--color-text-secondary)]"
                />
              </div>
              <div className="text-3xl font-display font-bold text-[var(--color-text-primary)]">
                {analytics ? Number(analytics.totalExports) : logs.length}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]">
                All time across all roles
              </div>
            </div>

            <div
              className="rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] p-5 space-y-2"
              data-ocid="export_center.kpi.success_rate"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                  Success Rate
                </span>
                <CheckCircle2
                  size={14}
                  className="text-[var(--color-role-patient)]"
                />
              </div>
              <div className="text-3xl font-display font-bold text-[var(--color-role-patient)]">
                {successRate !== null ? `${successRate}%` : "—"}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]">
                {last7Days !== null
                  ? `Last 7 days: ${last7Days}% success rate`
                  : "No recent data"}
              </div>
            </div>

            <div
              className="rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] p-5 space-y-2"
              data-ocid="export_center.kpi.failed_count"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                  Failed
                </span>
                <XCircle size={14} className="text-[var(--color-role-admin)]" />
              </div>
              <div className="text-3xl font-display font-bold text-[var(--color-role-admin)]">
                {analytics
                  ? Number(analytics.failureCount)
                  : logs.filter((l) => !l.success).length}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]">
                Requires attention
              </div>
            </div>

            <div
              className="rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] p-5 space-y-2"
              data-ocid="export_center.kpi.top_format"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                  Top Format
                </span>
                <FileText
                  size={14}
                  className="text-[var(--color-role-hospital)]"
                />
              </div>
              <div className="text-3xl font-display font-bold text-[var(--color-role-hospital)]">
                {formatBreakdown.length > 0
                  ? formatBreakdown.sort((a, b) => b.value - a.value)[0].label
                  : "PDF"}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]">
                Most used export format
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Exports by Format */}
        <div className="rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <FileText
              size={14}
              className="text-[var(--color-text-secondary)]"
            />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Exports by Format
            </h3>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-2 w-20 rounded bg-[var(--color-bg-muted)]" />
                  <div className="flex-1 h-2 rounded bg-[var(--color-bg-muted)]" />
                </div>
              ))}
            </div>
          ) : formatBreakdown.length > 0 ? (
            <div className="space-y-3">
              {formatBreakdown.map((item) => (
                <BarRow
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  max={item.max}
                  color={
                    FORMAT_COLORS[item.label] ?? "var(--color-role-hospital)"
                  }
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--color-text-secondary)] italic">
              No format data yet
            </p>
          )}
        </div>

        {/* Exports by Role */}
        <div className="rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <User size={14} className="text-[var(--color-text-secondary)]" />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Exports by Role
            </h3>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-2 w-20 rounded bg-[var(--color-bg-muted)]" />
                  <div className="flex-1 h-2 rounded bg-[var(--color-bg-muted)]" />
                </div>
              ))}
            </div>
          ) : roleBreakdown.length > 0 ? (
            <div className="space-y-3">
              {roleBreakdown.map((item) => (
                <BarRow
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  max={item.max}
                  color={
                    ROLE_COLORS[item.label] ?? "var(--color-role-hospital)"
                  }
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--color-text-secondary)] italic">
              No role data yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Report Center Tab ───────────────────────────────────────────────────
function ReportCenterTab({
  userRole,
  logs,
}: { userRole: UserRole | null; logs: ExportAuditEntry[] }) {
  const { actor, isFetching } = useActor(createActor);
  const [previewTemplate, setPreviewTemplate] = useState<ReportTemplate | null>(
    null,
  );
  const [previewData, setPreviewData] = useState<ReportData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const visibleTemplates = useMemo(() => {
    if (!userRole) return [];
    return REPORT_TEMPLATES.filter((t) => t.roles.includes(userRole));
  }, [userRole]);

  function getLastGenerated(templateId: string): string | null {
    const entry = logs.find((l) => l.exportType === templateId);
    return entry ? formatDateShort(entry.timestamp) : null;
  }

  async function handlePreview(template: ReportTemplate) {
    setPreviewTemplate(template);
    setPreviewData(null);
    setPreviewLoading(true);
    try {
      if (!actor) throw new Error("No actor");
      const data = await actor.getReportData(template.id);
      setPreviewData(data);
    } catch {
      toast.error("Failed to load report preview data.");
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div className="space-y-4" data-ocid="export_center.report_center.section">
      <ReportPreviewDialog
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        reportData={previewData}
        isLoading={previewLoading}
        templateName={previewTemplate?.name ?? ""}
        colorKey={previewTemplate?.colorKey ?? "blue"}
      />

      {visibleTemplates.length === 0 ? (
        <div
          className="rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] p-12 text-center"
          data-ocid="export_center.report_center.empty_state"
        >
          <FileBarChart
            size={32}
            className="mx-auto mb-3 text-[var(--color-text-secondary)]"
          />
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            No Reports Available
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Report templates are role-specific. Log in with your assigned role
            to see available reports.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleTemplates.map((template, idx) => {
            const lastGenerated = getLastGenerated(template.id);
            return (
              <div
                key={template.id}
                className="group relative rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] overflow-hidden hover:border-[var(--color-border-accent)] transition-all"
                data-ocid={`export_center.report_card.item.${idx + 1}`}
              >
                {/* Left accent rail */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl export-template-rail-${template.colorKey}`}
                />
                <div className="pl-5 pr-4 py-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 export-template-icon-${template.colorKey}`}
                      >
                        <span
                          className={`export-template-text-${template.colorKey}`}
                        >
                          {template.icon}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight">
                        {template.name}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {template.description}
                  </p>

                  {/* Scope + last generated */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Filter
                        size={10}
                        className="text-[var(--color-text-secondary)] shrink-0"
                      />
                      <span className="text-xs text-[var(--color-text-secondary)] truncate">
                        {template.scope}
                      </span>
                    </div>
                    {lastGenerated ? (
                      <div className="flex items-center gap-1.5">
                        <Clock
                          size={10}
                          className="text-[var(--color-text-secondary)] shrink-0"
                        />
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          Last: {lastGenerated}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Clock
                          size={10}
                          className="text-[var(--color-text-secondary)] opacity-40 shrink-0"
                        />
                        <span className="text-xs text-[var(--color-text-secondary)] opacity-40">
                          Not yet generated
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    type="button"
                    onClick={() => handlePreview(template)}
                    disabled={isFetching}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all export-template-cta-${template.colorKey}`}
                    data-ocid={`export_center.report_preview_button.${idx + 1}`}
                  >
                    <Eye size={12} />
                    Preview & Export
                    <ChevronRight size={12} className="ml-auto" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Scheduled Reports Tab ──────────────────────────────────────────────
function ScheduledTab({ userRole }: { userRole: UserRole | null }) {
  const visibleTemplates = useMemo(() => {
    if (!userRole) return [];
    return REPORT_TEMPLATES.filter((t) => t.roles.includes(userRole));
  }, [userRole]);

  return (
    <div className="space-y-4" data-ocid="export_center.scheduled.section">
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)] border border-[var(--color-border-base)] rounded-xl px-4 py-3">
        <Calendar size={13} />
        <span>
          Scheduled report delivery is coming soon. Configure cadences for your
          reports below.
        </span>
      </div>

      {visibleTemplates.length === 0 ? (
        <div
          className="rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] p-12 text-center"
          data-ocid="export_center.scheduled.empty_state"
        >
          <Calendar
            size={32}
            className="mx-auto mb-3 text-[var(--color-text-secondary)]"
          />
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            No Scheduled Reports
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Log in with your assigned role to configure schedules.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleTemplates.map((template, idx) => (
            <div
              key={template.id}
              className="rounded-2xl border border-[var(--color-border-base)] border-dashed bg-[var(--color-bg-elevated)] p-5 space-y-3 opacity-80"
              data-ocid={`export_center.scheduled_card.item.${idx + 1}`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 export-template-sched-${template.colorKey}`}
                >
                  <span className={`export-template-text-${template.colorKey}`}>
                    {template.icon}
                  </span>
                </div>
                <span className="text-sm font-medium text-[var(--color-text-primary)] leading-tight">
                  {template.name}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                No schedule configured
              </p>
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                <Calendar size={11} />
                <span>Not scheduled</span>
              </div>
              <button
                type="button"
                onClick={() => toast.info("Schedule configuration coming soon")}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border border-[var(--color-border-base)] bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)] transition-all"
                data-ocid={`export_center.configure_schedule_button.${idx + 1}`}
              >
                <Settings2 size={12} />
                Configure Schedule
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── History Tab ─────────────────────────────────────────────────────────
const PAGE_SIZE = 25;
const ROLES = ["Patient", "Pharmacy", "Hospital", "Lab", "Admin"] as const;
const FILE_TYPES = ["pdf", "csv", "print"] as const;
const STATUSES = ["success", "failed"] as const;

function HistoryTab({
  logs,
  clearLogs,
  searchLogs,
}: {
  logs: ExportAuditEntry[];
  clearLogs: () => void;
  searchLogs: (
    query: string,
    opts?: {
      role?: string;
      fileType?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) => ExportAuditEntry[];
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<HistoryView>("table");
  const [showConfirm, setShowConfirm] = useState(false);

  const filtered = useMemo(
    () =>
      searchLogs(query, {
        role: roleFilter || undefined,
        fileType: fileTypeFilter || undefined,
      }).filter(
        (e) =>
          !statusFilter ||
          (statusFilter === "success" ? e.success : !e.success),
      ),
    [query, roleFilter, fileTypeFilter, statusFilter, searchLogs],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const hasActiveFilters = !!(
    query ||
    roleFilter ||
    fileTypeFilter ||
    statusFilter
  );

  function clearFilters() {
    setQuery("");
    setRoleFilter("");
    setFileTypeFilter("");
    setStatusFilter("");
    setPage(1);
  }

  function handleClearHistory() {
    clearLogs();
    setShowConfirm(false);
    setPage(1);
  }

  function handleExportAuditCsv() {
    const headers = [
      "Date/Time",
      "User ID",
      "Role",
      "Export Type",
      "File Type",
      "Status",
      "Filename",
      "File Size",
    ];
    const rows = logs.map((e) => [
      formatDateTime(e.timestamp),
      e.userId,
      e.userRole,
      e.exportType,
      e.fileFormat,
      e.success ? "success" : "failed",
      e.filename ?? "",
      e.fileSizeBytes != null ? formatBytes(e.fileSizeBytes) : "—",
    ]);
    const csv = generateCsv(headers, rows);
    downloadCsv(
      `medivault-export-audit-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
    );
  }

  const groupedByDate = useMemo(
    () => groupByDate(filtered.slice(0, 100)),
    [filtered],
  );

  return (
    <div className="space-y-4" data-ocid="export_center.history.section">
      {/* Confirm clear */}
      {showConfirm && (
        <dialog
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          data-ocid="export_center.clear_history.dialog"
        >
          <div
            className="absolute inset-0 bg-[var(--color-bg-overlay)] backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowConfirm(false);
            }}
            aria-hidden="true"
          />
          <div className="relative bg-[var(--color-bg-surface)] border border-[var(--color-border-base)] rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-role-admin)]/20 border border-[var(--color-role-admin)]/30 flex items-center justify-center shrink-0">
                <AlertCircle
                  size={18}
                  style={{ color: "var(--color-role-admin)" }}
                />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)]">
                  Clear Export History
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  This cannot be undone.
                </p>
              </div>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              All export audit logs will be permanently deleted from this
              device.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-muted)] text-[var(--color-text-primary)] border border-[var(--color-border-base)] transition-all"
                data-ocid="export_center.clear_history.cancel_button"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--color-role-admin)]/20 hover:bg-[var(--color-role-admin)]/30 text-[var(--color-role-admin)] border border-[var(--color-role-admin)]/30 transition-all"
                data-ocid="export_center.clear_history.confirm_button"
              >
                Clear All
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by type, role, format…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-base)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-role-hospital)]/30 transition-all"
            data-ocid="export_center.history.search_input"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all ${showFilters || hasActiveFilters ? "bg-[var(--color-role-hospital)]/15 text-[var(--color-role-hospital)] border-[var(--color-role-hospital)]/30" : "bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] border-[var(--color-border-base)] hover:bg-[var(--color-bg-muted)]"}`}
          data-ocid="export_center.history.filter_toggle"
        >
          <Filter size={13} /> Filters{" "}
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-[var(--color-role-hospital)] shrink-0" />
          )}
        </button>
        {/* View toggle */}
        <div
          className="flex items-center rounded-xl border border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] p-0.5"
          data-ocid="export_center.history.view_toggle"
        >
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${viewMode === "table" ? "bg-[var(--color-bg-muted)] text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"}`}
            data-ocid="export_center.history.table_view_button"
          >
            <List size={12} /> Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode("timeline")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${viewMode === "timeline" ? "bg-[var(--color-bg-muted)] text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"}`}
            data-ocid="export_center.history.timeline_view_button"
          >
            <Activity size={12} /> Timeline
          </button>
        </div>
        <button
          type="button"
          onClick={handleExportAuditCsv}
          disabled={logs.length === 0}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium bg-[var(--color-role-hospital)]/15 hover:bg-[var(--color-role-hospital)]/25 text-[var(--color-role-hospital)] border border-[var(--color-role-hospital)]/30 transition-all disabled:opacity-40"
          data-ocid="export_center.history.export_csv_button"
        >
          <Download size={13} /> Audit CSV
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          disabled={logs.length === 0}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium bg-[var(--color-role-admin)]/15 hover:bg-[var(--color-role-admin)]/25 text-[var(--color-role-admin)] border border-[var(--color-role-admin)]/30 transition-all disabled:opacity-40"
          data-ocid="export_center.history.clear_button"
        >
          <XCircle size={13} /> Clear All
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-base)] p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {(
            [
              [
                "filter-role",
                "Role",
                roleFilter,
                setRoleFilter,
                ROLES.map((r) => ({ v: r, l: r })),
              ],
              [
                "filter-filetype",
                "Format",
                fileTypeFilter,
                setFileTypeFilter,
                FILE_TYPES.map((t) => ({ v: t, l: t.toUpperCase() })),
              ],
              [
                "filter-status",
                "Status",
                statusFilter,
                setStatusFilter,
                STATUSES.map((s) => ({
                  v: s,
                  l: s.charAt(0).toUpperCase() + s.slice(1),
                })),
              ],
            ] as Array<
              [
                string,
                string,
                string,
                React.Dispatch<React.SetStateAction<string>>,
                Array<{ v: string; l: string }>,
              ]
            >
          ).map(([id, label, val, setter, opts]) => (
            <div key={id} className="space-y-1.5">
              <label
                htmlFor={id}
                className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide"
              >
                {label}
              </label>
              <select
                id={id}
                value={val}
                onChange={(e) => {
                  setter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-2 rounded-xl bg-[var(--color-bg-muted)] border border-[var(--color-border-base)] text-sm text-[var(--color-text-primary)] focus:outline-none"
              >
                <option value="">All</option>
                {opts.map(({ v, l }) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {hasActiveFilters && (
            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-base)] hover:bg-[var(--color-bg-muted)] transition-all"
              >
                <XCircle size={11} /> Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {filtered.length === 0 ? (
        <div
          className="rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] p-12 text-center"
          data-ocid="export_center.history.empty_state"
        >
          <History
            size={32}
            className="mx-auto mb-3 text-[var(--color-text-secondary)]"
          />
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            No Export Records
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            {hasActiveFilters
              ? "Try adjusting your filters."
              : "Export history will appear here after your first export."}
          </p>
        </div>
      ) : viewMode === "table" ? (
        <div className="rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table
              className="w-full text-xs"
              data-ocid="export_center.history.table"
            >
              <thead>
                <tr className="border-b border-[var(--color-border-base)] bg-[var(--color-bg-muted)]">
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                    Export Type
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                    Format
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                    Size
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-base)]">
                {pageItems.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-[var(--color-bg-muted)] transition-colors"
                    data-ocid={`export_center.history.row.${idx + 1}`}
                  >
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] whitespace-nowrap">
                      {formatDateTime(entry.timestamp)}
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--color-text-primary)] max-w-[160px] truncate">
                      {entry.exportType}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                        {ROLE_ICONS[entry.userRole]}
                        {entry.userRole}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <FormatBadge fmt={entry.fileFormat} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge success={entry.success} />
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] font-mono">
                      {formatBytes(entry.fileSizeBytes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-[var(--color-border-base)]">
            {pageItems.map((entry, idx) => (
              <div
                key={entry.id}
                className="px-3 py-3 space-y-2.5 hover:bg-[var(--color-bg-muted)] transition-colors"
                data-ocid={`export_center.history.mobile_row.${idx + 1}`}
              >
                {/* Row 1: Name + Status */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--color-text-primary)] leading-snug flex-1 min-w-0 truncate">
                    {entry.exportType}
                  </span>
                  <StatusBadge success={entry.success} />
                </div>
                {/* Row 2: Meta grid — Format · Role · Size */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wide w-11 shrink-0">
                      Format
                    </span>
                    <FormatBadge fmt={entry.fileFormat} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wide w-8 shrink-0">
                      Role
                    </span>
                    <span className="flex items-center gap-1 text-[var(--color-text-secondary)] text-xs truncate">
                      {ROLE_ICONS[entry.userRole]}
                      {entry.userRole}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wide w-11 shrink-0">
                      Size
                    </span>
                    <span className="text-xs font-mono text-[var(--color-text-secondary)]">
                      {entry.fileSizeBytes
                        ? formatBytes(entry.fileSizeBytes)
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wide w-8 shrink-0">
                      Date
                    </span>
                    <span className="text-[11px] text-[var(--color-text-secondary)] truncate">
                      {formatDateTime(entry.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border-base)] bg-[var(--color-bg-muted)]">
              <span className="text-xs text-[var(--color-text-secondary)]">
                {filtered.length} records · Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] disabled:opacity-40 hover:bg-[var(--color-bg-muted)] transition-all"
                  data-ocid="export_center.history.pagination_prev"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] disabled:opacity-40 hover:bg-[var(--color-bg-muted)] transition-all"
                  data-ocid="export_center.history.pagination_next"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Timeline View */
        <div className="space-y-6" data-ocid="export_center.history.timeline">
          {Object.entries(groupedByDate).map(([date, entries]) => (
            <div key={date} className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                  {date}
                </span>
                <div className="flex-1 h-px bg-[var(--color-border-base)]" />
                <span className="text-xs text-[var(--color-text-secondary)] badge-info">
                  {entries.length}
                </span>
              </div>
              <div className="space-y-2 pl-4 border-l-2 border-[var(--color-border-base)]">
                {entries.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="relative bg-[var(--color-bg-elevated)] border border-[var(--color-border-base)] rounded-xl p-3 flex items-center gap-3 hover:border-[var(--color-border-accent)] transition-all"
                    data-ocid={`export_center.timeline.item.${idx + 1}`}
                  >
                    {/* Timeline dot */}
                    <div
                      className="absolute -left-5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-[var(--color-bg-base)] flex-shrink-0"
                      style={{
                        background: entry.success
                          ? "var(--color-role-patient)"
                          : "var(--color-role-admin)",
                      }}
                    />
                    <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)] shrink-0">
                      {ROLE_ICONS[entry.userRole]}
                      <span className="text-xs">{entry.userRole}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                        {entry.exportType}
                      </p>
                    </div>
                    <FormatBadge fmt={entry.fileFormat} />
                    <StatusBadge success={entry.success} />
                    <span className="text-xs text-[var(--color-text-secondary)] shrink-0 font-mono">
                      {new Date(entry.timestamp).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────
export default function ExportCenterPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userRole = (user?.role ?? null) as UserRole | null;
  const { logs, clearLogs, searchLogs } = useExportAudit();

  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  const totalExports = logs.length;
  const successCount = logs.filter((l) => l.success).length;
  const successPct =
    totalExports > 0 ? Math.round((successCount / totalExports) * 100) : 100;

  return (
    <div
      className="min-h-screen bg-[var(--color-bg-base)]"
      data-ocid="export_center.page"
    >
      {/* Page header */}
      <div className="border-b border-[var(--color-border-base)] bg-[var(--color-bg-elevated)]">
        <div className="px-4 md:px-8 py-5">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors mb-4"
            data-ocid="export_center.back_button"
          >
            <ArrowLeft size={13} /> Back
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[var(--color-role-hospital)]/15 border border-[var(--color-role-hospital)]/25 flex items-center justify-center">
                <BarChart3
                  size={20}
                  style={{ color: "var(--color-role-hospital)" }}
                />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-[var(--color-text-primary)]">
                  Export & Reporting Intelligence
                </h1>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Healthcare operations reporting center
                </p>
              </div>
            </div>
            {/* Operational summary */}
            <div className="flex items-center gap-4 bg-[var(--color-bg-muted)] border border-[var(--color-border-base)] rounded-xl px-4 py-2.5">
              <div className="text-center">
                <div className="text-sm font-bold text-[var(--color-text-primary)] font-mono">
                  {totalExports}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  Total
                </div>
              </div>
              <div className="w-px h-6 bg-[var(--color-border-base)]" />
              <div className="text-center">
                <div
                  className="text-sm font-bold font-mono"
                  style={{ color: "var(--color-role-patient)" }}
                >
                  {successPct}%
                </div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  Success
                </div>
              </div>
              <div className="w-px h-6 bg-[var(--color-border-base)]" />
              <div className="text-center">
                <div
                  className="text-sm font-bold font-mono"
                  style={{ color: "var(--color-role-admin)" }}
                >
                  {totalExports - successCount}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  Failed
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 md:px-8 pb-0">
          <div className="flex items-center gap-1 border-b-0">
            <TabButton
              id="dashboard"
              active={activeTab === "dashboard"}
              icon={<LayoutDashboard size={14} />}
              label="Export Dashboard"
              onClick={setActiveTab}
            />
            <TabButton
              id="reports"
              active={activeTab === "reports"}
              icon={<FileBarChart size={14} />}
              label="Report Center"
              onClick={setActiveTab}
            />
            <TabButton
              id="history"
              active={activeTab === "history"}
              icon={<History size={14} />}
              label="Export History"
              onClick={setActiveTab}
            />
            <TabButton
              id="scheduled"
              active={activeTab === "scheduled"}
              icon={<Calendar size={14} />}
              label="Scheduled"
              onClick={setActiveTab}
            />
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 md:px-8 py-6">
        {activeTab === "dashboard" && <DashboardTab logs={logs} />}
        {activeTab === "reports" && (
          <ReportCenterTab userRole={userRole} logs={logs} />
        )}
        {activeTab === "history" && (
          <HistoryTab
            logs={logs}
            clearLogs={clearLogs}
            searchLogs={searchLogs}
          />
        )}
        {activeTab === "scheduled" && <ScheduledTab userRole={userRole} />}
      </div>
    </div>
  );
}
