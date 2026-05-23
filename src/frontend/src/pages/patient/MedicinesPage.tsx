import { MedicineCategory } from "@/backend";
import { EmptyState } from "@/components/common/EmptyState";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMedicineMutation, useMyMedicines } from "@/hooks/useBackend";
import useDebounce from "@/hooks/useDebounce";
import { useFormValidation } from "@/hooks/useFormValidation";
import { getMedicineStatus } from "@/types";
import type { Medicine, MedicineStatus } from "@/types";
import {
  AlertTriangle,
  CheckCircle2,
  Edit2,
  PillIcon,
  Plus,
  QrCode,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type CategoryFilter = "All" | MedicineCategory;
type ExpiryFilter = "All" | "Safe" | "ExpiringSoon" | "Expired";

const EXPIRY_PILLS: { value: ExpiryFilter; label: string }[] = [
  { value: "All", label: "All" },
  { value: "Safe", label: "Safe" },
  { value: "ExpiringSoon", label: "Expiring Soon" },
  { value: "Expired", label: "Expired" },
];

const STATUS_CONFIG: Record<
  MedicineStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  Safe: {
    label: "Safe",
    color:
      "bg-[var(--color-status-success)]/20 text-[var(--color-status-success)] border-[var(--color-status-success)]/30",
    icon: <CheckCircle2 size={12} />,
  },
  ExpiringSoon: {
    label: "Expiring Soon",
    color:
      "bg-[var(--color-status-warning)]/20 text-[var(--color-status-warning)] border-[var(--color-status-warning)]/30",
    icon: <AlertTriangle size={12} />,
  },
  Expired: {
    label: "Expired",
    color:
      "bg-[var(--color-status-danger)]/20 text-[var(--color-status-danger)] border-[var(--color-status-danger)]/30",
    icon: <XCircle size={12} />,
  },
};

function QRModal({
  medicine,
  onClose,
}: { medicine: Medicine; onClose: () => void }) {
  const qrData = encodeURIComponent(
    JSON.stringify({
      id: medicine.id,
      name: medicine.name,
      dosage: medicine.dosage,
      expiryDate: String(medicine.expiryDate),
    }),
  );
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg-overlay)] backdrop-blur-sm"
      role="presentation"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="bg-card border border-border rounded-2xl p-6 w-80 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <QrCode size={18} className="text-primary" /> QR Code
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close QR modal"
          >
            <X size={18} />
          </button>
        </div>
        <img
          src={qrUrl}
          alt={`QR code for ${medicine.name}`}
          width={200}
          height={200}
          className="mx-auto rounded-lg border border-border block"
        />
        <p className="text-center text-xs text-muted-foreground mt-3">
          {medicine.name} · {medicine.dosage}
        </p>
        <p className="text-center text-xs font-mono text-primary/60 mt-1 truncate">
          {medicine.id}
        </p>
        <a
          href={`${qrUrl}&format=png`}
          download={`qr-${medicine.name.replace(/\s+/g, "-").toLowerCase()}.png`}
          className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
        >
          <QrCode size={14} /> Download QR
        </a>
      </div>
    </div>
  );
}

type FormValues = {
  name: string;
  dosage: string;
  frequency: string;
  expiryDate: string;
  category: MedicineCategory;
};

const EMPTY_FORM: FormValues = {
  name: "",
  dosage: "",
  frequency: "",
  expiryDate: "",
  category: MedicineCategory.Tablet,
};

const MEDICINE_RULES = {
  name: [
    { type: "required" as const },
    { type: "minLength" as const, value: 2 },
    { type: "maxLength" as const, value: 100 },
  ],
  dosage: [{ type: "required" as const }, { type: "dosage" as const }],
  frequency: [{ type: "required" as const }],
  expiryDate: [{ type: "required" as const }, { type: "futureDate" as const }],
};

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p
      className="mt-1 text-xs text-[var(--color-status-danger)] flex items-center gap-1 fade-in-up"
      role="alert"
    >
      <XCircle size={11} className="shrink-0" />
      {error}
    </p>
  );
}

