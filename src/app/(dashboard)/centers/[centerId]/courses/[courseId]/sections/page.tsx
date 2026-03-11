"use client";

import { use } from "react";
import { SectionManager } from "@/features/sections/components/SectionManager";
import { useTranslation } from "@/features/localization";

type PageProps = {
  params: Promise<{ centerId: string; courseId: string }>;
};

export default function CenterCourseSectionsPage({ params }: PageProps) {
  const { t } = useTranslation();
  const { centerId, courseId } = use(params);

  return (
    <SectionManager
      centerId={centerId}
      courseId={courseId}
      backHref={`/centers/${centerId}/courses/${courseId}`}
      breadcrumbs={[
        { label: t("common.labels.centers"), href: "/centers" },
        {
          label: t("pages.sectionManager.breadcrumbs.centerById", {
            id: centerId,
          }),
          href: `/centers/${centerId}`,
        },
        {
          label: t("sidebar.items.courses"),
          href: `/centers/${centerId}/courses`,
        },
        {
          label: t("pages.sectionManager.breadcrumbs.courseById", {
            id: courseId,
          }),
          href: `/centers/${centerId}/courses/${courseId}`,
        },
        { label: t("pages.sectionManager.title") },
      ]}
    />
  );
}
