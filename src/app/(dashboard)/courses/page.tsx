"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import { Card, CardContent } from "@/components/ui/card";
import { useTenant } from "@/app/tenant-provider";

export default function CoursesPage() {
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
        title="Courses"
        description="Select a center to manage center-scoped courses."
        actions={
          <>
            <CenterPicker className="hidden md:block" />
            {centerId ? (
              <Link href={`/centers/${centerId}/courses/create`}>
                <Button>Create Course</Button>
              </Link>
            ) : null}
          </>
        }
      />

      {!centerId ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            Center context is required to manage courses.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
