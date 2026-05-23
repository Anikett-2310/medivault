import { BookingStatus } from "@/backend";
import { ComingSoonCard } from "@/components/common/ComingSoonModal";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { useLabDiagnosticBookings, useLabReports } from "@/hooks/useBackend";
import { cn } from "@/lib/utils";
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  FlaskConical,
  Microscope,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { Suspense, useMemo } from "react";
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

const GLASS =
  "bg-[var(--color-bg-elevated)] backdrop-blur-sm border border-[var(--color-border-base)] rounded-xl";

const TYPE_COLORS: Record<string, string> = {
  Diagnostic: "oklch(0.65 0.22 185)",
  "Blood Test": "oklch(0.52 0.26 15)",
  "X-Ray": "oklch(0.58 0.24 245)",
  MRI: "oklch(0.58 0.26 295)",
  Other: "oklch(0.55 0.008 245)",
};

export default function LabAnalyticsPage() {
  const { data: reports, isLoading } = useLabReports();
  const { data: bookings } = useLabDiagnosticBookings();

  const bookingStats = {
    total: bookings?.length ?? 0,
    booked:
      bookings?.filter((b) => b.status === BookingStatus.Booked).length ?? 0,
    inProgress:
      bookings?.filter(
        (b) =>
          b.status === BookingStatus.InProgress ||
          b.status === BookingStatus.Confirmed,
      ).length ?? 0,
    completed:
      bookings?.filter(
        (b) =>
          b.status === BookingStatus.Completed ||
          b.status === BookingStatus.ReportUploaded,
      ).length ?? 0,
  };

  const total = reports?.length ?? 0;

  const thisMonth = useMemo(() => {
    const now = new Date();
    return (
      reports?.filter((r) => {
        const d = new Date(Number(r.uploadDate));
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }).length ?? 0
    );
  }, [reports]);

  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of reports ?? []) {
      counts[r.reportType] = (counts[r.reportType] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [reports]);

  const mostCommon = useMemo(() => {
    if (pieData.length === 0) return "—";
    return pieData.reduce((a, b) => (a.value >= b.value ? a : b)).name;
  }, [pieData]);

  const weeklyData = useMemo(() => {
    const now = Date.now();
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const start = now - (7 - i) * 7 * 24 * 60 * 60 * 1000;
      const end = start + 7 * 24 * 60 * 60 * 1000;
      const count =
        reports?.filter((r) => {
          const ts = Number(r.uploadDate);
          return ts >= start && ts < end;
        }).length ?? 0;
      const d = new Date(start);
      return {
        week: `W${i + 1}`,
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        count,
      };
    });
    return weeks;
  }, [reports]);

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-bold">
          Lab Analytics <span className="gradient-text">📈</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Report upload trends and distribution
        </p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} lines={1} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonCard lines={6} />
            <SkeletonCard lines={6} />
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {[
              {
                label: "Total Uploads",
                value: total,
                icon: <FileText size={18} />,
                color: "badge-teal",
              },
              {
                label: "This Month",
                value: thisMonth,
                icon: <TrendingUp size={18} />,
                color: "bg-primary/15 text-primary",
              },
              {
                label: "Most Common Type",
                value: mostCommon,
                icon: <Award size={18} />,
                color: "badge-purple",
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
                  <p className="text-xl font-display font-bold text-foreground truncate">
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
              <h2 className="font-display font-bold mb-1">
                <span className="gradient-text">Reports by Type</span>
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Distribution across all report categories
              </p>
              {pieData.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-12">
                  No data yet.
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
                          <Cell
                            key={entry.name}
                            fill={
                              TYPE_COLORS[entry.name] ?? "oklch(0.50 0.008 245)"
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-bg-elevated)",
                          border: "1px solid var(--color-border-base)",
                          borderRadius: 10,
                          color: "var(--color-text-primary)",
                        }}
                      />
                      <Legend
                        formatter={(value) => (
                          <span
                            style={{
                              color: "var(--color-text-secondary)",
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

            {/* Weekly bar */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className={cn(GLASS, "p-5")}
            >
              <h2 className="font-display font-bold mb-1">
                <span className="gradient-text">Upload Trend</span>
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Report uploads over the last 8 weeks
              </p>
              <Suspense
                fallback={
                  <div
                    className="h-64 animate-pulse rounded-xl"
                    style={{ background: "var(--color-surface)" }}
                  />
                }
              >
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={weeklyData} barSize={22}>
                    <XAxis
                      dataKey="date"
                      tick={{
                        fill: "var(--color-text-secondary)",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{
                        fill: "var(--color-text-secondary)",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-bg-elevated)",
                        border: "1px solid var(--color-border-base)",
                        borderRadius: "8px",
                        color: "var(--color-text-primary)",
                      }}
                      cursor={{ fill: "var(--color-bg-muted)" }}
                    />
                    <Bar
                      dataKey="count"
                      fill="var(--color-role-diagnostic)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Suspense>
            </motion.div>
          </div>

          {/* Booking Statistics card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className={cn(GLASS, "p-5")}
            data-ocid="lab.booking_stats_card"
          >
            <div className="flex items-center gap-2 mb-4">
              <h2 className="gradient-text font-bold font-display">
                Ecosystem Analytics
              </h2>
              <span className="badge-success flex items-center gap-1">
                <Zap size={9} /> Live Data
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Diagnostic Booking Statistics — real-time booking pipeline
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Total Bookings",
                  value: bookingStats.total,
                  icon: <FlaskConical size={16} />,
                  color: "badge-teal",
                },
                {
                  label: "Pending",
                  value: bookingStats.booked,
                  icon: <Clock size={16} />,
                  color: "badge-info",
                },
                {
                  label: "In Progress",
                  value: bookingStats.inProgress,
                  icon: <Calendar size={16} />,
                  color: "badge-warning",
                },
                {
                  label: "Completed",
                  value: bookingStats.completed,
                  icon: <CheckCircle2 size={16} />,
                  color: "badge-success",
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
            transition={{ delay: 0.4 }}
          >
            <ComingSoonCard
              title="AI Diagnostic Interpretation"
              description="Automated analysis of diagnostic reports with AI-powered insights and natural language summaries."
              badge="Q4 2025"
              icon={<Microscope size={18} />}
            />
          </motion.div>
        </>
      )}
    </div>
  );
}
