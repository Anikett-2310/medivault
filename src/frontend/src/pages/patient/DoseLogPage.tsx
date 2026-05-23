import { EmptyState } from "@/components/common/EmptyState";
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
import {
  useAdherenceScore,
  useDoseLogMutation,
  useMyDoseLogs,
  useMyMedicines,
  useMyReminders,
} from "@/hooks/useBackend";
import { getMedicineStatus } from "@/types";
import { CheckCircle2, Clock, PillIcon, TrendingUp } from "lucide-react";
import { useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { toast } from "sonner";

const getChartColors = (): string[] => {
  const style = getComputedStyle(document.documentElement);
  return [
    `oklch(${style.getPropertyValue("--chart-1").trim()})` || "#6366f1",
    `oklch(${style.getPropertyValue("--chart-2").trim()})` || "#06b6d4",
    `oklch(${style.getPropertyValue("--chart-3").trim()})` || "#8b5cf6",
    `oklch(${style.getPropertyValue("--chart-4").trim()})` || "#10b981",
    `oklch(${style.getPropertyValue("--chart-5").trim()})` || "#f59e0b",
  ];
};

const resolveStatusColor = (cssVar: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();

function AdherenceGauge({ score }: { score: number }) {
  const fillColor =
    score >= 80
      ? `oklch(${resolveStatusColor("--color-status-success")})`
      : score >= 50
        ? `oklch(${resolveStatusColor("--color-status-warning")})`
        : `oklch(${resolveStatusColor("--color-status-danger")})`;
  const data = [
    {
      value: score,
      fill: fillColor,
    },
  ];
  const color =
    score >= 80
      ? "text-[oklch(var(--color-status-success))]"
      : score >= 50
        ? "text-[oklch(var(--color-status-warning))]"
        : "text-[oklch(var(--color-status-danger))]";
  return (
    <div className="relative flex items-center justify-center h-36">
      <ResponsiveContainer width={140} height={140}>
        <RadialBarChart
          innerRadius={45}
          outerRadius={65}
          startAngle={90}
          endAngle={-270}
          data={data}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={8}
            background={{ fill: "var(--color-bg-elevated)" }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${color}`}>{score}%</span>
        <span className="text-xs text-muted-foreground">Adherence</span>
      </div>
    </div>
  );
}

export default function DoseLogPage() {
  const { data: medicines = [], isLoading: medsLoading } = useMyMedicines();
  const [selectedMedId, setSelectedMedId] = useState("");
  const { data: doseLogs = [], isLoading: logsLoading } = useMyDoseLogs(
    selectedMedId || undefined,
  );
  const { data: adherenceScore = 0, isLoading: scoreLoading } =
    useAdherenceScore(selectedMedId);
  const { data: reminders = [] } = useMyReminders();
  const logDose = useDoseLogMutation();

  // Date range filter — default to last 30 days
  const todayStr = new Date().toISOString().split("T")[0];
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const [dateStart, setDateStart] = useState(thirtyDaysAgoStr);
  const [dateEnd, setDateEnd] = useState(todayStr);

  const isDateRangeActive =
    dateStart !== thirtyDaysAgoStr || dateEnd !== todayStr;

  const clearDateRange = () => {
    setDateStart(thirtyDaysAgoStr);
    setDateEnd(todayStr);
  };

  const selectedMed = medicines.find((m) => m.id === selectedMedId);

  /**
   * Determine if a dose being logged right now is "on time".
   * Strategy:
   *   1. Find the reminder for the selected medicine (if any).
   *   2. Parse its reminderTime ("HH:MM") and compare to now with ±30 min grace.
   *   3. If no reminder exists, default to on-time (manual log should not be penalised).
   */
  const computeIsOnTime = (): boolean => {
    const medReminder = reminders.find(
      (r) => r.medicineId === selectedMedId && r.isEnabled,
    );
    if (!medReminder) return true;
    const [hStr, mStr] = medReminder.reminderTime.split(":");
    const reminderHour = Number.parseInt(hStr ?? "0", 10);
    const reminderMinute = Number.parseInt(mStr ?? "0", 10);
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const scheduledMinutes = reminderHour * 60 + reminderMinute;
    return Math.abs(nowMinutes - scheduledMinutes) <= 30;
  };

  const handleLogDose = () => {
    if (!selectedMedId) {
      toast.error("Select a medicine first");
      return;
    }
    const now = BigInt(Date.now());
    const isOnTime = computeIsOnTime();
    logDose.mutate(
      { medicineId: selectedMedId, takenAt: now, isOnTime },
      {
        onSuccess: (res) => {
          if (res.__kind__ === "ok") toast.success("Dose logged successfully!");
          else toast.error(res.err);
        },
        onError: () => toast.error("Failed to log dose"),
      },
    );
  };

  // Derive category distribution from dose logs
  const categoryMap: Record<string, number> = {};
  for (const log of doseLogs) {
    const med = medicines.find((m) => m.id === log.medicineId);
    if (med) {
      categoryMap[med.category] = (categoryMap[med.category] ?? 0) + 1;
    }
  }
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  const onTimeCount = doseLogs.filter((l) => l.isOnTime).length;
  const lateCount = doseLogs.length - onTimeCount;

  const sortedLogs = [...doseLogs]
    .sort((a, b) => Number(b.takenAt) - Number(a.takenAt))
    .filter((log) => {
      const ts = Number(log.takenAt);
      const start = dateStart ? new Date(dateStart).getTime() : 0;
      const end = dateEnd
        ? new Date(dateEnd).getTime() + 24 * 60 * 60 * 1000 - 1
        : Number.POSITIVE_INFINITY;
      return ts >= start && ts <= end;
    });

  return (
    <div className="p-6 space-y-6" data-ocid="dose-log.page">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dose Log</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track your daily medication intake
        </p>
      </div>

      {/* Adherence Hero */}
      {!scoreLoading && selectedMedId && (
        <div className="flex flex-col items-center gap-1 py-4">
          <span className="text-5xl font-bold gradient-text">
            {Math.round(adherenceScore)}%
          </span>
          <span className="text-sm text-muted-foreground font-medium">
            Adherence Score
          </span>
        </div>
      )}

      {/* Medicine Selector + Log Button */}
      <div className="glassmorphism border border-border rounded-xl p-5">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="medicine-select">Select Medicine</Label>
            <Select value={selectedMedId} onValueChange={setSelectedMedId}>
              <SelectTrigger
                id="medicine-select"
                className="mt-1"
                data-ocid="dose-log.select"
              >
                <SelectValue placeholder="Choose a medicine..." />
              </SelectTrigger>
              <SelectContent>
                {medicines.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="flex items-center gap-2">
                      <PillIcon size={13} />
                      {m.name} — {m.dosage}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            onClick={handleLogDose}
            disabled={!selectedMedId || logDose.isPending}
            className="gap-2 min-w-36"
            data-ocid="dose-log.submit_button"
          >
            {logDose.isPending ? (
              <span className="flex items-center gap-2">
                <Clock size={14} className="animate-spin" /> Logging...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 size={14} /> Log Dose Taken
              </span>
            )}
          </Button>
        </div>

        {selectedMed && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary">{selectedMed.category}</Badge>
            <Badge variant="outline">{selectedMed.dosage}</Badge>
            <Badge variant="outline">{selectedMed.frequency}</Badge>
            <Badge
              className={`${
                getMedicineStatus(selectedMed.expiryDate) === "Safe"
                  ? "badge-success"
                  : getMedicineStatus(selectedMed.expiryDate) === "ExpiringSoon"
                    ? "badge-warning"
                    : "badge-danger"
              } border-0`}
            >
              {getMedicineStatus(selectedMed.expiryDate)}
            </Badge>
          </div>
        )}
      </div>

      {/* Adherence + Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Adherence Gauge */}
        <div className="glassmorphism border border-border rounded-xl p-5 flex flex-col items-center">
          <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <TrendingUp size={14} /> Adherence Score
          </p>
          {scoreLoading ? (
            <Skeleton className="h-36 w-36 rounded-full" />
          ) : (
            <AdherenceGauge score={Math.round(adherenceScore)} />
          )}
          {selectedMedId && (
            <p className="text-xs text-muted-foreground text-center mt-1">
              {adherenceScore >= 80
                ? "Excellent! Keep it up"
                : adherenceScore >= 50
                  ? "Good — aim for consistency"
                  : "Needs improvement"}
            </p>
          )}
        </div>

        {/* On-time stats */}
        <div className="glassmorphism border border-border rounded-xl p-5">
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Dose Timing
          </p>
          {doseLogs.length === 0 ? (
            <div className="flex items-center justify-center h-28 text-muted-foreground/40 text-sm">
              No doses logged yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie
                  data={[
                    { name: "On Time", value: onTimeCount },
                    { name: "Late", value: lateCount },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  dataKey="value"
                >
                  <Cell
                    fill={`oklch(${resolveStatusColor("--color-status-success")})`}
                  />
                  <Cell
                    fill={`oklch(${resolveStatusColor("--color-status-warning")})`}
                  />
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-bg-elevated)",
                    border: "1px solid var(--color-border-base)",
                    borderRadius: "8px",
                    color: "var(--color-text-primary)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex gap-4 justify-center text-xs mt-2">
            <span className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: `oklch(${resolveStatusColor("--color-status-success")})`,
                }}
              />{" "}
              On Time ({onTimeCount})
            </span>
            <span className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: `oklch(${resolveStatusColor("--color-status-warning")})`,
                }}
              />{" "}
              Late ({lateCount})
            </span>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="glassmorphism border border-border rounded-xl p-5">
          <p className="text-sm font-medium text-muted-foreground mb-3">
            By Category
          </p>
          {categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-28 text-muted-foreground/40 text-sm">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  dataKey="value"
                >
                  {categoryData.map((_entry, i) => {
                    const COLORS = getChartColors();
                    return (
                      <Cell
                        key={_entry.name}
                        fill={COLORS[i % COLORS.length]}
                      />
                    );
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-bg-elevated)",
                    border: "1px solid var(--color-border-base)",
                    borderRadius: "8px",
                    color: "var(--color-text-primary)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Dose History Table */}
      <div className="glassmorphism border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="font-semibold text-foreground">Dose History</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {sortedLogs.length} of {doseLogs.length} doses shown
              </p>
            </div>
            {isDateRangeActive && (
              <button
                type="button"
                onClick={clearDateRange}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-muted)] transition-all duration-200 flex items-center gap-1"
                data-ocid="dose-log.clear_date_button"
              >
                <Clock size={11} /> Reset range
              </button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-end">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">From</p>
              <Input
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                max={dateEnd}
                className="h-8 text-sm bg-input border-border"
                data-ocid="dose-log.date_start_input"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">To</p>
              <Input
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                min={dateStart}
                max={todayStr}
                className="h-8 text-sm bg-input border-border"
                data-ocid="dose-log.date_end_input"
              />
            </div>
          </div>
        </div>
        {logsLoading || medsLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="glass-card rounded-lg h-14 animate-pulse"
              />
            ))}
          </div>
        ) : sortedLogs.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 />}
            title="No doses logged yet"
            description="Select a medicine above and log your first dose to start tracking adherence."
            contextualHint="Every dose you log creates a traceable entry in your medical timeline — visible to hospitals and pharmacies you have consented to."
            data-ocid="dose-log.empty_state"
          />
        ) : (
          <div className="divide-y divide-border">
            {sortedLogs.slice(0, 20).map((log, idx) => {
              const med = medicines.find((m) => m.id === log.medicineId);
              const takenDate = new Date(Number(log.takenAt));
              return (
                <div
                  key={log.id}
                  className={`flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors ${
                    !log.isOnTime
                      ? "border-l-2 border-[var(--color-status-danger)]/50"
                      : ""
                  }`}
                  data-ocid={`dose-log.item.${idx + 1}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: log.isOnTime
                          ? `oklch(${resolveStatusColor("--color-status-success")} / 0.15)`
                          : `oklch(${resolveStatusColor("--color-status-warning")} / 0.10)`,
                      }}
                    >
                      <CheckCircle2
                        size={14}
                        style={{
                          color: log.isOnTime
                            ? `oklch(${resolveStatusColor("--color-status-success")})`
                            : `oklch(${resolveStatusColor("--color-status-warning")})`,
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {med?.name ?? "Unknown Medicine"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {med?.dosage ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-foreground">
                      {takenDate.toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {takenDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Badge
                    className={`ml-3 text-xs ${log.isOnTime ? "badge-success" : "badge-warning"}`}
                  >
                    {log.isOnTime ? "On Time" : "Late"}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
        {sortedLogs.length > 20 && (
          <p className="px-5 py-3 text-xs text-muted-foreground border-t border-border">
            Showing most recent 20 entries — {sortedLogs.length - 20} older{" "}
            {sortedLogs.length - 20 === 1 ? "entry" : "entries"} not shown
          </p>
        )}
      </div>
    </div>
  );
}
