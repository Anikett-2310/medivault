import { MedicineCategory } from "@/backend";
import { EmptyState } from "@/components/common/EmptyState";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInventoryMutation, usePharmacyInventory } from "@/hooks/useBackend";
import useDebounce from "@/hooks/useDebounce";
import { useFormValidation } from "@/hooks/useFormValidation";
import { INVENTORY_STATUS_META, getInventoryStatus } from "@/types";
import { Edit2, Package, Plus, Search, Trash2, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

type CategoryFilter = "All" | keyof typeof MedicineCategory;
type StatusFilter =
  | "All"
  | "Safe"
  | "LowStock"
  | "ExpiringSoon"
  | "Expired"
  | "CriticalStock";

interface FormState {
  medicineName: string;
  stockQuantity: string;
  minThreshold: string;
  maxThreshold: string;
  expiryDate: string;
  category: MedicineCategory;
}

const EMPTY_FORM: FormState = {
  medicineName: "",
  stockQuantity: "",
  minThreshold: "",
  maxThreshold: "",
  expiryDate: "",
  category: MedicineCategory.Tablet,
};

const CATEGORIES = Object.values(MedicineCategory);

function StockBar({
  stock,
  min,
  max,
}: {
  stock: bigint;
  min: bigint;
  max: bigint;
}) {
  const pct =
    max > 0
      ? Math.min(100, Math.round((Number(stock) / Number(max)) * 100))
      : 0;
  const isLow = stock < min;
  const isCritical = max > 0 && Number(stock) / Number(max) < 0.15;
  const barColor = isCritical
    ? "bg-red-400"
    : isLow
      ? "bg-orange-400"
      : pct > 60
        ? "bg-emerald-400"
        : "bg-yellow-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span
        className={`text-xs tabular-nums font-semibold ${
          isCritical
            ? "text-red-400"
            : isLow
              ? "text-orange-400"
              : "text-foreground"
        }`}
      >
        {String(stock)}
      </span>
    </div>
  );
}

