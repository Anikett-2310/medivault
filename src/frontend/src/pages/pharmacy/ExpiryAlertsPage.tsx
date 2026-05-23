import { EmptyState } from "@/components/common/EmptyState";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { usePharmacyInventory } from "@/hooks/useBackend";
import { INVENTORY_STATUS_META, getInventoryStatus } from "@/types";
import type { InventoryItem } from "@/types";
import { AlertTriangle, Clock, ShieldCheck, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

type AlertFilter = "All" | "Expired" | "Expiring";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface AlertEntry {
  item: InventoryItem;
  daysUntil: number;
  bucket: "Expired" | "Week" | "Month" | "Safe";
}

function buildAlerts(inventory: InventoryItem[]): AlertEntry[] {
  const now = Date.now();
  const entries: AlertEntry[] = [];
  for (const item of inventory) {
    const expMs = Number(item.expiryDate);
    const daysUntil = Math.round((expMs - now) / MS_PER_DAY);
    let bucket: AlertEntry["bucket"] = "Safe";
    if (daysUntil < 0) bucket = "Expired";
    else if (daysUntil <= 7) bucket = "Week";
    else if (daysUntil <= 30) bucket = "Month";
    entries.push({ item, daysUntil, bucket });
  }
  // Sort: expired first (most expired first), then expiring-soon soonest first, then safe
  const bucketOrder = { Expired: 0, Week: 1, Month: 2, Safe: 3 };
  entries.sort((a, b) => {
    const bo = bucketOrder[a.bucket] - bucketOrder[b.bucket];
    if (bo !== 0) return bo;
    return a.daysUntil - b.daysUntil;
  });
  return entries;
}

const BUCKET_STYLE: Record<
  AlertEntry["bucket"],
  { border: string; bg: string; text: string; badge: string }
> = {
  Expired: {
    border: "border-l-red-500",
    bg: "bg-red-500/5",
    text: "text-[var(--color-status-danger)]",
    badge: "badge-danger",
  },
  Week: {
    border: "border-l-orange-500",
    bg: "bg-orange-500/5",
    text: "text-[var(--color-status-warning)]",
    badge: "badge-warning",
  },
  Month: {
    border: "border-l-yellow-500",
    bg: "bg-yellow-500/5",
    text: "text-[var(--color-status-warning)]",
    badge: "badge-warning",
  },
  Safe: {
    border: "border-l-emerald-500",
    bg: "bg-emerald-500/5",
    text: "text-[var(--color-status-success)]",
    badge: "badge-success",
  },
};

export default function ExpiryAlertsPage() {
  const { data: inventory = [], isLoading } = usePharmacyInventory();
  const [filter, setFilter] = useState<AlertFilter>("All");

  // Using getInventoryStatus for consistent 5-state classification
  const alerts = useMemo(() => buildAlerts(inventory), [inventory]);

  const counts = useMemo(() => {
    let expired = 0;
    let week = 0;
    let month = 0;
    let safe = 0;
    for (const a of alerts) {
      if (a.bucket === "Expired") expired++;
      else if (a.bucket === "Week") week++;
      else if (a.bucket === "Month") month++;
      else safe++;
    }
    return { expired, week, month, safe };
  }, [alerts]);

  const visible = alerts.filter((a) => {
    if (filter === "All") return true;
    if (filter === "Expired") return a.bucket === "Expired";
    if (filter === "Expiring")
      return a.bucket === "Week" || a.bucket === "Month";
    return true;
  });

  const summaryCards = [
    {
      label: "Expired",
      count: counts.expired,
      icon: <XCircle className="w-5 h-5" />,
      cls: "border-[var(--color-status-danger)] bg-[color-mix(in_oklch,var(--color-status-danger)_8%,transparent)] text-[var(--color-status-danger)]",
    },
    {
      label: "Expiring in 7 days",
      count: counts.week,
      icon: <AlertTriangle className="w-5 h-5" />,
      cls: "border-[var(--color-status-warning)] bg-[color-mix(in_oklch,var(--color-status-warning)_8%,transparent)] text-[var(--color-status-warning)]",
    },
    {
      label: "Expiring in 30 days",
      count: counts.month,
      icon: <Clock className="w-5 h-5" />,
      cls: "border-[var(--color-status-warning)] bg-[color-mix(in_oklch,var(--color-status-warning)_8%,transparent)] text-[var(--color-status-warning)]",
    },
    {
      label: "Safe",
      count: counts.safe,
      icon: <ShieldCheck className="w-5 h-5" />,
      cls: "border-[var(--color-status-success)] bg-[color-mix(in_oklch,var(--color-status-success)_8%,transparent)] text-[var(--color-status-success)]",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Expiry Alerts
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Monitor stock approaching expiry
        </p>
      </div>

      {/* Summary pills */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <SkeletonCard key={n} lines={1} />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {summaryCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border glass-card ${s.cls}`}
              data-ocid={`expiry.summary.${s.label.replace(/\s+/g, "_").toLowerCase()}`}
            >
              {s.icon}
              <span className="text-xs font-semibold opacity-90">
                {s.label}
              </span>
              <span className="text-lg font-display font-bold leading-none">
                {s.count}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1.5">
        {(["All", "Expired", "Expiring"] as AlertFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            data-ocid={`expiry.filter.${f.toLowerCase()}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <SkeletonCard key={n} lines={2} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="w-7 h-7 text-emerald-400" />}
          title="All Clear — No expiry alerts"
          description="All inventory items are within safe expiry range."
          className="border-emerald-500/20 bg-emerald-500/5"
        />
      ) : (
        <div className="space-y-3" data-ocid="expiry.list">
          {visible.map((entry, idx) => {
            const { item, daysUntil, bucket } = entry;
            const s = BUCKET_STYLE[bucket];
            const label =
              daysUntil < 0
                ? `Expired ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? "s" : ""} ago`
                : daysUntil === 0
                  ? "Expires today"
                  : `Expires in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`;
            const isExpired = bucket === "Expired";
            const isExpiringSoon = bucket === "Week" || bucket === "Month";
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.3 }}
                className={`glass-card flex items-center gap-4 p-4 rounded-xl border-l-4 ${s.border} ${
                  isExpired
                    ? "border-red-500/40 bg-red-500/5"
                    : isExpiringSoon
                      ? "border-amber-500/40 bg-amber-500/5"
                      : s.bg
                }`}
                data-ocid={`expiry.item.${idx + 1}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">
                    {item.medicineName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Stock: {String(item.stockQuantity)} units · Expires{" "}
                    {new Date(Number(item.expiryDate)).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isExpired
                        ? "badge-danger"
                        : isExpiringSoon
                          ? "badge-warning"
                          : "badge-success"
                    }`}
                  >
                    {isExpired
                      ? "Expired"
                      : isExpiringSoon
                        ? "Expiring Soon"
                        : "Safe"}
                  </span>
                  <p className={`text-xs mt-1 font-medium ${s.text}`}>
                    {label}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
