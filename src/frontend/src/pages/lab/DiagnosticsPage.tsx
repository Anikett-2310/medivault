import { BookingStatus, type DiagnosticBooking } from "@/backend";
import { createActor } from "@/backend";
import { EmptyState } from "@/components/common/EmptyState";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { useLabDiagnosticBookings, useLabReports } from "@/hooks/useBackend";
import { cn } from "@/lib/utils";
import type { Report } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  FileText,
  FlaskConical,
  Microscope,
  RefreshCw,
  UploadCloud,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const GLASS =
  "bg-[var(--color-bg-elevated)] backdrop-blur-sm border border-[var(--color-border-base)] rounded-xl";

const BOOKING_STATUS_META: Record<
  BookingStatus,
  { label: string; badge: string; next?: BookingStatus }
> = {
  [BookingStatus.Booked]: {
    label: "Booked",
    badge: "badge-blue",
    next: BookingStatus.Confirmed,
  },
  [BookingStatus.Confirmed]: {
    label: "Confirmed",
    badge: "badge-teal",
    next: BookingStatus.InProgress,
  },
  [BookingStatus.InProgress]: {
    label: "In Progress",
    badge: "badge-warning",
    next: BookingStatus.Completed,
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

function useUpdateBookingStatus() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      bookingId: string;
      status: BookingStatus;
      note: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const res = await actor.updateDiagnosticBookingStatus(
        vars.bookingId,
        vars.status,
        vars.note,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["labDiagnosticBookings"] }),
  });
}

function useUploadReport() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { bookingId: string; reportUrl: string }) => {
      if (!actor) throw new Error("Not connected");
      const res = await actor.uploadDiagnosticReport(
        vars.bookingId,
        vars.reportUrl,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["labDiagnosticBookings"] }),
  });
}

