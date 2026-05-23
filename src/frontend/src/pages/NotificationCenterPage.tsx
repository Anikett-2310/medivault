import type { NotificationRecord } from "@/backend";
import { NotifType } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMyNotifications,
} from "@/hooks/useBackend";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Bell,
  BellOff,
  CalendarCheck,
  CalendarClock,
  Check,
  CheckCheck,
  Clock,
  FileText,
  Package,
  Pill,
  ShieldAlert,
  Warehouse,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────

type FilterTab = "All" | "Unread" | NotifType;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "All", label: "All" },
  { key: "Unread", label: "Unread" },
  { key: NotifType.MedicineSynced, label: "Medicine Synced" },
  { key: NotifType.LowStock, label: "Low Stock" },
  { key: NotifType.ReportReady, label: "Report Ready" },
  { key: NotifType.BookingConfirmed, label: "Booking Confirmed" },
  { key: NotifType.BookingCompleted, label: "Booking Completed" },
  { key: NotifType.ReminderMissed, label: "Reminder Missed" },
];

// ── Icon + color per notification type ────────────────────────────────────────

function getNotifMeta(type: NotifType, role?: string) {
  switch (type) {
    case NotifType.MedicineSynced:
      return {
        icon: <Pill size={18} />,
        color: "text-[var(--color-accent-teal)]",
        bg: "bg-[var(--color-accent-teal)]/15",
        border: "border-[var(--color-accent-teal)]/30",
        label: "Medicine Synced",
      };
    case NotifType.LowStock:
      return {
        icon:
          role === "Pharmacy" ? <Warehouse size={18} /> : <Package size={18} />,
        color: "text-[var(--color-status-warning)]",
        bg: "bg-[color-mix(in_oklch,var(--color-role-pharmacy)_15%,transparent)]",
        border:
          "border-[color-mix(in_oklch,var(--color-role-pharmacy)_25%,transparent)]",
        label: "Low Stock",
      };
    case NotifType.ExpiringSoon:
      return {
        icon: <Clock size={18} />,
        color: "text-[var(--color-status-warning)]",
        bg: "bg-[color-mix(in_oklch,var(--color-status-warning)_15%,transparent)]",
        border:
          "border-[color-mix(in_oklch,var(--color-status-warning)_25%,transparent)]",
        label: "Expiring Soon",
      };
    case NotifType.ReportReady:
      return {
        icon: <FileText size={18} />,
        color: "text-[var(--color-status-success)]",
        bg: "bg-[color-mix(in_oklch,var(--color-status-success)_15%,transparent)]",
        border:
          "border-[color-mix(in_oklch,var(--color-status-success)_25%,transparent)]",
        label: "Report Ready",
      };
    case NotifType.BookingConfirmed:
      return {
        icon: <CalendarCheck size={18} />,
        color: "text-[var(--color-role-diagnostic)]",
        bg: "bg-[color-mix(in_oklch,var(--color-role-diagnostic)_15%,transparent)]",
        border:
          "border-[color-mix(in_oklch,var(--color-role-diagnostic)_25%,transparent)]",
        label: "Booking Confirmed",
      };
    case NotifType.BookingCompleted:
      return {
        icon: <CalendarClock size={18} />,
        color: "text-[var(--color-status-info)]",
        bg: "bg-[color-mix(in_oklch,var(--color-status-info)_15%,transparent)]",
        border:
          "border-[color-mix(in_oklch,var(--color-status-info)_25%,transparent)]",
        label: "Booking Completed",
      };
    case NotifType.ReminderMissed:
      return {
        icon: <AlertCircle size={18} />,
        color: "text-[var(--color-status-danger)]",
        bg: "bg-[color-mix(in_oklch,var(--color-status-danger)_15%,transparent)]",
        border:
          "border-[color-mix(in_oklch,var(--color-status-danger)_25%,transparent)]",
        label: "Reminder Missed",
      };
    case NotifType.ConsentChanged:
      return {
        icon: <ShieldAlert size={18} />,
        color: "text-[var(--color-role-diagnostic)]",
        bg: "bg-[color-mix(in_oklch,var(--color-role-diagnostic)_15%,transparent)]",
        border:
          "border-[color-mix(in_oklch,var(--color-role-diagnostic)_25%,transparent)]",
        label: "Consent Changed",
      };
    default:
      return {
        icon: <Bell size={18} />,
        color: "text-muted-foreground",
        bg: "bg-muted",
        border: "border-border",
        label: "Notification",
      };
  }
}

// ── Relative timestamp ────────────────────────────────────────────────────────

function relativeTime(createdAt: bigint): string {
  const diffMs = Date.now() - Number(createdAt) / 1_000_000;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
  return new Date(Number(createdAt) / 1_000_000).toLocaleDateString();
}

