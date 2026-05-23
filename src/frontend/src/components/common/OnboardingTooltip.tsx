import * as Tooltip from "@radix-ui/react-tooltip";
import { HelpCircle } from "lucide-react";
import type { ReactNode } from "react";

interface OnboardingTooltipProps {
  children?: ReactNode;
  content: string;
  side?: "top" | "bottom" | "left" | "right";
}

export function OnboardingTooltip({
  children,
  content,
  side = "top",
}: OnboardingTooltipProps) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {children ?? (
            <button
              type="button"
              className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <HelpCircle size={16} />
            </button>
          )}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            sideOffset={6}
            className="glass-card text-sm text-foreground px-3 py-2 rounded-lg max-w-xs z-50 animate-in fade-in-0 zoom-in-95 shadow-xl"
          >
            {content}
            <Tooltip.Arrow className="fill-border" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

export default OnboardingTooltip;
