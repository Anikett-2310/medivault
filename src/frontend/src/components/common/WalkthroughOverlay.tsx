import type { WalkthroughRole, WalkthroughStep } from "@/hooks/useWalkthrough";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";

const ROLE_ACCENT: Record<WalkthroughRole, string> = {
  patient: "var(--color-role-patient)",
  pharmacy: "var(--color-role-pharmacy)",
  hospital: "var(--color-role-hospital)",
  diagnostic: "var(--color-role-diagnostic)",
  admin: "var(--color-role-admin)",
};

const ROLE_SURFACE: Record<WalkthroughRole, string> = {
  patient: "var(--color-role-patient-surface)",
  pharmacy: "var(--color-role-pharmacy-surface)",
  hospital: "var(--color-role-hospital-surface)",
  diagnostic: "var(--color-role-diagnostic-surface)",
  admin: "var(--color-role-admin-surface)",
};

interface WalkthroughOverlayProps {
  steps: WalkthroughStep[];
  currentStepIndex: number;
  isActive: boolean;
  onNext: () => void;
  onPrev: () => void;
  onDismiss: () => void;
}

export function WalkthroughOverlay({
  steps,
  currentStepIndex,
  isActive,
  onNext,
  onPrev,
  onDismiss,
}: WalkthroughOverlayProps) {
  const currentStep = steps[currentStepIndex] ?? null;
  const totalSteps = steps.length;
  const highlightedRef = useRef<Element | null>(null);

  // Inject / remove walkthrough-highlight class on target element
  useEffect(() => {
    // Remove from previous target
    if (highlightedRef.current) {
      highlightedRef.current.classList.remove("walkthrough-highlight");
      highlightedRef.current = null;
    }

    if (!isActive || !currentStep?.targetSelector) return;

    const target = document.querySelector(currentStep.targetSelector);
    if (target) {
      target.classList.add("walkthrough-highlight");
      highlightedRef.current = target;
      target.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    return () => {
      if (highlightedRef.current) {
        highlightedRef.current.classList.remove("walkthrough-highlight");
        highlightedRef.current = null;
      }
    };
  }, [isActive, currentStep?.targetSelector]);

  if (!currentStep) return null;

  const role = currentStep.role;
  const accentColor = ROLE_ACCENT[role];
  const surfaceColor = ROLE_SURFACE[role];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === totalSteps - 1;

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.dialog
          key={currentStep.id}
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed bottom-6 right-6 z-[9999] w-80 max-w-[calc(100vw-2rem)] m-0"
          aria-modal="true"
          aria-label={`Walkthrough step ${currentStepIndex + 1} of ${totalSteps}`}
          data-ocid="walkthrough.panel"
          open
        >
          <div
            className="rounded-xl border border-border shadow-xl overflow-hidden"
            style={{
              background: `oklch(${surfaceColor})`,
              boxShadow: `var(--shadow-xl), 0 0 0 1px oklch(${accentColor} / 0.15)`,
            }}
          >
            {/* Header bar with role accent */}
            <div
              className="flex items-center justify-between px-4 py-2.5 border-b border-border/50"
              style={{ borderBottomColor: `oklch(${accentColor} / 0.2)` }}
            >
              {/* Step indicator */}
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold leading-none"
                  style={{
                    background: `oklch(${accentColor})`,
                    color: "var(--color-text-on-accent)",
                  }}
                >
                  {currentStepIndex + 1}
                </div>
                <span className="text-xs text-muted-foreground font-medium tracking-wide">
                  of {totalSteps}
                </span>
              </div>

              {/* Progress dots */}
              <div className="flex items-center gap-1 flex-1 justify-center mx-3">
                {steps.map((step, i) => (
                  <div
                    key={step.id}
                    className="transition-all duration-200"
                    style={{
                      width: i === currentStepIndex ? "14px" : "5px",
                      height: "5px",
                      borderRadius: "9999px",
                      background:
                        i === currentStepIndex
                          ? `oklch(${accentColor})`
                          : i < currentStepIndex
                            ? `oklch(${accentColor} / 0.45)`
                            : "var(--color-border-base)",
                    }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={onDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors rounded p-0.5 -mr-0.5"
                aria-label="Dismiss walkthrough"
                data-ocid="walkthrough.close_button"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 pt-3 pb-2" aria-live="polite">
              <h3
                className="text-sm font-semibold text-foreground mb-1 leading-snug"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {currentStep.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {currentStep.description}
              </p>
            </div>

            {/* Actions */}
            <div
              className="flex items-center justify-between px-4 pt-1 pb-3"
              style={{ paddingBottom: "env(safe-area-inset-bottom, 0.75rem)" }}
            >
              <button
                type="button"
                onClick={onDismiss}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="walkthrough.skip_button"
              >
                Skip tour
              </button>

              <div className="flex items-center gap-1.5">
                {!isFirst && (
                  <button
                    type="button"
                    onClick={onPrev}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    aria-label="Previous step"
                    data-ocid="walkthrough.prev_button"
                  >
                    <ChevronLeft size={13} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onNext}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 hover:opacity-90 active:scale-95"
                  style={{
                    background: `oklch(${accentColor})`,
                    color: "var(--color-text-on-accent)",
                  }}
                  data-ocid="walkthrough.next_button"
                >
                  {isLast ? "Finish" : "Next"}
                  {!isLast && <ChevronRight size={12} />}
                </button>
              </div>
            </div>
          </div>
        </motion.dialog>
      )}
    </AnimatePresence>
  );
}

export default WalkthroughOverlay;
