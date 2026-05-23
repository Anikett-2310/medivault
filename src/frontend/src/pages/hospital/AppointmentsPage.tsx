import { EmptyState } from "@/components/common/EmptyState";

import { SkeletonCard } from "@/components/common/SkeletonCard";
import { useAppointmentMutation, useAppointments } from "@/hooks/useBackend";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types";
import { Calendar, CheckCircle2, Clock, Plus, X, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const GLASS = "bg-card backdrop-blur-md border border-border rounded-xl";

type StatusFilter = "All" | "Scheduled" | "Completed" | "Cancelled";

const STATUS_TABS: StatusFilter[] = [
  "All",
  "Scheduled",
  "Completed",
  "Cancelled",
];

function AppointmentStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Scheduled: "bg-primary/15 text-primary border-primary/30",
    Pending: "bg-primary/15 text-primary border-primary/30",
    Completed:
      "bg-[var(--color-status-success)]/15 text-[var(--color-status-success)] border-[var(--color-status-success)]/30",
    Cancelled:
      "bg-[var(--color-status-danger)]/15 text-[var(--color-status-danger)] border-[var(--color-status-danger)]/30",
  };
  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-semibold border",
        map[status] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {status}
    </span>
  );
}

function AddAppointmentModal({ onClose }: { onClose: () => void }) {
  const { create } = useAppointmentMutation();
  const [patientName, setPatientName] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientName.trim() || !dateTime) return;
    setSaving(true);
    try {
      const ts = BigInt(new Date(dateTime).getTime());
      const res = await create.mutateAsync({
        patientName: patientName.trim(),
        dateTime: ts,
        notes: notes.trim(),
      });
      if (res.__kind__ === "ok") {
        toast.success("Appointment scheduled");
        onClose();
      } else {
        toast.error(res.err);
      }
    } catch {
      toast.error("Failed to create appointment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-bg-overlay)] backdrop-blur-sm"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      data-ocid="hospital.appointment.dialog"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-card/95 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-foreground text-lg">
            New Appointment
          </h2>
          <button
            type="button"
            data-ocid="hospital.appointment.close_button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="appt-patient-name"
              className="text-xs font-semibold text-muted-foreground mb-1.5 block"
            >
              Patient Name
            </label>
            <input
              id="appt-patient-name"
              data-ocid="hospital.appointment.patient_input"
              required
              type="text"
              placeholder="e.g. Sarah Johnson"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-purple-400/50 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="appt-datetime"
              className="text-xs font-semibold text-muted-foreground mb-1.5 block"
            >
              Date & Time
            </label>
            <input
              id="appt-datetime"
              data-ocid="hospital.appointment.datetime_input"
              required
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-purple-400/50 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="appt-notes"
              className="text-xs font-semibold text-muted-foreground mb-1.5 block"
            >
              Notes (optional)
            </label>
            <textarea
              id="appt-notes"
              data-ocid="hospital.appointment.notes_textarea"
              placeholder="Follow-up consultation…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-purple-400/50 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              data-ocid="hospital.appointment.cancel_button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-ocid="hospital.appointment.submit_button"
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-[var(--color-role-hospital)] hover:opacity-90 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Schedule"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function StatusUpdateModal({
  apt,
  onClose,
}: {
  apt: Appointment;
  onClose: () => void;
}) {
  const { updateStatus } = useAppointmentMutation();
  const [status, setStatus] = useState(apt.status);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await updateStatus.mutateAsync({ id: apt.id, status });
      if (res.__kind__ === "ok") {
        toast.success("Status updated");
        onClose();
      } else {
        toast.error(res.err);
      }
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-bg-overlay)] backdrop-blur-sm"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      data-ocid="hospital.status.dialog"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-card/95 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-foreground text-base">
            Update Status
          </h2>
          <button
            type="button"
            data-ocid="hospital.status.close_button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Patient:{" "}
          <span className="text-foreground font-medium">{apt.patientName}</span>
        </p>
        <select
          data-ocid="hospital.status.select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-purple-400/50 mb-4"
        >
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <div className="flex gap-3">
          <button
            type="button"
            data-ocid="hospital.status.cancel_button"
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            data-ocid="hospital.status.confirm_button"
            disabled={saving}
            onClick={handleSave}
            className="flex-1 py-2 rounded-lg bg-[var(--color-role-hospital)] hover:opacity-90 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AppointmentsPage() {
  const { data: appointments, isLoading } = useAppointments();
  const [filter, setFilter] = useState<StatusFilter>("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editApt, setEditApt] = useState<Appointment | null>(null);

  const filtered = (appointments ?? []).filter(
    (a) => filter === "All" || a.status === filter,
  );

  const counts = {
    All: appointments?.length ?? 0,
    Scheduled:
      appointments?.filter(
        (a) => a.status === "Scheduled" || a.status === "Pending",
      ).length ?? 0,
    Completed:
      appointments?.filter((a) => a.status === "Completed").length ?? 0,
    Cancelled:
      appointments?.filter((a) => a.status === "Cancelled").length ?? 0,
  };

  return (
    <div className="p-6 space-y-6">
      <AnimatePresence>
        {showAdd && <AddAppointmentModal onClose={() => setShowAdd(false)} />}
        {editApt && (
          <StatusUpdateModal apt={editApt} onClose={() => setEditApt(null)} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Appointments <span className="text-purple-400">📅</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Schedule and manage patient appointments
          </p>
        </div>
        <button
          type="button"
          data-ocid="hospital.appointment.open_modal_button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-role-hospital)] hover:opacity-90 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg"
        >
          <Plus size={16} />
          New Appointment
        </button>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={cn(GLASS, "p-1 flex gap-1")}
      >
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            data-ocid={`hospital.appointment.filter.${tab.toLowerCase()}`}
            onClick={() => setFilter(tab)}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
              filter === tab
                ? "bg-[var(--color-role-hospital)] text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            {tab}
            <span className="ml-1.5 text-xs opacity-70">
              {counts[tab as keyof typeof counts]}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={cn(GLASS, "overflow-hidden")}
      >
        <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-5 py-3 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span>Patient</span>
          <span>Date &amp; Time</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <SkeletonCard key={n} lines={2} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Calendar size={28} />}
            title="No appointments found"
            description="Schedule your first appointment using the button above."
            className="border-0 rounded-none"
          />
        ) : (
          <div>
            {filtered.map((apt, idx) => (
              <div
                key={apt.id}
                data-ocid={`hospital.appointment.row.${idx + 1}`}
                className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-5 py-4 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 items-center"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {apt.patientName}
                  </p>
                  {apt.notes && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {apt.notes}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-foreground">
                    {new Date(Number(apt.dateTime)).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(Number(apt.dateTime)).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <AppointmentStatusBadge status={apt.status} />
                <button
                  type="button"
                  data-ocid={`hospital.appointment.edit_button.${idx + 1}`}
                  onClick={() => setEditApt(apt)}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors px-2 py-1 rounded-lg hover:bg-muted"
                >
                  Update
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock size={12} className="text-primary" /> Scheduled = upcoming
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2
            size={12}
            className="text-[var(--color-status-success)]"
          />{" "}
          Completed = done
        </span>
        <span className="flex items-center gap-1.5">
          <XCircle size={12} className="text-[var(--color-status-danger)]" />{" "}
          Cancelled = void
        </span>
      </div>
    </div>
  );
}
