import { useOfflineStore } from "@/store/offline";
import { useEffect, useRef, useState } from "react";

export interface UseOnlineResult {
  isOnline: boolean;
  wasOffline: boolean;
}

export function useOnline(): UseOnlineResult {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const wasOfflineRef = useRef<boolean>(false);
  const pendingResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      useOfflineStore.getState().setOnline(true);

      if (wasOfflineRef.current) {
        setWasOffline(true);
        window.dispatchEvent(new CustomEvent("medivault:reconnected"));
        // Reset wasOffline flag after a short delay so consumers can react.
        // We store the timeout ID and clear it if the component unmounts before
        // the 5 s window expires, preventing a double-fire if the user loses
        // and regains connectivity rapidly within that window.
        const resetTimer = setTimeout(() => {
          wasOfflineRef.current = false;
          setWasOffline(false);
        }, 5000);
        // Attach to ref so the offline handler can cancel it if we go offline
        // again before the reset fires.
        pendingResetRef.current = resetTimer;
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      wasOfflineRef.current = true;
      setWasOffline(false);
      useOfflineStore.getState().setOnline(false);
      // Cancel any in-flight reset so wasOfflineRef stays true while offline
      if (pendingResetRef.current !== null) {
        clearTimeout(pendingResetRef.current);
        pendingResetRef.current = null;
      }
    };

    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === "SW_UPDATED") {
        useOfflineStore.getState().setHasUpdate(true);
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    navigator.serviceWorker?.addEventListener("message", handleSwMessage);

    // Sync initial state to store
    useOfflineStore.getState().setOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      navigator.serviceWorker?.removeEventListener("message", handleSwMessage);
      if (pendingResetRef.current !== null) {
        clearTimeout(pendingResetRef.current);
        pendingResetRef.current = null;
      }
    };
  }, []);

  return { isOnline, wasOffline };
}

export default useOnline;
