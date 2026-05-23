import type { WorkflowChain, WorkflowStage } from "@/backend";
import { EmptyState } from "@/components/common/EmptyState";
import { LifecycleCanvasSkeleton } from "@/components/common/LoadingSpinner";
import { LifecycleConnector } from "@/components/lifecycle/LifecycleConnector";
import { LifecycleWorkflowNode } from "@/components/lifecycle/LifecycleWorkflowNode";
import type { NodeStatus } from "@/components/lifecycle/LifecycleWorkflowNode";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLifecycleMedicines, useWorkflowChain } from "@/hooks/useLifecycle";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FlaskConical,
  Heart,
  Package,
  Pill,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Stethoscope,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

// ─── Main Page ────────────────────────────────────────────────────────────────
// ─── Stage Config ─────────────────────────────────────────────────────────────
const STAGE_MAP: Record<
  string,
  {
    stageName: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    accentColor: string;
  }
> = {
  PharmacySale: {
    stageName: "Pharmacy Sale",
    icon: ShoppingCart,
    accentColor: "var(--color-role-pharmacy)",
  },
  PatientInventory: {
    stageName: "Patient Inventory",
    icon: Package,
    accentColor: "var(--color-role-patient)",
  },
  ReminderSetup: {
    stageName: "Reminder Setup",
    icon: Clock,
    accentColor: "var(--color-accent-teal)",
  },
  DoseLogs: {
    stageName: "Dose Logs",
    icon: Pill,
    accentColor: "var(--color-status-success)",
  },
  AdherenceTracking: {
    stageName: "Adherence",
    icon: Heart,
    accentColor: "var(--color-status-warning)",
  },
  ExpiryMonitoring: {
    stageName: "Expiry Status",
    icon: Calendar,
    accentColor: "var(--color-status-danger)",
  },
  Replacement: {
    stageName: "Replacement / Reorder",
    icon: RefreshCw,
    accentColor: "var(--color-role-hospital)",
  },
};

const ORDERED_STAGE_TYPES = [
  "PharmacySale",
  "PatientInventory",
  "ReminderSetup",
  "DoseLogs",
  "AdherenceTracking",
  "ExpiryMonitoring",
  "Replacement",
];

function resolveNodeStatus(stage: WorkflowStage): NodeStatus {
  const s = stage.status.toLowerCase();
  if (s === "completed") return "completed";
  if (s === "active" || s === "in_progress") return "active";
  if (s === "warning" || s === "at_risk") return "warning";
  return "pending";
}

function computeHealthScore(chain: WorkflowChain): number {
  const stages = chain.stages;
  if (stages.length === 0) return 0;
  const completed = stages.filter(
    (s) => s.status.toLowerCase() === "completed",
  ).length;
  return Math.round((completed / stages.length) * 100);
}

