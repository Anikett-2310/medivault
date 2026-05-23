import { PWASettingsSection } from "@/components/pwa/PWASettingsSection";
import { useNavigate } from "@tanstack/react-router";
import { ClipboardList, FileText, Settings, ShieldCheck } from "lucide-react";

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
    <div className="bg-muted backdrop-blur-md rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <div
          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${accentFrom} ${accentTo} border border-border flex items-center justify-center`}
        >
          <ClipboardList size={16} className={iconColor} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Reports &amp; Exports
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Export history and audit logs
          </p>
        </div>
      </div>
      <div className="px-6 py-4 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          View a full audit trail of all PDF and CSV exports, filters used, and
          export status.
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: "/export-history" })}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-muted hover:bg-muted/80 text-foreground border border-border transition-all duration-200"
          data-ocid="settings.reports.view_history_button"
        >
          <FileText size={14} />
          View Export History
        </button>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <div
      className="min-h-screen bg-background p-6 space-y-6"
      data-ocid="admin.settings.page"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-role-admin)]/30 to-[var(--color-role-admin)]/20 border border-border flex items-center justify-center">
          <Settings size={18} className="text-[var(--color-role-admin)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Admin Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Platform-wide settings and offline configuration
          </p>
        </div>
      </div>

      {/* Role info card */}
      <div className="bg-muted backdrop-blur-md rounded-2xl border border-border px-6 py-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-role-admin)]/20 to-[var(--color-role-admin)]/10 border border-border flex items-center justify-center flex-shrink-0">
          <ShieldCheck size={18} className="text-[var(--color-role-admin)]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Platform Administrator
          </p>
          <p className="text-xs text-muted-foreground">
            You have full system access. Use the options below to manage
            platform caching, offline queues, and app installation.
          </p>
        </div>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full badge-danger flex-shrink-0">
          Admin
        </span>
      </div>

      {/* Reports & Exports */}
      <ReportsExportsCard
        accentFrom="from-[var(--color-role-admin)]/30"
        accentTo="to-[var(--color-role-admin)]/20"
        iconColor="text-[var(--color-role-admin)]"
      />

      {/* PWA / Offline settings */}
      <PWASettingsSection />
    </div>
  );
}
