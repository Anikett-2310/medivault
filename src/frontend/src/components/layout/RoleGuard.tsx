import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuthStore } from "@/store/auth";
import type { UserRole } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { isAuthenticated, isInitializing } = useInternetIdentity();
  const { user, isLoading } = useAuthStore();

  if (isInitializing || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!user) {
    return <Navigate to="/role-select" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass-card max-w-md w-full mx-4 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚫</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Access Denied
          </h2>
          <p className="text-muted-foreground">
            You don&apos;t have permission to view this page. Your role is{" "}
            <span className="text-primary font-semibold">
              {user.role as string}
            </span>
            .
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
