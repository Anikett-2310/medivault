import { ComingSoonCard } from "@/components/common/ComingSoonModal";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { useAppointments, useConsentedPatients } from "@/hooks/useBackend";
import { cn } from "@/lib/utils";
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  ShieldCheck,
  Stethoscope,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { Suspense } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const GLASS = "bg-card backdrop-blur-md border border-border rounded-xl";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function HospitalAnalyticsPage() {
  const { data: appointments, isLoading } = useAppointments();
  const { data: consentedPatients } = useConsentedPatients();

  const consentStats = {
    total: consentedPatients?.length ?? 0,
    adherenceSharing:
      consentedPatients?.filter((c) => c.consent.adherenceSharing).length ?? 0,
    prescriptionSharing:
      consentedPatients?.filter((c) => c.consent.prescriptionSharing).length ??
      0,
    diagnosticAccess:
      consentedPatients?.filter((c) => c.consent.diagnosticAccess).length ?? 0,
  };

  const total = appointments?.length ?? 0;
  const scheduled =
    appointments?.filter(
      (a) => a.status === "Scheduled" || a.status === "Pending",
    ).length ?? 0;
  const completed =
    appointments?.filter((a) => a.status === "Completed").length ?? 0;
  const cancelled =
    appointments?.filter((a) => a.status === "Cancelled").length ?? 0;

  const pieData = [
    { name: "Scheduled", value: scheduled, color: "var(--color-chart-1)" },
    { name: "Completed", value: completed, color: "var(--color-chart-2)" },
    { name: "Cancelled", value: cancelled, color: "var(--color-chart-3)" },
  ].filter((d) => d.value > 0);

  const barData = DAYS.map((day) => ({
    day,
    count:
      appointments?.filter(
        (a) => DAYS[new Date(Number(a.dateTime)).getDay()] === day,
      ).length ?? 0,
  }));

  const stats = [
    {
      label: "Total",
      value: total,
      icon: <Calendar size={18} />,
      color:
        "bg-[color-mix(in_oklch,var(--color-role-diagnostic)_15%,transparent)] text-[var(--color-role-diagnostic)]",
    },
    {
      label: "Scheduled",
      value: scheduled,
      icon: <Clock size={18} />,
      color: "bg-primary/15 text-primary",
    },
    {
      label: "Completed",
      value: completed,
      icon: <CheckCircle2 size={18} />,
      color:
        "bg-[color-mix(in_oklch,var(--color-status-success)_15%,transparent)] text-[var(--color-status-success)]",
    },
    {
      label: "Cancelled",
      value: cancelled,
      icon: <XCircle size={18} />,
      color:
        "bg-[color-mix(in_oklch,var(--color-status-danger)_15%,transparent)] text-[var(--color-status-danger)]",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-2xl font-bold text-foreground">
          Hospital Analytics
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Appointment trends and distribution
        </p>
      </motion.div>

      {isLoading ? (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <SkeletonCard key={n} lines={1} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((n) => (
              <SkeletonCard
                key={n}
                lines={4}
                showIcon={false}
                className="h-72"
              />
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Stats cards */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 xl:grid-cols-4 gap-4"
          >
            {stats.map((s) => (
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
                  <p className="text-2xl font-display font-bold text-foreground">
                    {s.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie chart */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(GLASS, "p-5")}
            >
              <h2 className="gradient-text text-sm font-bold uppercase tracking-wider mb-4">
                Appointments by Status
              </h2>
              {pieData.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-12">
                  No appointment data yet.
                </p>
              ) : (
                <Suspense
                  fallback={
                    <div
                      className="h-64 animate-pulse rounded-xl"
                      style={{ background: "var(--color-surface)" }}
                    />
                  }
                >
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-surface-card)",
                          border: "1px solid var(--color-border-subtle)",
                          borderRadius: "8px",
                          color: "var(--color-text-primary)",
                        }}
                      />
                      <Legend
                        formatter={(value) => (
                          <span
                            style={{
                              color: "var(--color-text-muted)",
                              fontSize: 12,
                            }}
                          >
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Suspense>
              )}
            </motion.div>

            {/* Bar chart */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className={cn(GLASS, "p-5")}
            >
              <h2 className="gradient-text text-sm font-bold uppercase tracking-wider mb-4">
                Appointments by Day of Week
              </h2>
              <Suspense
                fallback={
                  <div
                    className="h-64 animate-pulse rounded-xl"
                    style={{ background: "var(--color-surface)" }}
                  />
                }
              >
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barData} barSize={24}>
                    <XAxis
                      dataKey="day"
                      tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-surface-card)",
                        border: "1px solid var(--color-border-subtle)",
                        borderRadius: "8px",
                        color: "var(--color-text-primary)",
                      }}
                      cursor={{
                        fill: "color-mix(in oklch, var(--color-text-muted) 12%, transparent)",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="var(--color-chart-1)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Suspense>
            </motion.div>
          </div>

          {/* Consent Coverage card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className={cn(GLASS, "p-5")}
            data-ocid="hospital.consent_coverage_card"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="gradient-text font-bold font-display">
                  Ecosystem Analytics
                </h2>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[color-mix(in_srgb,var(--color-status-success)_15%,transparent)] text-[var(--color-status-success)] border border-[var(--color-status-success)]/30">
                  <Zap size={9} /> Live Data
                </span>
              </div>
              <ShieldCheck size={16} className="text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Consent Coverage — patients who have granted data-sharing access
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Consented Patients",
                  value: consentStats.total,
                  icon: <Users size={16} />,
                  color: "bg-primary/15 text-primary",
                },
                {
                  label: "Adherence Sharing",
                  value: consentStats.adherenceSharing,
                  icon: <Activity size={16} />,
                  color: "bg-primary/15 text-primary",
                },
                {
                  label: "Prescription Sharing",
                  value: consentStats.prescriptionSharing,
                  icon: <FileText size={16} />,
                  color:
                    "bg-[color-mix(in_srgb,var(--color-role-diagnostic)_15%,transparent)] text-[var(--color-role-diagnostic)]",
                },
                {
                  label: "Diagnostic Access",
                  value: consentStats.diagnosticAccess,
                  icon: <ShieldCheck size={16} />,
                  color:
                    "bg-[color-mix(in_srgb,var(--color-status-success)_15%,transparent)] text-[var(--color-status-success)]",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className={cn(GLASS, "p-3 flex items-center gap-2")}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      s.color,
                    )}
                  >
                    {s.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-display font-bold text-foreground">
                      {s.value}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {s.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Coming Soon */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <ComingSoonCard
              title="AI Diagnosis Assist"
              description="AI-powered diagnostic suggestions based on patient medicine history — pattern recognition, interaction warnings, and treatment adherence insights."
              badge="Q3 2025"
              icon={<Stethoscope className="w-5 h-5" />}
            />
          </motion.div>
        </>
      )}
    </div>
  );
}