function BookingQueueSection() {
  const { data: bookings, isLoading } = useLabDiagnosticBookings();
  const updateStatus = useUpdateBookingStatus();
  const uploadReport = useUploadReport();
  const [reportUrls, setReportUrls] = useState<Record<string, string>>({});

  function handleAdvance(booking: DiagnosticBooking) {
    const meta = BOOKING_STATUS_META[booking.status];
    if (!meta.next) return;
    updateStatus.mutate(
      {
        bookingId: booking.id,
        status: meta.next,
        note: "Status updated by lab",
      },
      {
        onSuccess: () =>
          toast.success(
            `Status updated to ${BOOKING_STATUS_META[meta.next!].label}`,
          ),
        onError: (e) => toast.error(e.message || "Failed to update status"),
      },
    );
  }

  function handleUploadReport(booking: DiagnosticBooking) {
    const url = reportUrls[booking.id]?.trim();
    if (!url) {
      toast.error("Please enter a report URL");
      return;
    }
    uploadReport.mutate(
      { bookingId: booking.id, reportUrl: url },
      {
        onSuccess: () => {
          toast.success("Report uploaded successfully!");
          setReportUrls((p) => {
            const n = { ...p };
            delete n[booking.id];
            return n;
          });
        },
        onError: (e) => toast.error(e.message || "Failed to upload report"),
      },
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={cn(GLASS, "p-5")}
      data-ocid="lab.bookings_queue"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500/15 flex items-center justify-center">
            <FlaskConical
              size={14}
              className="text-teal-600 dark:text-teal-400"
            />
          </div>
          <h2 className="font-display font-bold text-foreground">
            Incoming Bookings
          </h2>
        </div>
        <span className="badge-teal">{bookings?.length ?? 0} bookings</span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((n) => (
            <SkeletonCard key={n} lines={2} />
          ))}
        </div>
      ) : !bookings?.length ? (
        <EmptyState
          icon={<FlaskConical size={22} />}
          title="No bookings yet"
          description="Patient diagnostic bookings will appear here."
          data-ocid="lab.bookings.empty_state"
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking: DiagnosticBooking, i) => {
            const meta = BOOKING_STATUS_META[booking.status];
            const isCompleted = booking.status === BookingStatus.Completed;
            const isReportUploaded =
              booking.status === BookingStatus.ReportUploaded;
            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-3"
                data-ocid={`lab.booking.${i + 1}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {booking.testType}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Preferred: {booking.preferredDate} · Booked{" "}
                      {new Date(Number(booking.createdAt)).toLocaleDateString()}
                    </p>
                    {booking.reason && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5 italic truncate">
                        {booking.reason}
                      </p>
                    )}
                  </div>
                  <span className={cn(meta.badge, "shrink-0")}>
                    {meta.label}
                  </span>
                </div>

                {!isReportUploaded && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {meta.next && (
                      <button
                        type="button"
                        onClick={() => handleAdvance(booking)}
                        disabled={updateStatus.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/40 text-teal-300 text-xs font-semibold transition-colors disabled:opacity-50"
                        data-ocid={`lab.booking.advance.${i + 1}`}
                      >
                        {updateStatus.isPending ? (
                          <RefreshCw size={11} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={11} />
                        )}
                        Mark as {BOOKING_STATUS_META[meta.next].label}
                      </button>
                    )}
                    {isCompleted && (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="url"
                          value={reportUrls[booking.id] ?? ""}
                          onChange={(e) =>
                            setReportUrls((p) => ({
                              ...p,
                              [booking.id]: e.target.value,
                            }))
                          }
                          placeholder="Paste report URL…"
                          className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-purple-500/50 text-xs transition-colors min-w-0"
                          data-ocid={`lab.booking.report_url.${i + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleUploadReport(booking)}
                          disabled={uploadReport.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-xs font-semibold transition-colors disabled:opacity-50 shrink-0"
                          data-ocid={`lab.booking.upload_report.${i + 1}`}
                        >
                          {uploadReport.isPending ? (
                            <RefreshCw size={11} className="animate-spin" />
                          ) : (
                            <UploadCloud size={11} />
                          )}
                          Upload
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {isReportUploaded && booking.reportUrl && (
                  <a
                    href={booking.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors font-semibold"
                  >
                    <FileText size={11} /> View Uploaded Report
                  </a>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

function ReportTypePill({ type }: { type: string }) {
  const map: Record<string, string> = {
    Diagnostic: "badge-teal",
    "Blood Test": "badge-danger",
    "X-Ray": "badge-blue",
    MRI: "badge-purple",
    Other: "badge-neutral",
  };
  return <span className={cn(map[type] ?? map.Other)}>{type}</span>;
}

interface PatientReportGroup {
  patientId: string;
  reports: Report[];
}

export default function DiagnosticsPage() {
  const { data: reports, isLoading } = useLabReports();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const groups = useMemo(() => {
    const map = new Map<string, Report[]>();
    for (const r of reports ?? []) {
      const existing = map.get(r.patientId) ?? [];
      map.set(r.patientId, [...existing, r]);
    }
    return Array.from(map.entries()).map(([patientId, reps]) => ({
      patientId,
      reports: reps.sort((a, b) => Number(b.uploadDate) - Number(a.uploadDate)),
    })) as PatientReportGroup[];
  }, [reports]);

  const thisMonth = useMemo(() => {
    const now = new Date();
    return (
      reports?.filter((r) => {
        const d = new Date(Number(r.uploadDate));
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }).length ?? 0
    );
  }, [reports]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of reports ?? []) {
      counts[r.reportType] = (counts[r.reportType] ?? 0) + 1;
    }
    return counts;
  }, [reports]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleDownloadAll(group: PatientReportGroup) {
    for (const r of group.reports) {
      window.open(r.fileUrl, "_blank");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-bold">
          Diagnostics <span className="gradient-text">🧬</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Patient report groups and diagnostic summaries
        </p>
      </motion.div>

      {/* Incoming booking queue */}
      <BookingQueueSection />

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-4"
      >
        <div className={cn(GLASS, "border-t-2 border-teal-500/60 p-4")}>
          <p className="text-2xl font-display font-bold gradient-text">
            {reports?.length ?? 0}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Total Reports</p>
        </div>
        <div className={cn(GLASS, "border-t-2 border-cyan-500/60 p-4")}>
          <p className="text-2xl font-display font-bold gradient-text">
            {thisMonth}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">This Month</p>
        </div>
        <div className={cn(GLASS, "border-t-2 border-blue-500/60 p-4")}>
          <p className="text-2xl font-display font-bold gradient-text">
            {Object.keys(typeCounts).length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Report Types</p>
        </div>
      </motion.div>

      {/* Type breakdown */}
      {Object.keys(typeCounts).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={cn(GLASS, "p-4")}
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Report Type Breakdown
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(typeCounts).map(([type, count]) => (
              <div
                key={type}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]"
              >
                <ReportTypePill type={type} />
                <span className="text-sm font-bold text-foreground">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Accordion */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} lines={2} />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={<Microscope size={28} />}
            title="No diagnostics yet"
            description="Upload lab reports to see patient groupings here."
          />
        ) : (
          groups.map((group, gi) => {
            const isOpen = expanded.has(group.patientId);
            return (
              <motion.div
                key={group.patientId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.07 }}
                data-ocid={`lab.diagnostics.group.${gi + 1}`}
                className={cn(
                  GLASS,
                  "overflow-hidden hover:border-teal-500/40 transition-colors",
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(group.patientId)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--color-bg-surface)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
                      <FileText size={14} className="text-teal-300" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">
                        Patient {group.patientId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {group.reports.length} report
                        {group.reports.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      data-ocid={`lab.diagnostics.download_all.${gi + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadAll(group);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-600/20 hover:bg-teal-600/40 text-teal-300 text-xs font-semibold transition-colors"
                    >
                      <Download size={12} /> Download All
                    </button>
                    {isOpen ? (
                      <ChevronUp size={16} className="text-muted-foreground" />
                    ) : (
                      <ChevronDown
                        size={16}
                        className="text-muted-foreground"
                      />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 border-t border-[var(--color-border-subtle)]">
                        <div className="space-y-2 pt-3">
                          {group.reports.map((r, ri) => (
                            <div
                              key={r.id}
                              data-ocid={`lab.diagnostics.report.${gi + 1}.${ri + 1}`}
                              className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)]"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <ReportTypePill type={r.reportType} />
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {r.id.slice(0, 8)}…
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(
                                    Number(r.uploadDate),
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <a
                                href={r.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                              >
                                View →
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}
