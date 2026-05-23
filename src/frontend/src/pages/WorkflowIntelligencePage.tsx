import { WorkflowSectionSkeleton } from "@/components/common/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { useLifecycleMedicines, useWorkflowChain } from "@/hooks/useLifecycle";
import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowRight,
  Building2,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  Layers,
  Pill,
  Shield,
  Stethoscope,
  Users,
  Workflow,
} from "lucide-react";
import { useState } from "react";

// ── Role definitions ─────────────────────────────────────────────────
const ROLES = [
  {
    id: "patient",
    label: "Patient",
    icon: Users,
    colorVar: "--color-role-patient",
    surfaceVar: "--color-role-patient-surface",
    interactions: 142,
    desc: "Medicine intake, dose logging, adherence tracking",
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    icon: Pill,
    colorVar: "--color-role-pharmacy",
    surfaceVar: "--color-role-pharmacy-surface",
    interactions: 88,
    desc: "Inventory management, patient syncs, dispensing",
  },
  {
    id: "hospital",
    label: "Hospital",
    icon: Stethoscope,
    colorVar: "--color-role-hospital",
    surfaceVar: "--color-role-hospital-surface",
    interactions: 64,
    desc: "Prescriptions, consent access, clinical monitoring",
  },
  {
    id: "lab",
    label: "Laboratory",
    icon: FlaskConical,
    colorVar: "--color-role-diagnostic",
    surfaceVar: "--color-role-diagnostic-surface",
    interactions: 37,
    desc: "Diagnostic reports, test results, specimen data",
  },
  {
    id: "admin",
    label: "Admin",
    icon: Shield,
    colorVar: "--color-role-admin",
    surfaceVar: "--color-role-admin-surface",
    interactions: 29,
    desc: "Platform oversight, ecosystem analytics, governance",
  },
] as const;

// ── Workflow edges ────────────────────────────────────────────────────
const WORKFLOW_EDGES = [
  {
    from: "pharmacy",
    to: "patient",
    label: "Inventory Sync",
    desc: "Medicine dispensed → patient inventory updated",
  },
  {
    from: "hospital",
    to: "patient",
    label: "Consent Access",
    desc: "Hospital requests patient adherence visibility",
  },
  {
    from: "lab",
    to: "hospital",
    label: "Report Upload",
    desc: "Diagnostic results delivered to clinical records",
  },
  {
    from: "patient",
    to: "hospital",
    label: "Treatment Adherence",
    desc: "Dose compliance data shared with care team",
  },
] as const;

// ── Stage phase grouping ──────────────────────────────────────────────
const PHASE_MAP: Record<string, { label: string; color: string }> = {
  PharmacySale: { label: "Intake Phase", color: "var(--color-role-pharmacy)" },
  PatientInventory: {
    label: "Intake Phase",
    color: "var(--color-role-pharmacy)",
  },
  ReminderSetup: {
    label: "Administration Phase",
    color: "var(--color-role-patient)",
  },
  DoseLogs: {
    label: "Administration Phase",
    color: "var(--color-role-patient)",
  },
  AdherenceTracking: {
    label: "Monitoring Phase",
    color: "var(--color-role-hospital)",
  },
  ExpiryMonitoring: {
    label: "Monitoring Phase",
    color: "var(--color-role-hospital)",
  },
  ReplacementReorder: {
    label: "Monitoring Phase",
    color: "var(--color-role-hospital)",
  },
};

const STAGE_ROLE_COLOR: Record<string, string> = {
  Patient: "var(--color-role-patient)",
  Pharmacy: "var(--color-role-pharmacy)",
  Hospital: "var(--color-role-hospital)",
  Lab: "var(--color-role-diagnostic)",
  Admin: "var(--color-role-admin)",
};

function formatTs(ts: bigint): string {
  const d = new Date(Number(ts));
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEventLabel(eventType: string | Record<string, unknown>): string {
  const key =
    typeof eventType === "string" ? eventType : Object.keys(eventType)[0];
  return (
    key
      ?.replace(/([A-Z])/g, " $1")
      .replace(/^\s/, "")
      .trim() ?? "Event"
  );
}

// ── RoleNode ─────────────────────────────────────────────────────────
function RoleNode({
  role,
  isActive,
}: {
  role: (typeof ROLES)[number];
  isActive: boolean;
}) {
  const Icon = role.icon;
  const roleNodeClass = `role-node-${role.id}`;
  const roleIconClass = `role-icon-bg-${role.id}`;
  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200",
        "border-l-[3px]",
        roleNodeClass,
        isActive
          ? "border-[var(--color-border-strong)] shadow-[var(--shadow-md)]"
          : "border-[var(--color-border-base)]",
      )}
      data-ocid={`workflow.role_node.${role.id}`}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          roleIconClass,
        )}
      >
        <Icon size={18} style={{ color: `oklch(var(${role.colorVar}))` }} />
      </div>
      <div className="text-center">
        <p
          className="text-xs font-bold tracking-wide"
          style={{ color: `oklch(var(${role.colorVar}))` }}
        >
          {role.label}
        </p>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 font-mono tabular-nums">
          {role.interactions} interactions
        </p>
      </div>
    </div>
  );
}

