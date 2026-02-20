"use client";

import { use } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { RolePermissionsForm } from "@/features/role-permissions/components/RolePermissionsForm";
import { can } from "@/lib/capabilities";

type PageProps = {
  params: Promise<{ centerId: string; roleId: string }>;
};

export default function CenterRolePermissionsPage({ params }: PageProps) {
  const { centerId, roleId } = use(params);
  const canManageWrite = can("manage_roles");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role Permissions"
        description={
          canManageWrite
            ? "Manage permissions assigned to this role."
            : "View role permissions. Updates require role.manage permission."
        }
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          { label: "Roles", href: `/centers/${centerId}/roles` },
          { label: "Permissions" },
        ]}
      />

      <RolePermissionsForm
        roleId={roleId}
        scopeCenterId={centerId}
        readOnly={!canManageWrite}
      />
    </div>
  );
}
