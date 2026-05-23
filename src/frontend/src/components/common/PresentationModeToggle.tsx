import { usePresentationMode } from "@/hooks/usePresentationMode";
import { Monitor, MonitorX } from "lucide-react";

export function PresentationModeToggle() {
  const { isPresentation, togglePresentationMode } = usePresentationMode();

  return (
    <div
      className="fixed bottom-5 left-5 z-50 group"
      data-ocid="presentation_mode.toggle"
    >
      {/* Tooltip */}
      <div
        role="tooltip"
        className="
          absolute bottom-full left-0 mb-2 px-2.5 py-1
          rounded text-xs font-medium whitespace-nowrap
          pointer-events-none select-none
          opacity-0 translate-y-1
          group-hover:opacity-100 group-hover:translate-y-0
          transition-all duration-200
          bg-[oklch(var(--popover)_/_1)] text-[oklch(var(--popover-foreground)_/_1)]
          border border-[oklch(var(--border)_/_1)]
          shadow-md
        "
      >
        {isPresentation ? "Exit Presentation Mode" : "Presentation Mode"}
      </div>

      {/* Button */}
      <button
        type="button"
        onClick={togglePresentationMode}
        aria-label={
          isPresentation ? "Exit Presentation Mode" : "Enter Presentation Mode"
        }
        aria-pressed={isPresentation}
        className="
          relative flex items-center justify-center
          w-9 h-9 rounded-lg
          border transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(var(--ring)_/_1)]
          focus-visible:ring-offset-1
          "
        style={{
          background: isPresentation
            ? "color-mix(in oklch, oklch(var(--primary)) 15%, oklch(var(--card)))"
            : "oklch(var(--card))",
          borderColor: isPresentation
            ? "color-mix(in oklch, oklch(var(--primary)) 40%, transparent)"
            : "oklch(var(--border))",
          color: isPresentation
            ? "oklch(var(--primary))"
            : "oklch(var(--muted-foreground))",
          boxShadow: isPresentation
            ? "0 0 0 1px color-mix(in oklch, oklch(var(--primary)) 20%, transparent)"
            : "none",
          opacity: 0.7,
        }}
      >
        {isPresentation ? (
          <MonitorX className="w-4 h-4" aria-hidden="true" />
        ) : (
          <Monitor className="w-4 h-4" aria-hidden="true" />
        )}

        {/* Active pulse indicator */}
        {isPresentation && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
            style={{
              background: "oklch(var(--primary))",
              boxShadow: "0 0 4px oklch(var(--primary) / 0.6)",
            }}
          />
        )}
      </button>
    </div>
  );
}

export default PresentationModeToggle;