export default function InventoryPage() {
  const { data: inventory = [], isLoading } = usePharmacyInventory();
  const { create, update, remove } = useInventoryMutation();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const debouncedSearch = useDebounce(search, 300);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [searchFocused, setSearchFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { validateAll: _validateAll } = useFormValidation<
    Record<string, string>
  >({}, {});
  void _validateAll;

  function validateForm(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!editId && form.medicineName.trim().length < 2)
      errs.medicineName = "Name must be at least 2 characters";
    const qty = Number(form.stockQuantity);
    if (form.stockQuantity === "" || !Number.isInteger(qty) || qty < 0)
      errs.stockQuantity = "Stock must be a whole number ≥ 0";
    const price = Number(form.minThreshold);
    if (form.minThreshold === "" || Number.isNaN(price) || price < 0)
      errs.minThreshold = "Threshold must be a number ≥ 0";
    const maxP = Number(form.maxThreshold);
    if (form.maxThreshold === "" || Number.isNaN(maxP) || maxP < 0)
      errs.maxThreshold = "Threshold must be a number ≥ 0";
    if (form.expiryDate) {
      const date = new Date(form.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (Number.isNaN(date.getTime()) || date <= today)
        errs.expiryDate = "Expiry date must be a future date";
    } else {
      errs.expiryDate = "Expiry date is required";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // Compute status for each item once, memoize
  const itemsWithStatus = inventory.map((item) => ({
    ...item,
    inventoryStatus: getInventoryStatus(
      item.expiryDate,
      item.stockQuantity,
      item.minThreshold,
    ),
  }));

  // Summary counts by status
  const statusCounts: Record<StatusFilter, number> = {
    All: inventory.length,
    Safe: 0,
    LowStock: 0,
    ExpiringSoon: 0,
    Expired: 0,
    CriticalStock: 0,
  };
  for (const item of itemsWithStatus) {
    statusCounts[item.inventoryStatus]++;
  }

  const filtered = itemsWithStatus.filter((item) => {
    const matchSearch = item.medicineName
      .toLowerCase()
      .includes(debouncedSearch.toLowerCase());
    const matchCat =
      categoryFilter === "All" || item.category === categoryFilter;
    const matchStatus =
      statusFilter === "All" || item.inventoryStatus === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const hasActiveFilters =
    debouncedSearch.length > 0 ||
    categoryFilter !== "All" ||
    statusFilter !== "All";

  function clearFilters() {
    setSearch("");
    setCategoryFilter("All");
    setStatusFilter("All");
  }

  function openAdd() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(id: string) {
    const item = inventory.find((i) => i.id === id);
    if (!item) return;
    setEditId(id);
    setForm({
      medicineName: item.medicineName,
      stockQuantity: String(item.stockQuantity),
      minThreshold: String(item.minThreshold),
      maxThreshold: String(item.maxThreshold),
      expiryDate: new Date(Number(item.expiryDate)).toISOString().slice(0, 10),
      category: item.category,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setIsSubmitting(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const expiryMs = BigInt(new Date(form.expiryDate).getTime());
      if (editId) {
        await update.mutateAsync({
          id: editId,
          stockQuantity: BigInt(form.stockQuantity),
          minThreshold: BigInt(form.minThreshold),
          maxThreshold: BigInt(form.maxThreshold),
          expiryDate: expiryMs,
        });
        toast.success("Inventory item updated");
      } else {
        await create.mutateAsync({
          medicineName: form.medicineName,
          stockQuantity: BigInt(form.stockQuantity),
          minThreshold: BigInt(form.minThreshold),
          maxThreshold: BigInt(form.maxThreshold),
          expiryDate: expiryMs,
          category: form.category,
        });
        toast.success("Item added to inventory");
      }
      closeModal();
    } catch {
      toast.error("Failed to save inventory item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await remove.mutateAsync(id);
      toast.success("Item removed from inventory");
    } catch {
      toast.error("Failed to remove item. Please try again.");
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-display font-bold gradient-text">
            Inventory
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your pharmacy stock
          </p>
        </div>
      </motion.div>

      {/* Status summary cards */}
      {!isLoading && inventory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
          data-ocid="inventory.status_summary"
        >
          {(
            [
              "Safe",
              "LowStock",
              "ExpiringSoon",
              "Expired",
              "CriticalStock",
            ] as StatusFilter[]
          ).map((s, i) => {
            const meta =
              INVENTORY_STATUS_META[s as keyof typeof INVENTORY_STATUS_META];
            const count = statusCounts[s];
            const isActive = statusFilter === s;
            return (
              <motion.button
                key={s}
                type="button"
                onClick={() => setStatusFilter(isActive ? "All" : s)}
                data-ocid={`inventory.status_summary.${s.toLowerCase()}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className={`glass-card p-3 rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 ${
                  isActive
                    ? `${meta.border} ${meta.bg} shadow-md`
                    : "border-border hover:border-border/60"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {meta.label}
                  </span>
                </div>
                <p className="text-2xl font-display font-bold text-foreground">
                  {count}
                </p>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="inv-search"
              placeholder="Search medicines…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={`pl-9 bg-muted border-border/40 backdrop-blur-sm transition-all duration-300 ${
                searchFocused
                  ? "border-cyan-500/50 shadow-[0_0_0_3px_oklch(0.72_0.17_195/0.15)]"
                  : ""
              }`}
              data-ocid="inventory.search_input"
            />
          </div>
          {/* Category filters */}
          <div className="flex gap-1.5 flex-wrap items-start">
            {(["All", ...CATEGORIES] as CategoryFilter[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                data-ocid={`inventory.filter.${cat.toLowerCase()}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  categoryFilter === cat
                    ? "gradient-brand text-white shadow-md"
                    : "bg-muted border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        {/* Status filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {(
            [
              "All",
              "Safe",
              "LowStock",
              "ExpiringSoon",
              "Expired",
              "CriticalStock",
            ] as StatusFilter[]
          ).map((sf) => {
            const isActive = statusFilter === sf;
            const meta =
              sf !== "All"
                ? INVENTORY_STATUS_META[
                    sf as keyof typeof INVENTORY_STATUS_META
                  ]
                : null;
            return (
              <button
                key={sf}
                type="button"
                onClick={() => setStatusFilter(sf)}
                data-ocid={`inventory.status_filter.${sf.toLowerCase()}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? meta
                      ? `${meta.badge} shadow-md`
                      : "gradient-brand text-white shadow-md"
                    : "bg-muted border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                {sf === "All"
                  ? "All Status"
                  : sf === "CriticalStock"
                    ? "Critical"
                    : sf === "LowStock"
                      ? "Low Stock"
                      : sf === "ExpiringSoon"
                        ? "Expiring Soon"
                        : sf}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count + clear filters */}
      {!isLoading && inventory.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing{" "}
            <span className="text-foreground font-semibold">
              {filtered.length}
            </span>{" "}
            of{" "}
            <span className="text-foreground font-semibold">
              {inventory.length}
            </span>{" "}
            items
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              data-ocid="inventory.clear_filters_button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-400 border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors duration-200"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Table / loading / empty */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey:
            <SkeletonCard key={i} lines={3} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="w-7 h-7" />}
          title={
            hasActiveFilters
              ? "No items match your filters"
              : "No inventory items yet"
          }
          description={
            hasActiveFilters
              ? "Try adjusting your search term, category, or stock filter to find what you're looking for."
              : "Add your first medicine to start tracking inventory, stock levels, and expiry dates."
          }
          action={
            hasActiveFilters
              ? { label: "Clear filters", onClick: clearFilters }
              : { label: "Add First Item", onClick: openAdd }
          }
        />
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "Medicine",
                    "Category",
                    "Stock",
                    "Min / Max",
                    "Expiry",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const invStatus = item.inventoryStatus;
                  const meta = INVENTORY_STATUS_META[invStatus];
                  const expiryText = new Date(
                    Number(item.expiryDate),
                  ).toLocaleDateString();
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`border-b border-border/50 hover:bg-muted transition-colors ${meta.bg}`}
                      data-ocid={`inventory.item.${idx + 1}`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground text-sm">
                          {item.medicineName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className="text-xs bg-muted border-border/40"
                        >
                          {item.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <StockBar
                          stock={item.stockQuantity}
                          min={item.minThreshold}
                          max={item.maxThreshold}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">
                        {String(item.minThreshold)} /{" "}
                        {String(item.maxThreshold)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-sm font-medium ${
                            invStatus === "Expired"
                              ? "text-red-400"
                              : invStatus === "ExpiringSoon"
                                ? "text-amber-400"
                                : "text-muted-foreground"
                          }`}
                        >
                          {expiryText}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.badge}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}
                          />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(item.id)}
                            aria-label="Edit item"
                            data-ocid={`inventory.edit_button.${idx + 1}`}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-cyan-400 hover:bg-cyan-400/10 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            aria-label="Delete item"
                            data-ocid={`inventory.delete_button.${idx + 1}`}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FAB */}
      <motion.button
        type="button"
        onClick={openAdd}
        data-ocid="inventory.add_button"
        aria-label="Add inventory item"
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full gradient-brand text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-200 z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        style={{ boxShadow: "0 0 32px oklch(0.65 0.20 220 / 0.4)" }}
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Add / Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-bg-overlay)] backdrop-blur-sm"
          role="presentation"
          onKeyDown={(e) => e.key === "Escape" && closeModal()}
          data-ocid="inventory.dialog"
        >
          <motion.div
            className="w-full max-w-md glass-card rounded-2xl p-6 shadow-2xl"
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <h2 className="text-lg font-display font-bold gradient-text mb-5">
              {editId ? "Edit Inventory Item" : "Add New Item"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="inv-name"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Medicine Name
                </label>
                <Input
                  id="inv-name"
                  value={form.medicineName}
                  onChange={(e) =>
                    setForm({ ...form, medicineName: e.target.value })
                  }
                  disabled={!!editId}
                  placeholder="e.g. Amoxicillin 500mg"
                  onBlur={() => {
                    if (
                      !editId &&
                      form.medicineName.trim().length > 0 &&
                      form.medicineName.trim().length < 2
                    )
                      setFormErrors((p) => ({
                        ...p,
                        medicineName: "Name must be at least 2 characters",
                      }));
                    else
                      setFormErrors((p) => ({ ...p, medicineName: undefined }));
                  }}
                  className="bg-muted border-border/40"
                  data-ocid="inventory.name_input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="inv-stock"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Stock Qty
                  </label>
                  <Input
                    id="inv-stock"
                    type="number"
                    min="0"
                    value={form.stockQuantity}
                    onChange={(e) =>
                      setForm({ ...form, stockQuantity: e.target.value })
                    }
                    required
                    className="bg-muted border-border/40"
                    data-ocid="inventory.stock_input"
                  />
                  {formErrors.stockQuantity && (
                    <p className="text-xs text-red-400 mt-1">
                      {formErrors.stockQuantity}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="inv-min"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Min Threshold
                  </label>
                  <Input
                    id="inv-min"
                    type="number"
                    min="0"
                    value={form.minThreshold}
                    onChange={(e) =>
                      setForm({ ...form, minThreshold: e.target.value })
                    }
                    required
                    className="bg-muted border-border/40"
                    data-ocid="inventory.min_input"
                  />
                  {formErrors.minThreshold && (
                    <p className="text-xs text-red-400 mt-1">
                      {formErrors.minThreshold}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="inv-max"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Max Threshold
                  </label>
                  <Input
                    id="inv-max"
                    type="number"
                    min="0"
                    value={form.maxThreshold}
                    onChange={(e) =>
                      setForm({ ...form, maxThreshold: e.target.value })
                    }
                    required
                    className="bg-muted border-border/40"
                    data-ocid="inventory.max_input"
                  />
                  {formErrors.maxThreshold && (
                    <p className="text-xs text-red-400 mt-1">
                      {formErrors.maxThreshold}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="inv-expiry"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Expiry Date
                  </label>
                  <Input
                    id="inv-expiry"
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) =>
                      setForm({ ...form, expiryDate: e.target.value })
                    }
                    required
                    className="bg-muted border-border/40"
                    data-ocid="inventory.expiry_input"
                  />
                  {formErrors.expiryDate && (
                    <p className="text-xs text-red-400 mt-1">
                      {formErrors.expiryDate}
                    </p>
                  )}
                </div>
              </div>
              {!editId && (
                <div>
                  <label
                    htmlFor="inv-category"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Category
                  </label>
                  <select
                    id="inv-category"
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value as MedicineCategory,
                      })
                    }
                    className="w-full bg-muted border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                    data-ocid="inventory.category_select"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="flex-1 btn-gradient-glow text-white"
                  disabled={
                    create.isPending || update.isPending || isSubmitting
                  }
                  data-ocid="inventory.submit_button"
                >
                  {editId ? "Update Item" : "Add Item"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="border-border/40 hover:bg-muted/30"
                  data-ocid="inventory.cancel_button"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
