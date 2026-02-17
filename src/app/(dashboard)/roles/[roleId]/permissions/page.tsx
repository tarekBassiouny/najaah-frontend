"use client";

import { useParams } from "next/navigation";
import { useTenant } from "@/app/tenant-provider";
import { PageHeader } from "@/components/ui/page-header";
import { useAdminMe } from "@/features/auth/hooks/use-admin-me";
import { RolePermissionsForm } from "@/features/role-permissions/components/RolePermissionsForm";
import { isSystemScopeUser } from "@/lib/admin-scope";

export default function RolePermissionsPage() {
  const params = useParams<{ roleId: string | string[] }>();
  const roleIdParam = params?.roleId;
  const roleId = Array.isArray(roleIdParam) ? roleIdParam[0] : roleIdParam;

  const { centerSlug } = useTenant();
  const { data: user } = useAdminMe();
  const canManageWrite = isSystemScopeUser(user, !centerSlug);

  if (!roleId) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role Permissions"
        description={
          canManageWrite
            ? "Manage permissions assigned to this role."
            : "View role permissions. Updates require system-scoped access."
        }
      />
      <RolePermissionsForm roleId={roleId} readOnly={!canManageWrite} />
    </div>
  );
}
