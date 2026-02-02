"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/ui/stats-card";
import { AnalyticsBarChart } from "./charts/AnalyticsBarChart";
import { AnalyticsDonutChart } from "./charts/AnalyticsDonutChart";
import type { AnalyticsDevicesRequests } from "@/features/analytics/types/analytics";

type AnalyticsDevicesRequestsPanelProps = {
  data?: AnalyticsDevicesRequests;
  isLoading?: boolean;
  isError?: boolean;
};

export function AnalyticsDevicesRequestsPanel({
  data,
  isLoading,
  isError,
}: AnalyticsDevicesRequestsPanelProps) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Devices & requests analytics unavailable</AlertTitle>
        <AlertDescription>Failed to load device/request metrics.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading || !data) {
    return <Skeleton className="h-80 w-full" />;
  }

  const { devices, requests } = data;

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total Devices" value={devices.total} />
        <StatsCard title="Active Devices" value={devices.active} />
        <StatsCard title="Revoked Devices" value={devices.revoked} />
        <StatsCard title="Pending Devices" value={devices.pending} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Device Change Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsBarChart
              categories={["Pending", "Approved", "Rejected", "Pre-approved"]}
              values={[
                devices.changes.pending,
                devices.changes.approved,
                devices.changes.rejected,
                devices.changes.pre_approved,
              ]}
              color="#6366f1"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Source Mix</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsDonutChart
              labels={["Mobile", "OTP", "Admin"]}
              values={[
                devices.changes.by_source.mobile,
                devices.changes.by_source.otp,
                devices.changes.by_source.admin,
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Extra View Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <StatsCard
                title="Approval Rate"
                value={`${Math.round(requests.extra_views.approval_rate * 100)}%`}
              />
              <StatsCard
                title="Avg Decision Hours"
                value={requests.extra_views.avg_decision_hours.toFixed(2)}
              />
            </div>
            <AnalyticsBarChart
              categories={["Pending", "Approved", "Rejected"]}
              values={[
                requests.extra_views.pending,
                requests.extra_views.approved,
                requests.extra_views.rejected,
              ]}
              color="#10b981"
              height={220}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enrollment Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsBarChart
              categories={["Pending", "Approved", "Rejected"]}
              values={[
                requests.enrollment.pending,
                requests.enrollment.approved,
                requests.enrollment.rejected,
              ]}
              color="#0ea5e9"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
