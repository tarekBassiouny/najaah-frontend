"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/ui/stats-card";
import { AnalyticsBarChart } from "./charts/AnalyticsBarChart";
import { AnalyticsDonutChart } from "./charts/AnalyticsDonutChart";
import type { AnalyticsDevicesRequests } from "@/features/analytics/types/analytics";
import { useTranslation } from "@/features/localization";

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
  const { t } = useTranslation();

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>
          {t(
            "auto.features.analytics.components.analyticsdevicesrequestspanel.s1",
          )}
        </AlertTitle>
        <AlertDescription>
          {t(
            "auto.features.analytics.components.analyticsdevicesrequestspanel.s2",
          )}
        </AlertDescription>
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
        <StatsCard
          title={t(
            "auto.features.analytics.components.analyticsdevicesrequestspanel.s3",
          )}
          value={devices.total}
        />
        <StatsCard
          title={t(
            "auto.features.analytics.components.analyticsdevicesrequestspanel.s4",
          )}
          value={devices.active}
        />
        <StatsCard
          title={t(
            "auto.features.analytics.components.analyticsdevicesrequestspanel.s5",
          )}
          value={devices.revoked}
        />
        <StatsCard
          title={t(
            "auto.features.analytics.components.analyticsdevicesrequestspanel.s6",
          )}
          value={devices.pending}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {t(
                "auto.features.analytics.components.analyticsdevicesrequestspanel.s7",
              )}
            </CardTitle>
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
            <CardTitle>
              {t(
                "auto.features.analytics.components.analyticsdevicesrequestspanel.s8",
              )}
            </CardTitle>
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
            <CardTitle>
              {t(
                "auto.features.analytics.components.analyticsdevicesrequestspanel.s9",
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <StatsCard
                title={t(
                  "auto.features.analytics.components.analyticsdevicesrequestspanel.s10",
                )}
                value={`${Math.round(requests.extra_views.approval_rate * 100)}%`}
              />
              <StatsCard
                title={t(
                  "auto.features.analytics.components.analyticsdevicesrequestspanel.s11",
                )}
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
            <CardTitle>
              {t(
                "auto.features.analytics.components.analyticsdevicesrequestspanel.s12",
              )}
            </CardTitle>
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
