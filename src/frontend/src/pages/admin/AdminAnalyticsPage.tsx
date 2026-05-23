import { ROLE_CONFIG, RoleBadge } from "@/components/common/RoleBadge";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import {
  useExpiryStats,
  useInventoryStats,
  useSystemStats,
} from "@/hooks/useBackend";
import { cn } from "@/lib/utils";
import {
  Activity,
  Bell,
  Brain,
  CheckCircle,
  Pill,
  ShoppingCart,
  Users,
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

const GLASS = "bg-muted backdrop-blur-md border border-border rounded-xl";

const ROLE_COLORS: Record<string, string> = {
  patient: "oklch(0.65 0.22 185)",
  pharmacy: "oklch(0.72 0.22 75)",
  hospital: "oklch(0.58 0.24 245)",
  diagnostic: "oklch(0.58 0.26 295)",
  admin: "oklch(0.52 0.26 15)",
};

const EXPIRY_COLORS = [
  "oklch(0.55 0.20 145)",
  "oklch(0.72 0.22 75)",
  "oklch(0.52 0.26 15)",
];

export default function AdminAnalyticsPage() {
  const { data: stats, isLoading: loadingStats } = useSystemStats();
  const { data: expiryStats, isLoading: loadingExpiry } = useExpiryStats();
  const { data: inventoryStats, isLoading: loadingInv } = useInventoryStats();

  const isLoading = loadingStats || loadingExpiry || loadingInv;

  const rolesPie = useMemo(() => {
    return (stats?.usersByRole ?? [])
      .map(([role, count]) => ({
        name: role,
        value: Number(count),
      }))
      .filter((d) => d.value > 0);
  }, [stats]);

  const expiryPie = useMemo(
    () =>
      [
        { name: "Safe", value: Number(expiryStats?.safe ?? 0) },
        {
          name: "Expiring Soon",
          value: Number(expiryStats?.expiringSoon ?? 0),
        },
        { name: "Expired", value: Number(expiryStats?.expired ?? 0) },
      ].filter((d) => d.value > 0),
    [expiryStats],
  );

  const inventoryBar = useMemo(
    () =>
      (inventoryStats ?? []).map(([category, count]) => ({
        category,
        count: Number(count),
      })),
    [inventoryStats],
  );

  const mainStats = [
    {
      label: "Total Users",
      value: Number(stats?.totalUsers ?? 0),
      icon: <Users size={18} />,
      color:
        "bg-[var(--color-accent-amber)]/20 text-[var(--color-accent-amber)]",
      large: true,
    },
    {
      label: "Total Medicines",
      value: Number(stats?.totalMedicines ?? 0),
      icon: <Pill size={18} />,
      color: "bg-primary/15 text-primary",
      large: true,
    },
    {
      label: "Total Orders",
      value: Number(stats?.totalOrders ?? 0),
      icon: <ShoppingCart size={18} />,
      color: "bg-[var(--color-role-admin)]/20 text-[var(--color-role-admin)]",
      large: true,
    },
    {
      label: "Avg. Adherence",
      value: "--",
      icon: <Activity size={18} />,
      color:
        "bg-[var(--color-status-success)]/20 text-[var(--color-status-success)]",
      large: false,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-bold">
          System Analytics <span className="gradient-text">📊</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Platform-wide health and usage overview
        </p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonCard key={i} lines={1} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <SkeletonCard lines={8} />
            <SkeletonCard lines={8} />
            <SkeletonCard lines={8} className="lg:col-span-2 xl:col-span-1" />
          </div>
        </div>
      ) : (
        <>
          {/* Main stats */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 xl:grid-cols-4 gap-4"
          >
            {mainStats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
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
                  <p
                    className={cn(
                      "font-display font-bold",
                      s.large
                        ? "text-5xl gradient-text"
                        : "text-xl text-foreground",
                    )}
                  >
                    {s.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* 3 charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Users by role */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(GLASS, "p-5")}
            >
              <h2 className="font-display font-bold mb-1 text-sm">
                <span className="gradient-text">Users by Role</span>
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Active role distribution
              </p>
              {rolesPie.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground text-sm">No users yet.</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {Object.keys(ROLE_CONFIG).map((r) => (
                      <RoleBadge key={r} role={r} />
                    ))}
                  </div>
                </div>
              ) : (
                <Suspense
                  fallback={
                    <div
                      className="h-64 animate-pulse rounded-xl"
                      style={{ background: "var(--color-surface)" }}
                    />
                  }
                >
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={rolesPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {rolesPie.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={ROLE_COLORS[entry.name] ?? "#64748b"}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "oklch(var(--card))",
                          border: "1px solid oklch(var(--border))",
                          borderRadius: 10,
                          color: "oklch(var(--foreground))",
                        }}
                      />
                      <Legend
                        formatter={(value) => (
                          <span
                            style={{
                              color: "oklch(var(--muted-foreground))",
                              fontSize: 11,
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

            {/* Expiry pie */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className={cn(GLASS, "p-5")}
            >
              <h2 className="font-display font-bold mb-1 text-sm">
                <span className="gradient-text">Expiry Summary</span>
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Medicine status across all inventories
              </p>
              {expiryPie.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-12">
                  No medicine data.
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
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={expiryPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {expiryPie.map((entry, i) => (
                          <Cell key={entry.name} fill={EXPIRY_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "oklch(var(--card))",
                          border: "1px solid oklch(var(--border))",
                          borderRadius: 10,
                          color: "oklch(var(--foreground))",
                        }}
                      />
                      <Legend
                        formatter={(value) => (
                          <span
                            style={{
                              color: "oklch(var(--muted-foreground))",
                              fontSize: 11,
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

            {/* Inventory bar */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={cn(GLASS, "p-5 lg:col-span-2 xl:col-span-1")}
            >
              <h2 className="font-display font-bold mb-1 text-sm">
                <span className="gradient-text">Inventory by Category</span>
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Stock distribution across medicine categories
              </p>
              {inventoryBar.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-12">
                  No inventory data.
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
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={inventoryBar} barSize={20}>
                      <XAxis
                        dataKey="category"
                        tick={{
                          fill: "oklch(var(--muted-foreground))",
                          fontSize: 10,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{
                          fill: "oklch(var(--muted-foreground))",
                          fontSize: 10,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "oklch(var(--card))",
                          border: "1px solid oklch(var(--border))",
                          borderRadius: 10,
                          color: "oklch(var(--foreground))",
                        }}
                        cursor={{ fill: "oklch(var(--muted)/0.3)" }}
                      />
                      <Bar
                        dataKey="count"
                        fill="oklch(0.52 0.26 15)"
                        radius={[5, 5, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Suspense>
              )}
            </motion.div>
          </div>

          {/* System health */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className={cn(GLASS, "p-5")}
          >
            <h2 className="font-display font-bold text-foreground mb-4">
              System Health
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                "Backend Canister",
                "Identity Provider",
                "Object Storage",
                "Data Sync",
              ].map((service) => (
                <div
                  key={service}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-muted border border-border"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-status-success)] shadow-sm shrink-0" />
                  <p className="text-xs text-foreground font-medium truncate">
                    {service}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Phase 2 Coming Soon */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={cn(GLASS, "p-5")}
          >
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-display font-bold text-foreground">
                Phase 2 Features
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold border border-primary/30">
                Coming Soon
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: <Zap size={20} />,
                  title: "Real-Time Sync",
                  desc: "WebSocket-based live data updates across all dashboards.",
                  color:
                    "text-primary bg-[var(--color-accent-teal)]/10 border-[var(--color-accent-teal)]/20",
                },
                {
                  icon: <Bell size={20} />,
                  title: "Push Notifications",
                  desc: "Persistent push alerts even when the app is closed.",
                  color:
                    "text-[var(--color-status-info)] bg-[var(--color-status-info)]/10 border-[var(--color-status-info)]/20",
                },
                {
                  icon: <Brain size={20} />,
                  title: "AI Assistant",
                  desc: "GPT-powered prescription analysis and smart recommendations.",
                  color:
                    "text-[var(--color-role-admin)] bg-[var(--color-role-admin)]/10 border-[var(--color-role-admin)]/20",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className={cn(
                    "p-4 rounded-xl border relative overflow-hidden opacity-70 cursor-not-allowed",
                    f.color,
                  )}
                >
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]">
                    PHASE 2
                  </div>
                  <div className="mb-2">{f.icon}</div>
                  <p className="font-semibold text-sm text-foreground mb-1">
                    {f.title}
                  </p>
                  <p className="text-xs opacity-70">{f.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CheckCircle summary */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {[
              "Internet Identity Auth",
              "Role-Based Access",
              "Medicine Tracking",
              "Decentralized Storage",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-status-success)]/10 border border-[var(--color-status-success)]/20"
              >
                <CheckCircle
                  size={14}
                  className="text-[var(--color-status-success)] shrink-0"
                />
                <p className="text-xs text-[var(--color-status-success)] font-medium">
                  {feature}
                </p>
              </div>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}
