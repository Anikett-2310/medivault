import { useCallback } from "react";

/**
 * All localStorage keys cleared during a demo reset.
 * Exported so consumers can inspect or extend the list.
 */
export const DEMO_RESET_KEYS = [
  // Walkthrough progress — one per role
  "medivault_walkthrough_patient",
  "medivault_walkthrough_pharmacy",
  "medivault_walkthrough_admin",
  "medivault_walkthrough_hospital",
  "medivault_walkthrough_diagnostic",
  // Presentation mode
  "medivault_presentation_mode",
  // Offline action queue
  "medivault-offline-queue",
] as const;

/**
 * Scans localStorage for any remaining medivault-prefixed keys not in
 * DEMO_RESET_KEYS (e.g. notification dismissed flags, reminder ack keys).
 */
function collectNotificationKeys(): string[] {
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key?.startsWith("medivault") &&
        !(DEMO_RESET_KEYS as readonly string[]).includes(key)
      ) {
        keys.push(key);
      }
    }
  } catch {
    // ignore storage access errors
  }
  return keys;
}

/**
 * Provides a `resetDemo()` function that:
 * 1. Clears all walkthrough localStorage keys for every role.
 * 2. Clears the presentation mode flag.
 * 3. Clears the offline action queue.
 * 4. Clears any additional notification/preference keys prefixed with 'medivault'.
 * 5. Reloads the page so seed data re-initialises from the backend.
 */
export function useDemoReset() {
  const resetDemo = useCallback(() => {
    try {
      // Clear all known keys
      for (const key of DEMO_RESET_KEYS) {
        localStorage.removeItem(key);
      }
      // Clear any discovered notification / preference keys
      const extra = collectNotificationKeys();
      for (const key of extra) {
        localStorage.removeItem(key);
      }
    } catch {
      // If localStorage is unavailable, still proceed with reload
    }
    // Hard reload — forces seed data re-initialisation
    window.location.reload();
  }, []);

  return { resetDemo };
}

export default useDemoReset;
