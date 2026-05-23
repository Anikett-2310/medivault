import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Bell,
  BrainCircuit,
  ChevronRight,
  Clock,
  FileText,
  Heart,
  LayoutDashboard,
  MessageCircle,
  Microscope,
  Moon,
  Network,
  Pill,
  QrCode,
  RefreshCw,
  Send,
  Settings2,
  Shield,
  ShoppingCart,
  Sparkles,
  Star,
  Stethoscope,
  Sun,
  TestTube2,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { motion, useInView } from "motion/react";
import { useTheme } from "next-themes";
import { useRef } from "react";

// ─── Animation helpers ────────────────────────────────────────────────────────
const fadeUp: import("motion/react").Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

function Section({
  children,
  className = "",
  id,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={stagger}
      className={className}
      style={style}
    >
      {children}
    </motion.section>
  );
}

// ─── Feature cards data ───────────────────────────────────────────────────────
const features = [
  {
    icon: Shield,
    title: "Multi-Role Authentication",
    desc: "5 secure dashboards for patients, pharmacies, hospitals, labs, and admins",
    roleColor: "var(--color-role-hospital)",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    desc: "Browser, voice, and Telegram notifications for every medication on schedule",
    roleColor: "var(--color-role-diagnostic)",
  },
  {
    icon: Pill,
    title: "Medicine Tracking",
    desc: "Full lifecycle tracking with expiry alerts, status badges, and CRUD management",
    roleColor: "var(--color-role-patient)",
  },
  {
    icon: QrCode,
    title: "QR Scanning",
    desc: "Generate and scan QR codes for prescriptions and medicine records instantly",
    roleColor: "var(--color-accent-teal)",
  },
  {
    icon: BarChart3,
    title: "Adherence Analytics",
    desc: "Track dose logs, adherence scores, and health trends with beautiful charts",
    roleColor: "var(--color-role-admin)",
  },
  {
    icon: FileText,
    title: "Prescription Upload",
    desc: "Securely upload and manage prescriptions and diagnostic reports in one place",
    roleColor: "var(--color-role-pharmacy)",
  },
];

// ─── Stakeholder roles ────────────────────────────────────────────────────────
const roles: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  roleVar: string;
  description: string;
  benefits: string[];
}[] = [
  {
    title: "Patient",
    subtitle: "Personal health management",
    icon: UserCheck,
    roleVar: "var(--color-role-patient)",
    description:
      "A calm, supportive interface for managing your own medicine cabinet and health journey.",
    benefits: [
      "Track medicines & expiry dates",
      "Set daily dose reminders",
      "Monitor adherence scores",
    ],
  },
  {
    title: "Pharmacy",
    subtitle: "Inventory & logistics systems",
    icon: ShoppingCart,
    roleVar: "var(--color-role-pharmacy)",
    description:
      "Process-oriented workflows for inventory management, order tracking, and expiry control.",
    benefits: [
      "Full inventory CRUD",
      "Expiry alert system",
      "Order management",
    ],
  },
  {
    title: "Hospital",
    subtitle: "Clinical records & monitoring",
    icon: Stethoscope,
    roleVar: "var(--color-role-hospital)",
    description:
      "Dense clinical dashboards for patient records, prescription oversight, and care coordination.",
    benefits: [
      "Patient medicine records",
      "Prescription oversight",
      "Appointment tracking",
    ],
  },
  {
    title: "Laboratory",
    subtitle: "Diagnostic testing environment",
    icon: Microscope,
    roleVar: "var(--color-role-diagnostic)",
    description:
      "Laboratory-grade tools for uploading test results, managing diagnostic records, and analysis.",
    benefits: [
      "Upload diagnostic reports",
      "Manage test records",
      "View analytics",
    ],
  },
  {
    title: "Admin",
    subtitle: "System oversight & command",
    icon: LayoutDashboard,
    roleVar: "var(--color-role-admin)",
    description:
      "Command-center visibility across all roles — user management, system analytics, and platform control.",
    benefits: [
      "User management",
      "System-wide analytics",
      "Platform oversight",
    ],
  },
];

