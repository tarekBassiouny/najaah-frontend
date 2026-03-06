"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTenant } from "@/app/tenant-provider";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { DeviceChangeRequestsTable } from "@/features/device-change-requests/components/DeviceChangeRequestsTable";
import { useDeviceChangeRequests } from "@/features/device-change-requests/hooks/use-device-change-requests";
import { EnrollmentsTable } from "@/features/enrollments/components/EnrollmentsTable";
import { useEnrollments } from "@/features/enrollments/hooks/use-enrollments";
import { ExtraViewRequestsTable } from "@/features/extra-view-requests/components/ExtraViewRequestsTable";
import { useExtraViewRequests } from "@/features/extra-view-requests/hooks/use-extra-view-requests";
import { VideoAccessPanel } from "@/features/video-access/components/VideoAccessPanel";
import { useVideoAccessRequests } from "@/features/video-access/hooks/use-video-access";
import { can } from "@/lib/capabilities";
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
  const tenant = useTenant();
  const router = useRouter();
  const searchParams = useSearchParams();
  const basePath = centerId
    ? `/centers/${centerId}/student-requests`
    : "/student-requests";
  const initialCourseId = searchParams.get("course_id");
  const initialUserId = searchParams.get("user_id");
  const searchParamsString = searchParams.toString();
  const videoAccessCenterId = centerId ?? tenant.centerId ?? null;
  const hasVideoAccessCenterContext =
    videoAccessCenterId != null &&
    String(videoAccessCenterId).trim().length > 0;
  const canManageEnrollments = can("manage_enrollments");
  const canManageExtraView = can("manage_extra_view_requests");
  const canManageDeviceChange = can("manage_device_change_requests");
  const canManageVideoAccess = can("manage_video_access");
  const availableTabs = STUDENT_REQUEST_DEFINITIONS.filter((item) =>
    can(item.capability),
  );
  const hasAccessToCurrentType = availableTabs.some(
    (item) => item.type === type,
  );

  const enrollmentsCountQuery = useEnrollments(
    {
      page: 1,
      per_page: 1,
      centerScopeId: centerId ?? null,
      status: "PENDING",
    },
    { staleTime: 60_000, enabled: canManageEnrollments },
  );

  const extraViewsCountQuery = useExtraViewRequests(
    {
      page: 1,
      per_page: 1,
      centerScopeId: centerId ?? null,
      status: "PENDING",
    },
    { staleTime: 60_000, enabled: canManageExtraView },
  );

  const deviceChangesCountQuery = useDeviceChangeRequests(
    {
      page: 1,
      per_page: 1,
      centerScopeId: centerId ?? null,
      status: "PENDING",
    },
    { staleTime: 60_000, enabled: canManageDeviceChange },
  );

  const videoAccessCountQuery = useVideoAccessRequests(
    {
      page: 1,
      per_page: 1,
      centerScopeId: videoAccessCenterId,
      status: "pending",
    },
    {
      staleTime: 60_000,
      enabled: hasVideoAccessCenterContext && canManageVideoAccess,
    },
  );

  const tabCounts: Record<StudentRequestType, number> = {
    enrollments: enrollmentsCountQuery.data?.meta?.total ?? 0,
    "extra-view": extraViewsCountQuery.data?.meta?.total ?? 0,
    "device-change": deviceChangesCountQuery.data?.meta?.total ?? 0,
    "video-access": videoAccessCountQuery.data?.meta?.total ?? 0,
  };

  useEffect(() => {
    if (hasAccessToCurrentType) return;
    if (availableTabs.length === 0) return;
    const fallbackType = availableTabs[0].type;
    router.replace(
      `${basePath}/${fallbackType}${searchParamsString ? `?${searchParamsString}` : ""}`,
    );
  }, [
    availableTabs,
    basePath,
    hasAccessToCurrentType,
    router,
    searchParamsString,
  ]);

  if (!hasAccessToCurrentType) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={centerId ? "Center Student Requests" : "Student Requests"}
        description={
          centerId
            ? "Manage enrollment, extra-view, device-change, and video-access requests for this center."
            : "Manage enrollment, extra-view, device-change, and video-access requests across the system."
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
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4">
          {availableTabs.map((item) => (
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

      {type === "video-access" ? (
        <VideoAccessPanel centerId={centerId} showCenterFilter={!centerId} />
      ) : null}
    </div>
  );
}
