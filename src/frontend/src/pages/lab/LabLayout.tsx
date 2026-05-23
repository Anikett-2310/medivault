import { Layout } from "@/components/layout/Layout";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { Outlet } from "@tanstack/react-router";
import { memo } from "react";

function LabLayout() {
  return (
    <RoleGuard allowedRoles={["Lab" as import("@/types").UserRole]}>
      <Layout>
        <Outlet />
      </Layout>
    </RoleGuard>
  );
}

export default memo(LabLayout);
