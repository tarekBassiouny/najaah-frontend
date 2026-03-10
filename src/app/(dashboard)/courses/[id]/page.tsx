"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import { useTranslation } from "@/features/localization";
import { useTenant } from "@/app/tenant-provider";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function CourseDetailPage({ params }: PageProps) {
  const { t } = useTranslation();
  const { id } = use(params);
  const router = useRouter();
  const tenant = useTenant();
  const centerId = tenant.centerId;

  useEffect(() => {
    if (!centerId) return;
    router.replace(`/centers/${centerId}/courses/${id}`);
  }, [centerId, id, router]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.courseDetails.title")}
        description={t("pages.courseDetails.description")}
        actions={<CenterPicker className="hidden md:block" />}
      />

      <Card>
        <CardContent className="space-y-4 py-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("pages.courseDetails.selectCenterPrompt")}
          </p>
          <Link href="/centers">
            <Button variant="outline">
              {t("pages.centerSettings.goToCenters")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
