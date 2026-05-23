import { RoleBadge } from "@/components/common/RoleBadge";
import { SkeletonStat } from "@/components/common/SkeletonCard";
import { WalkthroughOverlay } from "@/components/common/WalkthroughOverlay";
import AnimatedModal from "@/components/ui/modal-animated";
import { ADMIN_WALKTHROUGH_STEPS } from "@/data/walkthroughSteps";
import { useAllUsers, useSystemStats } from "@/hooks/useBackend";
import { useDemoReset } from "@/hooks/useDemoReset";
import { useWalkthrough } from "@/hooks/useWalkthrough";
import { useAuthStore } from "@/store/auth";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Circle,
  Map as MapIcon,
  Pill,
  RefreshCw,
  ShoppingCart,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const {
    activeStepIndex,
    isActive: walkthroughActive,
    startWalkthrough,
    nextStep,
    prevStep,
    dismissWalkthrough,
  } = useWalkthrough(ADMIN_WALKTHROUGH_STEPS, "admin");

  const { data: stats, isLoading } = useSystemStats();
  const { data: allUsers } = useAllUsers();
  const [cacheModalOpen, setCacheModalOpen] = useState(false);
  const [cacheResetDone, setCacheResetDone] = useState(false);
  const [demoResetOpen, setDemoResetOpen] = useState(false);
  const { resetDemo } = useDemoReset();

  function handleCacheReset() {
    setCacheResetDone(true);
    setTimeout(() => {
      setCacheModalOpen(false);
      setCacheResetDone(false);
    }, 1200);
  }

  return (
    <div className="p-6 space-y-6 bg-[var(--color-bg-base)] min-h-full relative">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-1 pb-3 border-b border-[var(--color-role-admin)]/20">
          <div className="w-1 h-8 rounded-sm bg-[var(--color-role-admin)] shadow-[0_0_8px_var(--color-role-admin)]" />
          <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
            Admin Dashboard
          </h1>
          <span className="text-2xl">🛡️</span>
        </div>
        <div className="flex items-center justify-between gap-4 mt-1 pl-4">
          <p className="text-[var(--color-text-secondary)] text-sm">
            System overview — Welcome,{" "}
            <span className="font-semibold text-[var(--color-text-primary)]">
              {user?.name}
            </span>
          </p>
          {!walkthroughActive && (
            <button
              type="button"
              onClick={() => startWalkthrough("admin")}
              data-ocid="admin.walkthrough.start_button"
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-role-admin)]/35 text-[var(--color-role-admin)] bg-[var(--color-role-admin)]/8 hover:bg-[var(--color-role-admin)]/15 hover:border-[var(--color-role-admin)]/55 transition-all duration-200"
              aria-label="Start platform tour"
            >
              <MapIcon size={12} />
              Platform Tour
            </button>
          )}
        </div>
      </motion.div>

      <div className="bg-[var(--color-bg-surface)] p-4 rounded-lg">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonStat key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total Users",
                value: Number(stats?.totalUsers ?? 0),
                icon: <Users size={20} />,
                color:
                  "bg-[var(--color-role-admin)]/15 text-[var(--color-role-admin)]",
              },
              {
                label: "Total Medicines",
                value: Number(stats?.totalMedicines ?? 0),
                icon: <Pill size={20} />,
                color:
                  "bg-[var(--color-role-admin-accent)]/20 text-[var(--color-role-admin-accent)]",
              },
              {
                label: "Total Orders",
                value: Number(stats?.totalOrders ?? 0),
                icon: <ShoppingCart size={20} />,
                color:
                  "bg-[var(--color-role-admin)]/15 text-[var(--color-role-admin)]",
              },
              {
                label: "Roles Active",
                value: (stats?.usersByRole ?? []).filter(
                  ([, n]) => Number(n) > 0,
                ).length,
                icon: <Activity size={20} />,
                color:
                  "bg-[var(--color-role-admin)]/10 text-[var(--color-role-admin)]",
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="panel-depth-2 border-l-[3px] border-l-[var(--color-role-admin)] shadow-[var(--shadow-md)] p-5 rounded-xl flex items-start gap-4 hover:border-l-[var(--color-role-admin-accent)] transition-colors duration-200">
                  <div
                    className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 shadow-[var(--shadow-sm)] ${stat.color}`}
                  >
                    {stat.icon}
                  </div>
                  <div>
                    <p
                      className="metric-value-primary tabular-nums text-[var(--color-role-admin)]"
                      data-metric
                    >
                      {stat.value}
                    </p>
                    <p className="metric-label uppercase tracking-wider">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="flex flex-wrap gap-3 p-4 panel-depth-1 rounded-xl"
      >
        <button
          type="button"
          onClick={() => setCacheModalOpen(true)}
          data-ocid="admin.quick_action.cache_reset_button"
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-role-admin)]/15 text-[var(--color-role-admin)] border border-[var(--color-role-admin)]/35 text-sm font-semibold hover:bg-[var(--color-role-admin)]/28 hover:border-[var(--color-role-admin)]/55 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
        >
          ⚡ Quick Action: Reset Cache
        </button>
      </motion.div>

      <AnimatedModal
        isOpen={cacheModalOpen}
        onClose={() => setCacheModalOpen(false)}
        title="Reset System Cache?"
        size="sm"
        className="!bg-card"
      >
        <div className="space-y-4" data-ocid="admin.cache_reset.dialog">
          <p className="text-sm text-muted-foreground">
            This will flush all cached data and force a fresh reload from the
            canister. Active sessions will not be affected.
          </p>
          {cacheResetDone ? (
            <div
              className="flex items-center gap-2 text-[var(--color-status-success)] text-sm font-semibold py-2"
              data-ocid="admin.cache_reset.success_state"
            >
              ✅ Cache reset successfully!
            </div>
          ) : (
            <div className="flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={() => setCacheModalOpen(false)}
                data-ocid="admin.cache_reset.cancel_button"
                className="px-4 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:bg-secondary/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCacheReset}
                data-ocid="admin.cache_reset.confirm_button"
                className="px-4 py-2 rounded-lg text-sm bg-[var(--color-role-admin)] hover:opacity-90 text-[var(--color-text-on-accent)] font-semibold transition-all"
              >
                Confirm Reset
              </button>
            </div>
          )}
        </div>
      </AnimatedModal>

      {/* Role breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="panel-depth-1 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-sm bg-[var(--color-role-admin)] opacity-80" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
              Role Distribution
            </h2>
          </div>
          {(stats?.usersByRole ?? []).length === 0 ? (
            <p className="text-[var(--color-text-secondary)] text-sm text-center py-4">
              No role data yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(stats?.usersByRole ?? []).map(([role, count]) => (
                <div
                  key={role}
                  className="panel-depth-2 p-4 rounded-lg text-center hover:bg-[var(--color-bg-active)] transition-colors duration-150"
                >
                  <p className="metric-value-primary tabular-nums" data-metric>
                    {count.toString()}
                  </p>
                  <RoleBadge role={role} size="sm" className="mt-1" />
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
      >
        <div className="panel-depth-3 rounded-xl p-5 border-l-[3px] border-l-[var(--color-role-admin)]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[var(--color-status-success)] animate-pulse shadow-[0_0_6px_var(--color-status-success)]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
              System Status
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Backend", status: "Online" },
              { label: "Storage", status: "Online" },
              { label: "Auth", status: "Online" },
            ].map((svc) => (
              <div
                key={svc.label}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-status-success)]/10 border border-[var(--color-status-success)]/25 panel-depth-2"
              >
                <Circle
                  size={8}
                  className="text-[var(--color-status-success)] fill-[var(--color-status-success)]"
                />
                <span className="text-xs font-semibold font-mono text-[var(--color-status-success)] tracking-wide">
                  {svc.label}: {svc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Recent users */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="panel-depth-2 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-sm bg-[var(--color-role-admin)] opacity-75" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                Recent Users
              </h2>
            </div>
            <Link
              to="/admin/users"
              className="text-xs text-[var(--color-role-admin)] hover:opacity-80 transition-colors"
            >
              View all →
            </Link>
          </div>
          {!allUsers?.length ? (
            <p className="text-[var(--color-text-secondary)] text-sm text-center py-4">
              No users yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <div className="space-y-2 min-w-[400px]">
                {allUsers.slice(0, 5).map((u, i) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-lg panel-depth-3 border-l-[2px] border-l-[var(--color-border-base)] hover:border-l-[var(--color-role-admin)]/60 hover:bg-[var(--color-bg-active)] transition-all duration-150"
                    data-ocid={`admin.user.item.${i + 1}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-role-admin)]/15 border border-[var(--color-role-admin)]/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-[var(--color-role-admin)] font-mono">
                          {u.name[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)] font-display">
                          {u.name}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] font-mono tracking-tight">
                          {u.email}
                        </p>
                      </div>
                    </div>
                    <RoleBadge role={u.role as string} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
      {/* Demo Environment */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="panel-depth-1 rounded-xl p-5 border border-[var(--color-status-warning)]/20">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 rounded-sm bg-[var(--color-status-warning)] opacity-80" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
              Demo Environment
            </h2>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mb-4 pl-3">
            Restore the platform to a clean showcase baseline. Clears
            walkthrough progress, resets presentation mode, flushes the offline
            queue, and removes any temporary notification state — then reloads
            so seed data re-initialises.
          </p>
          <button
            type="button"
            onClick={() => setDemoResetOpen(true)}
            data-ocid="admin.demo_reset.open_modal_button"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: "oklch(var(--color-status-warning) / 0.12)",
              borderColor: "oklch(var(--color-status-warning) / 0.35)",
              color: "oklch(var(--color-status-warning))",
            }}
          >
            <RefreshCw size={15} />
            Reset Demo Environment
          </button>
        </div>
      </motion.div>

      <AnimatedModal
        isOpen={demoResetOpen}
        onClose={() => setDemoResetOpen(false)}
        title="Reset Demo Environment?"
        size="sm"
        className="!bg-card"
      >
        <div className="space-y-4" data-ocid="admin.demo_reset.dialog">
          <div
            className="flex items-start gap-3 p-3 rounded-lg"
            style={{
              background: "oklch(var(--color-status-warning) / 0.08)",
              border: "1px solid oklch(var(--color-status-warning) / 0.25)",
            }}
          >
            <AlertTriangle
              size={16}
              className="flex-shrink-0 mt-0.5"
              style={{ color: "oklch(var(--color-status-warning))" }}
            />
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-0.5">
                This will clear all demo state
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Walkthrough progress, presentation mode, offline queue, and
                temporary notification state will be cleared for all roles. The
                page will reload and seed data will re-initialise.
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={() => setDemoResetOpen(false)}
              data-ocid="admin.demo_reset.cancel_button"
              className="px-4 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:bg-secondary/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={resetDemo}
              data-ocid="admin.demo_reset.confirm_button"
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
              style={{
                background: "oklch(var(--color-status-warning))",
                color: "oklch(var(--warning-foreground))",
              }}
            >
              Confirm Reset
            </button>
          </div>
        </div>
      </AnimatedModal>

      <WalkthroughOverlay
        steps={ADMIN_WALKTHROUGH_STEPS}
        currentStepIndex={activeStepIndex}
        isActive={walkthroughActive}
        onNext={nextStep}
        onPrev={prevStep}
        onDismiss={dismissWalkthrough}
      />
    </div>
  );
}
