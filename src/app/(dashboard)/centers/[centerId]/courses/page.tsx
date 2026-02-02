"use client";

import { use } from "react";
import { CoursesTable } from "@/features/courses/components/CoursesTable";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function CenterCoursesPage({ params }: PageProps) {
  const { centerId } = use(params);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Center Courses"
        description="Manage courses for this center"
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          { label: "Courses" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/centers/${centerId}`}>
              <Button variant="outline">Back to Center</Button>
            </Link>
            <Link href={`/centers/${centerId}/courses/create`}>
              <Button>Create Course</Button>
            </Link>
          </div>
        }
      />
      <CoursesTable centerId={centerId} />
    </div>
  );
}
