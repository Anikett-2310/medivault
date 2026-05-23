import { createActor } from "@/backend";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ROLE_CONFIG } from "@/components/common/RoleBadge";
import { useAuthStore } from "@/store/auth";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useActor } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bell,
  Building2,
  Calendar,
  FlaskConical,
  LayoutDashboard,
  Moon,
  Pill,
  Shield,
  ShieldCheck,
  Sun,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const FEATURE_PILLS = [
  {
    label: "5 Role Dashboards",
    icon: <LayoutDashboard size={11} />,
  },
  {
    label: "Smart Reminders",
    icon: <Bell size={11} />,
  },
  {
    label: "Expiry Tracking",
    icon: <Calendar size={11} />,
  },
];

const ROLE_HIGHLIGHTS = [
  { icon: <User size={22} />, label: "Patient" },
  { icon: <Pill size={22} />, label: "Pharmacy" },
  { icon: <Building2 size={22} />, label: "Hospital" },
  { icon: <FlaskConical size={22} />, label: "Lab" },
  { icon: <ShieldCheck size={22} />, label: "Admin" },
];

export default function LoginPage() {
  const { login, isAuthenticated, isInitializing, isLoggingIn } =
    useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { setUser, setLoading, getRolePath } = useAuthStore();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !actor || actorFetching || resolving) return;
    setResolving(true);
    setLoading(true);

    actor
      .getMyProfile()
      .then((res) => {
        if (res.__kind__ === "ok") {
          setUser(res.ok);
          setLoading(false);
          navigate({ to: getRolePath() });
        } else {
          setLoading(false);
          navigate({ to: "/role-select" });
        }
      })
      .catch(() => {
        setLoading(false);
        navigate({ to: "/role-select" });
      });
  }, [
    isAuthenticated,
    actor,
    actorFetching,
    resolving,
    setUser,
    setLoading,
    navigate,
    getRolePath,
  ]);

  const busy = isInitializing || isLoggingIn || resolving || actorFetching;

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden"
      data-ocid="login.page"
    >
      {/* Theme toggle — top-right corner */}
      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label={
          theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
        }
        className="theme-toggle-floating"
        data-ocid="login.theme_toggle"
      >
        {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      {/* Animated floating orbs */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div className="orb-float absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-[var(--color-bg-muted)] opacity-40 blur-3xl" />
        <div className="orb-float-slow absolute -bottom-48 -right-32 w-[520px] h-[520px] rounded-full bg-[var(--color-bg-muted)] opacity-30 blur-3xl" />
        <div className="orb-float-med absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] rounded-full bg-[var(--color-bg-elevated)] opacity-20 blur-3xl" />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.9 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.9 0 0) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Back to landing link */}
        <motion.a
          href="/"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
          data-ocid="login.back_to_landing.link"
        >
          <ArrowLeft size={13} />
          <span>Back to MediVault Home</span>
        </motion.a>

        {/* Glass card */}
        <div className="card-operational rounded-3xl shadow-2xl p-8">
          {/* Logo + brand */}
          <div className="flex flex-col items-center mb-8">
            {/* Inline SVG shield/cross logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="mb-5"
            >
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="MediVault logo"
              >
                <title>MediVault logo</title>
                <defs>
                  <linearGradient
                    id="lgShield"
                    x1="0"
                    y1="0"
                    x2="64"
                    y2="64"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="oklch(0.62 0.22 225)" />
                    <stop offset="1" stopColor="oklch(0.76 0.18 195)" />
                  </linearGradient>
                </defs>
                <path
                  d="M32 4L8 14v18c0 13.255 10.315 25.647 24 29 13.685-3.353 24-15.745 24-29V14L32 4z"
                  fill="url(#lgShield)"
                  opacity="0.9"
                />
                <rect x="29" y="20" width="6" height="24" rx="3" fill="white" />
                <rect x="20" y="29" width="24" height="6" rx="3" fill="white" />
              </svg>
            </motion.div>

            {/* Brand name */}
            <h1 className="font-display text-4xl font-bold tracking-tight mb-1">
              <span className="text-foreground">Medi</span>
              <span className="gradient-text">Vault</span>
            </h1>

            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="font-display text-xl font-semibold gradient-text text-center mt-1 mb-2"
            >
              Welcome to MediVault
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground text-sm text-center max-w-[280px] leading-relaxed"
            >
              Secure, smart medicine management for patients, pharmacies, and
              healthcare providers
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-4 flex items-center gap-2 px-3.5 py-1.5 bg-[var(--color-status-success)]/10 border border-[var(--color-status-success)]/25 rounded-full"
            >
              <Shield
                size={12}
                className="text-[var(--color-status-success)]"
              />
              <span className="text-[11px] text-[var(--color-status-success)] font-medium tracking-wide">
                Secured by Internet Identity
              </span>
            </motion.div>
          </div>

          {/* Login button */}
          <motion.button
            type="button"
            onClick={() => login()}
            disabled={busy}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="btn-gradient-glow w-full py-3.5 px-6 rounded-full text-white font-semibold text-sm flex items-center justify-center gap-2"
            data-ocid="login.sign_in.primary_button"
          >
            {busy ? (
              <>
                <LoadingSpinner size="sm" /> <span>Connecting...</span>
              </>
            ) : (
              <>
                <Shield size={16} /> <span>Sign in with Internet Identity</span>
              </>
            )}
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-center text-xs text-muted-foreground mt-4"
          >
            No passwords. No accounts. Just your cryptographic identity.
          </motion.p>

          {/* Feature highlight pills */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex flex-wrap justify-center gap-2"
          >
            {FEATURE_PILLS.map((pill) => (
              <span
                key={pill.label}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[var(--color-bg-muted)] border border-[var(--color-border-muted)] text-[var(--color-text-secondary)]"
              >
                {pill.icon}
                {pill.label}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Role highlights strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="mt-5 grid grid-cols-5 gap-2"
        >
          {ROLE_HIGHLIGHTS.map((r, i) => (
            <motion.div
              key={r.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.07 }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-muted)] backdrop-blur-sm"
            >
              <span className="text-foreground">{r.icon}</span>
              <span className="text-[10px] font-medium text-muted-foreground">
                {r.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
