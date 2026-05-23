import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type OfflineActionType =
  | "ADD_MEDICINE"
  | "UPDATE_REMINDER"
  | "UPDATE_SETTINGS"
  | "SYNC_MEDICINE"
  | "CREATE_BOOKING";

export type OfflineActionStatus = "pending" | "syncing" | "success" | "failed";

export interface OfflineAction {
  id: string;
  type: OfflineActionType;
  payload: unknown;
  createdAt: number;
  status: OfflineActionStatus;
  retryCount: number;
  lastAttempt?: number;
  errorMessage?: string;
}

export type SyncLogStatus = "success" | "failure";

export interface SyncLogEntry {
  actionId: string;
  actionType: OfflineActionType;
  timestamp: number;
  status: SyncLogStatus;
  errorMessage?: string;
}

export interface OfflineStore {
  isOnline: boolean;
  lastSyncedAt: number | null;
  isSyncing: boolean;
  syncError: string | null;
  queue: OfflineAction[];
  syncLog: SyncLogEntry[];
  hasUpdate: boolean;

  setOnline: (online: boolean) => void;
  setLastSyncedAt: (ts: number) => void;
  setSyncing: (syncing: boolean) => void;
  setSyncError: (err: string | null) => void;
  enqueue: (
    action: Omit<OfflineAction, "id" | "createdAt" | "status" | "retryCount">,
  ) => void;
  updateActionStatus: (
    id: string,
    status: OfflineActionStatus,
    errorMessage?: string,
  ) => void;
  clearCompleted: () => void;
  clearAll: () => void;
  addSyncLogEntry: (entry: Omit<SyncLogEntry, "timestamp">) => void;
  getSyncLog: () => SyncLogEntry[];
  setHasUpdate: (hasUpdate: boolean) => void;
}

export const useOfflineStore = create<OfflineStore>()(
  persist(
    (set, get) => ({
      isOnline: navigator.onLine,
      lastSyncedAt: null,
      isSyncing: false,
      syncError: null,
      queue: [],
      syncLog: [],
      hasUpdate: false,

      setOnline: (online) => set({ isOnline: online }),
      setLastSyncedAt: (ts) => set({ lastSyncedAt: ts }),
      setSyncing: (syncing) => set({ isSyncing: syncing }),
      setSyncError: (err) => set({ syncError: err }),

      enqueue: (action) =>
        set((state) => {
          // Deduplicate: skip if a pending action of the same type + key already exists
          const payload = action.payload as
            | Record<string, unknown>
            | null
            | undefined;
          const incomingKey =
            payload && typeof payload === "object"
              ? (payload.key as string | undefined)
              : undefined;
          const isDuplicate = state.queue.some((item) => {
            if (item.status !== "pending" || item.type !== action.type)
              return false;
            if (incomingKey === undefined) return false;
            const itemPayload = item.payload as
              | Record<string, unknown>
              | null
              | undefined;
            const itemKey =
              itemPayload && typeof itemPayload === "object"
                ? (itemPayload.key as string | undefined)
                : undefined;
            return itemKey === incomingKey;
          });
          if (isDuplicate) return {};
          return {
            queue: [
              ...state.queue,
              {
                ...action,
                id: crypto.randomUUID(),
                createdAt: Date.now(),
                status: "pending" as OfflineActionStatus,
                retryCount: 0,
              },
            ],
          };
        }),

      updateActionStatus: (id, status, errorMessage) =>
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status,
                  errorMessage,
                  lastAttempt: Date.now(),
                  retryCount:
                    status === "failed" ? item.retryCount + 1 : item.retryCount,
                }
              : item,
          ),
        })),

      clearCompleted: () =>
        set((state) => ({
          queue: state.queue.filter((item) => item.status !== "success"),
        })),

      clearAll: () => set({ queue: [] }),

      addSyncLogEntry: (entry) =>
        set((state) => ({
          syncLog: [
            {
              ...entry,
              timestamp: Date.now(),
            },
            ...state.syncLog,
          ].slice(0, 20),
        })),

      getSyncLog: () => get().syncLog,

      setHasUpdate: (hasUpdate) => set({ hasUpdate }),
    }),
    {
      name: "medivault-offline-queue",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default useOfflineStore;