export default function MedicineLifecyclePage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { medicineId?: string };
  const initMedId = search?.medicineId ?? "";

  const [selectedMedicineId, setSelectedMedicineId] = useState(initMedId);
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>(
    {},
  );

  const { data: medicines, isLoading: medsLoading } = useLifecycleMedicines();
  const {
    data: chain,
    isLoading: chainLoading,
    isError,
    refetch,
  } = useWorkflowChain(selectedMedicineId || null);

  useEffect(() => {
    if (!selectedMedicineId && medicines && medicines.length > 0) {
      setSelectedMedicineId(medicines[0].id);
    }
  }, [medicines, selectedMedicineId]);

  const selectedMedicine = medicines?.find((m) => m.id === selectedMedicineId);
  const isLoading = medsLoading || chainLoading;
  const healthScore = chain ? computeHealthScore(chain) : 0;
  const toggleStage = (stageType: string) =>
    setExpandedStages((prev) => ({ ...prev, [stageType]: !prev[stageType] }));

  const displayStages = ORDERED_STAGE_TYPES.map((stageType) => {
    const backendStage = chain?.stages.find((s) => s.stageType === stageType);
    const meta = STAGE_MAP[stageType] ?? {
      stageName: stageType,
      icon: Activity,
      accentColor: "var(--color-text-muted)",
    };
    return { stageType, meta, stage: backendStage ?? null };
  });

  const completedCount =
    chain?.stages.filter((s) => s.status.toLowerCase() === "completed")
      .length ?? 0;
  const totalStages = chain?.stages.length ?? 0;

  return (
    <div
      className="min-h-screen bg-[var(--color-bg-base)]"
      data-ocid="lifecycle.page"
    >
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-card/90 backdrop-blur-xl border-b border-[var(--color-border-base)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                data-ocid="lifecycle.back_button"
                onClick={() => navigate({ to: "/patient" })}
                className="p-2 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-base)] hover:border-[var(--color-border-strong)] transition-colors shrink-0"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4 text-[var(--color-text-secondary)]" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[var(--color-role-patient)]/20 flex items-center justify-center shrink-0">
                    <FlaskConical className="w-4 h-4 text-[var(--color-role-patient)]" />
                  </div>
                  <h1 className="text-lg font-bold font-display text-[var(--color-text-primary)] truncate">
                    Medicine Lifecycle
                  </h1>
                </div>
                {selectedMedicine && (
                  <p className="text-xs text-[var(--color-text-tertiary)] truncate pl-9">
                    {selectedMedicine.name} · {selectedMedicine.dosage}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-base)]">
                <Stethoscope className="w-3 h-3 text-[var(--color-text-tertiary)]" />
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  Healthcare lifecycle audit
                </span>
              </div>
              <button
                type="button"
                data-ocid="lifecycle.refresh_button"
                onClick={() => refetch()}
                className="p-2 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-base)] hover:border-[var(--color-border-strong)] transition-colors"
                aria-label="Refresh lifecycle"
              >
                <RefreshCw className="w-4 h-4 text-[var(--color-text-secondary)]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Medicine selector */}
        {medicines && medicines.length > 1 && (
          <div data-ocid="lifecycle.medicine_selector">
            <Select
              value={selectedMedicineId}
              onValueChange={(val) => {
                setSelectedMedicineId(val);
                setExpandedStages({});
              }}
            >
              <SelectTrigger
                className="bg-[var(--color-bg-elevated)] border-[var(--color-border-base)] text-sm"
                data-ocid="lifecycle.medicine_select"
              >
                <SelectValue placeholder="Select a medicine…" />
              </SelectTrigger>
              <SelectContent>
                {medicines.map((med) => (
                  <SelectItem key={med.id} value={med.id}>
                    {med.name} — {med.dosage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Loading */}
        {isLoading && <LifecycleCanvasSkeleton />}

        {/* Error */}
        {isError && !isLoading && (
          <div
            className="panel-depth-2 rounded-2xl p-10 text-center"
            data-ocid="lifecycle.error_state"
          >
            <AlertTriangle className="w-10 h-10 text-[var(--color-status-danger)] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">
              Unable to load lifecycle data
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-5">
              Something went wrong fetching the workflow chain.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => refetch()}
              data-ocid="lifecycle.retry_button"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Try again
            </Button>
          </div>
        )}

        {/* Empty — no medicine */}
        {!isLoading && !isError && !selectedMedicineId && (
          <div
            className="panel-depth-2 rounded-2xl p-16 text-center"
            data-ocid="lifecycle.empty_state"
          >
            <FlaskConical className="w-14 h-14 text-[var(--color-role-patient)] mx-auto mb-4" />
            <h3 className="text-lg font-bold font-display text-[var(--color-text-primary)] mb-2">
              No Medicine Selected
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mx-auto mb-6">
              Select a medicine to explore its complete lifecycle — from
              pharmacy sale to expiry monitoring.
            </p>
            <Button
              type="button"
              onClick={() => navigate({ to: "/patient/medicines" })}
              data-ocid="lifecycle.go_medicines_button"
              className="gap-2"
            >
              <Pill className="w-4 h-4" /> View my medicines
            </Button>
          </div>
        )}

        {/* Main content */}
        {!isLoading && !isError && selectedMedicineId && (
          <div className="space-y-5">
            {/* Lifecycle Health Score */}
            {chain && totalStages > 0 && (
              <div
                className="panel-depth-2 rounded-2xl border border-[var(--color-border-base)] p-5"
                data-ocid="lifecycle.health_score"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck
                      size={15}
                      className="text-[var(--color-role-patient)]"
                    />
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                      Lifecycle Health Score
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      <span data-metric>{completedCount}</span> /{" "}
                      <span data-metric>{totalStages}</span> stages completed
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        healthScore >= 80
                          ? "bg-[var(--color-status-success)]/15 text-[var(--color-status-success)] border-[var(--color-status-success)]/30 text-xs"
                          : healthScore >= 50
                            ? "bg-[var(--color-status-warning)]/15 text-[var(--color-status-warning)] border-[var(--color-status-warning)]/30 text-xs"
                            : "bg-[var(--color-status-danger)]/15 text-[var(--color-status-danger)] border-[var(--color-status-danger)]/30 text-xs"
                      }
                    >
                      {healthScore}%
                    </Badge>
                  </div>
                </div>
                <Progress
                  value={healthScore}
                  className="h-1.5 bg-[var(--color-bg-muted)]"
                />
              </div>
            )}

            {/* Vertical lifecycle canvas with blueprint grid */}
            <div className="min-w-0 overflow-hidden">
              <div
                className="panel-depth-2 rounded-2xl border border-[var(--color-border-base)] overflow-x-auto p-3 sm:p-5 blueprint-grid"
                data-ocid="lifecycle.canvas"
              >
                <div className="flex items-center gap-2 mb-5">
                  <Activity
                    size={15}
                    className="text-[var(--color-role-patient)]"
                  />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Workflow Chain
                  </h2>
                  {chain && (
                    <Badge
                      variant="outline"
                      className="ml-auto text-[10px] font-mono border-[var(--color-border-base)] text-[var(--color-text-muted)]"
                    >
                      {chain.stages.reduce(
                        (sum, s) => sum + s.events.length,
                        0,
                      )}{" "}
                      total events
                    </Badge>
                  )}
                </div>

                {/* Empty chain */}
                {!chain?.stages.length && !medsLoading && (
                  <EmptyState
                    icon={<Activity />}
                    title="No lifecycle data yet"
                    description="Lifecycle events will appear as this medicine is dispensed, tracked, and monitored."
                  />
                )}

                {/* Stage nodes with connectors */}
                <div className="space-y-0 min-w-0 sm:min-w-[680px]">
                  {displayStages.map(({ stageType, meta, stage }, idx) => {
                    const status: NodeStatus = stage
                      ? resolveNodeStatus(stage)
                      : "pending";
                    const events = stage?.events ?? [];
                    const latestTs =
                      events.length > 0
                        ? events.reduce(
                            (max, e) => (e.timestamp > max ? e.timestamp : max),
                            events[0].timestamp,
                          )
                        : undefined;
                    const actorRole = stage?.actorRole;
                    const dosesAdherenceMissed =
                      stageType === "AdherenceTracking"
                        ? events.filter(
                            (e) =>
                              Object.keys(e.eventType)[0] === "ReminderMissed",
                          ).length
                        : 0;
                    const isLast = idx === displayStages.length - 1;
                    const isActive =
                      status === "active" || status === "completed";

                    return (
                      <div key={stageType}>
                        <LifecycleWorkflowNode
                          icon={meta.icon}
                          stageName={meta.stageName}
                          status={status}
                          actorRole={actorRole}
                          latestTimestamp={latestTs}
                          eventCount={events.length}
                          isExpanded={expandedStages[stageType] ?? false}
                          onToggle={() => toggleStage(stageType)}
                          dosesAdherenceMissed={dosesAdherenceMissed}
                          events={events}
                          accentColor={meta.accentColor}
                        />
                        <LifecycleConnector active={isActive} isLast={isLast} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Summary stats */}
            {chain && (
              <div
                className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                data-ocid="lifecycle.stats_bar"
              >
                {[
                  {
                    icon: CheckCircle,
                    label: "Stages Done",
                    value: completedCount,
                    color: "text-[var(--color-status-success)]",
                    bg: "bg-[var(--color-status-success)]/12",
                    ocid: "lifecycle.stat.completed",
                  },
                  {
                    icon: TrendingUp,
                    label: "Total Events",
                    value: chain.stages.reduce(
                      (s, st) => s + st.events.length,
                      0,
                    ),
                    color: "text-[var(--color-role-patient)]",
                    bg: "bg-[var(--color-role-patient)]/12",
                    ocid: "lifecycle.stat.events",
                  },
                  {
                    icon: Clock,
                    label: "Pending",
                    value: displayStages.filter(
                      ({ stage: st }) =>
                        !st || st.status.toLowerCase() === "pending",
                    ).length,
                    color: "text-[var(--color-text-muted)]",
                    bg: "bg-[var(--color-bg-muted)]",
                    ocid: "lifecycle.stat.pending",
                  },
                  {
                    icon: AlertTriangle,
                    label: "Warnings",
                    value: chain.stages.filter(
                      (s) =>
                        s.status.toLowerCase() === "warning" ||
                        s.status.toLowerCase() === "at_risk",
                    ).length,
                    color: "text-[var(--color-status-warning)]",
                    bg: "bg-[var(--color-status-warning)]/12",
                    ocid: "lifecycle.stat.warnings",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="panel-depth-2 rounded-xl p-4 flex items-center gap-3"
                    data-ocid={stat.ocid}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}
                    >
                      <stat.icon size={16} className={stat.color} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        {stat.label}
                      </p>
                      <p
                        className={`text-xl font-bold font-display ${stat.color}`}
                        data-metric
                      >
                        {stat.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
