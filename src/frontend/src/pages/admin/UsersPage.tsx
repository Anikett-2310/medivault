import { createActor } from "@/backend";
import { EmptyState } from "@/components/common/EmptyState";
import { ROLE_CONFIG, RoleBadge } from "@/components/common/RoleBadge";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { useAllUsers } from "@/hooks/useBackend";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Shield, UserCheck, UserX, Users } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const GLASS = "bg-muted backdrop-blur-md border border-border rounded-xl";

function useUserStatusMutation() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { userId: string; isActive: boolean }) =>
      actor!.updateUserStatus(vars.userId, vars.isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allUsers"] }),
  });
}

const ALL_ROLES = Object.keys(ROLE_CONFIG);

export default function UsersPage() {
  const { data: users, isLoading } = useAllUsers();
  const statusMutation = useUserStatusMutation();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [toggling, setToggling] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = users ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u: UserProfile) =>
          u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      );
    }
    if (roleFilter !== "All") {
      list = list.filter((u: UserProfile) => (u.role as string) === roleFilter);
    }
    return list;
  }, [users, search, roleFilter]);

  const stats = useMemo(() => {
    const all = users ?? [];
    return {
      total: all.length,
      active: all.filter((u) => u.isActive).length,
      byRole: (() => {
        const result: Record<string, number> = {};
        for (const role of ALL_ROLES) {
          result[role] = all.filter((u) => (u.role as string) === role).length;
        }
        return result;
      })(),
    };
  }, [users]);

  async function toggleStatus(user: UserProfile) {
    setToggling(user.id);
    try {
      const res = await statusMutation.mutateAsync({
        userId: user.id,
        isActive: !user.isActive,
      });
      if (res.__kind__ === "ok") {
        toast.success(
          `${user.name} ${!user.isActive ? "activated" : "deactivated"}`,
        );
      } else {
        toast.error(res.err);
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-bold">
          User Management <span className="gradient-text">🛡️</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          View and manage all registered users
        </p>
      </motion.div>

      {/* Stats row + role pills */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className={cn(GLASS, "p-4 flex items-center gap-3")}>
            <div className="w-9 h-9 rounded-lg bg-orange-500/20 text-[var(--color-status-warning)] flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
            <div>
              <p className="text-xl font-display font-bold text-foreground">
                {stats.total}
              </p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </div>
          <div className={cn(GLASS, "p-4 flex items-center gap-3")}>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-[var(--color-status-success)] flex items-center justify-center shrink-0">
              <UserCheck size={18} />
            </div>
            <div>
              <p className="text-xl font-display font-bold text-foreground">
                {stats.active}
              </p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
          {ALL_ROLES.slice(0, 2).map((role) => (
            <div
              key={role}
              className={cn(GLASS, "p-4 flex items-center gap-3")}
            >
              <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-primary flex items-center justify-center shrink-0">
                <Shield size={18} />
              </div>
              <div>
                <p className="text-xl font-display font-bold text-foreground">
                  {stats.byRole[role] ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">{role}s</p>
              </div>
            </div>
          ))}
        </div>
        {/* Role count pills */}
        <div className="flex flex-wrap gap-2">
          {ALL_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              data-ocid={`admin.users.role_pill.${role.toLowerCase()}`}
              onClick={() => setRoleFilter(roleFilter === role ? "All" : role)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
                roleFilter === role
                  ? "bg-primary/30 text-primary border-primary/50"
                  : "glass-card hover:border-primary/40 text-muted-foreground",
              )}
            >
              {role} · {stats.byRole[role] ?? 0}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className={cn(GLASS, "p-3 flex items-center gap-3 flex-1")}>
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            data-ocid="admin.users.search_input"
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
        <select
          data-ocid="admin.users.role_filter"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className={cn(
            GLASS,
            "px-3 py-2 text-sm text-foreground outline-none bg-[var(--color-bg-surface)]",
          )}
        >
          <option value="All">All Roles</option>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(GLASS, "overflow-hidden")}
      >
        <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-[var(--color-border-base)] text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span>User</span>
          <span>Email</span>
          <span>Role</span>
          <span>Registered</span>
          <span>Status</span>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <SkeletonCard key={i} lines={1} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={28} />}
            title="No users found"
            description="No users match your search criteria."
            className="border-0 rounded-none"
          />
        ) : (
          <div>
            {filtered.map((u, idx) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                data-ocid={`admin.users.item.${idx + 1}`}
                className="flex sm:grid sm:grid-cols-[1fr_1fr_auto_auto_auto] gap-4 flex-col sm:flex-row px-5 py-4 hover:bg-muted/30 transition-colors border-b border-border/40 last:border-0 items-start sm:items-center"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border border-border flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-foreground">
                      {u.name[0]?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">
                    {u.name}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground truncate min-w-0">
                  {u.email}
                </p>
                <RoleBadge role={u.role as string} />
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(Number(u.registrationDate)).toLocaleDateString()}
                </p>
                <button
                  type="button"
                  data-ocid={`admin.users.toggle_status.${idx + 1}`}
                  disabled={toggling === u.id}
                  onClick={() => toggleStatus(u)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors disabled:opacity-50",
                    u.isActive
                      ? "bg-[var(--color-status-success)]/20 text-[var(--color-status-success)] border-[var(--color-status-success)]/30 hover:bg-[var(--color-status-danger)]/20 hover:text-[var(--color-status-danger)] hover:border-[var(--color-status-danger)]/30"
                      : "bg-[var(--color-status-danger)]/20 text-[var(--color-status-danger)] border-[var(--color-status-danger)]/30 hover:bg-[var(--color-status-success)]/20 hover:text-[var(--color-status-success)] hover:border-[var(--color-status-success)]/30",
                  )}
                >
                  {toggling === u.id ? (
                    <span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                  ) : u.isActive ? (
                    <UserCheck size={12} />
                  ) : (
                    <UserX size={12} />
                  )}
                  {u.isActive ? "Active" : "Inactive"}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
