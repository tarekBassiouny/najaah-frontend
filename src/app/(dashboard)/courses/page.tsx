"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import { CoursesTable } from "@/features/courses/components/CoursesTable";

export default function CoursesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="Manage your learning center's course catalog"
        actions={
          <>
            <CenterPicker className="hidden md:block" />
            <Link href="/courses/create">
              <Button>
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Course
              </Button>
            </Link>
          </>
        }
      />

      <CoursesTable />
    </div>
  );
}
