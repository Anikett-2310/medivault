import type {
  Appointment,
  ConsentAuditEntry,
  ConsentRecord,
  DoseLog,
  InventoryItem,
  Medicine,
  MedicineCategory,
  Order,
  OrderStatus,
  PharmacySyncLog,
  Reminder,
  Report,
  UserProfile,
  UserRole,
  Variant_Failed_Duplicate_Success,
} from "@/backend";

// Re-export backend types
export type {
  Appointment,
  ConsentAuditEntry,
  ConsentRecord,
  DoseLog,
  InventoryItem,
  Medicine,
  MedicineCategory,
  Order,
  OrderStatus,
  PharmacySyncLog,
  Reminder,
  Report,
  UserProfile,
  UserRole,
  Variant_Failed_Duplicate_Success,
};

// Medicine status derived from expiry date
export type MedicineStatus = "Safe" | "ExpiringSoon" | "Expired";

// Inventory status: combines expiry + stock levels into 5 states
export type InventoryStatus =
  | "Safe"
  | "LowStock"
  | "ExpiringSoon"
  | "Expired"
  | "CriticalStock";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const EXPIRY_WARNING_DAYS = 30;

export function getMedicineStatus(expiryDate: bigint): MedicineStatus {
  const expiryMs = Number(expiryDate);
  const now = Date.now();
  if (expiryMs < now) return "Expired";
  if (expiryMs - now < EXPIRY_WARNING_DAYS * MS_PER_DAY) return "ExpiringSoon";
  return "Safe";
}

/**
 * Compute 5-state inventory status.
 * Priority: Expired > CriticalStock > ExpiringSoon > LowStock > Safe
 */
export function getInventoryStatus(
  expiryDate: bigint,
  stockQuantity: bigint,
  minThreshold: bigint,
): InventoryStatus {
  const expiryMs = Number(expiryDate);
  const now = Date.now();
  const stock = Number(stockQuantity);
  const min = Number(minThreshold);

  if (expiryMs < now) return "Expired";
  if (stock <= min * 0.5) return "CriticalStock";
  if (expiryMs - now < EXPIRY_WARNING_DAYS * MS_PER_DAY) return "ExpiringSoon";
  if (stock <= min) return "LowStock";
  return "Safe";
}

export const INVENTORY_STATUS_META: Record<
  InventoryStatus,
  { label: string; badge: string; bg: string; border: string; dot: string }
> = {
  Safe: {
    label: "Safe",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  LowStock: {
    label: "Low Stock",
    badge: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
    bg: "bg-yellow-500/5",
    border: "border-yellow-500/30",
    dot: "bg-yellow-400",
  },
  ExpiringSoon: {
    label: "Expiring Soon",
    badge: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    bg: "bg-orange-500/5",
    border: "border-orange-500/30",
    dot: "bg-orange-400",
  },
  Expired: {
    label: "Expired",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
    bg: "bg-red-500/5",
    border: "border-red-500/30",
    dot: "bg-red-500",
  },
  CriticalStock: {
    label: "Critical",
    badge:
      "bg-rose-700/20 text-rose-300 border-rose-600/40 shadow-[0_0_8px_oklch(0.45_0.22_15/0.3)]",
    bg: "bg-rose-700/5",
    border: "border-rose-600/30",
    dot: "bg-rose-600",
  },
};

export function getAdherenceColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

export function getAdherenceBg(score: number): string {
  if (score >= 80) return "bg-emerald-500/20 text-emerald-300";
  if (score >= 50) return "bg-yellow-500/20 text-yellow-300";
  return "bg-red-500/20 text-red-300";
}

export type RoleNavItem = {
  label: string;
  path: string;
  icon: string;
};
