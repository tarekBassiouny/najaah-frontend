"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import { Card, CardContent } from "@/components/ui/card";
import { useTenant } from "@/app/tenant-provider";
import { useTranslation } from "@/features/localization";

export default function CoursesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const tenant = useTenant();
  const centerId = tenant.centerId;

  useEffect(() => {
    if (!centerId) return;
    router.replace(`/centers/${centerId}/courses`);
  }, [centerId, router]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.coursesPage.title")}
        description={t("pages.coursesPage.description")}
        actions={
          <>
            <CenterPicker className="hidden md:block" />
            {centerId ? (
              <Link href={`/centers/${centerId}/courses/create`}>
                <Button>{t("pages.coursesPage.createCourse")}</Button>
              </Link>
            ) : null}
          </>
        }
      />

      {!centerId ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            {t("pages.coursesPage.centerContextRequired")}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