// ─── Workflow steps ───────────────────────────────────────────────────────────
const steps: {
  icon: React.ElementType;
  label: string;
  roleVar: string;
}[] = [
  {
    icon: Shield,
    label: "Login Securely",
    roleVar: "var(--color-role-hospital)",
  },
  {
    icon: Users,
    label: "Choose Your Role",
    roleVar: "var(--color-accent-cyan)",
  },
  {
    icon: Pill,
    label: "Manage Medicines",
    roleVar: "var(--color-role-diagnostic)",
  },
  {
    icon: BarChart3,
    label: "Track Adherence",
    roleVar: "var(--color-role-patient)",
  },
  {
    icon: Bell,
    label: "Get Reminders",
    roleVar: "var(--color-brand-primary)",
  },
];

// ─── Coming soon features ─────────────────────────────────────────────────────
const comingSoon: {
  icon: React.ElementType;
  title: string;
  desc: string;
  timeline: string;
  accentVar: string;
}[] = [
  {
    icon: FileText,
    title: "OCR Prescription Parsing",
    desc: "Auto-extract medicine data from uploaded prescription images using computer vision",
    timeline: "Q3 2025",
    accentVar: "var(--color-role-hospital)",
  },
  {
    icon: BrainCircuit,
    title: "AI Medicine Recommendations",
    desc: "Personalized medication suggestions based on your health history and patterns",
    timeline: "Q3 2025",
    accentVar: "var(--color-role-diagnostic)",
  },
  {
    icon: Bell,
    title: "Push Notifications",
    desc: "Reminders on any device, even when your browser is completely closed",
    timeline: "Q4 2025",
    accentVar: "var(--color-accent-cyan)",
  },
  {
    icon: Sparkles,
    title: "Smart AI Assistant",
    desc: "Ask questions about your medicines and get instant, accurate answers",
    timeline: "Q4 2025",
    accentVar: "var(--color-brand-primary)",
  },
  {
    icon: RefreshCw,
    title: "Real-Time Sync",
    desc: "Live updates across all your devices and roles instantly",
    timeline: "2026",
    accentVar: "var(--color-role-patient)",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground overflow-x-hidden"
      style={{ scrollBehavior: "smooth" }}
    >
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[var(--color-bg-elevated)]/90 backdrop-blur-sm border-b border-[var(--color-border-muted)]">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--color-brand-primary)" }}
          >
            <Heart className="w-4 h-4 text-white" />
          </div>
          <span
            className="font-display font-bold text-lg"
            style={{ color: "var(--color-brand-primary)" }}
          >
            MediVault
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => scrollTo("features")}
            className="hover:text-foreground transition-colors"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => scrollTo("stakeholders")}
            className="hover:text-foreground transition-colors"
          >
            Stakeholders
          </button>
          <button
            type="button"
            onClick={() => scrollTo("workflow")}
            className="hover:text-foreground transition-colors"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => scrollTo("reminders")}
            className="hover:text-foreground transition-colors"
          >
            Reminders
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-ocid="nav.theme_toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-md border transition-colors"
            style={{
              borderColor: "var(--color-border-base)",
              background: "transparent",
              color: "var(--color-text-secondary)",
            }}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            type="button"
            data-ocid="nav.get_started_button"
            onClick={() => navigate({ to: "/login" })}
            className="px-4 py-2 rounded-full text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
            style={{ background: "var(--color-brand-primary)" }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ── HERO SECTION ──────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-16 overflow-hidden bg-grid-technical">
        {/* Gradient background */}
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-hero)" }}
        />
        {/* Floating orbs */}
        <div
          className="absolute top-1/4 left-1/6 w-64 h-64 rounded-full blur-3xl opacity-[0.04] animate-pulse"
          style={{ background: "var(--color-accent-teal)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/6 w-48 h-48 rounded-full blur-3xl opacity-[0.04] animate-pulse"
          style={{
            background: "var(--color-brand-primary)",
            animationDelay: "1s",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-[0.04]"
          style={{ background: "var(--color-accent-teal)" }}
        />

        {/* Floating icons decoration */}
        <motion.div
          className="absolute top-28 left-[8%] opacity-20"
          animate={{ y: [0, -12, 0] }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          <Pill
            className="w-8 h-8"
            style={{ color: "var(--color-role-pharmacy)" }}
          />
        </motion.div>
        <motion.div
          className="absolute top-40 right-[10%] opacity-20"
          animate={{ y: [0, 10, 0] }}
          transition={{
            duration: 3.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 0.5,
          }}
        >
          <Heart
            className="w-10 h-10"
            style={{ color: "var(--color-role-patient)" }}
          />
        </motion.div>
        <motion.div
          className="absolute bottom-32 left-[12%] opacity-15"
          animate={{ y: [0, 8, 0] }}
          transition={{
            duration: 5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 1,
          }}
        >
          <Activity
            className="w-7 h-7"
            style={{ color: "var(--color-accent-teal)" }}
          />
        </motion.div>
        <motion.div
          className="absolute bottom-40 right-[8%] opacity-15"
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 4.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 1.5,
          }}
        >
          <QrCode
            className="w-9 h-9"
            style={{ color: "var(--color-accent-cyan)" }}
          />
        </motion.div>

        {/* Hero content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8 border"
            style={{
              background: "var(--color-bg-surface)",
              borderColor: "var(--color-border-subtle)",
              color: "var(--color-accent-teal)",
            }}
          >
            <Sparkles className="w-3 h-3" />
            Smart Medicine Lifecycle Management
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="heading-operational font-display text-5xl md:text-7xl font-bold leading-tight mb-6"
          >
            Smart Medicine{" "}
            <span style={{ color: "var(--color-brand-primary)" }}>
              Management
            </span>
            <br />
            for Everyone
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Track medicines, monitor adherence, prevent expiry — for patients,
            pharmacies, hospitals, and labs. One platform, every healthcare
            role.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              type="button"
              data-ocid="hero.get_started_button"
              onClick={() => navigate({ to: "/login" })}
              className="group flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-2xl bg-[var(--color-brand-primary)] hover:opacity-90"
            >
              Get Started Free
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              type="button"
              data-ocid="hero.see_how_button"
              onClick={() => scrollTo("features")}
              className="flex items-center gap-2 px-8 py-4 rounded-full font-semibold transition-all duration-200 hover:scale-105 border"
              style={{
                background: "var(--color-bg-surface)",
                borderColor: "var(--color-border-base)",
                color: "var(--color-text-primary)",
              }}
            >
              See How It Works
            </button>
          </motion.div>

          {/* Stats row */}
          <motion.div
            variants={fadeUp}
            custom={4}
            className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto"
          >
            {[
              { value: "5", label: "Role Dashboards" },
              { value: "99%", label: "Adherence Accuracy" },
              { value: "24/7", label: "Reminder System" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div
                  className="font-display text-3xl font-bold"
                  style={{ color: "var(--color-brand-primary)" }}
                >
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Dashboard preview image */}
        <motion.div
          variants={fadeUp}
          custom={5}
          className="relative z-10 mt-16 w-full max-w-5xl mx-auto"
        >
          <div
            className="rounded-2xl overflow-hidden border shadow-operational"
            style={{
              borderColor: "var(--color-border-base)",
            }}
          >
            <img
              src="/assets/generated/hero-medivault.dim_1200x600.jpg"
              alt="MediVault Dashboard"
              className="w-full object-cover"
            />
          </div>
        </motion.div>
      </section>

      {/* ── FEATURES SECTION ──────────────────────────────────────────── */}
      <Section id="features" className="py-24 px-6 bg-[var(--color-bg-base)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4 border"
              style={{
                background: "var(--color-bg-surface)",
                borderColor: "var(--color-border-subtle)",
                color: "var(--color-accent-teal)",
              }}
            >
              <Zap className="w-3 h-3" />
              Platform Features
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl md:text-5xl font-bold mb-4"
            >
              Everything You Need to{" "}
              <span style={{ color: "var(--color-brand-primary)" }}>
                Manage Medicines
              </span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-muted-foreground max-w-xl mx-auto"
            >
              One platform covering the full medicine lifecycle — from
              prescription to dose log.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                custom={i}
                data-ocid={`features.card.${i + 1}`}
                className="card-operational shadow-operational group relative p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-default"
                style={{
                  borderLeftColor: feature.roleColor,
                  borderLeftWidth: "3px",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 border"
                  style={{
                    background: "var(--color-bg-elevated)",
                    borderColor: "var(--color-border-base)",
                  }}
                >
                  <feature.icon
                    className="w-6 h-6"
                    style={{ color: feature.roleColor }}
                  />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── STAKEHOLDERS SECTION ──────────────────────────────────────── */}
      <Section
        id="stakeholders"
        className="relative py-24 px-6 bg-grid-technical surface-hierarchy"
        style={
          {
            backgroundColor: "var(--color-bg-surface)",
            borderTop: "1px solid var(--color-border-muted)",
            borderBottom: "1px solid var(--color-border-muted)",
          } as React.CSSProperties
        }
      >
        {/* Blueprint layer overlay — structured depth, no blobs */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--color-border-muted) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border-muted) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            opacity: 0.3,
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-sm text-xs font-semibold mb-4 border label-clinical"
              style={{
                background: "var(--color-bg-elevated)",
                borderColor: "var(--color-border-base)",
                color: "var(--color-accent-teal)",
              }}
            >
              <Network className="w-3 h-3" />
              Healthcare Ecosystem
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl md:text-5xl font-bold mb-4 heading-operational"
            >
              Built for Every{" "}
              <span
                style={{
                  color: "var(--color-brand-primary)",
                }}
              >
                Healthcare Role
              </span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed"
            >
              Five operational dashboards — each calibrated for the workflows,
              data density, and responsibilities of its role.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {roles.map((role, i) => (
              <motion.div
                key={role.title}
                variants={fadeUp}
                custom={i}
                data-ocid={`stakeholders.card.${i + 1}`}
                className="card-operational shadow-blueprint group p-5 transition-all duration-300 hover:shadow-md cursor-default"
                style={{
                  borderLeftColor: role.roleVar,
                  backgroundColor: "var(--color-bg-elevated)",
                  borderColor: "var(--color-border-base)",
                  borderLeftWidth: "4px",
                }}
              >
                {/* Role icon — structured, not decorative pill */}
                <div
                  className="w-9 h-9 flex items-center justify-center mb-4"
                  style={{
                    borderLeft: `3px solid ${role.roleVar}`,
                    paddingLeft: "0.5rem",
                  }}
                >
                  <role.icon
                    className="w-5 h-5"
                    style={{ color: role.roleVar }}
                  />
                </div>
                {/* Role label */}
                <div
                  className="label-clinical mb-0.5"
                  style={{ color: role.roleVar }}
                >
                  {role.subtitle}
                </div>
                <h3 className="font-display font-semibold text-base mb-2 heading-operational">
                  {role.title}
                </h3>
                <p
                  className="text-xs leading-relaxed mb-4"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {role.description}
                </p>
                {/* Capability list */}
                <ul className="space-y-1.5">
                  {role.benefits.map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-1.5 text-xs"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: role.roleVar }}
                      />
                      {b}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Ecosystem connector hint */}
          <motion.div
            variants={fadeUp}
            className="mt-12 flex items-center justify-center gap-3"
          >
            <div
              className="h-px flex-1 max-w-32"
              style={{ background: "var(--color-border-base)" }}
            />
            <span
              className="label-clinical px-3 py-1 border rounded-sm"
              style={{
                borderColor: "var(--color-border-base)",
                color: "var(--color-text-secondary)",
              }}
            >
              Connected Healthcare Ecosystem
            </span>
            <div
              className="h-px flex-1 max-w-32"
              style={{ background: "var(--color-border-base)" }}
            />
          </motion.div>
        </div>
      </Section>

      {/* ── WORKFLOW SECTION ──────────────────────────────────────────── */}
      <Section id="workflow" className="py-24 px-6 bg-[var(--color-bg-base)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4 border"
              style={{
                background: "var(--color-bg-surface)",
                borderColor: "var(--color-border-subtle)",
                color: "var(--color-accent-teal)",
              }}
            >
              <Clock className="w-3 h-3" />
              Simple Process
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl md:text-5xl font-bold mb-4"
            >
              How{" "}
              <span style={{ color: "var(--color-brand-primary)" }}>
                MediVault
              </span>{" "}
              Works
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-muted-foreground max-w-xl mx-auto"
            >
              Five simple steps from login to fully managed medicine care.
            </motion.p>
          </div>

          {/* Desktop: horizontal */}
          <div className="hidden md:flex items-center justify-between gap-2">
            {steps.map((step, i) => (
              <>
                <motion.div
                  key={step.label}
                  variants={fadeUp}
                  custom={i}
                  data-ocid={`workflow.step.${i + 1}`}
                  className="flex flex-col items-center gap-3 flex-1"
                >
                  <div
                    className="w-14 h-14 rounded-2xl border flex items-center justify-center transition-transform duration-200 hover:scale-110"
                    style={{
                      background: `color-mix(in oklch, ${step.roleVar} 12%, transparent)`,
                      borderColor: `color-mix(in oklch, ${step.roleVar} 30%, transparent)`,
                    }}
                  >
                    <step.icon
                      className="w-7 h-7"
                      style={{ color: step.roleVar }}
                    />
                  </div>
                  <span className="text-sm font-medium text-center leading-tight">
                    {step.label}
                  </span>
                </motion.div>
                {i < steps.length - 1 && (
                  <motion.div
                    key={`connector-${steps[i].label}`}
                    variants={fadeUp}
                    custom={i + 0.5}
                    className="flex-1 h-px max-w-[60px]"
                    style={{ background: "var(--color-border-base)" }}
                  />
                )}
              </>
            ))}
          </div>

          {/* Mobile: vertical */}
          <div className="flex md:hidden flex-col gap-0">
            {steps.map((step, i) => (
              <motion.div
                key={step.label}
                variants={fadeUp}
                custom={i}
                data-ocid={`workflow.step.mobile.${i + 1}`}
                className="flex items-start gap-4"
              >
                <div className="flex flex-col items-center">
                  <div
                    className="w-12 h-12 rounded-2xl border flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `color-mix(in oklch, ${step.roleVar} 12%, transparent)`,
                      borderColor: `color-mix(in oklch, ${step.roleVar} 30%, transparent)`,
                    }}
                  >
                    <step.icon
                      className="w-6 h-6"
                      style={{ color: step.roleVar }}
                    />
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className="w-px h-8 mt-1"
                      style={{ background: "var(--color-border-base)" }}
                    />
                  )}
                </div>
                <div className="pt-3">
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── ANALYTICS SHOWCASE SECTION ────────────────────────────────── */}
      <Section
        id="analytics"
        className="py-24 px-6"
        style={{ background: "var(--color-bg-surface)" } as React.CSSProperties}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4 border"
              style={{
                background: "var(--color-bg-elevated)",
                borderColor: "var(--color-border-subtle)",
                color: "var(--color-accent-teal)",
              }}
            >
              <BarChart3 className="w-3 h-3" />
              Analytics
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl md:text-5xl font-bold mb-4"
            >
              Powerful Analytics{" "}
              <span style={{ color: "var(--color-brand-primary)" }}>
                &amp; Insights
              </span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-muted-foreground max-w-xl mx-auto"
            >
              Real-time dashboards that turn medicine data into actionable
              healthcare intelligence.
            </motion.p>
          </div>

          {/* Browser window mockup */}
          <motion.div
            variants={fadeUp}
            className="rounded-2xl overflow-hidden border"
            style={{
              borderColor: "var(--color-border-base)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            {/* Browser chrome */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{
                background: "var(--color-bg-elevated)",
                borderBottom: "1px solid var(--color-border-base)",
              }}
            >
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[var(--color-status-danger)]/60" />
                <div className="w-3 h-3 rounded-full bg-[var(--color-status-warning)]/60" />
                <div className="w-3 h-3 rounded-full bg-[var(--color-status-success)]/60" />
              </div>
              <div
                className="flex-1 mx-4 px-3 py-1 rounded-md text-xs text-muted-foreground text-center"
                style={{ background: "var(--color-bg-surface)" }}
              >
                medivault.app/analytics
              </div>
            </div>
            {/* Dashboard content */}
            <div className="p-6" style={{ background: "var(--color-bg-base)" }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Adherence trend */}
                <div
                  className="col-span-1 md:col-span-2 p-4 rounded-xl border"
                  style={{
                    background: "var(--color-bg-surface)",
                    borderColor: "var(--color-border-subtle)",
                  }}
                >
                  <div className="text-sm font-medium mb-1">
                    Adherence Trend
                  </div>
                  <div className="text-xs text-muted-foreground mb-4">
                    Last 7 days
                  </div>
                  <svg viewBox="0 0 300 80" className="w-full h-16">
                    <title>Adherence trend chart</title>
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="oklch(0.68 0.22 225)" />
                        <stop offset="100%" stopColor="oklch(0.75 0.19 190)" />
                      </linearGradient>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="oklch(0.68 0.22 225)"
                          stopOpacity="0.3"
                        />
                        <stop
                          offset="100%"
                          stopColor="oklch(0.68 0.22 225)"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 60 L43 45 L86 50 L129 30 L172 35 L215 20 L258 25 L300 15"
                      fill="none"
                      stroke="url(#lineGrad)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M0 60 L43 45 L86 50 L129 30 L172 35 L215 20 L258 25 L300 15 L300 80 L0 80 Z"
                      fill="url(#areaGrad)"
                    />
                    {[0, 43, 86, 129, 172, 215, 258, 300].map((x, i) => {
                      const ys = [60, 45, 50, 30, 35, 20, 25, 15];
                      return (
                        <circle
                          key={x}
                          cx={x}
                          cy={ys[i]}
                          r="3"
                          fill="oklch(0.75 0.19 190)"
                        />
                      );
                    })}
                  </svg>
                </div>
                {/* Expiry donut */}
                <div
                  className="p-4 rounded-xl border"
                  style={{
                    background: "var(--color-bg-surface)",
                    borderColor: "var(--color-border-subtle)",
                  }}
                >
                  <div className="text-sm font-medium mb-1">Expiry Status</div>
                  <div className="text-xs text-muted-foreground mb-3">
                    Total medicines
                  </div>
                  <div className="flex justify-center">
                    <div
                      className="w-20 h-20 rounded-full"
                      style={{
                        background:
                          "conic-gradient(oklch(0.65 0.20 150) 0% 65%, oklch(0.70 0.21 60) 65% 85%, oklch(0.60 0.23 25) 85% 100%)",
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1 mt-3">
                    {[
                      {
                        label: "Safe",
                        color: "oklch(0.65 0.20 150)",
                        pct: "65%",
                      },
                      {
                        label: "Expiring",
                        color: "oklch(0.70 0.21 60)",
                        pct: "20%",
                      },
                      {
                        label: "Expired",
                        color: "oklch(0.60 0.23 25)",
                        pct: "15%",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-2 text-xs"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: item.color }}
                        />
                        <span className="text-muted-foreground flex-1">
                          {item.label}
                        </span>
                        <span className="font-medium">{item.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Inventory bars */}
                <div
                  className="col-span-1 md:col-span-3 p-4 rounded-xl border"
                  style={{
                    background: "var(--color-bg-surface)",
                    borderColor: "var(--color-border-subtle)",
                  }}
                >
                  <div className="text-sm font-medium mb-4">
                    Inventory Levels by Category
                  </div>
                  <div className="flex items-end gap-3 h-16">
                    {[
                      {
                        label: "Antibiotics",
                        h: "75%",
                        color: "oklch(0.68 0.22 225)",
                      },
                      {
                        label: "Vitamins",
                        h: "90%",
                        color: "oklch(0.75 0.19 190)",
                      },
                      {
                        label: "Cardiac",
                        h: "45%",
                        color: "oklch(0.62 0.26 275)",
                      },
                      {
                        label: "Pain Relief",
                        h: "60%",
                        color: "oklch(0.68 0.22 225)",
                      },
                      {
                        label: "Diabetes",
                        h: "35%",
                        color: "oklch(0.70 0.21 60)",
                      },
                      {
                        label: "Thyroid",
                        h: "80%",
                        color: "oklch(0.75 0.19 190)",
                      },
                    ].map((bar) => (
                      <div
                        key={bar.label}
                        className="flex flex-col items-center gap-1 flex-1"
                      >
                        <div
                          className="w-full rounded-t-md"
                          style={{
                            height: bar.h,
                            background: bar.color,
                            opacity: 0.8,
                          }}
                        />
                        <span
                          className="text-xs text-muted-foreground truncate w-full text-center"
                          style={{ fontSize: "9px" }}
                        >
                          {bar.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ── SMART REMINDER SECTION ────────────────────────────────────── */}
      <Section id="reminders" className="py-24 px-6 bg-[var(--color-bg-base)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4 border"
              style={{
                background: "var(--color-bg-surface)",
                borderColor: "var(--color-border-subtle)",
                color: "var(--color-role-diagnostic)",
              }}
            >
              <Bell className="w-3 h-3" />
              Reminder System
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl md:text-5xl font-bold mb-4"
            >
              Never Miss{" "}
              <span style={{ color: "var(--color-brand-primary)" }}>
                a Dose
              </span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-muted-foreground max-w-xl mx-auto"
            >
              Multi-channel reminder system that ensures you never skip a
              medication.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Browser alerts */}
            <motion.div
              variants={fadeUp}
              custom={0}
              data-ocid="reminders.browser_card"
              className="card-operational p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: "var(--color-bg-surface)",
                borderColor: "var(--color-border-base)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl border flex items-center justify-center mb-4"
                style={{
                  background:
                    "color-mix(in oklch, var(--color-role-hospital) 12%, transparent)",
                  borderColor:
                    "color-mix(in oklch, var(--color-role-hospital) 30%, transparent)",
                }}
              >
                <Bell
                  className="w-6 h-6"
                  style={{ color: "var(--color-role-hospital)" }}
                />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">
                Browser Alerts
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get notified directly in your browser with rich notification
                cards.
              </p>
              {/* Mockup */}
              <div
                className="rounded-lg p-3 border"
                style={{
                  background: "var(--color-bg-elevated)",
                  borderColor: "var(--color-border-base)",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        "color-mix(in oklch, var(--color-role-hospital) 18%, transparent)",
                    }}
                  >
                    <Pill
                      className="w-4 h-4"
                      style={{ color: "var(--color-role-hospital)" }}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium">
                      MediVault Reminder
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Time to take Metformin 500mg
                    </div>
                    <div
                      className="text-xs mt-1"
                      style={{ color: "var(--color-role-hospital)" }}
                    >
                      Just now
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Voice reminders */}
            <motion.div
              variants={fadeUp}
              custom={1}
              data-ocid="reminders.voice_card"
              className="card-operational p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: "var(--color-bg-surface)",
                borderColor: "var(--color-border-base)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl border flex items-center justify-center mb-4"
                style={{
                  background:
                    "color-mix(in oklch, var(--color-role-diagnostic) 12%, transparent)",
                  borderColor:
                    "color-mix(in oklch, var(--color-role-diagnostic) 30%, transparent)",
                }}
              >
                <Activity
                  className="w-6 h-6"
                  style={{ color: "var(--color-role-diagnostic)" }}
                />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">
                Voice Reminders
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Hear your medicine name and dosage read aloud via Web Speech
                API.
              </p>
              {/* Mockup */}
              <div
                className="rounded-lg p-3 border"
                style={{
                  background: "var(--color-bg-elevated)",
                  borderColor: "var(--color-border-base)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-0.5 items-end h-6">
                    {[
                      { h: 3, id: "bar-1" },
                      { h: 5, id: "bar-2" },
                      { h: 4, id: "bar-3" },
                      { h: 6, id: "bar-4" },
                      { h: 4, id: "bar-5" },
                      { h: 5, id: "bar-6" },
                      { h: 3, id: "bar-7" },
                    ].map(({ h, id }) => (
                      <div
                        key={id}
                        className="w-1 rounded-full"
                        style={{
                          background: "var(--color-role-diagnostic)",
                          height: `${h * 4}px`,
                          opacity: 0.8,
                          animation: `pulse ${0.4 + Number.parseInt(id.split("-")[1]) * 0.1}s ease-in-out infinite alternate`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Speaking...
                  </span>
                </div>
                <div className="text-xs font-medium">
                  "Time to take Aspirin 75mg"
                </div>
              </div>
            </motion.div>

            {/* Telegram */}
            <motion.div
              variants={fadeUp}
              custom={2}
              data-ocid="reminders.telegram_card"
              className="card-operational p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden"
              style={{
                background: "var(--color-bg-surface)",
                borderColor:
                  "color-mix(in oklch, var(--color-accent-teal) 30%, var(--color-border-base))",
                borderLeftColor: "var(--color-accent-teal)",
                borderLeftWidth: "3px",
                backdropFilter: "blur(12px)",
              }}
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-[0.04]"
                style={{ background: "var(--color-accent-teal)" }}
              />
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{
                  background:
                    "color-mix(in oklch, var(--color-accent-teal) 12%, transparent)",
                  border:
                    "1px solid color-mix(in oklch, var(--color-accent-teal) 30%, transparent)",
                }}
              >
                <Send
                  className="w-6 h-6"
                  style={{ color: "var(--color-accent-teal)" }}
                />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">
                Telegram Integration
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Receive reminders even when the app is closed. Works on any
                device.
              </p>
              {/* Message bubble animation */}
              <div
                className="rounded-lg p-3 border"
                style={{
                  background: "var(--color-bg-elevated)",
                  borderColor: "var(--color-border-base)",
                }}
              >
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: 1,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatDelay: 4,
                  }}
                  className="text-xs p-2 rounded-lg rounded-tl-none mb-1"
                  style={{
                    background:
                      "color-mix(in oklch, var(--color-accent-teal) 20%, transparent)",
                    color: "var(--color-text-primary)",
                    maxWidth: "85%",
                  }}
                >
                  ⏰ MediVault Reminder
                  <br />
                  Time to take Lisinopril 10mg
                </motion.div>
                <div className="text-xs text-muted-foreground">
                  via @MediVaultBot
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ── COMING SOON SECTION ───────────────────────────────────────── */}
      <Section
        id="coming-soon"
        className="py-24 px-6"
        style={{ background: "var(--color-bg-surface)" } as React.CSSProperties}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4 border"
              style={{
                background: "var(--color-bg-elevated)",
                borderColor: "var(--color-border-subtle)",
                color: "var(--color-accent-teal)",
              }}
            >
              <Sparkles className="w-3 h-3" />
              Roadmap
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl md:text-5xl font-bold mb-4"
            >
              The Future of{" "}
              <span style={{ color: "var(--color-brand-primary)" }}>
                MediVault
              </span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-muted-foreground max-w-xl mx-auto"
            >
              Powered by AI — coming soon. Our roadmap brings intelligent
              healthcare management to every role.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {comingSoon.map((item, i) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                custom={i}
                data-ocid={`coming_soon.card.${i + 1}`}
                className="card-operational relative p-6 rounded-2xl overflow-hidden"
                style={{
                  background: "var(--color-bg-elevated)",
                  backdropFilter: "blur(10px)",
                  borderLeftColor: item.accentVar,
                  borderLeftWidth: "3px",
                }}
              >
                {/* Accent shimmer */}
                <div
                  className="absolute inset-0 opacity-[0.05]"
                  style={{
                    background: `radial-gradient(ellipse at top left, ${item.accentVar}, transparent 70%)`,
                  }}
                />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-xl border flex items-center justify-center"
                      style={{
                        background: "var(--color-bg-surface)",
                        borderColor: "var(--color-border-base)",
                      }}
                    >
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{
                        background: "var(--color-bg-surface)",
                        border: "1px solid var(--color-border-base)",
                        color: "var(--color-accent-teal)",
                      }}
                    >
                      Coming Soon
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-base mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {item.desc}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    Target: {item.timeline}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer
        className="relative py-16 px-6"
        style={{
          background: "var(--color-bg-surface)",
          borderTop: "1px solid var(--color-border-muted)",
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "var(--color-border-muted)" }}
        />
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "var(--color-brand-primary)" }}
              >
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <div
                  className="font-display font-bold text-xl"
                  style={{ color: "var(--color-brand-primary)" }}
                >
                  MediVault
                </div>
                <div className="text-xs text-muted-foreground">
                  Smart Medicine Management
                </div>
              </div>
            </div>

            {/* Nav links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <button
                type="button"
                onClick={() => scrollTo("features")}
                className="hover:text-foreground transition-colors"
              >
                Features
              </button>
              <button
                type="button"
                onClick={() => scrollTo("stakeholders")}
                className="hover:text-foreground transition-colors"
              >
                Stakeholders
              </button>
              <button
                type="button"
                onClick={() => scrollTo("workflow")}
                className="hover:text-foreground transition-colors"
              >
                How It Works
              </button>
              <button
                type="button"
                onClick={() => navigate({ to: "/login" })}
                className="hover:text-foreground transition-colors"
                data-ocid="footer.get_started_link"
              >
                Get Started
              </button>
            </div>
          </div>

          <div
            className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
            style={{ borderColor: "var(--color-border-muted)" }}
          >
            <div className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} MediVault. All rights reserved.
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Built on</span>
              <span
                className="px-2 py-0.5 rounded-md font-medium"
                style={{
                  background: "var(--color-bg-elevated)",
                  color: "var(--color-accent-teal)",
                }}
              >
                Internet Computer
              </span>
              <span>by</span>
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "medivault")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-foreground transition-colors"
                style={{ color: "var(--color-brand-primary)" }}
              >
                caffeine.ai
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
