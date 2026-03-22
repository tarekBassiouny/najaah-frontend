"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/page-loading";
import { useTenant } from "@/app/tenant-provider";
import { useAdminMe } from "@/features/auth/hooks/use-admin-me";
import { useTranslation } from "@/features/localization";
import { getAdminScope } from "@/lib/user-scope";
import { useRouter } from "next/navigation";

export default function CentersSettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const tenant = useTenant();
  const centerId = tenant.centerId;
  const {
    data: user,
    isLoading: isUserLoading,
    isFetching: isUserFetching,
  } = useAdminMe();
  const userScope = getAdminScope(user);
  const isUserScopeReady = !isUserLoading && !isUserFetching;

  useEffect(() => {
    if (!isUserScopeReady) {
      return;
    }

    if (userScope.isSystemAdmin) {
      router.replace("/settings");
      return;
    }

    if (centerId) {
      router.replace(`/centers/${centerId}/settings`);
    }
  }, [centerId, isUserScopeReady, router, userScope.isSystemAdmin]);

  if (!centerId) {
    if (!isUserScopeReady || userScope.isSystemAdmin) {
      return <PageLoading />;
    }

    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("pages.centerSettings.centerContextRequired")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return <PageLoading />;
}
