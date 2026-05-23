import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { SkeletonStat } from "@/components/common/SkeletonCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { WalkthroughOverlay } from "@/components/common/WalkthroughOverlay";
import { LifecycleInlinePreview } from "@/components/timeline/LifecycleInlinePreview";
import {
  MediTimeline,
  type TimelineItem,
} from "@/components/ui/timeline-component";
import { PATIENT_WALKTHROUGH_STEPS } from "@/data/walkthroughSteps";
import {
  useExpiryStats,
  useMyDoseLogs,
  useMyMedicines,
  useMyMedicinesSync,
  useMyNotifications,
  useMyReminders,
} from "@/hooks/useBackend";
import { useWalkthrough } from "@/hooks/useWalkthrough";
import { useAuthStore } from "@/store/auth";
import { getMedicineStatus } from "@/types";
import { Link } from "@tanstack/react-router";
import {
  ActivitySquare,
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle,
  FileText,
  Map as MapIcon,
  Pill,
  RefreshCw,
  Shield,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";

function getActivityIcon(type: string) {
  switch (type) {
    case "MedicineSynced":
      return <Pill size={14} className="text-[var(--color-accent-teal)]" />;
    case "ReminderMissed":
      return <Bell size={14} className="text-[var(--color-accent-amber)]" />;
    case "ReportReady":
      return (
        <FileText size={14} className="text-[var(--color-status-success)]" />
      );
    case "BookingConfirmed":
    case "BookingCompleted":
      return <Calendar size={14} className="text-[var(--color-status-info)]" />;
    case "ConsentChanged":
      return (
        <Shield size={14} className="text-[var(--color-role-diagnostic)]" />
      );
    default:
      return <Bell size={14} className="text-muted-foreground" />;
  }
}

function getActivityIconBg(type: string) {
  switch (type) {
    case "MedicineSynced":
      return "bg-[var(--color-accent-teal)]/15";
    case "ReminderMissed":
      return "bg-[var(--color-accent-amber)]/15";
    case "ReportReady":
      return "bg-[var(--color-status-success)]/15";
    case "BookingConfirmed":
    case "BookingCompleted":
      return "bg-[var(--color-status-info)]/15";
    case "ConsentChanged":
      return "bg-[var(--color-role-diagnostic)]/15";
    default:
      return "bg-muted/40";
  }
}

function relativeTime(ts: bigint): string {
  const diffMs = Date.now() - Number(ts);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function PatientDashboard() {
  const { user } = useAuthStore();
  const {
    activeStepIndex,
    isActive: walkthroughActive,
    startWalkthrough,
    nextStep,
    prevStep,
    dismissWalkthrough,
  } = useWalkthrough(PATIENT_WALKTHROUGH_STEPS, "patient");

  const { data: medicines, isLoading: medsLoading } = useMyMedicines();
  const { data: expiryStats } = useExpiryStats();
  const { data: doseLogs } = useMyDoseLogs();
  const { data: reminders } = useMyReminders();
  const { data: notifications = [] } = useMyNotifications();
  const { data: syncedMeds = [] } = useMyMedicinesSync();

  const expiringSoon = Number(expiryStats?.expiringSoon ?? 0);
  const _expired = Number(expiryStats?.expired ?? 0);
  const safe = Number(expiryStats?.safe ?? 0);
  const activeReminders = (reminders ?? []).filter((r) => r.isEnabled).length;

  const statCards = [
    {
      label: "Total Medicines",
      value: medicines?.length ?? 0,
      sub: "in your cabinet",
      icon: <Pill size={20} />,
      color: "bg-[var(--color-status-info)]/20 text-[var(--color-status-info)]",
    },
    {
      label: "Safe",
      value: safe,
      sub: "within expiry date",
      icon: <CheckCircle size={20} />,
      color:
        "bg-[var(--color-status-success)]/20 text-[var(--color-status-success)]",
    },
    {
      label: "Expiring Soon",
      value: expiringSoon,
      sub: "within 30 days",
      icon: <AlertTriangle size={20} />,
      color:
        "bg-[var(--color-accent-amber)]/20 text-[var(--color-accent-amber)]",
    },
    {
      label: "Active Reminders",
      value: activeReminders,
      sub: "scheduled today",
      icon: <Bell size={20} />,
      color:
        "bg-[var(--color-role-diagnostic)]/20 text-[var(--color-role-diagnostic)]",
    },
  ];

  const quickActions = [
    {
      label: "Add Medicine",
      icon: <Pill size={16} />,
      to: "/patient/medicines",
      gradientStyle: {
        background:
          "linear-gradient(135deg, var(--color-role-patient), var(--color-brand-primary))",
      },
    },
    {
      label: "Log Dose",
      icon: <ActivitySquare size={16} />,
      to: "/patient/doses",
      gradientStyle: {
        background:
          "linear-gradient(135deg, var(--color-accent-teal), oklch(from var(--color-role-patient) calc(l + 0.1) c h))",
      },
    },
    {
      label: "Reminders",
      icon: <Bell size={16} />,
      to: "/patient/reminders",
      gradientStyle: {
        background:
          "linear-gradient(135deg, var(--color-brand-secondary), var(--color-brand-primary))",
      },
    },
    {
      label: "Analytics",
      icon: <TrendingUp size={16} />,
      to: "/patient/analytics",
      gradientStyle: {
        background:
          "linear-gradient(135deg, var(--color-role-diagnostic), var(--color-brand-secondary))",
      },
    },
  ];

  return (
    <div className="p-6 space-y-6 bg-[var(--color-bg-base)] min-h-full">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-block w-1 h-7 rounded-full bg-[var(--color-role-patient)]"
                aria-hidden="true"
              />
              <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)]">
                Welcome back,{" "}
                <span className="text-[var(--color-role-patient)]">
                  {user?.name?.split(" ")[0]}
                </span>{" "}
                👋
              </h1>
            </div>
            <p className="text-[var(--color-text-secondary)] text-sm mt-1 pl-3">
              Here's your health overview for today.
            </p>
          </div>
          {!walkthroughActive && (
            <button
              type="button"
              onClick={() => startWalkthrough("patient")}
              data-ocid="patient.walkthrough.start_button"
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-role-patient)]/35 text-[var(--color-role-patient)] bg-[var(--color-role-patient)]/8 hover:bg-[var(--color-role-patient)]/15 hover:border-[var(--color-role-patient)]/55 transition-all duration-200"
              aria-label="Start platform tour"
            >
              <MapIcon size={12} />
              Platform Tour
            </button>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="bg-[var(--color-bg-surface)] p-4 rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {medsLoading
            ? [0, 1, 2, 3].map((i) => <SkeletonStat key={i} />)
            : statCards.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="panel-depth-2 rounded-2xl border border-l-[3px] border-l-[var(--color-role-patient)] border-[var(--color-border-base)] shadow-[var(--shadow-md)] p-5 flex items-start gap-4 hover:border-[var(--color-role-patient)]/40 transition-colors">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-[var(--color-role-patient)]/15 text-[var(--color-role-patient)]">
                      {card.icon}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="metric-value-primary font-display font-bold text-[var(--color-role-patient)]"
                        data-metric
                        style={{
                          fontSize: i === 0 ? "1.875rem" : "1.5rem",
                          lineHeight: 1.1,
                        }}
                      >
                        {card.value}
                      </p>
                      <p className="metric-label text-sm font-semibold text-[var(--color-text-secondary)] mt-0.5">
                        {card.label}
                      </p>
                      {card.sub && (
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                          {card.sub}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
        </div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="panel-depth-1 bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-border-muted)] p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <ActivitySquare
            size={15}
            className="text-[var(--color-role-patient)]"
          />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="panel-depth-2 border border-[var(--color-border-base)] hover:border-[var(--color-role-patient)]/50 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-[var(--color-bg-active)] transition-colors duration-200 group shadow-[var(--shadow-sm)]"
              data-ocid={`patient.quick_action.${action.label.toLowerCase().replace(/\s/g, "_")}`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow"
                style={action.gradientStyle}
              >
                <span className="text-white">{action.icon}</span>
              </div>
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] group-hover:text-[var(--color-role-patient)] transition-colors">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent medicines */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36 }}
      >
        <div
          className="panel-depth-2 rounded-2xl border border-l-[3px] border-l-[var(--color-role-patient)] border-[var(--color-border-base)] shadow-[var(--shadow-md)] p-5"
          data-ocid="patient.recent_medicines.card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Pill size={16} className="text-[var(--color-role-patient)]" />
              <h2 className="font-display font-bold text-[var(--color-text-primary)]">
                Recent Medicines
              </h2>
            </div>
            <Link
              to="/patient/medicines"
              className="text-xs text-[var(--color-role-patient)] hover:text-[var(--color-accent-teal)] transition-colors font-medium"
            >
              View all →
            </Link>
          </div>
          {!medicines?.length ? (
            <EmptyState
              icon={<Pill />}
              title="No medicines yet"
              description="Start tracking your medications to monitor expiry and adherence."
              action={{ label: "Add your first medicine", onClick: () => {} }}
            />
          ) : (
            <div className="space-y-2">
              {medicines.slice(0, 5).map((med, i) => (
                <div
                  key={med.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-muted)] hover:border-[var(--color-role-patient)]/40 hover:bg-[var(--color-bg-overlay)] transition-colors"
                  data-ocid={`patient.medicine.item.${i + 1}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg bg-[var(--color-role-patient)]/15 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <Pill
                        size={14}
                        className="text-[var(--color-role-patient)]"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {med.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        {med.dosage} · {med.frequency}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={getMedicineStatus(med.expiryDate)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Medicine Lifecycle Inline Preview */}
      {(medicines?.length ?? 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.37 }}
        >
          <div
            className="panel-depth-2 rounded-2xl border border-l-[3px] border-l-[var(--color-role-patient)] border-[var(--color-border-base)] shadow-[var(--shadow-md)] p-5"
            data-ocid="patient.lifecycle_preview.card"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-1 h-4 rounded-full bg-[var(--color-role-patient)]"
                  aria-hidden="true"
                />
                <h2 className="font-display font-bold text-[var(--color-text-primary)]">
                  Medicine Lifecycle
                </h2>
              </div>
            </div>
            <LifecycleInlinePreview
              medicineId={medicines?.[0]?.id ?? ""}
              medicineName={medicines?.[0]?.name}
            />
          </div>
        </motion.div>
      )}

      {/* Medicine History Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38 }}
      >
        {(() => {
          const medicineTimelineItems: TimelineItem[] = [
            {
              id: "1",
              title: "Prescription Received",
              description:
                "Dr. Priya Mehra prescribed Metformin ER 500mg — dosage schedule confirmed",
              timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              status: "completed",
            },
            {
              id: "2",
              title: "Medicine Dispensed",
              description:
                "Lisinopril 10mg dispensed by Chennai Pharma — patient sync updated",
              timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
              status: "completed",
            },
            {
              id: "3",
              title: "First Dose Taken",
              description: "Morning dose confirmed via reminder",
              timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
              status: "completed",
            },
            {
              id: "4",
              title: "Reminder Sent",
              description: "Browser notification for evening dose",
              timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
              status: "active",
            },
            {
              id: "5",
              title: "Next Dose Scheduled",
              description: "Tomorrow morning 8:00 AM",
              status: "pending",
            },
          ];
          return (
            <div
              className="panel-depth-2 border border-[var(--color-border-base)] shadow-[var(--shadow-md)] p-6 rounded-2xl"
              data-ocid="patient.medicine_history.card"
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-1 h-5 rounded-full bg-[var(--color-role-patient)]"
                  aria-hidden="true"
                />
                <h3 className="font-display text-lg font-semibold text-[var(--color-text-primary)]">
                  Medicine History
                </h3>
              </div>
              <MediTimeline items={medicineTimelineItems} variant="compact" />
            </div>
          );
        })()}
      </motion.div>

      {/* Sync History */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42 }}
      >
        <div
          className="panel-depth-2 rounded-2xl border border-[var(--color-border-base)] shadow-[var(--shadow-md)] p-5"
          data-ocid="patient.sync_history.card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RefreshCw
                size={16}
                className="text-[var(--color-role-patient)]"
              />
              <h2 className="font-display font-bold text-[var(--color-text-primary)]">
                Pharmacy Sync
              </h2>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-role-patient)]/15 text-[var(--color-role-patient)] border border-[var(--color-role-patient)]/30 font-semibold">
              {syncedMeds.length} synced
            </span>
          </div>
          {syncedMeds.length === 0 ? (
            <p className="text-sm text-[var(--color-text-tertiary)] text-center py-4">
              No medicines synced from pharmacies yet.
            </p>
          ) : (
            <div className="space-y-2">
              {syncedMeds.slice(0, 3).map((med, i) => (
                <div
                  key={med.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-muted)] hover:border-[var(--color-role-patient)]/35 transition-colors"
                  data-ocid={`patient.sync_history.item.${i + 1}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[var(--color-role-patient)]/15 flex items-center justify-center">
                      <Pill
                        size={13}
                        className="text-[var(--color-role-patient)]"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                        {med.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        {med.sourcePharmacy}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {new Date(
                        Number(med.purchaseTimestamp),
                      ).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-[var(--color-role-patient)] font-semibold">
                      Qty: {String(med.batchNumber)}
                    </p>
                  </div>
                </div>
              ))}
              {syncedMeds.length > 3 && (
                <p className="text-xs text-[var(--color-text-muted)] text-center pt-1">
                  +{syncedMeds.length - 3} more synced medicines
                </p>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Activity Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div
          className="panel-depth-2 rounded-2xl border border-[var(--color-border-base)] shadow-[var(--shadow-md)] p-5"
          data-ocid="patient.activity_timeline.card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ActivitySquare
                size={16}
                className="text-[var(--color-role-patient)]"
              />
              <h2 className="font-display font-bold text-[var(--color-text-primary)]">
                Activity Timeline
              </h2>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-role-patient)]/15 text-[var(--color-role-patient)] border border-[var(--color-role-patient)]/30 font-semibold">
              Live
            </span>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-[var(--color-text-tertiary)] text-center py-4">
              No recent activity. Your ecosystem events will appear here.
            </p>
          ) : (
            <div className="space-y-1">
              {notifications.slice(0, 7).map((notif, i) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                    notif.isRead
                      ? "bg-[var(--color-bg-surface)]"
                      : "bg-[var(--color-role-patient)]/5 border border-[var(--color-role-patient)]/20"
                  }`}
                  data-ocid={`patient.activity_timeline.item.${i + 1}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${getActivityIconBg(notif.notifType)}`}
                  >
                    {getActivityIcon(notif.notifType)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm leading-snug ${
                        notif.isRead
                          ? "text-[var(--color-text-secondary)]"
                          : "text-[var(--color-text-primary)]"
                      }`}
                    >
                      {notif.message}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap flex-shrink-0">
                    {relativeTime(notif.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Recent dose logs */}
      {(doseLogs?.length ?? 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44 }}
        >
          <div className="panel-depth-2 rounded-2xl border border-l-[3px] border-l-[var(--color-role-patient)] border-[var(--color-border-base)] shadow-[var(--shadow-md)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <ActivitySquare
                size={16}
                className="text-[var(--color-role-patient)]"
              />
              <h2 className="font-display font-bold text-[var(--color-text-primary)]">
                Recent Dose Activity
              </h2>
            </div>
            <div className="overflow-x-auto">
              <div className="space-y-2 min-w-[320px]">
                {doseLogs!.slice(0, 4).map((log, i) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-muted)]"
                    data-ocid={`patient.doselog.item.${i + 1}`}
                  >
                    <div className="flex items-center gap-2">
                      <ActivitySquare
                        size={14}
                        className={
                          log.isOnTime
                            ? "text-[var(--color-status-success)]"
                            : "text-[var(--color-accent-amber)]"
                        }
                      />
                      <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                        Medicine ID: {log.medicineId.slice(0, 8)}…
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        log.isOnTime
                          ? "text-[var(--color-status-success)]"
                          : "text-[var(--color-accent-amber)]"
                      }`}
                    >
                      {log.isOnTime ? "On Time" : "Late"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
      <WalkthroughOverlay
        steps={PATIENT_WALKTHROUGH_STEPS}
        currentStepIndex={activeStepIndex}
        isActive={walkthroughActive}
        onNext={nextStep}
        onPrev={prevStep}
        onDismiss={dismissWalkthrough}
      />
    </div>
  );
}
