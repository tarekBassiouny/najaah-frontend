"use client";

import { PageHeader } from "@/components/ui/page-header";
import { DashboardStats } from "@/features/dashboard/components/DashboardStats";
import { QuickActions } from "@/features/dashboard/components/QuickActions";
import { RecentActivity } from "@/features/dashboard/components/RecentActivity";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import { AgentExecutionHistory } from "@/features/agents/components/AgentExecutionHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/app/tenant-provider";

export default function DashboardPage() {
  const { centerSlug, centerId } = useTenant();
  const isPlatformAdmin = !centerSlug;
  const hasCenterScope = centerId != null && String(centerId).trim().length > 0;

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useDashboard({
    is_platform_admin: isPlatformAdmin,
    center_id: hasCenterScope ? centerId : undefined,
  });

  const stats = data?.stats;
  const mappedStats = {
    totalCourses: stats?.total_courses ?? 0,
    totalStudents: stats?.total_students ?? 0,
    activeEnrollments: stats?.active_enrollments.count ?? 0,
    activeEnrollmentsChangePercent:
      stats?.active_enrollments.change_percent ?? 0,
    activeEnrollmentsTrend: stats?.active_enrollments.trend ?? null,
    pendingApprovals: stats?.pending_approvals.total ?? 0,
    pendingEnrollmentRequests:
      stats?.pending_approvals.enrollment_requests ?? 0,
    pendingDeviceChangeRequests:
      stats?.pending_approvals.device_change_requests ?? 0,
    pendingExtraViewRequests:
      stats?.pending_approvals.extra_view_requests ?? 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={
          isPlatformAdmin
            ? "Overview across all centers. Select a center to scope the data."
            : "Overview of your center dashboard metrics and recent activity."
        }
        actions={
          isPlatformAdmin ? (
            <CenterPicker
              hideWhenCenterScoped={false}
              className="w-full min-w-[14rem] sm:w-[18rem]"
              selectClassName="bg-none bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
            />
          ) : undefined
        }
      />

      {!isPlatformAdmin && !hasCenterScope ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          Missing center context. Refresh the page to reload center scope.
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          <div className="flex items-center justify-between gap-3">
            <span>Failed to load dashboard data.</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                void refetch();
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      <DashboardStats stats={mappedStats} isLoading={isLoading} />

      <div className="grid gap-6 lg:grid-cols-2">
        <QuickActions />
        <RecentActivity activities={data?.recent_activity ?? []} isLoading={isLoading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Agent Executions</CardTitle>
        </CardHeader>
        <CardContent>
          <AgentExecutionHistory />
          {isFetching ? (
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Refreshing dashboard data...
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
