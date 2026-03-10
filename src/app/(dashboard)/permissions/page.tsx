"use client";

import { useTenant } from "@/app/tenant-provider";
import { PageHeader } from "@/components/ui/page-header";
import { useTranslation } from "@/features/localization";
import { PermissionsTable } from "@/features/permissions/components/PermissionsTable";

export default function PermissionsPage() {
  const { t } = useTranslation();
  const { centerSlug } = useTenant();
  const isSystemScope = !centerSlug;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.permissions.title")}
        description={
          isSystemScope
            ? t("pages.permissions.descriptionWrite")
            : t("pages.permissions.descriptionReadOnly")
        }
      />
      <PermissionsTable />
    </div>
  );
}
