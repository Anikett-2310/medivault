import { createActor } from "@/backend";
import type { UserRole } from "@/backend";
import { useAuthStore } from "@/store/auth";
import { useActor } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  FlaskConical,
  Loader2,
  Pill,
  Shield,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

type RoleOption = {
  role: UserRole;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  border: string;
  features: string[];
};

const ONBOARDING_PILLS = [
  {
    icon: <User size={14} />,
    name: "Patient",
    benefit: "Track medicines & doses",
    color: "badge-blue",
  },
  {
    icon: <Pill size={14} />,
    name: "Pharmacy",
    benefit: "Manage inventory",
    color: "badge-teal",
  },
  {
    icon: <Building2 size={14} />,
    name: "Hospital",
    benefit: "Patient coordination",
    color: "badge-purple",
  },
  {
    icon: <FlaskConical size={14} />,
    name: "Lab",
    benefit: "Diagnostic reports",
    color: "badge-teal",
  },
  {
    icon: <ShieldCheck size={14} />,
    name: "Admin",
    benefit: "Platform oversight",
    color: "badge-amber",
  },
];

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: "Patient" as UserRole,
    title: "Patient",
    description:
      "Manage your medicines, track doses, and monitor your health journey.",
    icon: <User size={28} />,
    gradient:
      "from-[var(--color-role-patient)]/20 to-[var(--color-role-patient)]/10",
    border:
      "border-[var(--color-role-patient)]/30 hover:border-[var(--color-role-patient)]/60",
    features: [
      "Medicine tracking",
      "Dose reminders",
      "Expiry alerts",
      "Adherence score",
    ],
  },
  {
    role: "Pharmacy" as UserRole,
    title: "Pharmacy",
    description:
      "Manage inventory, track stock levels, and fulfill patient orders.",
    icon: <Pill size={28} />,
    gradient:
      "from-[var(--color-role-pharmacy)]/20 to-[var(--color-role-pharmacy)]/10",
    border:
      "border-[var(--color-role-pharmacy)]/30 hover:border-[var(--color-role-pharmacy)]/60",
    features: [
      "Inventory CRUD",
      "Stock tracking",
      "Order management",
      "Expiry alerts",
    ],
  },
  {
    role: "Hospital" as UserRole,
    title: "Hospital",
    description:
      "View patient records, manage prescriptions, and coordinate appointments.",
    icon: <Building2 size={28} />,
    gradient:
      "from-[var(--color-role-hospital)]/20 to-[var(--color-role-hospital)]/10",
    border:
      "border-[var(--color-role-hospital)]/30 hover:border-[var(--color-role-hospital)]/60",
    features: ["Patient records", "Prescriptions", "Appointments", "Analytics"],
  },
  {
    role: "Lab" as UserRole,
    title: "Laboratory",
    description:
      "Upload diagnostic reports and manage laboratory test records.",
    icon: <FlaskConical size={28} />,
    gradient:
      "from-[var(--color-role-diagnostic)]/20 to-[var(--color-role-diagnostic)]/10",
    border:
      "border-[var(--color-role-diagnostic)]/30 hover:border-[var(--color-role-diagnostic)]/60",
    features: [
      "Report upload",
      "Report viewing",
      "Diagnostic records",
      "Analytics",
    ],
  },
  {
    role: "Admin" as UserRole,
    title: "Admin",
    description:
      "Oversee all platform users, monitor system health, and manage access.",
    icon: <ShieldCheck size={28} />,
    gradient:
      "from-[var(--color-role-admin)]/20 to-[var(--color-role-admin)]/10",
    border:
      "border-[var(--color-role-admin)]/30 hover:border-[var(--color-role-admin)]/60",
    features: [
      "User management",
      "System analytics",
      "Role control",
      "Platform overview",
    ],
  },
];