// ── WorkflowEdge row ──────────────────────────────────────────────────
function EdgeRow({
  edge,
}: {
  edge: (typeof WORKFLOW_EDGES)[number];
}) {
  const fromRole = ROLES.find((r) => r.id === edge.from);
  const toRole = ROLES.find((r) => r.id === edge.to);
  if (!fromRole || !toRole) return null;

  // Map role-pair to pre-tokenized CSS class
  const edgeLineClass = `workflow-edge-${edge.from}-${edge.to}`;
  const arrowClass = `workflow-arrow-${edge.to}`;

  return (
    <div
      className="flex items-center gap-3 py-3 border-b border-[var(--color-border-muted)] last:border-0"
      data-ocid={`workflow.edge.${edge.from}-${edge.to}`}
    >
      <div className="flex items-center gap-1.5 min-w-[110px]">
        <span
          className="text-xs font-semibold"
          style={{ color: `oklch(var(${fromRole.colorVar}))` }}
        >
          {fromRole.label}
        </span>
      </div>
      <div className="flex-1 flex items-center gap-2">
        {/* connector line */}
        <div className="flex-1 flex items-center gap-0" aria-hidden="true">
          <div className={cn("flex-1 h-px", edgeLineClass)} />
          <ArrowRight
            size={10}
            className={cn("-ml-1 flex-shrink-0", arrowClass)}
          />
        </div>
      </div>
      <div className="min-w-[80px] flex flex-col items-end">
        <span
          className="text-xs font-semibold"
          style={{ color: `oklch(var(${toRole.colorVar}))` }}
        >
          {toRole.label}
        </span>
      </div>
      <div className="min-w-[130px] text-right">
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">
          {edge.label}
        </span>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 leading-tight">
          {edge.desc}
        </p>
      </div>
    </div>
  );
}

