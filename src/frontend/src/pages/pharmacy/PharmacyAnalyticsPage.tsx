import { OrderStatus } from "@/backend";
import { ComingSoonCard } from "@/components/common/ComingSoonModal";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import {
  useExpiryStats,
  useInventoryStats,
  usePharmacyInventory,
  usePharmacyOrders,
  usePharmacySyncLogs,
} from "@/hooks/useBackend";
import { getInventoryStatus, getMedicineStatus } from "@/types";
import {
  Activity,
  ArrowUpDown,
  Brain,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
  Zap,
} from "lucide-react";
import { Suspense, useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = [
  "oklch(0.72 0.22 75)",
  "oklch(0.65 0.22 185)",
  "oklch(0.55 0.22 245)",
  "oklch(0.55 0.20 145)",
  "oklch(0.52 0.26 295)",
  "oklch(0.52 0.26 15)",
];

const TOOLTIP_STYLE = {
  backgroundColor: "var(--color-bg-elevated)",
  border: "1px solid var(--color-border-base)",
  borderRadius: "8px",
  color: "var(--color-text-primary)",
};

const CHART_STYLE = { margin: { top: 5, right: 30, bottom: 5, left: 0 } };

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="gradient-text text-sm font-bold uppercase tracking-wider mb-4">
      {children}
    </h2>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="glass-card border border-border rounded-xl p-5">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}
      >
        {icon}
      </div>
      <p className="text-2xl font-display font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>}
    </div>
  );
}

