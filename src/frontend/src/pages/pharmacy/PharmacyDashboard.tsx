import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { SkeletonStat } from "@/components/common/SkeletonCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { WalkthroughOverlay } from "@/components/common/WalkthroughOverlay";
import { LifecycleInlinePreview } from "@/components/timeline/LifecycleInlinePreview";
import {
  SuccessToastNotification,
  WarningNotification,
} from "@/components/ui/notification-banners";
import ClassicLoader from "@/components/ui/stardust-loader";
import { PHARMACY_WALKTHROUGH_STEPS } from "@/data/walkthroughSteps";
import {
  usePharmacyInventory,
  usePharmacyOrders,
  usePharmacySyncLogs,
} from "@/hooks/useBackend";
import { useWalkthrough } from "@/hooks/useWalkthrough";
import { useAuthStore } from "@/store/auth";
import {
  INVENTORY_STATUS_META,
  getInventoryStatus,
  getMedicineStatus,
} from "@/types";
import {
  AlertTriangle,
  ArrowRight,
  Map as MapIcon,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="panel-depth-2 p-5 rounded-2xl flex items-start gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-role-pharmacy)]/60 hover:shadow-[var(--shadow-md)] border-l-[3px] border-l-[var(--color-role-pharmacy)]">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-[var(--color-role-pharmacy)]/15 text-[var(--color-role-pharmacy)]">
        {icon}
      </div>
      <div>
        <p className="metric-value-primary text-[var(--color-role-pharmacy)]">
          {value}
        </p>
        <p className="metric-label mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function PharmacyDashboard() {
  const { user } = useAuthStore();
  const {
    activeStepIndex,
    isActive: walkthroughActive,
    startWalkthrough,
    nextStep,
    prevStep,
    dismissWalkthrough,
  } = useWalkthrough(PHARMACY_WALKTHROUGH_STEPS, "pharmacy");

  const { data: inventory, isLoading } = usePharmacyInventory();
  const { data: orders } = usePharmacyOrders();
  const { data: syncLogs } = usePharmacySyncLogs();

  const pendingOrders = (orders ?? []).filter(
    (o) => (o.status as string) === "Pending",
  ).length;
  const recentSyncCount = (syncLogs ?? []).length;

  // Compute 5-state inventory health counts
  const inventoryItems = inventory ?? [];
  const healthCounts = {
    Safe: 0,
    LowStock: 0,
    ExpiringSoon: 0,
    Expired: 0,
    CriticalStock: 0,
  };
  for (const item of inventoryItems) {
    const s = getInventoryStatus(
      item.expiryDate,
      item.stockQuantity,
      item.minThreshold,
    );
    healthCounts[s]++;
  }
  const criticalTotal = healthCounts.Expired + healthCounts.CriticalStock;
  const warningTotal = healthCounts.LowStock + healthCounts.ExpiringSoon;
  const expiringSoon = healthCounts.ExpiringSoon;
  const hasCritical = criticalTotal > 0 || warningTotal > 0;

  const statCards = [
    {
      label: "Total Items",
      value: inventoryItems.length,
      icon: <Warehouse size={20} />,
      variant: "teal",
    },
    {
      label: "Low / Critical Stock",
      value: healthCounts.LowStock + healthCounts.CriticalStock,
      icon: <AlertTriangle size={20} />,
      variant: "amber",
    },
    {
      label: "Pending Orders",
      value: pendingOrders,
      icon: <ShoppingCart size={20} />,
      variant: "pharmacy",
    },
    {
      label: "Expiring Soon",
      value: expiringSoon,
      icon: <TrendingUp size={20} />,
      variant: "danger",
    },
  ];

  const [showSuccess, setShowSuccess] = useState(true);
  const [showWarning, setShowWarning] = useState(true);

  return (
    <div
      className="p-6 space-y-6 bg-[var(--color-bg-base)] min-h-full"
      data-ocid="pharmacy.dashboard.page"
    >
      {/* Notification banners */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="flex justify-start"
          data-ocid="pharmacy.notification.success"
        >
          <SuccessToastNotification
            title="Inventory synced successfully"
            description="All medicine records are up to date."
            onClose={() => setShowSuccess(false)}
          />
        </motion.div>
      )}
      {!isLoading && hasCritical && showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start"
          data-ocid="pharmacy.notification.warning"
        >
          <WarningNotification
            message={`${criticalTotal} critical stock alert${criticalTotal !== 1 ? "s" : ""} require your attention.`}
            onClose={() => setShowWarning(false)}
          />
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-[var(--color-border-base)]"
      >
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--color-role-pharmacy)] shadow-[0_0_8px_var(--color-role-pharmacy)]"
              aria-hidden="true"
            />
            <h1 className="text-2xl font-display font-bold tracking-tight text-[var(--color-text-primary)]">
              Medicine Inventory Dashboard
            </h1>
          </div>
          <p className="text-sm mt-0.5 text-[var(--color-text-secondary)]">
            Welcome back,{" "}
            <span className="text-[var(--color-role-pharmacy)] font-semibold">
              {user?.name?.split(" ")[0]}
            </span>{" "}
            — Pharmacy Hub
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!walkthroughActive && (
            <button
              type="button"
              onClick={() => startWalkthrough("pharmacy")}
              data-ocid="pharmacy.walkthrough.start_button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-role-pharmacy)]/35 text-[var(--color-role-pharmacy)] bg-[var(--color-role-pharmacy)]/8 hover:bg-[var(--color-role-pharmacy)]/15 hover:border-[var(--color-role-pharmacy)]/55 transition-all duration-200"
              aria-label="Start platform tour"
            >
              <MapIcon size={12} />
              Platform Tour
            </button>
          )}
          <a
            href="/pharmacy/inventory"
            data-ocid="pharmacy.nav.inventory"
            aria-label="Go to Inventory"
            className="px-4 py-2 rounded-full text-xs font-semibold bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border-strong)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text-primary)] transition-all duration-200 hover:-translate-y-0.5"
          >
            💊 Inventory
          </a>
          <a
            href="/pharmacy/orders"
            data-ocid="pharmacy.nav.orders"
            aria-label="Go to Orders"
            className="px-4 py-2 rounded-full text-xs font-semibold bg-[var(--color-role-pharmacy)]/15 text-[var(--color-role-pharmacy)] border border-[var(--color-role-pharmacy)]/40 hover:bg-[var(--color-role-pharmacy)]/25 hover:border-[var(--color-role-pharmacy)]/60 transition-all duration-200 hover:-translate-y-0.5"
          >
            🛒 Orders
          </a>
          <a
            href="/pharmacy/alerts"
            data-ocid="pharmacy.nav.expiry"
            aria-label="Go to Expiry Alerts"
            className="px-4 py-2 rounded-full text-xs font-semibold bg-[var(--color-status-danger)]/10 text-[var(--color-status-danger)] border border-[var(--color-status-danger)]/35 hover:bg-[var(--color-status-danger)]/20 transition-all duration-200 hover:-translate-y-0.5"
          >
            ⚠️ Alerts
          </a>
          <a
            href="/pharmacy/sync"
            data-ocid="pharmacy.nav.sync"
            aria-label="Sync Medicine to Patient"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[var(--color-status-success)]/10 text-[var(--color-status-success)] border border-[var(--color-status-success)]/35 hover:bg-[var(--color-status-success)]/20 transition-all duration-200 hover:-translate-y-0.5"
          >
            <RefreshCw size={12} /> Sync Medicine
          </a>
        </div>
      </motion.div>

      {/* Critical warning banner */}
      {!isLoading && hasCritical && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="panel-focus flex items-center gap-3 px-5 py-4 rounded-2xl border-l-4 border-l-[var(--color-status-warning)]"
          data-ocid="pharmacy.critical_banner"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--color-status-warning)]/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-[var(--color-accent-amber)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--color-status-warning)]">
              Critical Inventory Alerts
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {healthCounts.Expired > 0 &&
                `${healthCounts.Expired} expired item${healthCounts.Expired > 1 ? "s" : ""} require disposal`}
              {healthCounts.Expired > 0 &&
                (healthCounts.CriticalStock > 0 || expiringSoon > 0) &&
                " · "}
              {healthCounts.CriticalStock > 0 &&
                `${healthCounts.CriticalStock} item${healthCounts.CriticalStock > 1 ? "s" : ""} critically low`}
              {healthCounts.CriticalStock > 0 && expiringSoon > 0 && " · "}
              {expiringSoon > 0 &&
                `${expiringSoon} item${expiringSoon > 1 ? "s" : ""} expiring soon`}
            </p>
          </div>
          <a
            href="/pharmacy/expiry"
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-status-warning)]/15 text-[var(--color-status-warning)] border border-[var(--color-status-warning)]/40 hover:bg-[var(--color-status-warning)]/25 transition-colors"
            data-ocid="pharmacy.critical_banner_link"
          >
            Review →
          </a>
        </motion.div>
      )}

      {/* Stat cards */}
      <div className="bg-[var(--color-bg-surface)] p-4 rounded-lg">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey:
              <SkeletonStat key={i} />
            ))}
            <div className="col-span-full flex justify-center pt-2">
              <ClassicLoader />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                data-ocid={`pharmacy.stat.${i + 1}`}
              >
                <StatCard label={s.label} value={s.value} icon={s.icon} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Inventory Health card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="panel-depth-3 rounded-2xl p-5"
        data-ocid="pharmacy.inventory_health"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className="w-1 h-4 rounded-full bg-[var(--color-role-pharmacy)]"
              aria-hidden="true"
            />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Inventory Health
            </h2>
          </div>
          <a
            href="/pharmacy/inventory"
            className="text-xs text-[var(--color-role-pharmacy)] hover:text-[var(--color-role-pharmacy)]/80 transition-colors font-semibold"
            data-ocid="pharmacy.inventory_health_link"
          >
            Manage →
          </a>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {(
              [
                "Safe",
                "LowStock",
                "ExpiringSoon",
                "Expired",
                "CriticalStock",
              ] as const
            ).map((status, i) => {
              const meta = INVENTORY_STATUS_META[status];
              const count = healthCounts[status];
              const isAlert =
                status === "LowStock" ||
                status === "CriticalStock" ||
                status === "ExpiringSoon";
              return (
                <motion.a
                  key={status}
                  href="/pharmacy/inventory"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32 + i * 0.05 }}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] hover:border-[var(--color-role-pharmacy)]/50 bg-[var(--color-bg-elevated)] ${isAlert ? "border-[var(--color-role-pharmacy)]/45 border-l-[3px] border-l-[var(--color-role-pharmacy)]" : meta.border}`}
                  data-ocid={`pharmacy.health.${status.toLowerCase()}`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                    <span className="text-xs font-medium text-[var(--color-text-secondary)] truncate">
                      {meta.label}
                    </span>
                  </div>
                  <p
                    className={`metric-value-primary ${isAlert ? "text-[var(--color-role-pharmacy)]" : "text-[var(--color-text-primary)]"}`}
                    data-metric
                  >
                    {count}
                  </p>
                </motion.a>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Inventory Lifecycle Inline Preview */}
      {inventoryItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.31 }}
        >
          <div
            className="panel-depth-2 rounded-2xl p-5 border-l-[3px] border-l-[var(--color-role-pharmacy)]"
            data-ocid="pharmacy.lifecycle_preview.card"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-1 h-4 rounded-full bg-[var(--color-role-pharmacy)]"
                  aria-hidden="true"
                />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Inventory Lifecycle
                </h2>
              </div>
            </div>
            <LifecycleInlinePreview
              medicineId={inventoryItems[0]?.id ?? ""}
              medicineName={
                inventoryItems[0]?.medicineName ??
                (inventoryItems[0] as unknown as Record<string, string>)
                  ?.name ??
                undefined
              }
            />
          </div>
        </motion.div>
      )}

      {/* Quick action: Sync Medicine card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
        className="panel-depth-2 rounded-2xl p-5 flex items-center justify-between gap-4 border-l-[3px] border-l-[var(--color-role-pharmacy)]"
        data-ocid="pharmacy.sync_quick_action"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[var(--color-role-pharmacy)]/15 flex items-center justify-center shrink-0">
            <RefreshCw
              size={20}
              className="text-[var(--color-role-pharmacy)]"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              Sync Medicine to Patient
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
              {recentSyncCount > 0
                ? `${recentSyncCount} sync${recentSyncCount !== 1 ? "s" : ""} recorded`
                : "Auto-match dispensed medicines to patients"}
            </p>
          </div>
        </div>
        <a
          href="/pharmacy/sync"
          data-ocid="pharmacy.sync_quick_action_link"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-role-pharmacy)] hover:opacity-85 text-[var(--color-text-inverse)] text-xs font-bold tracking-wide transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_var(--color-role-pharmacy)/40] shrink-0"
        >
          Open <ArrowRight size={13} />
        </a>
      </motion.div>

      {/* Recent inventory */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="panel-depth-3 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span
                className="w-1 h-4 rounded-full bg-[var(--color-role-pharmacy)]"
                aria-hidden="true"
              />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Recent Inventory
              </h2>
            </div>
            <a
              href="/pharmacy/inventory"
              className="text-xs text-[var(--color-role-pharmacy)] hover:text-[var(--color-role-pharmacy)]/80 transition-colors font-semibold"
              data-ocid="pharmacy.inventory_manage_link"
            >
              Manage →
            </a>
          </div>
          {!inventory?.length ? (
            <div
              className="flex flex-col items-center justify-center py-10 gap-2"
              data-ocid="pharmacy.inventory.empty_state"
            >
              <Warehouse className="w-8 h-8 text-[var(--color-text-tertiary)]" />
              <p className="text-[var(--color-text-tertiary)] text-sm">
                No inventory items yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="space-y-2 min-w-[480px]">
                {inventory.slice(0, 6).map((item, i) => {
                  const isLow = item.stockQuantity < item.minThreshold;
                  const pct =
                    item.maxThreshold > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (Number(item.stockQuantity) /
                              Number(item.maxThreshold)) *
                              100,
                          ),
                        )
                      : 0;
                  const barColor = isLow
                    ? "bg-[var(--color-status-warning)]"
                    : pct > 60
                      ? "bg-[var(--color-status-success)]"
                      : "bg-[var(--color-accent-amber)]";
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                        i % 2 === 0
                          ? "bg-[var(--color-bg-elevated)]"
                          : "bg-[var(--color-bg-surface)]"
                      } border ${
                        isLow
                          ? "border-[var(--color-role-pharmacy)]/45 border-l-[3px] border-l-[var(--color-role-pharmacy)]"
                          : "border-[var(--color-border-base)]"
                      } hover:border-[var(--color-role-pharmacy)]/40 hover:bg-[var(--color-bg-card)]`}
                      data-ocid={`pharmacy.inventory.item.${i + 1}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                          {item.medicineName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 max-w-24 h-1.5 bg-[var(--color-bg-card)] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${barColor}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs tabular-nums font-mono text-[var(--color-text-tertiary)]">
                            {String(item.stockQuantity)}/
                            {String(item.maxThreshold)}
                          </span>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-2 ml-3 shrink-0"
                        aria-label={`${item.medicineName} inventory actions`}
                      >
                        {isLow && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-role-pharmacy)]/15 text-[var(--color-role-pharmacy)] font-bold tracking-wide"
                            aria-label="Low stock warning"
                          >
                            Low
                          </span>
                        )}
                        <StatusBadge
                          status={getMedicineStatus(item.expiryDate)}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
      <WalkthroughOverlay
        steps={PHARMACY_WALKTHROUGH_STEPS}
        isActive={walkthroughActive}
        currentStepIndex={activeStepIndex}
        onNext={nextStep}
        onPrev={prevStep}
        onDismiss={dismissWalkthrough}
      />
    </div>
  );
}