// ── StageNode ─────────────────────────────────────────────────────────
function StageNode({
  stage,
  index,
  isLast,
  showPhaseOverlay,
}: {
  stage: {
    stageType: string;
    actorRole: string;
    status: string;
    events: Array<{
      id: string;
      eventType: string | Record<string, unknown>;
      timestamp: bigint;
      metadata?: string | null;
    }>;
  };
  index: number;
  isLast: boolean;
  showPhaseOverlay: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const roleColor =
    STAGE_ROLE_COLOR[stage.actorRole] ?? "var(--color-text-secondary)";
  const phase = PHASE_MAP[stage.stageType];
  const isComplete =
    stage.status === "Completed" || stage.status === "completed";
  const isActive =
    stage.status === "Active" ||
    stage.status === "active" ||
    stage.status === "InProgress";

  return (
    <div className="flex items-start gap-0">
      <div className="flex flex-col items-center">
        {/* node circle */}
        <div
          className={cn(
            "w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10",
            isComplete &&
              "bg-[var(--color-status-success)] border-[var(--color-status-success)]",
            isActive && "border-2 bg-[var(--color-bg-elevated)]",
            !isComplete &&
              !isActive &&
              "bg-[var(--color-bg-surface)] border-[var(--color-border-base)]",
          )}
          style={isActive ? { borderColor: roleColor } : undefined}
        >
          {isComplete ? (
            <Activity size={11} className="text-white" />
          ) : (
            <span
              className="text-[10px] font-mono font-bold"
              style={{
                color: isActive ? roleColor : "var(--color-text-muted)",
              }}
            >
              {index + 1}
            </span>
          )}
        </div>
        {/* vertical connector line */}
        {!isLast && (
          <div
            className="w-px flex-1 min-h-[24px]"
            style={{
              background: isComplete
                ? "oklch(var(--color-status-success) / 0.4)"
                : "var(--color-border-muted)",
            }}
          />
        )}
      </div>

      <div className="flex-1 ml-3 mb-4">
        {showPhaseOverlay && phase && (
          <div
            className="inline-flex items-center gap-1 text-[9px] font-bold tracking-widest uppercase mb-1.5 px-2 py-0.5 rounded border"
            style={{
              color: phase.color,
              borderColor: `${phase.color}40`,
              background: `${phase.color}10`,
            }}
          >
            <Layers size={8} />
            {phase.label}
          </div>
        )}
        <button
          type="button"
          className={cn(
            "panel-depth-2 border rounded-xl p-3 transition-all duration-200 cursor-pointer hover:border-[var(--color-border-strong)] w-full text-left",
            "border-[var(--color-border-base)]",
          )}
          style={{ borderLeftWidth: "2px", borderLeftColor: roleColor }}
          onClick={() => setExpanded((p) => !p)}
          data-ocid={`workflow.stage_node.${index + 1}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: `${roleColor}18`,
                  color: roleColor,
                  border: `1px solid ${roleColor}35`,
                }}
              >
                {stage.actorRole}
              </span>
              <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                {stage.stageType.replace(/([A-Z])/g, " $1").trim()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded font-medium",
                  isComplete &&
                    "bg-[var(--color-status-success)]/15 text-[var(--color-status-success)]",
                  isActive &&
                    "bg-[var(--color-accent-teal)]/15 text-[var(--color-accent-teal)]",
                  !isComplete &&
                    !isActive &&
                    "bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]",
                )}
              >
                {stage.status}
              </span>
              <span
                aria-hidden="true"
                className="text-[var(--color-text-muted)] transition-colors"
              >
                <ChevronDown
                  size={12}
                  className={cn(
                    "transition-transform duration-200",
                    expanded ? "rotate-0" : "-rotate-90",
                  )}
                />
              </span>
            </div>
          </div>

          {/* Event count chips */}
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[10px] text-[var(--color-text-muted)] tabular-nums">
              {stage.events.length} event{stage.events.length !== 1 ? "s" : ""}
            </span>
            {stage.events.length > 0 && (
              <span className="text-[10px] text-[var(--color-text-muted)]">
                · {formatTs(stage.events[0]?.timestamp ?? 0n)}
              </span>
            )}
          </div>
        </button>

        {/* Expanded event list */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            expanded ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0",
          )}
        >
          <div className="space-y-1.5 ml-1 pl-3 border-l border-[var(--color-border-muted)]">
            {stage.events.map((ev) => (
              <div
                key={ev.id}
                className="flex items-start gap-2 py-1.5 px-2.5 rounded-lg bg-[var(--color-bg-muted)] border border-[var(--color-border-muted)]"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: roleColor }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                    {getEventLabel(ev.eventType)}
                  </p>
                  {ev.metadata && (
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 truncate">
                      {ev.metadata}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-[var(--color-text-muted)] tabular-nums whitespace-nowrap flex-shrink-0">
                  {formatTs(ev.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────
export default function WorkflowIntelligencePage() {
  const [selectedMedicineId, setSelectedMedicineId] = useState<string | null>(
    null,
  );
  const [showPhaseOverlay, setShowPhaseOverlay] = useState(true);
  const { data: medicines, isLoading: medsLoading } = useLifecycleMedicines();
  const { data: chain, isLoading: chainLoading } =
    useWorkflowChain(selectedMedicineId);

  const selectedMed = medicines?.find((m) => m.id === selectedMedicineId);

  return (
    <div
      className="p-6 space-y-6 bg-[var(--color-bg-base)] min-h-full"
      data-ocid="workflow_intelligence.page"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--color-border-base)]">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--color-brand-primary)]"
              aria-hidden="true"
            />
            <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Workflow Intelligence
            </h1>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Healthcare ecosystem coordination, cross-role dependencies &amp;
            medicine lifecycle chains
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-[var(--color-text-muted)] border-[var(--color-border-base)] font-mono text-[10px] tracking-wider"
        >
          OPERATIONAL
        </Badge>
      </div>

      {/* ── Section 1: Ecosystem Coordination Map ── */}
      <section data-ocid="workflow.ecosystem_section">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={15} className="text-[var(--color-brand-primary)]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Ecosystem Coordination
          </h2>
          <div className="flex-1 h-px bg-[var(--color-border-muted)]" />
        </div>

        {medsLoading ? (
          <WorkflowSectionSkeleton />
        ) : (
          <>
            <div className="overflow-x-auto -mx-1 px-1 mb-5">
              <div className="flex gap-3 sm:grid sm:grid-cols-3 lg:grid-cols-5 min-w-max sm:min-w-0">
                {ROLES.map((role) => (
                  <div key={role.id} className="w-40 sm:w-auto flex-shrink-0">
                    <RoleNode role={role} isActive={false} />
                  </div>
                ))}
              </div>
            </div>

            {/* Workflow edges */}
            <div className="panel-depth-2 border border-[var(--color-border-base)] rounded-xl p-4 bg-[var(--color-bg-surface)]">
              <div className="flex items-center gap-2 mb-3">
                <Workflow
                  size={13}
                  className="text-[var(--color-text-muted)]"
                />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                  Active Workflow Dependencies
                </span>
              </div>
              <div className="divide-y divide-[var(--color-border-muted)]">
                {WORKFLOW_EDGES.map((edge) => (
                  <EdgeRow key={`${edge.from}-${edge.to}`} edge={edge} />
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── Section 2: Operational Chain Inspector ── */}
      <section data-ocid="workflow.chain_inspector_section">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={15} className="text-[var(--color-accent-teal)]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Operational Chain Inspector
          </h2>
          <div className="flex-1 h-px bg-[var(--color-border-muted)]" />
        </div>

        {medsLoading ? (
          <WorkflowSectionSkeleton />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {/* Medicine selector */}
            <div className="col-span-full lg:col-span-1">
              <div className="panel-depth-2 border border-[var(--color-border-base)] rounded-xl p-4 bg-[var(--color-bg-surface)]">
                <div className="flex items-center gap-2 mb-3">
                  <Pill size={13} className="text-[var(--color-text-muted)]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                    Select Medicine
                  </span>
                </div>

                {medsLoading ? (
                  <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-10 rounded-lg bg-[var(--color-bg-muted)] animate-pulse"
                      />
                    ))}
                  </div>
                ) : (medicines ?? []).length === 0 ? (
                  <div
                    className="text-center py-6"
                    data-ocid="workflow.medicines.empty_state"
                  >
                    <Pill
                      size={24}
                      className="text-[var(--color-text-muted)] mx-auto mb-2"
                    />
                    <p className="text-xs text-[var(--color-text-muted)]">
                      No medicines found
                    </p>
                  </div>
                ) : (
                  <div
                    className="space-y-1"
                    data-ocid="workflow.medicine_selector.list"
                  >
                    {(medicines ?? []).map((med, i) => (
                      <button
                        key={med.id}
                        type="button"
                        onClick={() =>
                          setSelectedMedicineId(
                            selectedMedicineId === med.id ? null : med.id,
                          )
                        }
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-lg border text-xs font-medium transition-all duration-150 flex items-center justify-between gap-2",
                          selectedMedicineId === med.id
                            ? "bg-[var(--color-bg-active)] border-[var(--color-brand-primary)]/60 text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]"
                            : "border-[var(--color-border-base)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-elevated)]",
                        )}
                        data-ocid={`workflow.medicine_selector.item.${i + 1}`}
                      >
                        <span className="truncate">{med.name}</span>
                        {selectedMedicineId === med.id && (
                          <ChevronRight
                            size={12}
                            className="text-[var(--color-brand-primary)] flex-shrink-0"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Phase overlay toggle */}
                {selectedMedicineId && (
                  <div className="mt-4 pt-3 border-t border-[var(--color-border-muted)]">
                    <button
                      type="button"
                      onClick={() => setShowPhaseOverlay((p) => !p)}
                      className="flex items-center gap-2 text-[10px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors w-full"
                      data-ocid="workflow.phase_overlay.toggle"
                    >
                      <Layers size={11} className="flex-shrink-0" />
                      <span className="flex-1 text-left">
                        Process phase labels
                      </span>
                      <span
                        className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wide transition-colors",
                          showPhaseOverlay
                            ? "bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)]"
                            : "bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]",
                        )}
                      >
                        {showPhaseOverlay ? "ON" : "OFF"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Chain visualization */}
            <div className="col-span-full lg:col-span-2">
              <div
                className="panel-depth-2 border border-[var(--color-border-base)] rounded-xl p-5 bg-[var(--color-bg-surface)] min-h-[260px] overflow-hidden"
                data-ocid="workflow.chain_visualization"
              >
                {!selectedMedicineId ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[220px] gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-muted)] flex items-center justify-center">
                      <Activity
                        size={20}
                        className="text-[var(--color-text-muted)]"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                        Select a medicine
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Choose a medicine to inspect its complete operational
                        workflow chain
                      </p>
                    </div>
                  </div>
                ) : chainLoading ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-[var(--color-bg-muted)] animate-pulse flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-8 rounded-lg bg-[var(--color-bg-muted)] animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (chain?.stages ?? []).length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center h-full min-h-[220px] gap-2"
                    data-ocid="workflow.chain.empty_state"
                  >
                    <Activity
                      size={24}
                      className="text-[var(--color-text-muted)]"
                    />
                    <p className="text-xs text-[var(--color-text-muted)]">
                      No workflow stages found for{" "}
                      <span className="font-semibold">{selectedMed?.name}</span>
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-[var(--color-accent-teal)]" />
                      <span className="text-xs font-bold text-[var(--color-text-primary)]">
                        {selectedMed?.name}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--color-text-muted)] ml-1">
                        <span data-metric>{chain?.stages.length}</span> stage
                        {chain?.stages.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="space-y-0">
                      {chain?.stages.map((stage, i) => (
                        <StageNode
                          key={`${stage.stageType}-${i}`}
                          stage={stage}
                          index={i}
                          isLast={i === (chain?.stages.length ?? 0) - 1}
                          showPhaseOverlay={showPhaseOverlay}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
