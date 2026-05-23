import { SkeletonStat } from "@/components/common/SkeletonCard";
import { WalkthroughOverlay } from "@/components/common/WalkthroughOverlay";
import { LAB_WALKTHROUGH_STEPS } from "@/data/walkthroughSteps";
import { useLabReports } from "@/hooks/useBackend";
import { useWalkthrough } from "@/hooks/useWalkthrough";
import { useAuthStore } from "@/store/auth";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  FileText,
  FlaskConical,
  Map as MapIcon,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";

export default function LabDashboard() {
  const { user } = useAuthStore();
  const {
    activeStepIndex,
    isActive: walkthroughActive,
    startWalkthrough,
    nextStep,
    prevStep,
    dismissWalkthrough,
  } = useWalkthrough(LAB_WALKTHROUGH_STEPS, "diagnostic");
  const { data: reports, isLoading } = useLabReports();

  const recentTypes = [
    ...new Set((reports ?? []).map((r) => r.reportType)),
  ].slice(0, 3);

  return (
    <div
      className="p-6 space-y-6 bg-[var(--color-bg-base)] min-h-full"
      data-ocid="dashboard.section"
    >
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-role-diagnostic)]/15 border border-[var(--color-role-diagnostic)]/30 flex items-center justify-center flex-shrink-0">
              <FlaskConical
                size={20}
                className="text-[var(--color-role-diagnostic)]"
              />
            </div>
            <div>
              <h1 className="heading-operational text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <span className="text-[var(--color-role-diagnostic)]">
                  Laboratory
                </span>{" "}
                <span className="text-[var(--color-text-primary)]">
                  Dashboard
                </span>
              </h1>
              <p className="text-[var(--color-text-secondary)] text-sm mt-0.5">
                Welcome back,{" "}
                <span className="text-[var(--color-role-diagnostic)] font-semibold">
                  {user?.name}
                </span>
                {" · "}
                <span className="text-[var(--color-text-tertiary)]">
                  Lab &amp; Diagnostics
                </span>
              </p>
              <p className="text-[var(--color-role-diagnostic)]/70 text-xs mt-1.5 font-medium">
                <span
                  className="text-[var(--color-role-diagnostic)] font-bold"
                  data-metric
                >
                  {reports?.length ?? 0}
                </span>{" "}
                diagnostic reports on record ·{" "}
                <span
                  className="text-[var(--color-role-diagnostic)] font-bold"
                  data-metric
                >
                  {
                    (reports ?? []).filter((r) => {
                      const d = new Date(Number(r.uploadDate));
                      const n = new Date();
                      return d.toDateString() === n.toDateString();
                    }).length
                  }
                </span>{" "}
                uploaded today
              </p>
            </div>
          </div>
          {!walkthroughActive && (
            <button
              type="button"
              onClick={() => startWalkthrough("diagnostic")}
              data-ocid="lab.walkthrough.start_button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-role-diagnostic)]/35 text-[var(--color-role-diagnostic)] bg-[var(--color-role-diagnostic)]/8 hover:bg-[var(--color-role-diagnostic)]/15 hover:border-[var(--color-role-diagnostic)]/55 transition-all duration-200"
              aria-label="Start lab platform tour"
            >
              <MapIcon size={12} />
              Platform Tour
            </button>
          )}
        </div>
      </motion.div>

      <div className="bg-[var(--color-bg-surface)] p-4 rounded-lg">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <SkeletonStat key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                label: "Total Reports",
                value: reports?.length ?? 0,
                icon: <FileText size={20} />,
                iconBg:
                  "bg-[var(--color-role-diagnostic)]/15 border border-[var(--color-role-diagnostic)]/30",
                iconColor: "text-[var(--color-role-diagnostic)]",
                primary: true,
              },
              {
                label: "Report Types",
                value: recentTypes.length,
                icon: <FlaskConical size={20} />,
                iconBg:
                  "bg-[var(--color-role-diagnostic)]/10 border border-[var(--color-role-diagnostic)]/20",
                iconColor: "text-[var(--color-role-diagnostic)]",
                primary: false,
              },
              {
                label: "Today's Activity",
                value: (reports ?? []).filter((r) => {
                  const d = new Date(Number(r.uploadDate));
                  const n = new Date();
                  return d.toDateString() === n.toDateString();
                }).length,
                icon: <Activity size={20} />,
                iconBg:
                  "bg-[var(--color-role-diagnostic)]/10 border border-[var(--color-role-diagnostic)]/20",
                iconColor: "text-[var(--color-role-diagnostic)]",
                primary: false,
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="panel-depth-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-base)] shadow-[var(--shadow-card,var(--shadow-sm))] border-l-4 border-l-[var(--color-role-diagnostic)] p-5 rounded-xl flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.iconBg} ${stat.iconColor}`}
                  >
                    {stat.icon}
                  </div>
                  <div>
                    <p
                      className={`metric-value-primary text-2xl font-display font-bold ${stat.primary ? "text-[var(--color-role-diagnostic)]" : "text-[var(--color-text-primary)]"} tabular-nums`}
                      data-metric
                    >
                      {stat.value}
                    </p>
                    <p className="metric-label text-sm text-[var(--color-text-secondary)] mt-0.5 font-medium">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        data-ocid="reports.list"
      >
        <div className="panel-depth-3 bg-[var(--color-bg-surface)] border border-[var(--color-border-base)] border-t-[2px] border-t-[var(--color-role-diagnostic)]/40 shadow-[var(--shadow-md)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-[var(--color-role-diagnostic)]" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                Recent Reports
              </h2>
            </div>
            <Link
              to="/lab/reports"
              data-ocid="lab.reports.link"
              className="text-xs text-[var(--color-role-diagnostic)] hover:text-[var(--color-role-diagnostic)]/80 font-medium transition-colors"
            >
              View all →
            </Link>
          </div>
          {!reports?.length ? (
            <div
              className="text-center py-8"
              data-ocid="lab.reports.empty_state"
              data-ocid-alt="upload.section"
            >
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-role-diagnostic)]/10 border border-[var(--color-role-diagnostic)]/20 flex items-center justify-center mx-auto mb-3">
                <Upload
                  size={24}
                  className="text-[var(--color-role-diagnostic)]"
                />
              </div>
              <p className="text-[var(--color-text-secondary)] text-sm font-medium">
                No reports yet.
              </p>
              <p className="text-[var(--color-text-tertiary)] text-xs mt-1">
                Upload your first diagnostic report to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="space-y-2 min-w-[380px]">
                {reports.slice(0, 5).map((r, i) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-base)] border-l-[3px] border-l-[var(--color-role-diagnostic)]/30 hover:border-l-[var(--color-role-diagnostic)] hover:border-[var(--color-role-diagnostic)]/40 hover:bg-[var(--color-bg-active)] transition-colors"
                    data-ocid={`lab.report.item.${i + 1}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[var(--color-role-diagnostic)] flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold font-mono text-[var(--color-text-primary)]">
                          {r.reportType}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                          Patient: {r.patientId.slice(0, 8)}… ·{" "}
                          {new Date(Number(r.uploadDate)).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={r.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--color-role-diagnostic)] hover:text-[var(--color-role-diagnostic)]/80 font-medium transition-colors"
                    >
                      View →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
      {/* Upload workflow section marker — targeted by lab-upload walkthrough step */}
      <div data-ocid="upload.section" className="hidden" aria-hidden="true" />

      {/* Cross-role coordination section marker */}
      <div
        data-ocid="coordination.section"
        className="hidden"
        aria-hidden="true"
      />

      {/* Audit section marker */}
      <div data-ocid="audit.section" className="hidden" aria-hidden="true" />

      <WalkthroughOverlay
        steps={LAB_WALKTHROUGH_STEPS}
        isActive={walkthroughActive}
        currentStepIndex={activeStepIndex}
        onNext={nextStep}
        onPrev={prevStep}
        onDismiss={dismissWalkthrough}
      />
    </div>
  );
}
