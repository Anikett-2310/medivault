import { Variant_Failed_Duplicate_Success } from "@/backend";
import { EmptyState } from "@/components/common/EmptyState";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import {
  useLookupPatient,
  usePharmacySyncLogs,
  useSyncMedicineMutation,
} from "@/hooks/useBackend";
import { cn } from "@/lib/utils";
import type { PharmacySyncLog } from "@/types";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Copy,
  Info,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const GLASS =
  "bg-[var(--color-bg-elevated)] backdrop-blur-sm border border-[var(--color-border-base)] rounded-xl";

type Step = "lookup" | "form" | "confirm";

function SyncStatusBadge({
  status,
}: { status: Variant_Failed_Duplicate_Success }) {
  if (status === Variant_Failed_Duplicate_Success.Success)
    return (
      <span className="badge-success">
        <CheckCircle2 size={10} /> Success
      </span>
    );
  if (status === Variant_Failed_Duplicate_Success.Duplicate)
    return (
      <span className="badge-warning">
        <Info size={10} /> Duplicate
      </span>
    );
  return (
    <span className="badge-danger">
      <XCircle size={10} /> Failed
    </span>
  );
}

export default function PharmacySyncPage() {
  const [step, setStep] = useState<Step>("lookup");
  const [phone, setPhone] = useState("");
  const [patientName, setPatientName] = useState("");
  const [form, setForm] = useState({
    medicineName: "",
    batchNumber: "",
    expiryDate: "",
    quantity: "",
  });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: syncLogs, isLoading: logsLoading } = usePharmacySyncLogs();
  const lookupMutation = useLookupPatient();
  const syncMutation = useSyncMedicineMutation();

  function handleLookup() {
    const trimmed = phone.trim();
    if (!trimmed) {
      toast.error("Please enter a phone number");
      return;
    }
    lookupMutation.mutate(trimmed, {
      onSuccess: (data) => {
        setPatientName(data.name);
        setStep("form");
        toast.success(`Patient found: ${data.name}`);
      },
      onError: (err) => {
        toast.error(err.message || "Patient not found for that phone number");
      },
    });
  }

  function handleFormNext() {
    if (!form.medicineName.trim()) {
      toast.error("Medicine name is required");
      return;
    }
    if (!form.batchNumber.trim()) {
      toast.error("Batch number is required");
      return;
    }
    if (!form.expiryDate) {
      toast.error("Expiry date is required");
      return;
    }
    const expDate = new Date(form.expiryDate);
    if (expDate <= new Date()) {
      toast.error("Expiry date must be in the future");
      return;
    }
    const qty = Number.parseInt(form.quantity, 10);
    if (Number.isNaN(qty) || qty <= 0) {
      toast.error("Quantity must be a positive number");
      return;
    }
    setConfirmOpen(true);
  }

  function handleSync() {
    const expiryMs = BigInt(new Date(form.expiryDate).getTime());
    const qty = BigInt(Number.parseInt(form.quantity, 10));
    syncMutation.mutate(
      {
        patientPhone: phone.trim(),
        medicineName: form.medicineName.trim(),
        batchNumber: form.batchNumber.trim(),
        expiryDate: expiryMs,
        quantity: qty,
      },
      {
        onSuccess: (log) => {
          setConfirmOpen(false);
          if (log.status === Variant_Failed_Duplicate_Success.Duplicate) {
            toast.warning(
              "Duplicate sync — this medicine was already synced to this patient recently.",
            );
          } else if (log.status === Variant_Failed_Duplicate_Success.Failed) {
            toast.error(`Sync failed: ${log.errorMessage ?? "Unknown error"}`);
          } else {
            toast.success(`Medicine synced successfully to ${patientName}!`);
          }
          setStep("lookup");
          setPhone("");
          setPatientName("");
          setForm({
            medicineName: "",
            batchNumber: "",
            expiryDate: "",
            quantity: "",
          });
        },
        onError: (err) => {
          setConfirmOpen(false);
          toast.error(err.message || "Sync failed. Please try again.");
        },
      },
    );
  }

  const recentLogs = (syncLogs ?? []).slice(0, 10);

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-2xl font-bold gradient-text">
          Sync Medicine to Patient
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enter a patient's registered phone number to automatically sync
          dispensed medicines to their account.
        </p>
      </motion.div>

      {/* Step indicator */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center gap-2"
      >
        {(["lookup", "form"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                step === s || (step === "confirm" && i < 2)
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : i === 0 && step !== "lookup"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-[var(--color-bg-surface)] text-muted-foreground border border-[var(--color-border-subtle)]",
              )}
            >
              {i === 0 && step !== "lookup" ? (
                <CheckCircle2 size={14} />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={cn(
                "text-xs font-medium",
                step === s ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s === "lookup" ? "Find Patient" : "Medicine Details"}
            </span>
            {i < 1 && (
              <ArrowRight size={14} className="text-muted-foreground" />
            )}
          </div>
        ))}
      </motion.div>

      {/* Step 1 – Phone lookup */}
      <AnimatePresence mode="wait">
        {step === "lookup" && (
          <motion.div
            key="lookup"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            className={cn(GLASS, "p-6 space-y-4")}
            data-ocid="pharmacy.sync.lookup_card"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Phone size={18} className="text-cyan-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Patient Phone Lookup
                </p>
                <p className="text-xs text-muted-foreground">
                  Match by registered phone number
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <label
                htmlFor="patient-phone"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                Phone Number
              </label>
              <input
                id="patient-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 text-sm transition-colors"
                data-ocid="pharmacy.sync.phone_input"
              />
            </div>
            <button
              type="button"
              onClick={handleLookup}
              disabled={lookupMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-ocid="pharmacy.sync.lookup_button"
            >
              {lookupMutation.isPending ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <Search size={15} />
              )}
              {lookupMutation.isPending ? "Looking up…" : "Look Up Patient"}
            </button>
          </motion.div>
        )}

        {/* Step 2 – Medicine form */}
        {step === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className={cn(GLASS, "p-6 space-y-5")}
            data-ocid="pharmacy.sync.medicine_form"
          >
            {/* Patient found banner */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <User size={15} className="text-emerald-300" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-emerald-400 font-semibold">
                  Patient Found
                </p>
                <p className="text-sm font-bold text-foreground truncate">
                  {patientName}
                </p>
                <p className="text-xs text-muted-foreground">{phone}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep("lookup");
                  setPatientName("");
                }}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                data-ocid="pharmacy.sync.change_patient_button"
              >
                Change
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="medicine-name"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Medicine Name *
                </label>
                <input
                  id="medicine-name"
                  type="text"
                  value={form.medicineName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, medicineName: e.target.value }))
                  }
                  placeholder="e.g. Metformin 500mg"
                  className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-cyan-500/50 text-sm transition-colors"
                  data-ocid="pharmacy.sync.medicine_name_input"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="batch-number"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Batch Number *
                </label>
                <input
                  id="batch-number"
                  type="text"
                  value={form.batchNumber}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, batchNumber: e.target.value }))
                  }
                  placeholder="e.g. BT-20251201"
                  className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-cyan-500/50 text-sm transition-colors"
                  data-ocid="pharmacy.sync.batch_number_input"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="expiry-date"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Expiry Date *
                </label>
                <input
                  id="expiry-date"
                  type="date"
                  value={form.expiryDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, expiryDate: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-foreground focus:outline-none focus:border-cyan-500/50 text-sm transition-colors"
                  data-ocid="pharmacy.sync.expiry_date_input"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="quantity"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Quantity *
                </label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, quantity: e.target.value }))
                  }
                  placeholder="e.g. 30"
                  className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-cyan-500/50 text-sm transition-colors"
                  data-ocid="pharmacy.sync.quantity_input"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep("lookup")}
                className="px-4 py-2.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-[var(--color-bg-muted)] transition-colors"
                data-ocid="pharmacy.sync.back_button"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFormNext}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors"
                data-ocid="pharmacy.sync.review_button"
              >
                Review & Sync <ArrowRight size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation dialog */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg-overlay)] backdrop-blur-sm p-4"
            data-ocid="pharmacy.sync.confirm_dialog"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-[var(--color-border-subtle)] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-cyan-300" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground">
                    Confirm Sync
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Review before syncing to patient
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-[var(--color-border-subtle)]">
                  <span className="text-muted-foreground">Patient</span>
                  <span className="font-semibold text-foreground">
                    {patientName}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--color-border-subtle)]">
                  <span className="text-muted-foreground">Medicine</span>
                  <span className="font-semibold text-foreground">
                    {form.medicineName}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--color-border-subtle)]">
                  <span className="text-muted-foreground">Batch</span>
                  <span className="font-semibold text-foreground font-mono">
                    {form.batchNumber}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--color-border-subtle)]">
                  <span className="text-muted-foreground">Expiry</span>
                  <span className="font-semibold text-foreground">
                    {new Date(form.expiryDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-semibold text-foreground">
                    {form.quantity} units
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  data-ocid="pharmacy.sync.cancel_button"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={syncMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                  data-ocid="pharmacy.sync.confirm_button"
                >
                  {syncMutation.isPending ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  {syncMutation.isPending ? "Syncing…" : "Confirm Sync"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sync Logs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(GLASS, "p-5")}
        data-ocid="pharmacy.sync.logs_section"
      >
        <h2 className="font-display font-bold text-foreground mb-4">
          Recent Sync Logs
        </h2>
        {logsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <SkeletonCard key={n} lines={2} />
            ))}
          </div>
        ) : recentLogs.length === 0 ? (
          <EmptyState
            icon={<AlertCircle size={24} />}
            title="No sync history"
            description="Medicine syncs will appear here once you start syncing."
          />
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log: PharmacySyncLog, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                data-ocid={`pharmacy.sync.log.${i + 1}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {log.medicineName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Batch: <span className="font-mono">{log.batchNumber}</span>{" "}
                    · Qty: {String(log.quantity)}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <SyncStatusBadge status={log.status} />
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(Number(log.syncedAt)).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
