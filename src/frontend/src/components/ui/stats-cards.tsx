import { cn } from "@/lib/utils";
import { type LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import type React from "react";

interface StatCardProps {
  title: string;
  subtitle?: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({
  title,
  subtitle,
  value,
  change,
  changeType = "positive",
  icon: Icon,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-4">
        {Icon && (
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
        {change && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              changeType === "positive" && "badge-success",
              changeType === "negative" && "badge-danger",
              changeType === "neutral" && "bg-muted text-muted-foreground",
            )}
          >
            {changeType === "positive" ? (
              <TrendingUp className="h-3 w-3" />
            ) : changeType === "negative" ? (
              <TrendingDown className="h-3 w-3" />
            ) : null}
            {change}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground/70 mb-2">{subtitle}</p>
        )}
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function StatsGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
