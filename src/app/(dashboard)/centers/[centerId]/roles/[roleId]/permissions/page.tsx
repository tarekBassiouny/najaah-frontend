"use client";

import { use } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { useTranslation } from "@/features/localization";
import { RolePermissionsForm } from "@/features/role-permissions/components/RolePermissionsForm";
import { can } from "@/lib/capabilities";

type PageProps = {
  params: Promise<{ centerId: string; roleId: string }>;
};

export default function CenterRolePermissionsPage({ params }: PageProps) {
  const { t } = useTranslation();
  const { centerId, roleId } = use(params);
  const canManageWrite = can("manage_roles");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.rolePermissions.title")}
        description={
          canManageWrite
            ? t("pages.rolePermissions.descriptionWrite")
            : t("pages.centerRolePermissions.descriptionReadOnly")
        }
        breadcrumbs={[
          { label: t("common.labels.centers"), href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          {
            label: t("pages.rolesPage.title"),
            href: `/centers/${centerId}/roles`,
          },
          { label: t("pages.permissions.title") },
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
