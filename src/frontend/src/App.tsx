import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useRouterState,
} from "@tanstack/react-router";
import { ThemeProvider, useTheme } from "next-themes";
import { Suspense, lazy } from "react";
import { Toaster } from "sonner";

import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useEffect, useRef } from "react";

import LandingPage from "@/pages/LandingPage";
// ── Critical path (eager) ─────────────────────────────────────────────
import LoginPage from "@/pages/LoginPage";
import RoleSelectionPage from "@/pages/RoleSelectionPage";

import { PresentationModeToggle } from "@/components/common/PresentationModeToggle";
import ActivityTimelinePage from "@/pages/ActivityTimelinePage";
import MedicineLifecyclePage from "@/pages/MedicineLifecyclePage";
import AdminLayout from "@/pages/admin/AdminLayout";
import HospitalLayout from "@/pages/hospital/HospitalLayout";
import LabLayout from "@/pages/lab/LabLayout";
import PatientLayout from "@/pages/patient/PatientLayout";
import PharmacyLayout from "@/pages/pharmacy/PharmacyLayout";

// ── Lazy-loaded leaf pages ────────────────────────────────────────────
const PatientDashboard = lazy(() => import("@/pages/patient/PatientDashboard"));
const MedicinesPage = lazy(() => import("@/pages/patient/MedicinesPage"));
const DoseLogPage = lazy(() => import("@/pages/patient/DoseLogPage"));
const RemindersPage = lazy(() => import("@/pages/patient/RemindersPage"));
const PrescriptionsPage = lazy(
  () => import("@/pages/patient/PrescriptionsPage"),
);
const PatientAnalyticsPage = lazy(
  () => import("@/pages/patient/PatientAnalyticsPage"),
);
const QRScannerPage = lazy(() => import("@/pages/patient/QRScannerPage"));
const PatientSettingsPage = lazy(() => import("@/pages/patient/SettingsPage"));
const PatientReportsPage = lazy(
  () => import("@/pages/patient/PatientReportsPage"),
);

const PharmacyDashboard = lazy(
  () => import("@/pages/pharmacy/PharmacyDashboard"),
);
const InventoryPage = lazy(() => import("@/pages/pharmacy/InventoryPage"));
const OrdersPage = lazy(() => import("@/pages/pharmacy/OrdersPage"));
const ExpiryAlertsPage = lazy(
  () => import("@/pages/pharmacy/ExpiryAlertsPage"),
);
const PharmacyAnalyticsPage = lazy(
  () => import("@/pages/pharmacy/PharmacyAnalyticsPage"),
);
const PharmacySettingsPage = lazy(
  () => import("@/pages/pharmacy/SettingsPage"),
);
const PharmacyReportsPage = lazy(
  () => import("@/pages/pharmacy/PharmacyReportsPage"),
);
const PharmacySyncPage = lazy(
  () => import("@/pages/pharmacy/PharmacySyncPage"),
);

const DiagnosticBookingPage = lazy(
  () => import("@/pages/patient/DiagnosticBookingPage"),
);

const HospitalDashboard = lazy(
  () => import("@/pages/hospital/HospitalDashboard"),
);
const PatientRecordsPage = lazy(
  () => import("@/pages/hospital/PatientRecordsPage"),
);
const HospitalPrescriptionsPage = lazy(
  () => import("@/pages/hospital/HospitalPrescriptionsPage"),
);
const AppointmentsPage = lazy(
  () => import("@/pages/hospital/AppointmentsPage"),
);
const HospitalAnalyticsPage = lazy(
  () => import("@/pages/hospital/HospitalAnalyticsPage"),
);
const HospitalReportsPage = lazy(
  () => import("@/pages/hospital/HospitalReportsPage"),
);
const HospitalSettingsPage = lazy(
  () => import("@/pages/hospital/SettingsPage"),
);

const LabDashboard = lazy(() => import("@/pages/lab/LabDashboard"));
const ReportsPage = lazy(() => import("@/pages/lab/ReportsPage"));
const DiagnosticsPage = lazy(() => import("@/pages/lab/DiagnosticsPage"));
const LabAnalyticsPage = lazy(() => import("@/pages/lab/LabAnalyticsPage"));
const LabSettingsPage = lazy(() => import("@/pages/lab/SettingsPage"));
const LabReportsPage = lazy(() => import("@/pages/lab/LabReportsPage"));

const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const UsersPage = lazy(() => import("@/pages/admin/UsersPage"));
const AdminAnalyticsPage = lazy(
  () => import("@/pages/admin/AdminAnalyticsPage"),
);
const AdminSettingsPage = lazy(() => import("@/pages/admin/SettingsPage"));
const AdminReportsPage = lazy(() => import("@/pages/admin/AdminReportsPage"));

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingSpinner size="lg" />
    </div>
  );
}

function withSuspense(Component: React.ComponentType) {
  return function SuspenseWrapper() {
    return (
      <Suspense fallback={<PageFallback />}>
        <Component />
      </Suspense>
    );
  };
}

