import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  contextualHint?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  contextualHint,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-8",
        "glass-card",
        className,
      )}
      data-ocid="empty_state"
      aria-live="polite"
    >
      {icon && (
        <div className="relative w-20 h-20 rounded-full gradient-brand flex items-center justify-center mb-6 shadow-lg">
          <div className="absolute inset-0 rounded-full gradient-brand opacity-30 blur-lg" />
          <span className="relative text-white [&>svg]:w-12 [&>svg]:h-12">
            {icon}
          </span>
        </div>
      )}
      <h3 className="font-display font-semibold text-lg gradient-text mb-2.5">
        {title}
      </h3>
      {description && (
        <p className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-3">
          {description}
        </p>
      )}
      {contextualHint && (
        <p className="text-muted-foreground/70 text-xs italic max-w-sm leading-relaxed mb-7 border-l-2 border-border pl-3 text-left">
          {contextualHint}
        </p>
      )}
      {!contextualHint && description && <div className="mb-4" />}
      {action && (
        <Button
          onClick={action.onClick}
          className="gradient-brand text-white border-0 shadow-lg hover:opacity-90 transition-smooth"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
