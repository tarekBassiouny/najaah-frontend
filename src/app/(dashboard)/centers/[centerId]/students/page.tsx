"use client";

import { use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StudentsTable } from "@/features/students/components/StudentsTable";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function CenterStudentsPage({ params }: PageProps) {
  const { centerId } = use(params);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Center Students"
        description="Manage students for this center"
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          { label: "Students" },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href={`/centers/${centerId}`}>Back to Center</Link>
          </Button>
        }
      />
      <StudentsTable centerId={centerId} />
    </div>
  );
}
