import { RoleBadge } from "@/components/common/RoleBadge";
import { InstallPromptBanner } from "@/components/pwa/InstallPromptBanner";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotificationCount } from "@/hooks/useBackend";
import { useOnline } from "@/hooks/useOnline";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link, useRouter } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Calendar,
  ChevronLeft,
  ClipboardList,
  Clock,
  FileText,
  FlaskConical,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Microscope,
  Moon,
  Package,
  Pill,
  ScanQrCode,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sun,
  Users,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { type ReactNode, useEffect, useState } from "react";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

type NavItem = { label: string; path: string; icon: ReactNode };

const PATIENT_NAV: NavItem[] = [
  { label: "Overview", path: "/patient", icon: <LayoutDashboard size={18} /> },
  {
    label: "My Medicines",
    path: "/patient/medicines",
    icon: <Pill size={18} />,
  },
  { label: "Dose Log", path: "/patient/doses", icon: <Activity size={18} /> },
  { label: "Reminders", path: "/patient/reminders", icon: <Bell size={18} /> },
  {
    label: "Prescriptions",
    path: "/patient/prescriptions",
    icon: <FileText size={18} />,
  },
  {
    label: "Book Tests",
    path: "/patient/diagnostics",
    icon: <FlaskConical size={18} />,
  },
  {
    label: "QR Scanner",
    path: "/patient/scanner",
    icon: <ScanQrCode size={18} />,
  },
  {
    label: "Analytics",
    path: "/patient/analytics",
    icon: <BarChart3 size={18} />,
  },
  {
    label: "Reports",
    path: "/patient/reports",
    icon: <ClipboardList size={18} />,
  },
  {
    label: "Notifications",
    path: "/patient/notifications",
    icon: <Bell size={18} />,
  },
  {
    label: "Activity Timeline",
    path: "/timeline",
    icon: <Clock size={18} />,
  },
  {
    label: "Settings",
    path: "/patient/settings",
    icon: <Settings size={18} />,
  },
];

const PHARMACY_NAV: NavItem[] = [
  { label: "Overview", path: "/pharmacy", icon: <LayoutDashboard size={18} /> },
  {
    label: "Inventory",
    path: "/pharmacy/inventory",
    icon: <Package size={18} />,
  },
  {
    label: "Orders",
    path: "/pharmacy/orders",
    icon: <ShoppingCart size={18} />,
  },
  {
    label: "Expiry Alerts",
    path: "/pharmacy/alerts",
    icon: <AlertTriangle size={18} />,
  },
  {
    label: "Sync Medicine",
    path: "/pharmacy/sync",
    icon: <ShieldCheck size={18} />,
  },
  {
    label: "Analytics",
    path: "/pharmacy/analytics",
    icon: <BarChart3 size={18} />,
  },
  {
    label: "Reports",
    path: "/pharmacy/reports",
    icon: <ClipboardList size={18} />,
  },
  {
    label: "Notifications",
    path: "/pharmacy/notifications",
    icon: <Bell size={18} />,
  },
  {
    label: "Activity Timeline",
    path: "/timeline",
    icon: <Clock size={18} />,
  },
  {
    label: "Settings",
    path: "/pharmacy/settings",
    icon: <Settings size={18} />,
  },
];

const HOSPITAL_NAV: NavItem[] = [
  { label: "Overview", path: "/hospital", icon: <LayoutDashboard size={18} /> },
  {
    label: "Patient Records",
    path: "/hospital/records",
    icon: <Users size={18} />,
  },
  {
    label: "Prescriptions",
    path: "/hospital/prescriptions",
    icon: <FileText size={18} />,
  },
  {
    label: "Appointments",
    path: "/hospital/appointments",
    icon: <Calendar size={18} />,
  },
  {
    label: "Analytics",
    path: "/hospital/analytics",
    icon: <BarChart3 size={18} />,
  },
  {
    label: "Reports",
    path: "/hospital/reports",
    icon: <ClipboardList size={18} />,
  },
  {
    label: "Activity Timeline",
    path: "/timeline",
    icon: <Clock size={18} />,
  },
  {
    label: "Notifications",
    path: "/hospital/notifications",
    icon: <Bell size={18} />,
  },
  {
    label: "Settings",
    path: "/hospital/settings",
    icon: <Settings size={18} />,
  },
];

