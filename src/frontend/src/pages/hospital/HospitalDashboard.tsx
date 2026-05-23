import { SkeletonStat } from "@/components/common/SkeletonCard";
import { WalkthroughOverlay } from "@/components/common/WalkthroughOverlay";
import { HOSPITAL_WALKTHROUGH_STEPS } from "@/data/walkthroughSteps";
import { useAllUsers, useAppointments } from "@/hooks/useBackend";
import { useWalkthrough } from "@/hooks/useWalkthrough";
import { useAuthStore } from "@/store/auth";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  Calendar,
  ClipboardList,
  Map as MapIcon,
  Users,
} from "lucide-react";
import { motion } from "motion/react";

export default function HospitalDashboard() {
  const { user } = useAuthStore();
  const { data: appointments, isLoading } = useAppointments();
  const { data: allUsers } = useAllUsers();

  const {
    activeStepIndex,
    isActive: walkthroughActive,
    startWalkthrough,
    nextStep,
    prevStep,
    dismissWalkthrough,
  } = useWalkthrough(HOSPITAL_WALKTHROUGH_STEPS, "hospital");

  const patients = (allUsers ?? []).filter(
    (u) => (u.role as string) === "Patient",
  );
  const upcoming = (appointments ?? []).filter(
    (a) => a.status === "Scheduled" || a.status === "Pending",
  ).length;

  return (
    <div
      className="p-6 space-y-6 bg-[var(--color-bg-base)] min-h-full"
      data-ocid="dashboard.section"
    >
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full bg-[var(--color-role-hospital)]" />
            <div>
              <h1 className="heading-operational text-2xl text-[var(--color-text-primary)]">
                <span className="text-[var(--color-role-hospital)] font-bold">
                  Hospital
                </span>{" "}
                <span>Dashboard</span>
              </h1>
              <p className="text-[var(--color-text-secondary)] text-sm mt-0.5">
                Welcome back,{" "}
                <span className="text-[var(--color-text-primary)] font-semibold">
                  {user?.name}
                </span>
                {" · "}
                <span className="text-[var(--color-role-hospital)] text-xs font-medium uppercase tracking-wider">
                  Clinical Operations
                </span>
              </p>
              <p className="text-[var(--color-role-hospital)]/70 text-xs mt-1.5 font-medium">
                Coordinating care for{" "}
                <span
                  className="text-[var(--color-role-hospital)] font-bold"
                  data-metric
                >
                  {patients.length}
                </span>{" "}
                {patients.length === 1 ? "patient" : "patients"} ·{" "}
                <span
                  className="text-[var(--color-role-hospital)] font-bold"
                  data-metric
                >
                  {upcoming}
                </span>{" "}
                upcoming appointments
              </p>
            </div>
          </div>
          {!walkthroughActive && (
            <button
              type="button"
              onClick={() => startWalkthrough("hospital")}
              data-ocid="hospital.walkthrough.start_button"
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-role-hospital)]/35 text-[var(--color-role-hospital)] bg-[var(--color-role-hospital)]/8 hover:bg-[var(--color-role-hospital)]/15 hover:border-[var(--color-role-hospital)]/55 transition-all duration-200"
              aria-label="Start hospital platform tour"
            >
              <MapIcon size={12} />
              Platform Tour
            </button>
          )}
        </div>
      </motion.div>

      <div
        className="bg-[var(--color-bg-surface)] p-4 rounded-xl"
        data-ocid="patients.list"
      >
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <SkeletonStat key={n} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total Patients",
                value: patients.length,
                icon: <Users size={20} />,
                iconBg: "bg-[var(--color-role-hospital)]/15",
                iconColor: "text-[var(--color-role-hospital)]",
                accent: true,
              },
              {
                label: "Appointments",
                value: appointments?.length ?? 0,
                icon: <Calendar size={20} />,
                iconBg: "bg-[var(--color-role-hospital)]/12",
                iconColor: "text-[var(--color-role-hospital)]",
                accent: true,
              },
              {
                label: "Upcoming",
                value: upcoming,
                icon: <Activity size={20} />,
                iconBg: "bg-[var(--color-role-hospital)]/12",
                iconColor: "text-[var(--color-role-hospital)]",
                accent: true,
              },
              {
                label: "Prescriptions",
                value: (appointments ?? [])
                  .filter(
                    (a) => a.status === "Completed" || a.status === "Confirmed",
                  )
                  .length.toString(),
                icon: <ClipboardList size={20} />,
                iconBg: "bg-[var(--color-role-hospital)]/12",
                iconColor: "text-[var(--color-role-hospital)]",
                accent: true,
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div
                  className="panel-depth-2 border border-[var(--color-border-base)] border-l-4 border-l-[var(--color-role-hospital)] shadow-[var(--shadow-base)] p-5 rounded-xl flex items-start gap-4"
                  data-ocid={`hospital.stat.item.${i + 1}`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.iconBg} ${stat.iconColor}`}
                  >
                    {stat.icon}
                  </div>
                  <div>
                    <p
                      className="metric-value-primary text-2xl font-display font-bold text-[var(--color-role-hospital)] tabular-nums"
                      data-metric
                    >
                      {stat.value}
                    </p>
                    <p className="metric-label text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mt-0.5">
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
        transition={{ delay: 0.25 }}
        data-ocid="hospital-appointments-section"
      >
        <div className="panel-depth-1 rounded-xl border border-[var(--color-border-muted)] border-t-[2px] border-t-[var(--color-role-hospital)]/40 overflow-hidden">
          {/* Section header with clinical blue accent */}
          <div className="panel-depth-2 flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-base)]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--color-role-hospital)] opacity-80" />
              <h2 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Recent Appointments
              </h2>
            </div>
            <Link
              to="/hospital/appointments"
              className="text-xs text-[var(--color-role-hospital)] hover:opacity-75 transition-opacity font-medium"
              data-ocid="hospital.appointments.view_all_link"
            >
              View all →
            </Link>
          </div>

          {!appointments?.length ? (
            <div
              className="text-[var(--color-text-tertiary)] text-sm text-center py-10"
              data-ocid="hospital.appointments.empty_state"
            >
              No appointments recorded.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="divide-y divide-[var(--color-border-subtle)] min-w-[400px]">
                {appointments.slice(0, 5).map((apt, i) => (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.07 }}
                    className="flex items-center justify-between px-5 py-3 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-overlay)] transition-colors border-l-[2px] border-l-transparent hover:border-l-[var(--color-role-hospital)]"
                    data-ocid={`hospital.appointment.item.${i + 1}`}
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {apt.patientName}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                        {new Date(Number(apt.dateTime)).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        apt.status === "Completed"
                          ? "bg-[var(--color-status-success)]/15 text-[var(--color-status-success)] border-[var(--color-status-success)]/30"
                          : apt.status === "Cancelled"
                            ? "bg-[var(--color-status-danger)]/15 text-[var(--color-status-danger)] border-[var(--color-status-danger)]/30"
                            : "bg-[var(--color-role-hospital)]/15 text-[var(--color-role-hospital)] border-[var(--color-role-hospital)]/35"
                      }`}
                    >
                      {apt.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
      <WalkthroughOverlay
        steps={HOSPITAL_WALKTHROUGH_STEPS}
        currentStepIndex={activeStepIndex}
        isActive={walkthroughActive}
        onNext={nextStep}
        onPrev={prevStep}
        onDismiss={dismissWalkthrough}
      />
    </div>
  );
}
