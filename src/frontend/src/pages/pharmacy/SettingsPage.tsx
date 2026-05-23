import { PWASettingsSection } from "@/components/pwa/PWASettingsSection";
import { useAuth } from "@/hooks/useAuth";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  BellOff,
  ClipboardList,
  FileText,
  Settings,
  Shield,
  Store,
} from "lucide-react";
import { useEffect, useState } from "react";

function ReportsExportsCard({
  accentFrom,
  accentTo,
  iconColor,
}: {
  accentFrom: string;
  accentTo: string;
  iconColor: string;
}) {
  const navigate = useNavigate();
  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">
        Reports &amp; Exports
      </h2>
      <div className="bg-card backdrop-blur-md rounded-2xl border border-border shadow-xl overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accentFrom} ${accentTo} border border-border flex items-center justify-center`}
          >
            <ClipboardList size={18} className={iconColor} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Export History</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              View all past exports and audit logs
            </p>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-muted-foreground mb-4">
            Access a full audit trail of all report exports including PDF and
            CSV downloads, filters used, and export status.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/export-history" })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-card hover:bg-muted/80 text-foreground border border-border transition-all duration-200"
            data-ocid="settings.reports.view_history_button"
          >
            <FileText size={14} />
            View Export History
          </button>
        </div>
      </div>
    </div>
  );
}

function BrowserNotificationsCard() {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleRequest = async () => {
    if (!("Notification" in window)) return;
    setRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } finally {
      setRequesting(false);
    }
  };

  const isGranted = permission === "granted";
  const isDenied = permission === "denied";

  return (
    <div className="bg-card backdrop-blur-md rounded-2xl border border-border shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-border flex items-center justify-center">
            <Bell size={18} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Browser Notifications
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Receive alerts for inventory updates and low-stock warnings
            </p>
          </div>
        </div>
        <span
          className={`${
            isGranted
              ? "badge-success"
              : isDenied
                ? "badge-danger"
                : "badge-neutral"
          }`}
          data-ocid="pharmacy.settings.notification_status"
        >
          {isGranted ? "● Enabled" : isDenied ? "✕ Blocked" : "○ Not Set"}
        </span>
      </div>

      <div className="px-6 py-5">
        {isGranted ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Bell size={16} className="text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-300">
              Notifications are enabled. You'll receive alerts for inventory
              activity and system updates.
            </p>
          </div>
        ) : isDenied ? (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <BellOff size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">
              Notifications are blocked. To enable them, update your browser's
              site permissions for this page.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Enable desktop notifications to stay informed about inventory
              levels and medicine sync activity.
            </p>
            <button
              type="button"
              onClick={handleRequest}
              disabled={requesting}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all duration-200 disabled:opacity-50"
              data-ocid="pharmacy.settings.enable_notifications_button"
            >
              <Bell size={14} />
              {requesting ? "Requesting…" : "Enable Notifications"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PharmacySettingsPage() {
  const { user } = useAuth();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toText() ?? "—";

  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Settings size={22} className="text-emerald-400" />
          <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Settings
          </h1>
        </div>
        <p className="text-sm text-muted-foreground ml-9">
          Manage your pharmacy account and notification preferences
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile card */}
        <div className="bg-card backdrop-blur-md rounded-2xl border border-border shadow-xl overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-border flex items-center justify-center">
              <Shield size={18} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Profile</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your account information
              </p>
            </div>
          </div>
          <div className="px-6 py-5">
            <dl
              className="space-y-3"
              data-ocid="pharmacy.settings.profile.card"
            >
              <div className="flex items-center justify-between py-2 border-b border-border">
                <dt className="text-sm text-muted-foreground">Name</dt>
                <dd className="text-sm font-medium text-foreground">
                  {user?.name ?? "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <dt className="text-sm text-muted-foreground">Role</dt>
                <dd>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Store size={11} />
                    Pharmacy
                  </span>
                </dd>
              </div>
              <div className="flex items-start justify-between py-2">
                <dt className="text-sm text-muted-foreground">Principal ID</dt>
                <dd
                  className="text-xs font-mono text-foreground/80 max-w-[55%] break-all text-right"
                  data-ocid="pharmacy.settings.principal"
                >
                  {principal}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Notifications section */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">
            Notifications
          </h2>
          <BrowserNotificationsCard />
        </div>

        {/* Reports & Exports section */}
        <ReportsExportsCard
          accentFrom="from-[var(--color-role-patient)]/30"
          accentTo="to-[var(--color-role-patient)]/20"
          iconColor="text-emerald-400"
        />

        {/* App & Offline section */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">
            App &amp; Offline
          </h2>
          <PWASettingsSection />
        </div>
      </div>
    </div>
  );
}