function MedicineModal({
  initial,
  onSave,
  onClose,
  loading,
}: {
  initial?: Medicine;
  onSave: (v: FormValues) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const initialFormValues: FormValues = initial
    ? {
        name: initial.name,
        dosage: initial.dosage,
        frequency: initial.frequency,
        expiryDate: new Date(Number(initial.expiryDate))
          .toISOString()
          .split("T")[0],
        category: initial.category,
      }
    : EMPTY_FORM;

  const { values, errors, handleChange, handleBlur, validateAll } =
    useFormValidation(initialFormValues, MEDICINE_RULES);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;
    onSave({ ...values, category: values.category as MedicineCategory });
  };

  const isSubmitDisabled =
    loading ||
    !values.name.trim() ||
    !values.dosage.trim() ||
    !values.frequency.trim() ||
    !values.expiryDate;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg-overlay)] backdrop-blur-sm p-4"
      role="presentation"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-foreground">
            {initial ? "Edit Medicine" : "Add Medicine"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="med-name">Medicine Name</Label>
            <Input
              id="med-name"
              value={values.name}
              onChange={(e) => handleChange("name", e.target.value)}
              onBlur={() => handleBlur("name")}
              placeholder="e.g. Metformin"
              className={`mt-1 ${errors.name ? "border-[var(--color-status-danger)]/50 focus-visible:ring-[var(--color-status-danger)]/30" : ""}`}
              data-ocid="medicine.name_input"
              aria-describedby={errors.name ? "med-name-error" : undefined}
            />
            <FieldError error={errors.name} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="med-dosage">Dosage</Label>
              <Input
                id="med-dosage"
                value={values.dosage}
                onChange={(e) => handleChange("dosage", e.target.value)}
                onBlur={() => handleBlur("dosage")}
                placeholder="e.g. 500mg"
                className={`mt-1 ${errors.dosage ? "border-[var(--color-status-danger)]/50 focus-visible:ring-[var(--color-status-danger)]/30" : ""}`}
                data-ocid="medicine.dosage_input"
              />
              <FieldError error={errors.dosage} />
            </div>
            <div>
              <Label htmlFor="med-frequency">Frequency</Label>
              <Input
                id="med-frequency"
                value={values.frequency}
                onChange={(e) => handleChange("frequency", e.target.value)}
                onBlur={() => handleBlur("frequency")}
                placeholder="e.g. Twice daily"
                className={`mt-1 ${errors.frequency ? "border-[var(--color-status-danger)]/50 focus-visible:ring-[var(--color-status-danger)]/30" : ""}`}
                data-ocid="medicine.frequency_input"
              />
              <FieldError error={errors.frequency} />
            </div>
          </div>
          <div>
            <Label htmlFor="med-expiry">Expiry Date</Label>
            <Input
              id="med-expiry"
              type="date"
              value={values.expiryDate}
              onChange={(e) => handleChange("expiryDate", e.target.value)}
              onBlur={() => handleBlur("expiryDate")}
              className={`mt-1 ${errors.expiryDate ? "border-[var(--color-status-danger)]/50 focus-visible:ring-[var(--color-status-danger)]/30" : ""}`}
              data-ocid="medicine.expiry_input"
            />
            <FieldError error={errors.expiryDate} />
          </div>
          <div>
            <Label htmlFor="med-category">Category</Label>
            <Select
              value={values.category}
              onValueChange={(v) =>
                handleChange("category", v as MedicineCategory)
              }
            >
              <SelectTrigger
                id="med-category"
                className="mt-1"
                data-ocid="medicine.category_select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(MedicineCategory).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              data-ocid="medicine.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitDisabled}
              data-ocid="medicine.save_button"
            >
              {loading ? "Saving..." : initial ? "Update" : "Add Medicine"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MedicinesPage() {
  const { data: medicines = [], isLoading } = useMyMedicines();
  const { create, update, remove } = useMedicineMutation();
  const [search, setSearch] = useState("");
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>("All");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editMed, setEditMed] = useState<Medicine | null>(null);
  const [qrMed, setQrMed] = useState<Medicine | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const filtered = medicines.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      m.dosage.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchCategory =
      categoryFilter === "All" || m.category === categoryFilter;
    const matchExpiry =
      expiryFilter === "All" ||
      getMedicineStatus(m.expiryDate) === expiryFilter;
    return matchSearch && matchCategory && matchExpiry;
  });

  const hasActiveFilters =
    debouncedSearch !== "" ||
    expiryFilter !== "All" ||
    categoryFilter !== "All";

  const clearFilters = () => {
    setSearch("");
    setExpiryFilter("All");
    setCategoryFilter("All");
  };

  const handleCreate = (v: FormValues) => {
    create.mutate(
      {
        ...v,
        expiryDate: BigInt(new Date(v.expiryDate).getTime()),
        category: v.category,
      },
      {
        onSuccess: (res) => {
          if (res.__kind__ === "ok") {
            toast.success("Medicine added successfully");
            setShowAdd(false);
          } else toast.error(`Add medicine failed: ${res.err}`);
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : "Unknown error";
          toast.error(`Add medicine failed: ${msg}`, {
            action: { label: "Retry", onClick: () => handleCreate(v) },
          });
        },
      },
    );
  };

  const handleUpdate = (v: FormValues) => {
    if (!editMed) return;
    update.mutate(
      {
        id: editMed.id,
        ...v,
        expiryDate: BigInt(new Date(v.expiryDate).getTime()),
        category: v.category,
      },
      {
        onSuccess: (res) => {
          if (res.__kind__ === "ok") {
            toast.success("Medicine updated");
            setEditMed(null);
          } else toast.error(`Update failed: ${res.err}`);
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : "Unknown error";
          toast.error(`Update medicine failed: ${msg}`, {
            action: { label: "Retry", onClick: () => handleUpdate(v) },
          });
        },
      },
    );
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const id = deleteId;
    remove.mutate(id, {
      onSuccess: () => {
        toast.success("Medicine removed");
        setDeleteId(null);
      },
      onError: (err) => {
        const msg = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Delete failed: ${msg}`, {
          action: {
            label: "Retry",
            onClick: () => {
              setDeleteId(id);
              handleDelete();
            },
          },
        });
      },
    });
  };

  const safeCount = medicines.filter(
    (m) => getMedicineStatus(m.expiryDate) === "Safe",
  ).length;
  const expiringSoonCount = medicines.filter(
    (m) => getMedicineStatus(m.expiryDate) === "ExpiringSoon",
  ).length;
  const expiredCount = medicines.filter(
    (m) => getMedicineStatus(m.expiryDate) === "Expired",
  ).length;

  return (
    <div
      className="p-6 space-y-6 bg-[var(--color-bg-base)] min-h-full"
      data-ocid="medicines.page"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Medicines</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {medicines.length} medicines tracked
          </p>
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          data-ocid="medicine.add_button"
          className="gap-2"
        >
          <Plus size={16} /> Add Medicine
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Safe",
            count: safeCount,
            color: "text-[var(--color-status-success)]",
            bg: "bg-[var(--color-status-success)]/10 border-[var(--color-status-success)]/20",
          },
          {
            label: "Expiring Soon",
            count: expiringSoonCount,
            color: "text-[var(--color-status-warning)]",
            bg: "bg-[var(--color-status-warning)]/10 border-[var(--color-status-warning)]/20",
          },
          {
            label: "Expired",
            count: expiredCount,
            color: "text-[var(--color-status-danger)]",
            bg: "bg-[var(--color-status-danger)]/10 border-[var(--color-status-danger)]/20",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border p-4 panel-depth-2 ${s.bg}`}
          >
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="medicine-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicines..."
              className="pl-9 focus:ring-2 focus:ring-[var(--color-role-patient)]/50 transition-all"
              data-ocid="medicines.search_input"
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}
          >
            <SelectTrigger
              className="w-full sm:w-48"
              data-ocid="medicines.category_select"
            >
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {Object.values(MedicineCategory).map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {EXPIRY_PILLS.map((pill) => (
            <button
              key={pill.value}
              type="button"
              onClick={() => setExpiryFilter(pill.value)}
              data-ocid={`medicines.expiry_filter.${pill.value.toLowerCase()}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                expiryFilter === pill.value
                  ? "gradient-brand text-white shadow-md"
                  : "bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-muted/70"
              }`}
            >
              {pill.label}
            </button>
          ))}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-1 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground bg-muted border border-border hover:bg-muted/70 transition-all duration-200 flex items-center gap-1"
              data-ocid="medicines.clear_filters_button"
            >
              <X size={11} /> Clear filters
            </button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            Showing {filtered.length} of {medicines.length} medicines
          </span>
        </div>
      </div>

      {/* Medicine Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} lines={3} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<PillIcon />}
          title={
            hasActiveFilters
              ? "No medicines match your search"
              : "No medicines found"
          }
          description={
            hasActiveFilters
              ? "Try adjusting your filters"
              : "Add your first medicine to start tracking expiry and adherence."
          }
          action={
            hasActiveFilters
              ? { label: "Clear Filters", onClick: clearFilters }
              : { label: "Add Medicine", onClick: () => setShowAdd(true) }
          }
          contextualHint="Medicines are added when a pharmacy dispenses your prescription and syncs it to your account, or you can add them manually for self-managed medications."
          data-ocid="medicines.empty_state"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((med, idx) => {
            const status = getMedicineStatus(med.expiryDate);
            const cfg = STATUS_CONFIG[status];
            const expDate = new Date(Number(med.expiryDate));
            return (
              <div
                key={med.id}
                className={`panel-depth-2 rounded-xl p-5 flex flex-col gap-3 hover:scale-[1.02] hover:border-[var(--color-role-patient)]/40 transition-all duration-200 border border-[var(--color-border-base)] ${
                  status === "Expired"
                    ? "border-l-4 border-l-[var(--color-status-danger)]"
                    : status === "ExpiringSoon"
                      ? "border-l-4 border-l-[var(--color-status-warning)]"
                      : "border-l-4 border-l-[var(--color-role-patient)]"
                }`}
                data-ocid={`medicines.item.${idx + 1}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {med.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {med.category}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}
                  >
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/40 rounded-lg p-2">
                    <p className="text-muted-foreground">Dosage</p>
                    <p className="font-medium text-foreground truncate">
                      {med.dosage}
                    </p>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-2">
                    <p className="text-muted-foreground">Frequency</p>
                    <p className="font-medium text-foreground truncate">
                      {med.frequency}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  Expires:{" "}
                  <span
                    className={
                      status === "Expired"
                        ? "text-[var(--color-status-danger)]"
                        : status === "ExpiringSoon"
                          ? "text-[var(--color-status-warning)]"
                          : "text-[var(--color-status-success)]"
                    }
                  >
                    {expDate.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1"
                    onClick={() => setQrMed(med)}
                    data-ocid={`medicines.qr_button.${idx + 1}`}
                  >
                    <QrCode size={13} /> QR
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1"
                    onClick={() => setEditMed(med)}
                    data-ocid={`medicines.edit_button.${idx + 1}`}
                  >
                    <Edit2 size={13} /> Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-[var(--color-status-danger)] hover:opacity-80 border-[var(--color-status-danger)]/20 hover:border-[var(--color-status-danger)]/40"
                    onClick={() => setDeleteId(med.id)}
                    data-ocid={`medicines.delete_button.${idx + 1}`}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showAdd && (
        <MedicineModal
          onSave={handleCreate}
          onClose={() => setShowAdd(false)}
          loading={create.isPending}
        />
      )}
      {editMed && (
        <MedicineModal
          initial={editMed}
          onSave={handleUpdate}
          onClose={() => setEditMed(null)}
          loading={update.isPending}
        />
      )}
      {qrMed && <QRModal medicine={qrMed} onClose={() => setQrMed(null)} />}

      {/* Delete confirmation */}
      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg-overlay)] backdrop-blur-sm"
          role="presentation"
          onKeyDown={(e) => e.key === "Escape" && setDeleteId(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 w-80 shadow-2xl"
            data-ocid="medicines.dialog"
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Delete Medicine?
            </h3>
            <p className="text-muted-foreground text-sm mb-5">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteId(null)}
                data-ocid="medicines.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={remove.isPending}
                data-ocid="medicines.confirm_button"
              >
                {remove.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
