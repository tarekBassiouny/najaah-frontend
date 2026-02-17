"use client";

import { useTenant } from "@/app/tenant-provider";
import { PageHeader } from "@/components/ui/page-header";
import { PermissionsTable } from "@/features/permissions/components/PermissionsTable";

export default function PermissionsPage() {
  const { centerSlug } = useTenant();
  const isSystemScope = !centerSlug;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions"
        description={
          isSystemScope
            ? "View the permission catalog used for role assignment."
            : "View the shared permission catalog. Role updates require system-scoped access."
        }
      />
      <PermissionsTable />
    </div>
  );
}
