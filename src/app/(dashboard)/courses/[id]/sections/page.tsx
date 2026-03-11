"use client";

import { use } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useTenant } from "@/app/tenant-provider";
import { SectionManager } from "@/features/sections/components/SectionManager";
import { useTranslation } from "@/features/localization";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function CourseSectionsPage({ params }: PageProps) {
  const { t } = useTranslation();
  const { id } = use(params);
  const tenant = useTenant();
  const centerId = tenant.centerId;

  if (!centerId) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("pages.sectionManager.centerContextRequired")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <SectionManager
      centerId={centerId}
      courseId={id}
      backHref={`/courses/${id}`}
    />
  );
}
