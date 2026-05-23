import { cn } from "@/lib/utils";
import { useOfflineStore } from "@/store/offline";
import { useEffect, useState } from "react";

type NotificationPermission = "granted" | "denied" | "default";

function getNotificationPermission(): NotificationPermission {
  if (typeof Notification === "undefined") return "denied";
  return Notification.permission as NotificationPermission;
}

interface ReminderReliabilityIndicatorProps {
  className?: string;
}

export function ReminderReliabilityIndicator({
  className,
}: ReminderReliabilityIndicatorProps) {
  const isOnline = useOfflineStore((s) => s.isOnline);
  const [permission, setPermission] = useState<NotificationPermission>(
    getNotificationPermission,
  );

  // Re-check permission when the document becomes visible
  // (user may have changed browser settings)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setPermission(getNotificationPermission());
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const isDenied = permission === "denied";

  let dotColor: string;
  let label: string;
  let containerColor: string;
  let ariaLabel: string;

  if (isDenied) {
    dotColor = "bg-red-400";
    label = "Reminders paused";
    containerColor = "bg-red-500/10 border-red-500/20 text-red-400";
    ariaLabel =
      "Reminders paused — notification permission denied. Enable in browser settings.";
  } else if (!isOnline) {
    dotColor = "bg-amber-400 animate-pulse";
    label = "Local reminders only";
    containerColor = "bg-amber-500/10 border-amber-500/20 text-amber-400";
    ariaLabel =
      "Local reminders only — using browser Notification API fallback while offline.";
  } else {
    dotColor = "bg-emerald-400 animate-pulse";
    label = "Reminders active";
    containerColor = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    ariaLabel = "Reminders active — all reminder channels are operational.";
  }

  return (
    <output
      aria-label={ariaLabel}
      title={ariaLabel}
      data-ocid="reminder.reliability.indicator"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        "border transition-colors duration-300",
        containerColor,
        className,
      )}
    >
      <span
        className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dotColor)}
      />
      <span>{label}</span>
    </output>
  );
}

export default ReminderReliabilityIndicator;
