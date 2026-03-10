"use client";

import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useTenant } from "@/app/tenant-provider";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import { EducationPanel } from "@/features/education/components/EducationPanel";
import { useAdminMe } from "@/features/auth/hooks/use-admin-me";
import { useTranslation } from "@/features/localization";
import { getAdminScope } from "@/lib/user-scope";

export default function EducationPage() {
  const { t } = useTranslation();
  const tenant = useTenant();
  const { data: currentAdmin } = useAdminMe();
  const adminScope = getAdminScope(currentAdmin);

  const scopedCenterId = currentAdmin?.center_id ?? adminScope.centerId;
  const centerId = tenant.centerId ?? scopedCenterId ?? null;
  const isSystemAdmin = adminScope.isSystemAdmin;

  if (!centerId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t("pages.education.title")}
          description={t("pages.education.descriptionByCenter")}
          actions={
            isSystemAdmin ? <CenterPicker className="w-52" /> : undefined
          }
        />
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("pages.education.selectCenterPrompt")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.education.title")}
        description={t("pages.education.descriptionForProfiles")}
        actions={isSystemAdmin ? <CenterPicker className="w-52" /> : undefined}
      />

      <EducationPanel centerId={centerId} />
    </div>
  );
}
