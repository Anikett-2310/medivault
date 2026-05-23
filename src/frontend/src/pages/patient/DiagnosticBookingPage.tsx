import { BookingStatus, type DiagnosticBooking } from "@/backend";
import { createActor } from "@/backend";
import { EmptyState } from "@/components/common/EmptyState";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { cn } from "@/lib/utils";
import { useActor } from "@caffeineai/core-infrastructure";
import { Principal } from "@dfinity/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FlaskConical,
  RefreshCw,
  TestTube2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const GLASS =
  "bg-[var(--color-bg-elevated)] backdrop-blur-sm border border-[var(--color-border-base)] rounded-xl";

const TEST_TYPES = [
  "Blood Test",
  "Urine Analysis",
  "X-Ray",
  "MRI Scan",
  "CT Scan",
  "ECG",
  "Lipid Profile",
  "Thyroid Panel",
  "Liver Function Test",
  "Kidney Function Test",
  "HbA1c",
  "COVID-19 PCR",
  "Other",
];

const STATUS_META: Record<BookingStatus, { label: string; badge: string }> = {
  [BookingStatus.Booked]: {
    label: "Booked",
    badge: "badge-blue",
  },
  [BookingStatus.Confirmed]: {
    label: "Confirmed",
    badge: "badge-teal",
  },
  [BookingStatus.InProgress]: {
    label: "In Progress",
    badge: "badge-warning",
  },
  [BookingStatus.Completed]: {
    label: "Completed",
    badge: "badge-success",
  },
  [BookingStatus.ReportUploaded]: {
    label: "Report Ready",
    badge: "badge-purple",
  },
};

function useMyDiagnosticBookings() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<DiagnosticBooking[]>({
    queryKey: ["myDiagnosticBookings"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyDiagnosticBookings();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

function useCreateDiagnosticBooking() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      testType: string;
      preferredDate: string;
      reason: string | null;
    }) => {
      if (!actor) throw new Error("Not connected");
      const labPrincipal = Principal.fromText("aaaaa-aa");
      const res = await actor.createDiagnosticBooking(
        labPrincipal,
        vars.testType,
        vars.preferredDate,
        vars.reason,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["myDiagnosticBookings"] }),
  });
}

export default function DiagnosticBookingPage() {
  const { data: bookings, isLoading } = useMyDiagnosticBookings();
  const createBooking = useCreateDiagnosticBooking();

  const [testType, setTestType] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  function handleSubmit() {
    if (!testType) {
      toast.error("Please select a test type");
      return;
    }
    if (!preferredDate) {
      toast.error("Please select a preferred date");
      return;
    }
    if (new Date(preferredDate) < new Date(today)) {
      toast.error("Preferred date cannot be in the past");
      return;
    }

    createBooking.mutate(
      { testType, preferredDate, reason: reason.trim() || null },
      {
        onSuccess: () => {
          toast.success("Diagnostic test booked successfully!");
          setSubmitted(true);
          setTestType("");
          setPreferredDate("");
          setReason("");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to book test. Please try again.");
        },
      },
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-2xl font-bold gradient-text">
          Book Diagnostic Test
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Schedule laboratory tests and track their status in real time.
        </p>
      </motion.div>

      {/* Booking form */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={cn(GLASS, "p-6 space-y-5")}
        data-ocid="patient.diagnostics.booking_form"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center">
            <TestTube2 size={18} className="text-teal-300" />
          </div>
          <p className="font-semibold text-foreground">New Booking</p>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="test-type"
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            Test Type *
          </label>
          <select
            id="test-type"
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-foreground focus:outline-none focus:border-teal-500/50 text-sm transition-colors"
            data-ocid="patient.diagnostics.test_type_select"
          >
            <option value="" disabled>
              Select a test type…
            </option>
            {TEST_TYPES.map((t) => (
              <option key={t} value={t} className="bg-card text-foreground">
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="preferred-date"
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            Preferred Date *
          </label>
          <input
            id="preferred-date"
            type="date"
            value={preferredDate}
            min={today}
            onChange={(e) => setPreferredDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-foreground focus:outline-none focus:border-teal-500/50 text-sm transition-colors"
            data-ocid="patient.diagnostics.preferred_date_input"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="reason"
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            Reason / Notes{" "}
            <span className="text-muted-foreground/60 normal-case font-normal">
              (optional)
            </span>
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Describe symptoms or doctor's recommendation…"
            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-teal-500/50 text-sm transition-colors resize-none"
            data-ocid="patient.diagnostics.reason_textarea"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={createBooking.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          data-ocid="patient.diagnostics.submit_button"
        >
          {createBooking.isPending ? (
            <RefreshCw size={15} className="animate-spin" />
          ) : (
            <Calendar size={15} />
          )}
          {createBooking.isPending ? "Booking…" : "Book Test"}
        </button>
      </motion.div>

      {/* Success confirmation */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 px-5 py-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10"
          data-ocid="patient.diagnostics.success_state"
        >
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          <p className="text-sm font-semibold text-emerald-300">
            Booking submitted! The lab will confirm your appointment shortly.
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* My bookings */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={cn(GLASS, "p-5")}
        data-ocid="patient.diagnostics.bookings_section"
      >
        <h2 className="font-display font-bold text-foreground mb-4">
          My Bookings
        </h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <SkeletonCard key={n} lines={2} />
            ))}
          </div>
        ) : !bookings?.length ? (
          <EmptyState
            icon={<ClipboardList size={24} />}
            title="No bookings yet"
            description="Book your first diagnostic test above."
            data-ocid="patient.diagnostics.empty_state"
          />
        ) : (
          <div className="space-y-3">
            {bookings.map((booking: DiagnosticBooking, i) => {
              const meta = STATUS_META[booking.status];
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start justify-between p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-elevated)] transition-colors gap-3"
                  data-ocid={`patient.diagnostics.booking.${i + 1}`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center shrink-0">
                      <FlaskConical size={16} className="text-teal-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {booking.testType}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Preferred: {booking.preferredDate}
                      </p>
                      {booking.reason && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {booking.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={cn(meta.badge)}>{meta.label}</span>
                    {booking.status === BookingStatus.ReportUploaded &&
                      booking.reportUrl && (
                        <a
                          href={booking.reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 mt-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors font-semibold"
                          data-ocid={`patient.diagnostics.view_report.${i + 1}`}
                        >
                          <ExternalLink size={11} /> View Report
                        </a>
                      )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
