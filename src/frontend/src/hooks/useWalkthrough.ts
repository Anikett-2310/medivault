import { useCallback, useEffect, useState } from "react";

export type WalkthroughRole =
  | "patient"
  | "pharmacy"
  | "admin"
  | "hospital"
  | "diagnostic";

export interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  role: WalkthroughRole;
  stepNumber: number;
}

interface WalkthroughState {
  activeStepIndex: number;
  isActive: boolean;
  isDismissed: boolean;
}

const storageKey = (role: WalkthroughRole) => `medivault_walkthrough_${role}`;

function loadState(role: WalkthroughRole): WalkthroughState {
  try {
    const raw = localStorage.getItem(storageKey(role));
    if (raw) return JSON.parse(raw) as WalkthroughState;
  } catch {
    // ignore
  }
  return { activeStepIndex: 0, isActive: false, isDismissed: false };
}

function saveState(role: WalkthroughRole, state: WalkthroughState) {
  try {
    localStorage.setItem(storageKey(role), JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function useWalkthrough(
  steps: WalkthroughStep[],
  role: WalkthroughRole | null,
) {
  const [state, setState] = useState<WalkthroughState>(() => {
    if (!role)
      return { activeStepIndex: 0, isActive: false, isDismissed: false };
    return loadState(role);
  });

  // Sync state when role changes
  useEffect(() => {
    if (!role) return;
    const loaded = loadState(role);
    setState(loaded);
  }, [role]);

  // Persist state changes
  useEffect(() => {
    if (!role) return;
    saveState(role, state);
  }, [role, state]);

  // Auto-start on first visit if not yet dismissed
  useEffect(() => {
    if (!role || steps.length === 0) return;
    const loaded = loadState(role);
    if (!loaded.isDismissed && !loaded.isActive) {
      setState({ activeStepIndex: 0, isActive: true, isDismissed: false });
    }
  }, [role, steps.length]);

  const startWalkthrough = useCallback((targetRole: WalkthroughRole) => {
    const s = { activeStepIndex: 0, isActive: true, isDismissed: false };
    setState(s);
    saveState(targetRole, s);
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.activeStepIndex + 1;
      if (nextIndex >= steps.length) {
        return {
          activeStepIndex: prev.activeStepIndex,
          isActive: false,
          isDismissed: true,
        };
      }
      return { ...prev, activeStepIndex: nextIndex };
    });
  }, [steps.length]);

  const prevStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeStepIndex: Math.max(0, prev.activeStepIndex - 1),
    }));
  }, []);

  const dismissWalkthrough = useCallback(() => {
    setState((prev) => ({ ...prev, isActive: false, isDismissed: true }));
  }, []);

  const resetWalkthrough = useCallback(() => {
    if (!role) return;
    const s = { activeStepIndex: 0, isActive: true, isDismissed: false };
    setState(s);
    saveState(role, s);
  }, [role]);

  const isStepActive = useCallback(
    (stepId: string) => {
      if (!state.isActive) return false;
      const current = steps[state.activeStepIndex];
      return current?.id === stepId;
    },
    [state.isActive, state.activeStepIndex, steps],
  );

  const currentStep = steps[state.activeStepIndex] ?? null;
  const totalSteps = steps.length;

  return {
    activeStepIndex: state.activeStepIndex,
    totalSteps,
    isActive: state.isActive,
    isDismissed: state.isDismissed,
    currentStep,
    walkthroughSteps: steps,
    startWalkthrough,
    nextStep,
    prevStep,
    dismissWalkthrough,
    resetWalkthrough,
    isStepActive,
  };
}

export default useWalkthrough;
