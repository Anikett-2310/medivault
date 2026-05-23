import type { ActivityEventView } from "@/backend";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useRef } from "react";

interface DateGroupSectionProps {
  label: string;
  events: ActivityEventView[];
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function DateGroupSection({
  label,
  events,
  isExpanded,
  onToggle,
  children,
}: DateGroupSectionProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  if (events.length === 0) return null;

  const _unreadCount = events.filter(
    (_e) =>
      // unread detection delegated to parent, just show count
      false,
  ).length;

  return (
    <div
      className="mb-4"
      data-ocid={`timeline.group.${label.toLowerCase().replace(/\s+/g, "_")}`}
    >
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-3 w-full px-4 py-2.5 group transition-colors duration-[var(--duration-base)] hover:bg-[oklch(var(--color-bg-muted)/0.4)] rounded-lg"
        aria-expanded={isExpanded}
      >
        <div className="h-px flex-1 bg-[var(--color-border-muted)] group-hover:bg-[var(--color-border-base)] transition-colors" />
        <span className="flex items-center gap-2">
          <span className="label-clinical text-[oklch(var(--color-text-tertiary))]">
            {label}
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-[oklch(var(--color-bg-muted))] text-[oklch(var(--color-text-tertiary))] text-[10px] font-medium leading-none border border-[var(--color-border-muted)]">
            {events.length}
          </span>
        </span>
        <div className="h-px flex-1 bg-[var(--color-border-muted)] group-hover:bg-[var(--color-border-base)] transition-colors" />
        <ChevronDown
          size={14}
          className={cn(
            "text-muted-foreground transition-transform duration-300 flex-shrink-0",
            isExpanded ? "rotate-0" : "-rotate-90",
          )}
        />
      </button>

      {/* Collapsible content */}
      <div
        ref={contentRef}
        className={cn(
          "overflow-hidden transition-all ease-[var(--ease-operational)]",
          "duration-[var(--duration-slow)]",
          isExpanded ? "opacity-100" : "opacity-0 max-h-0",
        )}
        style={isExpanded ? {} : { maxHeight: 0 }}
      >
        <div className="space-y-2 px-4 pb-2">{children}</div>
      </div>
    </div>
  );
}
