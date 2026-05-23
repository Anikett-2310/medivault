import { EmptyState } from "@/components/common/EmptyState";

import { useConsentedPatients } from "@/hooks/useBackend";
import { cn } from "@/lib/utils";
import { Calendar, ChevronUp, ClipboardList, Pill, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";

const GLASS = "bg-card backdrop-blur-md border border-border rounded-xl";

import type { ConsentRecord, UserProfile } from "@/backend";
import { SkeletonCard } from "@/components/common/SkeletonCard";

export default function PatientRecordsPage() {
  const { data: consentedRecords, isLoading } = useConsentedPatients();
  // Flatten to UserProfile[] — hook guarantees only consented patients are returned
  const allUsers: UserProfile[] = useMemo<UserProfile[]>(
    () => (consentedRecords ?? []).map((r) => r.patient),
    [consentedRecords],
  );
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // useConsentedPatients already returns only consented patients
  const patients: UserProfile[] = useMemo<UserProfile[]>(
    () => allUsers,
    [allUsers],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return patients;
    const q = search.toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q),
    );
  }, [patients, search]);

  function toggleExpand(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const totalPatients = patients.length;
  const activePatients = patients.filter((p) => p.isActive).length;

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <ClipboardList
            size={22}
            className="text-[var(--color-role-hospital,var(--color-primary))]"
          />
          Patient Records
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Medicine records across all registered patients
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(GLASS, "p-4 flex items-center gap-3")}
      >
        <Search size={16} className="text-muted-foreground shrink-0" />
        <input
          data-ocid="hospital.records.search_input"
          type="text"
          placeholder="Search by patient ID or medicine name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none focus:outline-none ring-0"
        />
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-4"
      >
        {[
          {
            label: "Total Patients",
            value: totalPatients,
            icon: <ClipboardList size={18} />,
            color:
              "bg-purple-500/15 text-[var(--color-role-lab)] border-purple-500/20",
          },
          {
            label: "Active Patients",
            value: activePatients,
            icon: <Pill size={18} />,
            color: "bg-primary/15 text-primary",
          },
          {
            label: "Inactive",
            value: totalPatients - activePatients,
            icon: <Calendar size={18} />,
            color:
              "bg-amber-500/15 text-[var(--color-status-warning)] border-amber-500/20",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={cn(GLASS, "p-4 flex items-center gap-3")}
          >
            <div
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                s.color,
              )}
            >
              {s.icon}
            </div>
            <div>
              <p className="text-xl font-display font-bold text-foreground">
                {s.value}
              </p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(GLASS, "overflow-hidden")}
      >
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span>Patient</span>
          <span className="text-right">Email</span>
          <span className="text-right">Registered</span>
          <span className="text-right">Status</span>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <SkeletonCard key={n} lines={2} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={28} />}
            title="No patient records found"
            description="Patient records will appear here once patients register."
            className="border-0 rounded-none"
          />
        ) : (
          <div>
            {filtered.map((patient, idx) => {
              const isOpen = expanded.has(patient.id);
              return (
                <div key={patient.id}>
                  <button
                    type="button"
                    data-ocid={`hospital.records.item.${idx + 1}`}
                    onClick={() => toggleExpand(patient.id)}
                    className="w-full grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-4 hover:bg-muted/50 transition-colors text-left border-b border-border/50 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {patient.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                        {patient.id.slice(0, 16)}…
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground text-right self-center truncate max-w-[140px]">
                      {patient.email}
                    </span>
                    <span className="text-xs text-muted-foreground text-right self-center whitespace-nowrap">
                      {new Date(
                        Number(patient.registrationDate),
                      ).toLocaleDateString()}
                    </span>
                    <span className="text-right self-center">
                      {isOpen ? (
                        <ChevronUp
                          size={16}
                          className="text-muted-foreground"
                        />
                      ) : (
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full border",
                            patient.isActive
                              ? "bg-[var(--color-status-success)]/15 text-[var(--color-status-success)] border-[var(--color-status-success)]/30"
                              : "bg-[var(--color-status-danger)]/15 text-[var(--color-status-danger)] border-[var(--color-status-danger)]/30",
                          )}
                        >
                          {patient.isActive ? "Active" : "Inactive"}
                        </span>
                      )}
                    </span>
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
                        <div className="px-5 pb-4 pt-2 bg-muted/40">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Role
                              </p>
                              <p className="text-sm text-foreground font-medium">
                                {patient.role}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Status
                              </p>
                              <p
                                className={cn(
                                  "text-sm font-medium",
                                  patient.isActive
                                    ? "text-[var(--color-status-success)]"
                                    : "text-[var(--color-status-danger)]",
                                )}
                              >
                                {patient.isActive ? "Active" : "Inactive"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Patient ID
                              </p>
                              <p className="text-sm text-foreground font-mono text-xs">
                                {patient.id}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