/** Wraps the route outlet with a smooth fade+slide transition keyed by pathname. */
function AnimatedOutlet() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const prevPathRef = useRef(pathname);
  const keyRef = useRef(0);

  if (prevPathRef.current !== pathname) {
    keyRef.current += 1;
    prevPathRef.current = pathname;
  }

  return (
    <div key={keyRef.current} className="route-transition">
      <Outlet />
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────
function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      richColors={true}
      closeButton={true}
      theme={resolvedTheme as "light" | "dark"}
      toastOptions={{ duration: 5000 }}
    />
  );
}

const rootRoute = createRootRoute({
  component: () => (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AnimatedOutlet />
      <ThemedToaster />
    </ThemeProvider>
  ),
});

// ── Landing page (public) ─────────────────────────────────────────────
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

// ── Auth pages ────────────────────────────────────────────────────────
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const roleSelectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/role-select",
  component: RoleSelectionPage,
});

// ── Patient ───────────────────────────────────────────────────────────
const patientRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/patient",
  component: () => (
    <ErrorBoundary>
      <PatientLayout />
    </ErrorBoundary>
  ),
});
const patientIndexRoute = createRoute({
  getParentRoute: () => patientRoute,
  path: "/",
  component: withSuspense(PatientDashboard),
});
const patientMedicinesRoute = createRoute({
  getParentRoute: () => patientRoute,
  path: "/medicines",
  component: withSuspense(MedicinesPage),
});
const patientDosesRoute = createRoute({
  getParentRoute: () => patientRoute,
  path: "/doses",
  component: withSuspense(DoseLogPage),
});
const patientRemindersRoute = createRoute({
  getParentRoute: () => patientRoute,
  path: "/reminders",
  component: withSuspense(RemindersPage),
});
const patientPrescriptionsRoute = createRoute({
  getParentRoute: () => patientRoute,
  path: "/prescriptions",
  component: withSuspense(PrescriptionsPage),
});
const patientAnalyticsRoute = createRoute({
  getParentRoute: () => patientRoute,
  path: "/analytics",
  component: withSuspense(PatientAnalyticsPage),
});

const patientScannerRoute = createRoute({
  getParentRoute: () => patientRoute,
  path: "/scanner",
  component: withSuspense(QRScannerPage),
});
const patientSettingsRoute = createRoute({
  getParentRoute: () => patientRoute,
  path: "/settings",
  component: withSuspense(PatientSettingsPage),
});
const patientDiagnosticsRoute = createRoute({
  getParentRoute: () => patientRoute,
  path: "/diagnostics",
  component: withSuspense(DiagnosticBookingPage),
});
const patientReportsRoute = createRoute({
  getParentRoute: () => patientRoute,
  path: "/reports",
  component: withSuspense(PatientReportsPage),
});

// ── Pharmacy ──────────────────────────────────────────────────────────
const pharmacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pharmacy",
  component: () => (
    <ErrorBoundary>
      <PharmacyLayout />
    </ErrorBoundary>
  ),
});
const pharmacyIndexRoute = createRoute({
  getParentRoute: () => pharmacyRoute,
  path: "/",
  component: withSuspense(PharmacyDashboard),
});
const pharmacyInventoryRoute = createRoute({
  getParentRoute: () => pharmacyRoute,
  path: "/inventory",
  component: withSuspense(InventoryPage),
});
const pharmacyOrdersRoute = createRoute({
  getParentRoute: () => pharmacyRoute,
  path: "/orders",
  component: withSuspense(OrdersPage),
});
const pharmacyAlertsRoute = createRoute({
  getParentRoute: () => pharmacyRoute,
  path: "/alerts",
  component: withSuspense(ExpiryAlertsPage),
});
const pharmacyAnalyticsRoute = createRoute({
  getParentRoute: () => pharmacyRoute,
  path: "/analytics",
  component: withSuspense(PharmacyAnalyticsPage),
});
const pharmacySettingsRoute = createRoute({
  getParentRoute: () => pharmacyRoute,
  path: "/settings",
  component: withSuspense(PharmacySettingsPage),
});
const pharmacySyncRoute = createRoute({
  getParentRoute: () => pharmacyRoute,
  path: "/sync",
  component: withSuspense(PharmacySyncPage),
});
const pharmacyReportsRoute = createRoute({
  getParentRoute: () => pharmacyRoute,
  path: "/reports",
  component: withSuspense(PharmacyReportsPage),
});

// ── Hospital ──────────────────────────────────────────────────────────
const hospitalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/hospital",
  component: () => (
    <ErrorBoundary>
      <HospitalLayout />
    </ErrorBoundary>
  ),
});
const hospitalIndexRoute = createRoute({
  getParentRoute: () => hospitalRoute,
  path: "/",
  component: withSuspense(HospitalDashboard),
});
const hospitalRecordsRoute = createRoute({
  getParentRoute: () => hospitalRoute,
  path: "/records",
  component: withSuspense(PatientRecordsPage),
});
const hospitalPrescriptionsRoute = createRoute({
  getParentRoute: () => hospitalRoute,
  path: "/prescriptions",
  component: withSuspense(HospitalPrescriptionsPage),
});
const hospitalAppointmentsRoute = createRoute({
  getParentRoute: () => hospitalRoute,
  path: "/appointments",
  component: withSuspense(AppointmentsPage),
});
const hospitalAnalyticsRoute = createRoute({
  getParentRoute: () => hospitalRoute,
  path: "/analytics",
  component: withSuspense(HospitalAnalyticsPage),
});
const hospitalReportsRoute = createRoute({
  getParentRoute: () => hospitalRoute,
  path: "/reports",
  component: withSuspense(HospitalReportsPage),
});
const hospitalSettingsRoute = createRoute({
  getParentRoute: () => hospitalRoute,
  path: "/settings",
  component: withSuspense(HospitalSettingsPage),
});

