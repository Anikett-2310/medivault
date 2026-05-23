"use client";
import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";
import { Check, Clock, X } from "lucide-react";
import type * as React from "react";

const timelineVariants = cva("relative flex flex-col", {
  variants: {
    variant: {
      default: "gap-4",
      compact: "gap-2",
      spacious: "gap-8",
    },
  },
  defaultVariants: { variant: "default" },
});

const timelineIconVariants = cva(
  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-background text-xs font-medium",
  {
    variants: {
      status: {
        default: "border-border text-muted-foreground",
        completed: "border-primary bg-primary text-primary-foreground",
        active: "border-primary bg-background text-primary animate-pulse",
        pending: "border-muted-foreground/30 text-muted-foreground",
        error: "border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: { status: "default" },
  },
);

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp?: string | Date;
  status?: "default" | "completed" | "active" | "pending" | "error";
  icon?: React.ReactNode;
  content?: React.ReactNode;
}

export interface TimelineProps extends VariantProps<typeof timelineVariants> {
  items: TimelineItem[];
  className?: string;
  showConnectors?: boolean;
  showTimestamps?: boolean;
}

function getStatusIcon(status: TimelineItem["status"]) {
  switch (status) {
    case "completed":
      return <Check className="h-3 w-3" />;
    case "active":
    case "pending":
      return <Clock className="h-3 w-3" />;
    case "error":
      return <X className="h-3 w-3" />;
    default:
      return <div className="h-2 w-2 rounded-full bg-current" />;
  }
}

function formatTimestamp(timestamp: string | Date): string {
  if (!timestamp) return "";
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MediTimeline({
  items,
  className,
  variant,
  showConnectors = true,
  showTimestamps = true,
}: TimelineProps) {
  return (
    <div className={className}>
      <div className={cn(timelineVariants({ variant }))}>
        {items.map((item, index) => (
          <div key={item.id} className="relative flex gap-3 pb-2 flex-row">
            {showConnectors && index < items.length - 1 && (
              <div
                className={cn(
                  "absolute left-3 top-9 h-full w-px bg-border",
                  item.status === "completed" && "bg-primary",
                  item.status === "error" && "bg-destructive",
                  item.status === "pending" && "bg-muted-foreground/30",
                )}
              />
            )}
            <div className="relative z-10 flex shrink-0">
              <div
                className={cn(timelineIconVariants({ status: item.status }))}
              >
                {item.icon ?? getStatusIcon(item.status)}
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {showTimestamps && item.timestamp && (
                <time className="text-xs text-muted-foreground">
                  {formatTimestamp(item.timestamp)}
                </time>
              )}
              <h3 className="font-medium leading-tight text-sm">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              )}
              {item.content && <div className="mt-2">{item.content}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MediTimeline;
