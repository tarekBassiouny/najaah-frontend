"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { DeviceChangeRequestsTable } from "@/features/device-change-requests/components/DeviceChangeRequestsTable";
import { useDeviceChangeRequests } from "@/features/device-change-requests/hooks/use-device-change-requests";
import { EnrollmentsTable } from "@/features/enrollments/components/EnrollmentsTable";
import { useEnrollments } from "@/features/enrollments/hooks/use-enrollments";
import { ExtraViewRequestsTable } from "@/features/extra-view-requests/components/ExtraViewRequestsTable";
import { useExtraViewRequests } from "@/features/extra-view-requests/hooks/use-extra-view-requests";
import {
  STUDENT_REQUEST_DEFINITIONS,
  type StudentRequestType,
} from "@/lib/student-requests";
import { cn } from "@/lib/utils";

type StudentRequestsPageProps = {
  type: StudentRequestType;
  centerId?: string;
};

export function StudentRequestsPage({
  type,
  centerId,
}: StudentRequestsPageProps) {
  const searchParams = useSearchParams();
  const basePath = centerId
    ? `/centers/${centerId}/student-requests`
    : "/student-requests";
  const initialCourseId = searchParams.get("course_id");
  const initialUserId = searchParams.get("user_id");
  const searchParamsString = searchParams.toString();

  const enrollmentsCountQuery = useEnrollments(
    {
      page: 1,
      per_page: 1,
      centerScopeId: centerId ?? null,
      status: "PENDING",
    },
    { staleTime: 60_000 },
  );

  const extraViewsCountQuery = useExtraViewRequests(
    {
      page: 1,
      per_page: 1,
      centerScopeId: centerId ?? null,
      status: "PENDING",
    },
    { staleTime: 60_000 },
  );

  const deviceChangesCountQuery = useDeviceChangeRequests(
    {
      page: 1,
      per_page: 1,
      centerScopeId: centerId ?? null,
      status: "PENDING",
    },
    { staleTime: 60_000 },
  );

  const tabCounts: Record<StudentRequestType, number> = {
    enrollments: enrollmentsCountQuery.data?.meta?.total ?? 0,
    "extra-view": extraViewsCountQuery.data?.meta?.total ?? 0,
    "device-change": deviceChangesCountQuery.data?.meta?.total ?? 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={centerId ? "Center Student Requests" : "Student Requests"}
        description={
          centerId
            ? "Manage enrollment, extra-view, and device-change requests for this center."
            : "Manage enrollment, extra-view, and device-change requests across the system."
        }
        breadcrumbs={
          centerId
            ? [
                { label: "Centers", href: "/centers" },
                { label: `Center ${centerId}`, href: `/centers/${centerId}` },
                { label: "Student Requests" },
              ]
            : undefined
        }
        actions={
          centerId ? (
            <Link href={`/centers/${centerId}`}>
              <Button variant="outline">Back to Center</Button>
            </Link>
          ) : undefined
        }
      />

      <div className="rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
          {STUDENT_REQUEST_DEFINITIONS.map((item) => (
            <Link
              key={item.type}
              href={`${basePath}/${item.type}${searchParamsString ? `?${searchParamsString}` : ""}`}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                item.type === type
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white",
              )}
            >
              <span>{item.label}</span>
              <span
                className={cn(
                  "inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold",
                  item.type === type
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
                )}
              >
                {tabCounts[item.type]}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {type === "enrollments" ? (
        <EnrollmentsTable
          centerId={centerId}
          showCenterFilter={!centerId}
          initialCourseId={initialCourseId}
          initialUserId={initialUserId}
        />
      ) : null}

      {type === "extra-view" ? (
        <ExtraViewRequestsTable hideHeader centerId={centerId} />
      ) : null}

      {type === "device-change" ? (
        <DeviceChangeRequestsTable hideHeader centerId={centerId} />
      ) : null}
    </div>
  );
}
