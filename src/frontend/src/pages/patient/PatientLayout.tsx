import { Layout } from "@/components/layout/Layout";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { Outlet } from "@tanstack/react-router";
import { memo } from "react";

function PatientLayout() {
  return (
    <RoleGuard allowedRoles={["Patient" as import("@/types").UserRole]}>
      <Layout>
        <Outlet />
      </Layout>
    </RoleGuard>
  );
}

export default memo(PatientLayout);
