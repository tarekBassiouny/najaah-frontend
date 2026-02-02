"use client";

import { use } from "react";
import { SectionManager } from "@/features/sections/components/SectionManager";

type PageProps = {
  params: Promise<{ centerId: string; courseId: string }>;
};

export default function CenterCourseSectionsPage({ params }: PageProps) {
  const { centerId, courseId } = use(params);

  return (
    <SectionManager
      centerId={centerId}
      courseId={courseId}
      backHref={`/centers/${centerId}/courses/${courseId}`}
      breadcrumbs={[
        { label: "Centers", href: "/centers" },
        { label: `Center ${centerId}`, href: `/centers/${centerId}` },
        { label: "Courses", href: `/centers/${centerId}/courses` },
        { label: `Course ${courseId}`, href: `/centers/${centerId}/courses/${courseId}` },
        { label: "Sections" },
      ]}
    />
  );
}