// ── Grouping logic ────────────────────────────────────────────────────────────

function getGroup(createdAt: bigint): "Today" | "This Week" | "Older" {
  const diffMs = Date.now() - Number(createdAt) / 1_000_000;
  const diffHr = diffMs / (1000 * 60 * 60);
  if (diffHr < 24) return "Today";
  if (diffHr < 168) return "This Week";
  return "Older";
}

// ── Notification Card ─────────────────────────────────────────────────────────

interface NotifCardProps {
  notif: NotificationRecord;
  index: number;
  role?: string;
  onRead: (id: string) => void;
}

function NotifCard({ notif, index, role, onRead }: NotifCardProps) {
  const meta = getNotifMeta(notif.notifType as NotifType, role);

  return (
    <button
      type="button"
      data-ocid={`notification.item.${index}`}
      tabIndex={0}
      onClick={() => !notif.isRead && onRead(notif.id)}
      onKeyDown={(e) => e.key === "Enter" && !notif.isRead && onRead(notif.id)}
      className={cn(
        "relative flex items-start gap-4 px-5 py-4 rounded-xl border transition-all duration-200 cursor-pointer group w-full text-left",
        "backdrop-blur-sm",
        notif.isRead
          ? "bg-card/40 border-border/40 opacity-70 hover:opacity-100 hover:bg-card/60"
          : [
              "bg-card/80 border-transparent",
              "shadow-[0_0_0_1px_color-mix(in_oklch,var(--color-role-patient)_35%,transparent),0_4px_24px_color-mix(in_oklch,var(--color-role-patient)_8%,transparent)]",
              "hover:shadow-[0_0_0_1px_color-mix(in_oklch,var(--color-role-patient)_55%,transparent),0_4px_32px_color-mix(in_oklch,var(--color-role-patient)_15%,transparent)]",
            ],
      )}
    >
      {/* Unread glow accent bar */}
      {!notif.isRead && (
        <span
          className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full bg-[var(--color-accent-teal)]"
          aria-hidden="true"
        />
      )}

      {/* Icon bubble */}
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border",
          meta.bg,
          meta.border,
          meta.color,
        )}
      >
        {meta.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-wide",
                  meta.color,
                )}
              >
                {meta.label}
              </span>
              {!notif.isRead && (
                <span
                  className="w-2 h-2 rounded-full bg-[var(--color-accent-teal)] animate-pulse"
                  aria-label="Unread"
                />
              )}
            </div>
            <p className="text-sm text-foreground leading-snug break-words">
              {notif.message}
            </p>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
            {relativeTime(notif.createdAt)}
          </span>
        </div>
      </div>

      {/* Mark read button (unread only) */}
      {!notif.isRead && (
        <button
          type="button"
          data-ocid={`notification.mark_read.${index}`}
          onClick={(e) => {
            e.stopPropagation();
            onRead(notif.id);
          }}
          className="flex-shrink-0 w-7 h-7 rounded-lg bg-[var(--color-bg-surface)] hover:bg-[var(--color-accent-teal)]/20 border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-teal)]/40 flex items-center justify-center text-muted-foreground hover:text-[var(--color-accent-teal)] transition-all"
          aria-label="Mark as read"
          title="Mark as read"
        >
          <Check size={13} />
        </button>
      )}
    </button>
  );
}

// ── Group Section ─────────────────────────────────────────────────────────────