const LAB_NAV: NavItem[] = [
  { label: "Overview", path: "/lab", icon: <LayoutDashboard size={18} /> },
  { label: "Reports", path: "/lab/reports", icon: <FlaskConical size={18} /> },
  {
    label: "Diagnostic Records",
    path: "/lab/diagnostics",
    icon: <Microscope size={18} />,
  },
  { label: "Analytics", path: "/lab/analytics", icon: <BarChart3 size={18} /> },
  {
    label: "Activity Timeline",
    path: "/timeline",
    icon: <Clock size={18} />,
  },
  {
    label: "Notifications",
    path: "/lab/notifications",
    icon: <Bell size={18} />,
  },
  {
    label: "Export Reports",
    path: "/lab/reports-export",
    icon: <ClipboardList size={18} />,
  },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Overview", path: "/admin", icon: <LayoutDashboard size={18} /> },
  { label: "Users", path: "/admin/users", icon: <Users size={18} /> },
  {
    label: "System Analytics",
    path: "/admin/analytics",
    icon: <BarChart3 size={18} />,
  },
  {
    label: "Reports",
    path: "/admin/reports",
    icon: <ClipboardList size={18} />,
  },
  {
    label: "Activity Timeline",
    path: "/timeline",
    icon: <Clock size={18} />,
  },
  {
    label: "Notifications",
    path: "/admin/notifications",
    icon: <Bell size={18} />,
  },
];

function getRoleColorVar(role?: string): string {
  switch (role) {
    case "Patient":
      return "var(--color-role-patient)";
    case "Pharmacy":
      return "var(--color-role-pharmacy)";
    case "Hospital":
      return "var(--color-role-hospital)";
    case "Lab":
      return "var(--color-role-diagnostic)";
    case "Admin":
      return "var(--color-role-admin)";
    default:
      return "var(--color-brand-primary)";
  }
}

function getRoleSurfaceVar(role?: string): string {
  switch (role) {
    case "Patient":
      return "var(--color-role-patient-surface)";
    case "Pharmacy":
      return "var(--color-role-pharmacy-surface)";
    case "Hospital":
      return "var(--color-role-hospital-surface)";
    case "Lab":
      return "var(--color-role-diagnostic-surface)";
    case "Admin":
      return "var(--color-role-admin-surface)";
    default:
      return "var(--color-bg-highlight)";
  }
}

