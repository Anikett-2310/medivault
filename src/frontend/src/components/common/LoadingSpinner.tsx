import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  overlay?: boolean;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  overlay = false,
  className,
}: LoadingSpinnerProps) {
  const sizeMap = { sm: 16, md: 24, lg: 32 } as const;
  const px = sizeMap[size];

  const spinner = (
    <Loader2
      width={px}
      height={px}
      className="animate-spin text-primary"
      aria-hidden="true"
    />
  );

  if (overlay) {
    return (
      <output
        aria-label="Loading..."
        className={cn(
          "glass-card flex items-center justify-center rounded-2xl p-6",
          className,
        )}
      >
        {spinner}
        <span className="sr-only">Loading...</span>
      </output>
    );
  }

  return (
    <output
      aria-label="Loading..."
      className={cn("inline-flex items-center justify-center", className)}
    >
      {spinner}
      <span className="sr-only">Loading...</span>
    </output>
  );
}

// ── Dedicated skeleton fallbacks for heavy sections ─────────────────────────

/** Full-height skeleton for the medicine lifecycle canvas (7 stages). */
export function LifecycleCanvasSkeleton() {
  return (
    <div
      className="panel-depth-2 rounded-2xl border border-[var(--color-border-base)] p-3 sm:p-5 space-y-0 animate-pulse"
      aria-label="Loading lifecycle…"
    >
      {/* header row */}
      <div className="flex items-center gap-2 mb-5">
        <Skeleton className="w-4 h-4 rounded" />
        <Skeleton className="h-3 w-32 rounded" />
        <Skeleton className="h-5 w-20 rounded-full ml-auto" />
      </div>
      {/* 7 stage rows */}
      {Array.from({ length: 7 }, (_, i) => `stage-${i}`).map((k) => (
        <div key={k} className="flex items-start gap-3 mb-4">
          <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32 rounded" />
            <Skeleton className="h-2.5 w-48 rounded" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

/** Timeline skeleton — 5 animated event rows. */
export function TimelineEventsSkeleton() {
  return (
    <div className="space-y-3 px-4 pt-4 pb-2" aria-label="Loading timeline…">
      {Array.from({ length: 5 }, (_, i) => `evt-${i}`).map((k) => (
        <div
          key={k}
          className="glass-card rounded-2xl p-4 flex items-start gap-4 animate-pulse"
        >
          <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3.5 w-36 rounded" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <Skeleton className="h-2.5 w-full rounded" />
            <Skeleton className="h-2.5 w-3/4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Export history table skeleton — dense row layout. */
export function ExportTableSkeleton() {
  return (
    <div
      className="rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] overflow-hidden animate-pulse"
      aria-label="Loading export history…"
    >
      {/* header */}
      <div className="grid grid-cols-6 gap-4 px-4 py-3 border-b border-[var(--color-border-base)] bg-[var(--color-bg-muted)]">
        {Array.from({ length: 6 }, (_, i) => `th-${i}`).map((k) => (
          <Skeleton key={k} className="h-2.5 rounded" />
        ))}
      </div>
      {/* rows */}
      {Array.from({ length: 6 }, (_, i) => `row-${i}`).map((rowKey, i) => (
        <div
          key={rowKey}
          className="grid grid-cols-6 gap-4 px-4 py-3.5 border-b border-[var(--color-border-base)] last:border-0"
        >
          {Array.from({ length: 6 }, (_, j) => `cell-${i}-${j}`).map(
            (cellKey, j) => (
              <Skeleton
                key={cellKey}
                className={`h-2.5 rounded ${j === 1 ? "w-3/4" : j === 4 ? "w-14" : ""}`}
              />
            ),
          )}
        </div>
      ))}
    </div>
  );
}

/** Workflow Intelligence full-section skeleton. */
export function WorkflowSectionSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-label="Loading workflow…">
      {/* role nodes row */}
      <div className="flex gap-3 sm:grid sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => `node-${i}`).map((k) => (
          <Skeleton key={k} className="h-24 rounded-xl flex-1" />
        ))}
      </div>
      {/* edges panel */}
      <Skeleton className="h-32 rounded-xl w-full" />
      {/* chain inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="col-span-full lg:col-span-2 h-48 rounded-xl" />
      </div>
    </div>
  );
}