export default function PharmacyAnalyticsPage() {
  const { data: inventory = [], isLoading: invLoading } =
    usePharmacyInventory();
  const { data: orders = [], isLoading: ordLoading } = usePharmacyOrders();
  const { data: expiryStats } = useExpiryStats();
  const { data: invStats = [] } = useInventoryStats();
  const { data: syncLogs = [] } = usePharmacySyncLogs();

  const isLoading = invLoading || ordLoading;

  // Stat cards
  const totalItems = inventory.length;
  const lowStock = inventory.filter(
    (i) => i.stockQuantity < i.minThreshold,
  ).length;
  const totalOrders = orders.length;
  const avgStock = inventory.length
    ? Math.round(
        inventory.reduce((s, i) => s + Number(i.stockQuantity), 0) /
          inventory.length,
      )
    : 0;

  // Inventory by category bar chart
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of inventory) {
      map[item.category] =
        (map[item.category] ?? 0) + Number(item.stockQuantity);
    }
    return Object.entries(map).map(([cat, stock]) => ({ cat, stock }));
  }, [inventory]);

  // Order status pie
  const orderStatusData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of orders) {
      map[o.status] = (map[o.status] ?? 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [orders]);

  // Expiry pie (from backend stats or derive from inventory)
  const expiryPieData = useMemo(() => {
    if (expiryStats) {
      return [
        { name: "Expired", value: Number(expiryStats.expired) },
        { name: "Expiring Soon", value: Number(expiryStats.expiringSoon) },
        { name: "Safe", value: Number(expiryStats.safe) },
      ].filter((d) => d.value > 0);
    }
    const counts = { Expired: 0, ExpiringSoon: 0, Safe: 0 };
    for (const item of inventory) {
      counts[getMedicineStatus(item.expiryDate)]++;
    }
    return [
      { name: "Expired", value: counts.Expired },
      { name: "Expiring Soon", value: counts.ExpiringSoon },
      { name: "Safe", value: counts.Safe },
    ].filter((d) => d.value > 0);
  }, [expiryStats, inventory]);

  // Orders over last 7 days line chart
  const ordersOverTime = useMemo(() => {
    const now = Date.now();
    const days: { day: string; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const label = d.toLocaleDateString("en", { weekday: "short" });
      const count = orders.filter((o) => {
        const od = new Date(Number(o.orderDate));
        return od.toDateString() === d.toDateString();
      }).length;
      days.push({ day: label, orders: count });
    }
    return days;
  }, [orders]);

  // invStats as bar data
  const invStatsData = useMemo(
    () => invStats.map(([cat, val]) => ({ cat, stock: Number(val) })),
    [invStats],
  );

  const barData = invStatsData.length > 0 ? invStatsData : categoryData;

  const syncSuccessCount = syncLogs.filter(
    (l) => l.status === "Success",
  ).length;
  const syncSuccessRate =
    syncLogs.length > 0
      ? Math.round((syncSuccessCount / syncLogs.length) * 100)
      : 0;
  const mostSyncedMedicine = useMemo(() => {
    if (syncLogs.length === 0) return "—";
    const counts: Record<string, number> = {};
    for (const log of syncLogs) {
      counts[log.medicineName] = (counts[log.medicineName] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  }, [syncLogs]);

  // Inventory health summary
  const inventoryHealth = useMemo(() => {
    const counts = {
      Safe: 0,
      LowStock: 0,
      ExpiringSoon: 0,
      Expired: 0,
      CriticalStock: 0,
    };
    for (const item of inventory) {
      const st = getInventoryStatus(
        item.expiryDate,
        item.stockQuantity,
        item.minThreshold,
      );
      counts[st]++;
    }
    return counts;
  }, [inventory]);

  const statCards = [
    {
      icon: <Package className="w-5 h-5" />,
      label: "Total Items",
      value: totalItems,
      color: "badge-info",
    },
    {
      icon: <TrendingDown className="w-5 h-5" />,
      label: "Low Stock",
      value: lowStock,
      sub: "below threshold",
      color: "badge-amber",
    },
    {
      icon: <ShoppingCart className="w-5 h-5" />,
      label: "Total Orders",
      value: totalOrders,
      color: "badge-teal",
    },
    {
      icon: <Activity className="w-5 h-5" />,
      label: "Avg Stock",
      value: avgStock,
      sub: "units per item",
      color: "badge-purple",
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <SkeletonCard key={n} lines={2} />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <SkeletonCard key={n} lines={4} showIcon={false} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8" data-ocid="pharmacy_analytics.page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Analytics
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Pharmacy performance overview
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <StatCard
            key={s.label}
            icon={s.icon}
            label={s.label}
            value={s.value}
            sub={s.sub}
            color={s.color}
          />
        ))}
      </div>

      {/* Ecosystem Analytics row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Medicine Sync Analytics */}
        <div
          className="glass-card rounded-2xl p-5"
          data-ocid="pharmacy_analytics.sync_analytics.card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RefreshCw size={15} className="text-primary" />
              <h2 className="font-display font-bold text-foreground">
                Medicine Sync Analytics
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">
                Live Data
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wide font-medium">
            Ecosystem Analytics
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-muted border border-border/40 p-3 text-center">
              <p className="text-2xl font-display font-bold text-foreground">
                {syncLogs.length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total Syncs
              </p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
              <p className="text-2xl font-display font-bold text-emerald-300">
                {syncSuccessRate}%
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Success Rate
              </p>
            </div>
            <div className="rounded-xl bg-muted border border-border/40 p-3 text-center">
              <p className="text-lg font-display font-bold text-foreground truncate">
                {mostSyncedMedicine}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Top Medicine
              </p>
            </div>
          </div>
          {syncLogs.length === 0 && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              No sync activity yet. Sync data will appear here.
            </p>
          )}
        </div>

        {/* Inventory Health Summary */}
        <div
          className="glass-card rounded-2xl p-5"
          data-ocid="pharmacy_analytics.inventory_health.card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-yellow-400" />
              <h2 className="font-display font-bold text-foreground">
                Inventory Health
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">
                Live Data
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wide font-medium">
            Ecosystem Analytics
          </p>
          <div className="space-y-2">
            {[
              {
                label: "Safe",
                count: inventoryHealth.Safe,
                color: "bg-emerald-400",
                text: "text-emerald-300",
              },
              {
                label: "Low Stock",
                count: inventoryHealth.LowStock,
                color: "bg-yellow-400",
                text: "text-yellow-300",
              },
              {
                label: "Expiring Soon",
                count: inventoryHealth.ExpiringSoon,
                color: "bg-orange-400",
                text: "text-orange-300",
              },
              {
                label: "Critical",
                count: inventoryHealth.CriticalStock,
                color: "bg-rose-500",
                text: "text-rose-300",
              },
              {
                label: "Expired",
                count: inventoryHealth.Expired,
                color: "bg-red-500",
                text: "text-red-300",
              },
            ].map(({ label, count, color, text }) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`}
                />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className={`text-sm font-bold ${text}`}>{count}</span>
                </div>
                <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color} opacity-70`}
                    style={{
                      width:
                        inventory.length > 0
                          ? `${Math.round((count / inventory.length) * 100)}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {inventory.length === 0 && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              No inventory data yet.
            </p>
          )}
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Inventory by category */}
        <div
          className="glass-card rounded-2xl p-5"
          data-ocid="pharmacy_analytics.category_chart"
        >
          <SectionTitle>Inventory by Category</SectionTitle>
          {barData.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-10">
              No inventory data yet
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
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} {...CHART_STYLE}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="oklch(0.72 0.22 75)"
                        stopOpacity={0.9}
                      />
                      <stop
                        offset="100%"
                        stopColor="oklch(0.65 0.22 185)"
                        stopOpacity={0.6}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(var(--border) / 0.3)"
                  />
                  <XAxis
                    dataKey="cat"
                    tick={{
                      fill: "var(--color-text-secondary)",
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    tick={{
                      fill: "var(--color-text-secondary)",
                      fontSize: 11,
                    }}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelStyle={{ color: "var(--color-text-primary)" }}
                    itemStyle={{ color: "var(--color-text-secondary)" }}
                  />
                  <Bar
                    dataKey="stock"
                    fill="url(#barGrad)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Suspense>
          )}
        </div>

        {/* Order status pie */}
        <div
          className="glass-card rounded-2xl p-5"
          data-ocid="pharmacy_analytics.orders_pie"
        >
          <SectionTitle>Order Status Distribution</SectionTitle>
          {orderStatusData.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-10">
              No order data yet
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
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(e) => e.name}
                  >
                    {orderStatusData.map((entry, i) => (
                      <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    itemStyle={{ color: "var(--color-text-secondary)" }}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      color: "var(--color-text-secondary)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Suspense>
          )}
        </div>

        {/* Expiry summary pie */}
        <div
          className="glass-card rounded-2xl p-5"
          data-ocid="pharmacy_analytics.expiry_pie"
        >
          <SectionTitle>Expiry Summary</SectionTitle>
          {expiryPieData.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-10">
              No inventory data yet
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
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={expiryPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {expiryPieData.map((entry, _i) => {
                      const fill =
                        entry.name === "Expired"
                          ? "oklch(0.52 0.26 15)"
                          : entry.name === "Expiring Soon"
                            ? "oklch(0.72 0.22 75)"
                            : "oklch(0.55 0.20 145)";
                      return <Cell key={entry.name} fill={fill} />;
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    itemStyle={{ color: "var(--color-text-secondary)" }}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      color: "var(--color-text-secondary)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Suspense>
          )}
        </div>

        {/* Orders over time — area chart with gradient */}
        <div
          className="glass-card rounded-2xl p-5"
          data-ocid="pharmacy_analytics.orders_line"
        >
          <SectionTitle>Orders — Last 7 Days</SectionTitle>
          <Suspense
            fallback={
              <div
                className="h-64 animate-pulse rounded-xl"
                style={{ background: "var(--color-surface)" }}
              />
            }
          >
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={ordersOverTime} {...CHART_STYLE}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="oklch(0.72 0.22 75)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="oklch(0.72 0.22 75)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(var(--border) / 0.3)"
                />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: "var(--color-text-primary)" }}
                  itemStyle={{ color: "var(--color-text-secondary)" }}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="oklch(0.72 0.22 75)"
                  strokeWidth={2}
                  fill="url(#areaGrad)"
                  dot={{ fill: "oklch(0.72 0.22 75)", r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Suspense>
        </div>
      </div>

      {/* Coming soon */}
      <ComingSoonCard
        title="Automated Reorder Suggestions"
        description="AI-powered inventory management that suggests restocking before you run out — never miss a critical medicine again."
        badge="Q2 2025"
        icon={<Brain className="w-5 h-5" />}
      />
    </div>
  );
}
