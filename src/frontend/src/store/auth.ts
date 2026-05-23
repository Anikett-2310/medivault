import type { UserProfile, UserRole } from "@/types";
import { create } from "zustand";

interface AuthStore {
  user: UserProfile | null;
  isLoading: boolean;
  setUser: (user: UserProfile) => void;
  clearUser: () => void;
  setLoading: (val: boolean) => void;
  isPatient: () => boolean;
  isPharmacy: () => boolean;
  isHospital: () => boolean;
  isLab: () => boolean;
  isAdmin: () => boolean;
  getRolePath: () => string;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: false,

  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  setLoading: (val) => set({ isLoading: val }),

  isPatient: () => get().user?.role === "Patient",
  isPharmacy: () => get().user?.role === "Pharmacy",
  isHospital: () => get().user?.role === "Hospital",
  isLab: () => get().user?.role === "Lab",
  isAdmin: () => get().user?.role === "Admin",

  getRolePath: () => {
    const role = get().user?.role;
    if (!role) return "/login";
    const map: Record<string, string> = {
      Patient: "/patient",
      Pharmacy: "/pharmacy",
      Hospital: "/hospital",
      Lab: "/lab",
      Admin: "/admin",
    };
    return map[role as string] ?? "/login";
  },
}));