export default function RoleSelectionPage() {
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem("medivault_onboarded"),
  );

  const dismissOnboarding = () => {
    localStorage.setItem("medivault_onboarded", "true");
    setShowOnboarding(false);
  };

  const { actor } = useActor(createActor);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");

  const handleSelect = async (role: UserRole) => {
    if (!actor || !nameInput.trim() || !emailInput.trim()) return;
    setSelected(role);
    setSubmitting(true);
    try {
      const res = await actor.registerUser(
        emailInput.trim(),
        nameInput.trim(),
        role,
      );
      if (res.__kind__ === "ok") {
        setUser(res.ok);
        const paths: Record<string, string> = {
          Patient: "/patient",
          Pharmacy: "/pharmacy",
          Hospital: "/hospital",
          Lab: "/lab",
          Admin: "/admin",
        };
        toast.success(`Welcome to MediVault as ${res.ok.name}!`);
        navigate({ to: paths[role as string] ?? "/login" });
      } else {
        toast.error(res.err);
        setSelected(null);
      }
    } catch (_e) {
      toast.error("Registration failed. Please try again.");
      setSelected(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] bg-grid-technical relative overflow-hidden">
      {/* Onboarding overlay */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: "var(--color-bg-primary)",
              backdropFilter: "blur(12px)",
            }}
            data-ocid="onboarding.overlay"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 28,
                delay: 0.05,
              }}
              className="relative card-operational max-w-2xl w-full p-8 rounded-2xl"
              data-ocid="onboarding.card"
            >
              <button
                type="button"
                onClick={dismissOnboarding}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Skip onboarding"
                data-ocid="onboarding.close_button"
              >
                <X size={16} />
              </button>

              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-md bg-[var(--color-brand-primary)]">
                  <Shield
                    size={28}
                    className="text-[var(--color-text-primary)]"
                  />
                </div>
                <h2 className="font-display text-3xl font-bold mb-3 gradient-text">
                  Welcome to MediVault
                </h2>
                <p className="text-muted-foreground max-w-md">
                  The smart medicine management platform for healthcare
                  professionals
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center mb-8">
                {ONBOARDING_PILLS.map((pill) => (
                  <div
                    key={pill.name}
                    className={`flex items-center gap-2 ${pill.color}`}
                  >
                    {pill.icon}
                    <span>{pill.name}</span>
                    <span className="opacity-70">·</span>
                    <span className="opacity-70">{pill.benefit}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={dismissOnboarding}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-md bg-[var(--color-brand-primary)]"
                  data-ocid="onboarding.primary_button"
                >
                  Let me choose my role!
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none opacity-[0.04]" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent/15 rounded-full blur-3xl pointer-events-none opacity-[0.04]" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md bg-[var(--color-brand-primary)]">
            <Shield size={22} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold gradient-text">
            Select Your Role
          </h1>
          <p className="text-muted-foreground mt-2">
            Enter your details and choose your role to get started
          </p>
        </motion.div>

        {/* Name + Email */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6 mb-8 max-w-lg mx-auto"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="reg-name"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Dr. Sarah Johnson"
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                data-ocid="role_select.name.input"
              />
            </div>
            <div>
              <label
                htmlFor="reg-email"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="sarah@example.com"
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                data-ocid="role_select.email.input"
              />
            </div>
          </div>
        </motion.div>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROLE_OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.role as string}
              type="button"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.1 }}
              onClick={() => handleSelect(opt.role)}
              disabled={submitting || !nameInput.trim() || !emailInput.trim()}
              className={`card-operational relative text-left p-5 rounded-2xl border-l-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] ${
                opt.role === "Patient"
                  ? "border-l-[var(--color-role-patient)]"
                  : opt.role === "Pharmacy"
                    ? "border-l-[var(--color-role-pharmacy)]"
                    : opt.role === "Hospital"
                      ? "border-l-[var(--color-role-hospital)]"
                      : opt.role === "Lab"
                        ? "border-l-[var(--color-role-diagnostic)]"
                        : "border-l-[var(--color-role-admin)]"
              }`}
              data-ocid={`role_select.${(opt.role as string).toLowerCase()}.card`}
            >
              {selected === opt.role && submitting && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-overlay)] rounded-2xl">
                  <Loader2
                    size={24}
                    className="animate-spin text-[var(--color-text-primary)]"
                  />
                </div>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--color-bg-muted)] border border-[var(--color-border-base)]">
                  <span className="text-[var(--color-text-accent)]">
                    {opt.icon}
                  </span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground">
                    {opt.title}
                  </h3>
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                {opt.description}
              </p>
              <ul className="space-y-1.5 mb-4">
                {opt.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                Select Role <ArrowRight size={12} />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