// ── Lab ───────────────────────────────────────────────────────────────
const labRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/lab",
  component: () => (
    <ErrorBoundary>
      <LabLayout />
    </ErrorBoundary>
  ),
});
const labIndexRoute = createRoute({
  getParentRoute: () => labRoute,
  path: "/",
  component: withSuspense(LabDashboard),
});
const labReportsRoute = createRoute({
  getParentRoute: () => labRoute,
  path: "/reports",
  component: withSuspense(ReportsPage),
});
const labDiagnosticsRoute = createRoute({
  getParentRoute: () => labRoute,
  path: "/diagnostics",
  component: withSuspense(DiagnosticsPage),
});
const labAnalyticsRoute = createRoute({
  getParentRoute: () => labRoute,
  path: "/analytics",
  component: withSuspense(LabAnalyticsPage),
});
const labSettingsRoute = createRoute({
  getParentRoute: () => labRoute,
  path: "/settings",
  component: withSuspense(LabSettingsPage),
});
const labReportsExportRoute = createRoute({
  getParentRoute: () => labRoute,
  path: "/reports-export",
  component: withSuspense(LabReportsPage),
});

// ── Admin ─────────────────────────────────────────────────────────────
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => (
    <ErrorBoundary>
      <AdminLayout />
    </ErrorBoundary>
  ),
});
const adminIndexRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/",
  component: withSuspense(AdminDashboard),
});
const adminUsersRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/users",
  component: withSuspense(UsersPage),
});
const adminAnalyticsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/analytics",
  component: withSuspense(AdminAnalyticsPage),
});
const adminSettingsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/settings",
  component: withSuspense(AdminSettingsPage),
});
const adminReportsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/reports",
  component: withSuspense(AdminReportsPage),
});

// ── Shared top-level pages ──────────────────────────────────────────
const WorkflowIntelligencePage = lazy(
  () => import("@/pages/WorkflowIntelligencePage"),
);

const ExportCenterPage = lazy(() => import("@/pages/ExportCenterPage"));
const ExportHistoryPage = lazy(() => import("@/pages/ExportHistoryPage"));

const timelineRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/timeline",
  component: withSuspense(ActivityTimelinePage),
});

const lifecycleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/lifecycle",
  component: withSuspense(MedicineLifecyclePage),
});

const exportHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/export-history",
  component: withSuspense(ExportHistoryPage),
});
const exportCenterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/export-center",
  component: withSuspense(ExportCenterPage),
});
const workflowIntelligenceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/workflow-intelligence",
  component: withSuspense(WorkflowIntelligencePage),
});

// ── Router tree ───────────────────────────────────────────────────────
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  roleSelectRoute,
  timelineRoute,
  lifecycleRoute,
  exportHistoryRoute,
  exportCenterRoute,
  workflowIntelligenceRoute,
  patientRoute.addChildren([
    patientIndexRoute,
    patientMedicinesRoute,
    patientDosesRoute,
    patientRemindersRoute,
    patientPrescriptionsRoute,
    patientAnalyticsRoute,
    patientScannerRoute,
    patientSettingsRoute,
    patientDiagnosticsRoute,
    patientReportsRoute,
  ]),
  pharmacyRoute.addChildren([
    pharmacyIndexRoute,
    pharmacyInventoryRoute,
    pharmacyOrdersRoute,
    pharmacyAlertsRoute,
    pharmacyAnalyticsRoute,
    pharmacySettingsRoute,
    pharmacySyncRoute,
    pharmacyReportsRoute,
  ]),
  hospitalRoute.addChildren([
    hospitalIndexRoute,
    hospitalRecordsRoute,
    hospitalPrescriptionsRoute,
    hospitalAppointmentsRoute,
    hospitalAnalyticsRoute,
    hospitalReportsRoute,
    hospitalSettingsRoute,
  ]),
  labRoute.addChildren([
    labIndexRoute,
    labReportsRoute,
    labDiagnosticsRoute,
    labAnalyticsRoute,
    labSettingsRoute,
    labReportsExportRoute,
  ]),
  adminRoute.addChildren([
    adminIndexRoute,
    adminUsersRoute,
    adminAnalyticsRoute,
    adminSettingsRoute,
    adminReportsRoute,
  ]),
]);

const router = createRouter({ routeTree });

// Export router type for TypeScript
export type AppRouter = typeof router;

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <PresentationModeToggle />
    </>
  );
}