function NotifGroup({
  label,
  items,
  role,
  onRead,
  startIndex,
}: {
  label: string;
  items: NotificationRecord[];
  role?: string;
  onRead: (id: string) => void;
  startIndex: number;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1 pt-2">
        {label}
      </h3>
      {items.map((n, i) => (
        <NotifCard
          key={n.id}
          notif={n}
          index={startIndex + i + 1}
          role={role}
          onRead={onRead}
        />
      ))}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div
      data-ocid="notification.empty_state"
      className="flex flex-col items-center justify-center py-20 text-center gap-4"
    >
      <div className="w-16 h-16 rounded-2xl bg-card/60 border border-[var(--color-border-subtle)] flex items-center justify-center">
        <BellOff size={28} className="text-muted-foreground" />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">
          {filtered ? "No matching notifications" : "You're all caught up!"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {filtered
            ? "Try a different filter to see more."
            : "New notifications will appear here when actions happen across the system."}
        </p>
      </div>
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────

function NotifSkeleton() {
  return (
    <div className="space-y-3">
      {["sk-1", "sk-2", "sk-3", "sk-4", "sk-5"].map((skId) => (
        <div
          key={skId}
          className="flex items-start gap-4 p-4 rounded-xl border border-border/40 bg-card/40 animate-pulse"
        >
          <div className="w-10 h-10 rounded-full bg-[var(--color-bg-elevated)] shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[var(--color-bg-elevated)] rounded w-3/4" />
            <div className="h-3 bg-[var(--color-bg-elevated)] rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function NotificationCenterPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: notifications = [], isLoading, isError } = useMyNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const filtered = useMemo(() => {
    const sorted = [...notifications].sort(
      (a, b) => Number(b.createdAt) - Number(a.createdAt),
    );
    if (activeFilter === "All") return sorted;
    if (activeFilter === "Unread") return sorted.filter((n) => !n.isRead);
    return sorted.filter((n) => (n.notifType as NotifType) === activeFilter);
  }, [notifications, activeFilter]);

  const grouped = useMemo(() => {
    const today: NotificationRecord[] = [];
    const week: NotificationRecord[] = [];
    const older: NotificationRecord[] = [];
    for (const n of filtered) {
      const g = getGroup(n.createdAt);
      if (g === "Today") today.push(n);
      else if (g === "This Week") week.push(n);
      else older.push(n);
    }
    return { today, week, older };
  }, [filtered]);

  function handleMarkRead(id: string) {
    markRead.mutate(id, {
      onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
      onError: () => toast.error("Failed to mark notification as read"),
    });
  }

  function handleMarkAll() {
    markAll.mutate(undefined, {
      onSuccess: (count) => {
        qc.invalidateQueries({ queryKey: ["notifications"] });
        qc.invalidateQueries({ queryKey: ["unreadNotifCount"] });
        toast.success(
          `${count} notification${Number(count) !== 1 ? "s" : ""} marked as read`,
        );
      },
      onError: () => toast.error("Failed to mark all as read"),
    });
  }

  const isEmpty = !isLoading && filtered.length === 0;
  const isFiltered = activeFilter !== "All";

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div
        className="sticky top-0 z-10 bg-card/80 backdrop-blur-xl px-6 py-4"
        style={{
          borderBottom: "1px solid transparent",
          borderImage:
            "linear-gradient(to right, color-mix(in oklch, var(--color-role-patient) 30%, transparent), color-mix(in oklch, var(--color-role-patient) 20%, transparent), transparent) 1",
        }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/30 to-cyan-400/20 border border-[var(--color-accent-teal)]/30 flex items-center justify-center">
                <Bell size={20} className="text-[var(--color-accent-teal)]" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-foreground leading-none">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {unreadCount} unread
                  </p>
                )}
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-ocid="notification.mark_all_read.button"
                onClick={handleMarkAll}
                disabled={markAll.isPending}
                className="gap-2 border-[var(--color-accent-teal)]/30 text-[var(--color-accent-teal)] hover:bg-[var(--color-accent-teal)]/10 hover:border-[var(--color-accent-teal)]/50"
              >
                <CheckCheck size={15} />
                Mark All as Read
              </Button>
            )}
          </div>

          {/* Filter tabs */}
          <div
            className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin"
            data-ocid="notification.filter.tab"
          >
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.key;
              const isUnreadTab = tab.key === "Unread";
              return (
                <button
                  type="button"
                  key={tab.key}
                  data-ocid={`notification.filter.${tab.key.toLowerCase().replace(/\s+/g, "_")}`}
                  onClick={() => setActiveFilter(tab.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 border",
                    isActive
                      ? "bg-[var(--color-accent-teal)]/20 text-[var(--color-accent-teal)] border-[var(--color-accent-teal)]/40"
                      : "bg-card/40 text-muted-foreground border-border/40 hover:bg-card/70 hover:text-foreground",
                  )}
                >
                  {tab.label}
                  {isUnreadTab && unreadCount > 0 && (
                    <Badge className="text-[10px] h-4 min-w-[1rem] px-1 bg-[var(--color-accent-teal)] text-white border-0">
                      {unreadCount}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {isLoading && <NotifSkeleton />}

        {isError && (
          <div
            data-ocid="notification.error_state"
            className="flex flex-col items-center gap-3 py-16 text-center"
          >
            <AlertCircle size={32} className="text-destructive" />
            <p className="text-sm text-muted-foreground">
              Failed to load notifications. Please try again.
            </p>
          </div>
        )}

        {!isLoading &&
          !isError &&
          (isEmpty ? (
            <EmptyState filtered={isFiltered} />
          ) : (
            <>
              <NotifGroup
                label="Today"
                items={grouped.today}
                role={user?.role as string}
                onRead={handleMarkRead}
                startIndex={0}
              />
              <NotifGroup
                label="This Week"
                items={grouped.week}
                role={user?.role as string}
                onRead={handleMarkRead}
                startIndex={grouped.today.length}
              />
              <NotifGroup
                label="Older"
                items={grouped.older}
                role={user?.role as string}
                onRead={handleMarkRead}
                startIndex={grouped.today.length + grouped.week.length}
              />
            </>
          ))}
      </div>
    </div>
  );
}

export default NotificationCenterPage;
