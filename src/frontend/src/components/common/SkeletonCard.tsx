import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  lines?: number;
  showIcon?: boolean;
}

export function SkeletonCard({
  className,
  lines = 2,
  showIcon = true,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-5 flex items-start gap-4",
        className,
      )}
    >
      {showIcon && <Skeleton className="w-11 h-11 rounded-xl shrink-0" />}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-24" />
        {Array.from({ length: lines }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey:
          <Skeleton key={i} className={`h-3 ${i === 0 ? "w-full" : "w-3/4"}`} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonStat({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-5 flex items-start gap-4",
        className,
      )}
    >
      <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
