import { PWASettingsSection } from "@/components/pwa/PWASettingsSection";
import { useNavigate } from "@tanstack/react-router";
import { ClipboardList, FileText, FlaskConical, Settings } from "lucide-react";

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
    <div className="bg-card backdrop-blur-sm rounded-2xl border border-border overflow-hidden">
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

export default function LabSettingsPage() {
  return (
    <div
      className="min-h-screen bg-background p-6 space-y-6"
      data-ocid="lab.settings.page"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-role-diagnostic)]/20 to-[var(--color-role-hospital)]/20 border border-border flex items-center justify-center">
          <Settings size={18} className="text-[var(--color-role-diagnostic)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Lab Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your lab preferences and offline behavior
          </p>
        </div>
      </div>

      {/* Role info card */}
      <div className="bg-card backdrop-blur-sm rounded-2xl border border-border px-6 py-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-role-diagnostic)]/15 to-[var(--color-role-hospital)]/15 border border-border flex items-center justify-center flex-shrink-0">
          <FlaskConical
            size={18}
            className="text-[var(--color-role-diagnostic)]"
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Diagnostic Laboratory
          </p>
          <p className="text-xs text-muted-foreground">
            You are signed in as a Lab technician. Manage reports, diagnostics,
            and offline sync settings below.
          </p>
        </div>
        <span className="ml-auto badge-purple flex-shrink-0">Lab</span>
      </div>

      {/* Reports & Exports */}
      <ReportsExportsCard
        accentFrom="from-[var(--color-role-diagnostic)]/30"
        accentTo="to-[var(--color-role-hospital)]/30"
        iconColor="text-violet-400"
      />

      {/* PWA / Offline settings */}
      <PWASettingsSection />
    </div>
  );
}
