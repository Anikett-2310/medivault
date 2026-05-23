import { EmptyState } from "@/components/common/EmptyState";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { Input } from "@/components/ui/input";
import { useAppointments } from "@/hooks/useBackend";
import { cn } from "@/lib/utils";
import { Calendar, ClipboardList, Search } from "lucide-react";
import { useMemo, useState } from "react";

const GLASS = "bg-card backdrop-blur-md border border-border rounded-xl";

const STATUS_BADGE: Record<string, string> = {
  pending: "badge-warning",
  confirmed: "bg-primary/15 text-primary border-primary/30",
  completed: "badge-success",
  cancelled: "badge-danger",
};

export default function HospitalPrescriptionsPage() {
  const { data: appointments = [], isLoading } = useAppointments();
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      appointments.filter((apt) =>
        apt.patientName.toLowerCase().includes(search.toLowerCase()),
      ),
    [appointments, search],
  );

  return (
    <div className="p-6 space-y-6" data-ocid="hospital-prescriptions.page">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <ClipboardList size={22} className="text-purple-400" />
          Prescriptions
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Patient prescription records and appointment notes
        </p>
      </div>

      {/* Search */}
      <div className={cn(GLASS, "p-4")}>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name..."
            className="pl-9"
            data-ocid="hospital-prescriptions.search_input"
          />
        </div>
      </div>

      {/* Table */}
      <div className={cn(GLASS, "overflow-hidden")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3.5 text-muted-foreground font-medium">
                  Patient Name
                </th>
                <th className="text-left px-5 py-3.5 text-muted-foreground font-medium">
                  Date &amp; Time
                </th>
                <th className="text-left px-5 py-3.5 text-muted-foreground font-medium hidden md:table-cell">
                  Notes
                </th>
                <th className="text-left px-5 py-3.5 text-muted-foreground font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-4">
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <SkeletonCard key={i} lines={2} />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    data-ocid="hospital-prescriptions.empty_state"
                  >
                    <EmptyState
                      icon={<ClipboardList size={28} />}
                      title="No prescriptions on record"
                      description="Prescriptions will appear here when appointments are recorded by staff."
                      className="border-0 rounded-none"
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((apt, idx) => {
                  const statusKey = apt.status.toLowerCase();
                  const badgeClass =
                    STATUS_BADGE[statusKey] ??
                    "bg-muted text-muted-foreground border-border";
                  const dateStr = new Date(
                    Number(apt.dateTime) / 1_000_000,
                  ).toLocaleDateString();

                  return (
                    <tr
                      key={apt.id}
                      className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                      data-ocid={`hospital-prescriptions.item.${idx + 1}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-500/40 to-blue-500/40 border border-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.2)]">
                            <span className="text-[11px] font-bold text-purple-100">
                              {apt.patientName?.[0]?.toUpperCase() ?? "?"}
                            </span>
                          </div>
                          <span className="font-medium text-foreground">
                            {apt.patientName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar size={13} className="shrink-0" />
                          <span>{dateStr}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-muted-foreground truncate max-w-xs block">
                          {apt.notes || "-"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize",
                            badgeClass,
                          )}
                        >
                          {apt.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