function getNavForRole(role?: string): NavItem[] {
  switch (role) {
    case "Patient":
      return PATIENT_NAV;
    case "Pharmacy":
      return PHARMACY_NAV;
    case "Hospital":
      return HOSPITAL_NAV;
    case "Lab":
      return LAB_NAV;
    case "Admin":
      return ADMIN_NAV;
    default:
      return [];
  }
}

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  useOnline(); // Initialize online/offline detection
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const { data: unreadCount } = useUnreadNotificationCount();
  const unread = Number(unreadCount ?? BigInt(0));

  // Persist sidebar collapsed state in localStorage
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (isMobile) return false;
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored !== null) return stored !== "true";
    } catch {}
    return true;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  // Sync localStorage on collapse toggle
  const toggleSidebar = (open: boolean) => {
    setSidebarOpen(open);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, open ? "false" : "true");
    } catch {}
  };

  // Close mobile sidebar on Escape key
  useEffect(() => {
    if (!isMobile) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isMobile]);

  // Auto-close mobile sidebar on route change
  // biome-ignore lint/correctness/useExhaustiveDependencies: currentPath triggers mobile menu close
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentPath]);

  const navItems = getNavForRole(user?.role as string);
  const roleColor = getRoleColorVar(user?.role as string);
  const roleSurface = getRoleSurfaceVar(user?.role as string);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-5 bg-[var(--color-bg-elevated)]"
        style={{
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        {/* Shield/Cross icon — always visible */}
        <div className="w-9 h-9 rounded-xl bg-[var(--color-brand-primary)] flex items-center justify-center flex-shrink-0">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 2L4 6v6c0 5.25 3.4 10.15 8 11.35C16.6 22.15 20 17.25 20 12V6l-8-4z"
              fill="white"
              fillOpacity="0.95"
            />
            <path
              d="M11 8h2v3h3v2h-3v3h-2v-3H8v-2h3V8z"
              fill="rgba(14,165,233,0.9)"
            />
          </svg>
        </div>

        {/* Expanded: Medi + Vault wordmark */}
        {(sidebarOpen || mobileMenuOpen) && (
          <div className="flex items-baseline gap-0.5 min-w-0">
            <span className="font-display font-bold text-base text-[var(--color-text-primary)] leading-none hidden sm:block">
              Medi
            </span>
            <span className="font-display font-bold text-base leading-none text-[var(--color-brand-primary)]">
              Vault
            </span>
          </div>
        )}

        {/* Mobile close X inside sidebar panel */}
        {isMobile && mobileMenuOpen && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="ml-auto text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        )}
        {/* Desktop collapse chevron */}
        {!isMobile && sidebarOpen && (
          <button
            type="button"
            onClick={() => toggleSidebar(false)}
            className="ml-auto text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* User */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-4 bg-[var(--color-bg-surface)]",
          !sidebarOpen && !mobileMenuOpen && "justify-center",
        )}
        style={{ borderBottom: "1px solid var(--color-border-base)" }}
      >
        <div
          className="w-9 h-9 rounded-full border flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: `oklch(from ${roleColor} l c h / 0.18)`,
            borderColor: `oklch(from ${roleColor} l c h / 0.35)`,
          }}
        >
          <span className="text-sm font-bold" style={{ color: roleColor }}>
            {user?.name?.[0]?.toUpperCase() ?? "?"}
          </span>
        </div>
        {(sidebarOpen || mobileMenuOpen) && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
              {user?.name ?? "User"}
            </p>
            <RoleBadge role={user?.role as string} size="sm" />
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto flex flex-col gap-0.5">
        {navItems.map((item) => {
          const isActive =
            currentPath === item.path ||
            (item.path !== "/patient" &&
              item.path !== "/pharmacy" &&
              item.path !== "/hospital" &&
              item.path !== "/lab" &&
              item.path !== "/admin" &&
              currentPath.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-150 group overflow-hidden",
                !sidebarOpen && !mobileMenuOpen && "justify-center px-2",
                !isActive &&
                  "hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]",
              )}
              style={
                isActive
                  ? {
                      backgroundColor: roleSurface,
                      color: roleColor,
                      borderLeft: `3px solid ${roleColor}`,
                      paddingLeft:
                        !sidebarOpen && !mobileMenuOpen
                          ? "0.5rem"
                          : "calc(0.75rem - 2px)",
                      fontWeight: 600,
                    }
                  : {
                      color: "var(--color-text-secondary)",
                      borderLeft: "3px solid transparent",
                    }
              }
              data-ocid={`nav.${item.label.toLowerCase().replace(/\s+/g, "-")}.link`}
            >
              <span
                className="relative flex-shrink-0"
                style={isActive ? { color: roleColor } : {}}
              >
                {item.icon}
                {item.label === "Notifications" && unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-status-danger)] text-white text-[9px] font-bold flex items-center justify-center leading-none">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </span>
              {(sidebarOpen || mobileMenuOpen) && (
                <span className="text-sm flex-1 truncate">{item.label}</span>
              )}
              {(sidebarOpen || mobileMenuOpen) &&
                item.label === "Notifications" &&
                unread > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-full bg-[var(--color-status-danger)] text-white text-[9px] font-bold leading-none">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div
        className="px-3 pb-4 space-y-1 pt-3 bg-[var(--color-bg-surface)]"
        style={{ borderTop: "1px solid var(--color-border-base)" }}
      >
        <button
          type="button"
          onClick={logout}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-status-danger)]/10 hover:text-[var(--color-status-danger)] transition-all duration-200",
            !sidebarOpen && !mobileMenuOpen && "justify-center px-2",
          )}
          data-ocid="nav.logout.button"
          aria-label="Sign out"
        >
          <LogOut size={18} />
          {(sidebarOpen || mobileMenuOpen) && (
            <span className="text-sm font-medium">Logout</span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-base)" }}
    >
      <OfflineBanner />
      <InstallPromptBanner />
      {/* Desktop sidebar */}
      {!isMobile && (
        <aside
          className={cn(
            "hidden md:flex flex-col bg-[var(--color-bg-sidebar)] border-r border-[var(--color-border-base)] transition-all duration-300 flex-shrink-0",
            sidebarOpen ? "w-64" : "w-16",
          )}
        >
          <SidebarContent />
        </aside>
      )}

      {/* Mobile drawer — slide-in overlay */}
      {isMobile && (
        <>
          {/* Backdrop */}
          <div
            className={cn(
              "fixed inset-0 bg-[var(--color-bg-overlay)] backdrop-blur-sm z-40 transition-opacity duration-300",
              mobileMenuOpen
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none",
            )}
            aria-hidden={!mobileMenuOpen}
            role="presentation"
            onClick={() => setMobileMenuOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setMobileMenuOpen(false)}
          />
          {/* Panel */}
          <aside
            id="mobile-sidebar-panel"
            className={cn(
              "fixed left-0 top-0 bottom-0 w-72 bg-[var(--color-bg-sidebar)] border-r border-[var(--color-border-base)] z-50 flex flex-col transition-transform duration-300 ease-out",
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
            )}
            aria-label="Navigation"
          >
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header
          className="flex items-center gap-4 px-4 md:px-6 h-14 bg-[var(--color-bg-elevated)] flex-shrink-0"
          style={{
            borderBottom: "1px solid var(--color-border-base)",
            boxShadow: "0 1px 0 var(--color-border-subtle)",
          }}
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:outline-none"
          >
            Skip to main content
          </a>
          {isMobile ? (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="header.menu.button"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-sidebar-panel"
            >
              <Menu size={20} />
            </button>
          ) : (
            !sidebarOpen && (
              <button
                type="button"
                onClick={() => toggleSidebar(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="header.expand_sidebar.button"
                aria-label="Expand sidebar"
                aria-expanded={sidebarOpen}
              >
                <Menu size={20} />
              </button>
            )
          )}
          {/* Page title with role accent */}
          <div className="flex-1 min-w-0">
            {user?.role && (
              <span
                className="text-xs font-semibold uppercase tracking-widest hidden md:block"
                style={{ color: roleColor, letterSpacing: "0.08em" }}
              >
                {user.role} Portal
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border-base)",
              color: "var(--color-text-secondary)",
            }}
            data-ocid="header.theme_toggle.button"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border-base)",
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: `oklch(from ${roleColor} l c h / 0.18)`,
                border: `1px solid oklch(from ${roleColor} l c h / 0.35)`,
              }}
            >
              <span
                className="text-[10px] font-bold"
                style={{ color: roleColor }}
              >
                {user?.name?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            <span className="text-sm font-medium text-[var(--color-text-primary)] hidden sm:block">
              {user?.name ?? "User"}
            </span>
          </div>
        </header>

        {/* Accessibility: live region for screen-reader announcements */}
        <div
          id="status-announcer"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
        {/* Content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto"
          style={{ backgroundColor: "var(--color-bg-base)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
