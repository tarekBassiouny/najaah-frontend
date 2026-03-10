"use client";

import { use } from "react";
import { CoursesTable } from "@/features/courses/components/CoursesTable";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslation } from "@/features/localization";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function CenterCoursesPage({ params }: PageProps) {
  const { t } = useTranslation();
  const { centerId } = use(params);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.centerCourses.title")}
        description={t("pages.centerCourses.description")}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/centers/${centerId}`}>
              <Button variant="outline">
                {t("pages.centerCourses.backToCenter")}
              </Button>
            </Link>
            <Link href={`/centers/${centerId}/courses/create`}>
              <Button>{t("pages.centerCourses.createCourse")}</Button>
            </Link>
          </div>
        }
      />
      <CoursesTable centerId={centerId} />
    </div>
  );
}
