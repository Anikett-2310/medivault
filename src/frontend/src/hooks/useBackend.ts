import {
  type ConsentRecord,
  type DiagnosticBooking,
  type NotificationRecord,
  type SyncedMedicine,
  createActor,
} from "@/backend";
import type {
  Appointment,
  DoseLog,
  InventoryItem,
  Medicine,
  MedicineCategory,
  Order,
  OrderStatus,
  PharmacySyncLog,
  Report,
  UserProfile,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

function useBackendActor() {
  return useActor(createActor);
}

// ─── Medicines ──────────────────────────────────────────────────────────────
export function useMyMedicines() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Medicine[]>({
    queryKey: ["medicines"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyMedicines();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Hospital: fetch all users to derive patient records view
export function useAllUsersForHospital() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<UserProfile[]>({
    queryKey: ["allUsersHospital"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useMedicineMutation() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (vars: {
      name: string;
      dosage: string;
      frequency: string;
      expiryDate: bigint;
      category: MedicineCategory;
    }) =>
      actor!.createMedicine(
        vars.name,
        vars.dosage,
        vars.frequency,
        vars.expiryDate,
        vars.category,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medicines"] }),
  });

  const update = useMutation({
    mutationFn: (vars: {
      id: string;
      name: string;
      dosage: string;
      frequency: string;
      expiryDate: bigint;
      category: MedicineCategory;
    }) =>
      actor!.updateMedicine(
        vars.id,
        vars.name,
        vars.dosage,
        vars.frequency,
        vars.expiryDate,
        vars.category,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medicines"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => actor!.deleteMedicine(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medicines"] }),
  });

  return { create, update, remove };
}

// ─── Dose Logs ───────────────────────────────────────────────────────────────
export function useMyDoseLogs(medicineId?: string) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<DoseLog[]>({
    queryKey: ["doseLogs", medicineId ?? "all"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyDoseLogs(medicineId ?? null);
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useDoseLogMutation() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (vars: {
      medicineId: string;
      takenAt: bigint;
      isOnTime: boolean;
    }) => actor!.logDose(vars.medicineId, vars.takenAt, vars.isOnTime),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doseLogs"] }),
  });
}

// ─── Reminders ───────────────────────────────────────────────────────────────
export function useMyReminders() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<import("@/backend").Reminder[]>({
    queryKey: ["reminders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyReminders();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useReminderMutation() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (vars: {
      medicineId: string;
      reminderTime: string;
      voiceEnabled: boolean;
    }) =>
      actor!.createReminder(
        vars.medicineId,
        vars.reminderTime,
        vars.voiceEnabled,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const update = useMutation({
    mutationFn: (vars: {
      id: string;
      reminderTime: string;
      isEnabled: boolean;
      voiceEnabled: boolean;
    }) =>
      actor!.updateReminder(
        vars.id,
        vars.reminderTime,
        vars.isEnabled,
        vars.voiceEnabled,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => actor!.deleteReminder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  return { create, update, remove };
}

// ─── Pharmacy Inventory ──────────────────────────────────────────────────────
export function usePharmacyInventory() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<InventoryItem[]>({
    queryKey: ["inventory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPharmacyInventory();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useInventoryMutation() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (vars: {
      medicineName: string;
      stockQuantity: bigint;
      minThreshold: bigint;
      maxThreshold: bigint;
      expiryDate: bigint;
      category: MedicineCategory;
    }) =>
      actor!.createInventoryItem(
        vars.medicineName,
        vars.stockQuantity,
        vars.minThreshold,
        vars.maxThreshold,
        vars.expiryDate,
        vars.category,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });

  const update = useMutation({
    mutationFn: (vars: {
      id: string;
      stockQuantity: bigint;
      minThreshold: bigint;
      maxThreshold: bigint;
      expiryDate: bigint;
    }) =>
      actor!.updateInventoryItem(
        vars.id,
        vars.stockQuantity,
        vars.minThreshold,
        vars.maxThreshold,
        vars.expiryDate,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => actor!.deleteInventoryItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });

  return { create, update, remove };
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export function usePharmacyOrders() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Order[]>({
    queryKey: ["pharmacyOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPharmacyOrders();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useMyOrders() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Order[]>({
    queryKey: ["myOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyOrders();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useOrderMutation() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (vars: {
      patientId: string;
      pharmacyId: string;
      medicineName: string;
      quantity: bigint;
    }) =>
      actor!.createOrder(
        vars.patientId,
        vars.pharmacyId,
        vars.medicineName,
        vars.quantity,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myOrders"] });
      qc.invalidateQueries({ queryKey: ["pharmacyOrders"] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: (vars: { id: string; status: OrderStatus }) =>
      actor!.updateOrderStatus(vars.id, vars.status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myOrders"] });
      qc.invalidateQueries({ queryKey: ["pharmacyOrders"] });
    },
  });

  return { create, updateStatus };
}

// ─── Reports ─────────────────────────────────────────────────────────────────
export function useMyReports() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Report[]>({
    queryKey: ["myReports"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyReports();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useLabReports() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Report[]>({
    queryKey: ["labReports"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLabReports();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useReportMutation() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (vars: {
      patientId: string;
      fileUrl: string;
      reportType: string;
    }) => actor!.createReport(vars.patientId, vars.fileUrl, vars.reportType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myReports"] });
      qc.invalidateQueries({ queryKey: ["labReports"] });
    },
  });
}

// ─── Appointments ────────────────────────────────────────────────────────────
export function useAppointments() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Appointment[]>({
    queryKey: ["appointments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAppointments();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useAppointmentMutation() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (vars: {
      patientName: string;
      dateTime: bigint;
      notes: string;
    }) => actor!.createAppointment(vars.patientName, vars.dateTime, vars.notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });

  const updateStatus = useMutation({
    mutationFn: (vars: { id: string; status: string }) =>
      actor!.updateAppointmentStatus(vars.id, vars.status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });

  return { create, updateStatus };
}

// ─── Analytics & Stats ───────────────────────────────────────────────────────
export function useSystemStats() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<{
    totalOrders: bigint;
    totalUsers: bigint;
    totalMedicines: bigint;
    usersByRole: Array<[string, bigint]>;
  }>({
    queryKey: ["systemStats"],
    queryFn: async () => {
      if (!actor)
        return {
          totalOrders: BigInt(0),
          totalUsers: BigInt(0),
          totalMedicines: BigInt(0),
          usersByRole: [],
        };
      return actor.getSystemStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useExpiryStats() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<{ expiringSoon: bigint; expired: bigint; safe: bigint }>({
    queryKey: ["expiryStats"],
    queryFn: async () => {
      if (!actor)
        return {
          expiringSoon: BigInt(0),
          expired: BigInt(0),
          safe: BigInt(0),
        };
      return actor.getExpiryStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useInventoryStats() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Array<[string, bigint]>>({
    queryKey: ["inventoryStats"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInventoryStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllUsers() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<UserProfile[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useAdherenceScore(medicineId: string) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<number>({
    queryKey: ["adherenceScore", medicineId],
    queryFn: async () => {
      if (!actor) return 0;
      return actor.getAdherenceScore(medicineId);
    },
    enabled: !!actor && !isFetching && !!medicineId,
  });
}

export function useMyProfile() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<UserProfile | null>({
    queryKey: ["myProfile"],
    queryFn: async () => {
      if (!actor) return null;
      const res = await actor.getMyProfile();
      if (res.__kind__ === "ok") return res.ok;
      return null;
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function usePharmacySyncLogs() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<PharmacySyncLog[]>({
    queryKey: ["pharmacySyncLogs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPharmacySyncLogs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSyncMedicineMutation() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      patientPhone: string;
      medicineName: string;
      batchNumber: string;
      expiryDate: bigint;
      quantity: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      const res = await actor.syncMedicineToPatient(
        vars.patientPhone,
        vars.medicineName,
        vars.batchNumber,
        vars.expiryDate,
        vars.quantity,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pharmacySyncLogs"] });
    },
  });
}

export function useLookupPatient() {
  const { actor } = useBackendActor();
  return useMutation({
    mutationFn: async (phone: string) => {
      if (!actor) throw new Error("Not connected");
      const res = await actor.lookupPatientByPhone(phone);
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
  });
}
// Notifications
export function useMyNotifications() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<NotificationRecord[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyNotifications();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useUnreadNotificationCount() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<bigint>({
    queryKey: ["unreadNotifCount"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getUnreadNotificationCount();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useMarkNotificationRead() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notifId: string) => {
      if (!actor) throw new Error("Not connected");
      const res = await actor.markNotificationRead(notifId);
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["unreadNotifCount"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.markAllNotificationsRead();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["unreadNotifCount"] });
    },
  });
}
// ─── Synced Medicines (Patient) ─────────────────────────────────────────────
export function useMyMedicinesSync() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<SyncedMedicine[]>({
    queryKey: ["mySyncedMedicines"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMySyncedMedicines();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ─── Consented Patients (Hospital) ──────────────────────────────────────────
export function useConsentedPatients() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Array<{ patient: UserProfile; consent: ConsentRecord }>>({
    queryKey: ["consentedPatients"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getConsentedPatients();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ─── Lab Diagnostic Bookings ─────────────────────────────────────────────────
export function useLabDiagnosticBookings() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<DiagnosticBooking[]>({
    queryKey: ["labDiagnosticBookings"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLabDiagnosticBookings();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
