import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "medivault_presentation_mode";
const CSS_CLASS = "presentation-mode";

function readInitialState(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function applyClass(active: boolean) {
  if (active) {
    document.documentElement.classList.add(CSS_CLASS);
  } else {
    document.documentElement.classList.remove(CSS_CLASS);
  }
}

export function usePresentationMode() {
  const [isPresentation, setIsPresentation] =
    useState<boolean>(readInitialState);

  // Sync class on mount and whenever state changes
  useEffect(() => {
    applyClass(isPresentation);
  }, [isPresentation]);

  // Remove class on unmount
  useEffect(() => {
    return () => {
      document.documentElement.classList.remove(CSS_CLASS);
    };
  }, []);

  const togglePresentationMode = useCallback(() => {
    setIsPresentation((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  return { isPresentation, togglePresentationMode };
}

export default usePresentationMode;
