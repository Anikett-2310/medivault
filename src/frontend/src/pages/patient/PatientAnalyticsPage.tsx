import {
  ComingSoonCard,
  ComingSoonModal,
} from "@/components/common/ComingSoonModal";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdherenceScore,
  useMyDoseLogs,
  useMyMedicines,
  useMyReminders,
} from "@/hooks/useBackend";
import { getMedicineStatus } from "@/types";
import {
  Activity,
  AlertTriangle,
  Bell,
  Brain,
  CheckCircle2,
  PillIcon,
  Zap,
} from "lucide-react";
import { Suspense, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_COLORS = [
  "oklch(0.65 0.22 185)",
  "oklch(0.55 0.22 245)",
  "oklch(0.55 0.20 145)",
  "oklch(0.72 0.22 75)",
  "oklch(0.52 0.26 295)",
  "oklch(0.52 0.26 15)",
];
const TOOLTIP_STYLE = {
  backgroundColor: "oklch(0.16 0.008 245)",
  border: "1px solid oklch(0.25 0.012 245)",
  borderRadius: "8px",
  color: "oklch(0.96 0.005 240)",
  fontSize: "12px",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function PatientAnalyticsPage() {
  const { data: medicines = [], isLoading: medsLoading } = useMyMedicines();
  const { data: doseLogs = [], isLoading: logsLoading } = useMyDoseLogs();
  const { data: reminders = [] } = useMyReminders();
  // Use a known medicine id for overall score, or empty for all
  const firstMedId = medicines[0]?.id ?? "";
  const { data: adherenceScore = 0 } = useAdherenceScore(firstMedId);

  const loading = medsLoading || logsLoading;

  // ── Derived data ─────────────────────────────────────────────────────────
  const safeCount = medicines.filter(
    (m) => getMedicineStatus(m.expiryDate) === "Safe",
  ).length;
  const expiringSoonCount = medicines.filter(
    (m) => getMedicineStatus(m.expiryDate) === "ExpiringSoon",
  ).length;
  const expiredCount = medicines.filter(
    (m) => getMedicineStatus(m.expiryDate) === "Expired",
  ).length;

  // Medicine status pie
  const statusData = [
    { name: "Safe", value: safeCount },
    { name: "Expiring Soon", value: expiringSoonCount },
    { name: "Expired", value: expiredCount },
  ].filter((d) => d.value > 0);
  const statusColors = [
    "oklch(0.55 0.20 145)",
    "oklch(0.72 0.22 75)",
    "oklch(0.52 0.26 15)",
  ];

  // Medicines by category pie
  const categoryMap: Record<string, number> = {};
  for (const m of medicines) {
    categoryMap[m.category] = (categoryMap[m.category] ?? 0) + 1;
  }
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Doses by day of week bar chart
  const dayMap: Record<number, number> = {};
  for (const log of doseLogs) {
    const day = new Date(Number(log.takenAt)).getDay();
    dayMap[day] = (dayMap[day] ?? 0) + 1;
  }
  const dosesByDayData = DAY_NAMES.map((day, i) => ({
    day,
    doses: dayMap[i] ?? 0,
  }));

  // Adherence trend line chart (last 7 days)
  const trendData: Array<{ date: string; adherence: number; doses: number }> =
    [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const dayStart = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
    ).getTime();
    const dayEnd = dayStart + 86400000;
    const dayLogs = doseLogs.filter((l) => {
      const t = Number(l.takenAt);
      return t >= dayStart && t < dayEnd;
    });
    const onTimeLogs = dayLogs.filter((l) => l.isOnTime);
    const adherence =
      dayLogs.length > 0
        ? Math.round((onTimeLogs.length / dayLogs.length) * 100)
        : 0;
    trendData.push({ date: dateStr, adherence, doses: dayLogs.length });
  }

  const statCards = [
    {
      label: "Total Medicines",
      value: medicines.length,
      icon: <PillIcon size={20} className="text-indigo-400" />,
      color: "bg-indigo-500/10 border-indigo-500/20",
      valueColor: "text-indigo-400",
    },
    {
      label: "Avg Adherence",
      value: `${Math.round(adherenceScore)}%`,
      icon: <Activity size={20} className="text-primary" />,
      color: "bg-primary/10 border-primary/20",
      valueColor: "text-primary",
    },
    {
      label: "Expired Medicines",
      value: expiredCount,
      icon: (
        <AlertTriangle
          size={20}
          style={{ color: "var(--color-status-danger)" }}
        />
      ),
      color:
        "bg-[color-mix(in_oklch,var(--color-status-danger)_10%,transparent)] border-[color-mix(in_oklch,var(--color-status-danger)_25%,transparent)]",
      valueColor: "text-[var(--color-status-danger)]",
    },
    {
      label: "Active Reminders",
      value: reminders.filter((r) => r.isEnabled).length,
      icon: <Bell size={20} className="text-purple-400" />,
      color: "bg-purple-500/10 border-purple-500/20",
      valueColor: "text-purple-400",
    },
    {
      label: "Doses Logged",
      value: doseLogs.length,
      icon: (
        <CheckCircle2
          size={20}
          style={{ color: "var(--color-status-success)" }}
        />
      ),
      color:
        "bg-[color-mix(in_oklch,var(--color-status-success)_10%,transparent)] border-[color-mix(in_oklch,var(--color-status-success)_25%,transparent)]",
      valueColor: "text-[var(--color-status-success)]",
    },
  ];

  const [openComingSoon, setOpenComingSoon] = useState<
    null | "ai-health" | "predictive"
  >(null);

  return (
    <div className="p-6 space-y-6" data-ocid="analytics.page">
      <div>
        <h1 className="gradient-text font-display font-bold text-2xl">
          Analytics
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your health data at a glance
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {loading
          ? [1, 2, 3, 4, 5].map((i) => (
              <SkeletonCard key={i} lines={2} showIcon />
            ))
          : statCards.map((card) => (
              <div
                key={card.label}
                className={`glass-card rounded-xl p-4 ${card.color}`}
              >
                <div className="flex items-center justify-between mb-2">
                  {card.icon}
                </div>
                <p className={`text-2xl font-bold ${card.valueColor}`}>
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Adherence Trend */}
        <div className="glass-card rounded-xl p-5">
          <h2 className="font-display font-semibold gradient-text mb-4">
            Adherence Trend (7 Days)
          </h2>
          {loading ? (
            <SkeletonCard lines={4} showIcon={false} className="h-48" />
          ) : (
            <Suspense
              fallback={
                <div
                  className="h-64 animate-pulse rounded-xl"
                  style={{ background: "var(--color-surface)" }}
                />
              }
            >
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <defs>
                    <linearGradient
                      id="adherenceGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="oklch(0.65 0.22 185)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor="oklch(0.65 0.22 185)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v: number) => [`${v}%`, "Adherence"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="adherence"
                    stroke="oklch(0.65 0.22 185)"
                    strokeWidth={2}
                    dot={{ fill: "oklch(0.65 0.22 185)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Suspense>
          )}
        </div>

        {/* Doses by Day */}
        <div className="glass-card rounded-xl p-5">
          <h2 className="font-display font-semibold gradient-text mb-4">
            Doses by Day of Week
          </h2>
          {loading ? (
            <SkeletonCard lines={4} showIcon={false} className="h-48" />
          ) : (
            <Suspense
              fallback={
                <div
                  className="h-64 animate-pulse rounded-xl"
                  style={{ background: "var(--color-surface)" }}
                />
              }
            >
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dosesByDayData}>
                  <defs>
                    <linearGradient id="dosesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="oklch(0.65 0.22 185)"
                        stopOpacity={0.9}
                      />
                      <stop
                        offset="100%"
                        stopColor="oklch(0.65 0.22 185)"
                        stopOpacity={0.3}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar
                    dataKey="doses"
                    fill="url(#dosesGrad)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Suspense>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Medicine Status Pie */}
        <div className="glass-card rounded-xl p-5">
          <h2 className="font-display font-semibold gradient-text mb-4">
            Medicine Status Distribution
          </h2>
          {loading ? (
            <SkeletonCard lines={4} showIcon={false} className="h-48" />
          ) : statusData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground/40 text-sm">
              No medicines yet
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Suspense
                fallback={
                  <div
                    className="h-64 animate-pulse rounded-xl"
                    style={{ background: "var(--color-surface)" }}
                  />
                }
              >
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {statusData.map((_e, i) => (
                        <Cell
                          key={_e.name}
                          fill={statusColors[i % statusColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </Suspense>
              <div className="space-y-2">
                {statusData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{
                        background: statusColors[i % statusColors.length],
                      }}
                    />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-medium text-foreground ml-auto">
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Category Pie */}
        <div className="glass-card rounded-xl p-5">
          <h2 className="font-display font-semibold gradient-text mb-4">
            Medicines by Category
          </h2>
          {loading ? (
            <SkeletonCard lines={4} showIcon={false} className="h-48" />
          ) : categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground/40 text-sm">
              No medicines yet
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Suspense
                fallback={
                  <div
                    className="h-64 animate-pulse rounded-xl"
                    style={{ background: "var(--color-surface)" }}
                  />
                }
              >
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {categoryData.map((_e, i) => (
                        <Cell
                          key={_e.name}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </Suspense>
              <div className="space-y-2">
                {categoryData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{
                        background: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-medium text-foreground ml-auto">
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dose trend with dual axis */}
      <div className="glass-card rounded-xl p-5">
        <h2 className="font-display font-semibold gradient-text mb-4">
          Daily Dose Volume vs Adherence
        </h2>
        {loading ? (
          <Skeleton className="h-48 w-full rounded-lg" />
        ) : (
          <Suspense
            fallback={
              <div
                className="h-64 animate-pulse rounded-xl"
                style={{ background: "var(--color-surface)" }}
              />
            }
          >
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <YAxis
                  yAxisId="left"
                  allowDecimals={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend
                  wrapperStyle={{
                    fontSize: 11,
                    color: "var(--muted-foreground)",
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="doses"
                  fill="oklch(0.52 0.26 295)"
                  radius={[4, 4, 0, 0]}
                  name="Doses"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="adherence"
                  stroke="oklch(0.55 0.20 145)"
                  strokeWidth={2}
                  dot={false}
                  name="Adherence %"
                />
              </BarChart>
            </ResponsiveContainer>
          </Suspense>
        )}
      </div>
      {/* Coming Soon Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ComingSoonCard
          title="AI Health Insights"
          description="Personalized health trends and anomaly detection powered by AI"
          badge="Q3 2025"
          icon={<Brain size={18} />}
          onClick={() => setOpenComingSoon("ai-health")}
        />
        <ComingSoonCard
          title="Predictive Adherence Alerts"
          description="Know your adherence risks before they happen"
          badge="Q4 2025"
          icon={<Zap size={18} />}
          onClick={() => setOpenComingSoon("predictive")}
        />
      </div>

      <ComingSoonModal
        open={openComingSoon === "ai-health"}
        onClose={() => setOpenComingSoon(null)}
        title="AI Health Insights"
        description="Personalized health trends and anomaly detection powered by AI."
        features={[
          "Detects adherence patterns",
          "Flags unusual expiry rates",
          "Personalized recommendations",
        ]}
        badge="Q3 2025"
      />
      <ComingSoonModal
        open={openComingSoon === "predictive"}
        onClose={() => setOpenComingSoon(null)}
        title="Predictive Adherence Alerts"
        description="Know your adherence risks before they happen with AI-powered forecasting."
        features={[
          "7-day adherence forecast",
          "Smart dose reminders",
          "Health score trends",
        ]}
        badge="Q4 2025"
      />
    </div>
  );
}
