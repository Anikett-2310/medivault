import { formatLastSynced } from "@/hooks/useOfflineQueue";
import { cn } from "@/lib/utils";
import { useOfflineStore } from "@/store/offline";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface LastSyncedLabelProps {
  className?: string;
}

export function LastSyncedLabel({ className }: LastSyncedLabelProps) {
  const lastSyncedAt = useOfflineStore((s) => s.lastSyncedAt);
  // Force re-render every 30 seconds so relative time stays fresh
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const label = formatLastSynced(lastSyncedAt);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs text-muted-foreground",
        className,
      )}
      aria-label={`Last synced: ${label}`}
    >
      <Clock size={11} className="flex-shrink-0" />
      <span>Last synced: {label}</span>
    </span>
  );
}

export default LastSyncedLabel;
