"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { AnalyticsFiltersBar } from "@/features/analytics/components/AnalyticsFiltersBar";
import { AnalyticsOverviewPanel } from "@/features/analytics/components/AnalyticsOverviewPanel";
import { AnalyticsCoursesMediaPanel } from "@/features/analytics/components/AnalyticsCoursesMediaPanel";
import { AnalyticsLearnersEnrollmentsPanel } from "@/features/analytics/components/AnalyticsLearnersEnrollmentsPanel";
import { AnalyticsDevicesRequestsPanel } from "@/features/analytics/components/AnalyticsDevicesRequestsPanel";
import {
  useAnalyticsCoursesMedia,
  useAnalyticsDevicesRequests,
  useAnalyticsLearnersEnrollments,
  useAnalyticsOverview,
} from "@/features/analytics/hooks/use-analytics";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDefaultDateRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - 29);

  return {
    from: toDateInput(from),
    to: toDateInput(to),
  };
}

export default function CenterAnalyticsPage({ params }: PageProps) {
  const { centerId } = use(params);
  const [sessionDefaultRange] = useState(() => getDefaultDateRange());

  const [from, setFrom] = useState(sessionDefaultRange.from);
  const [to, setTo] = useState(sessionDefaultRange.to);

  const analyticsContext = useMemo(() => ({ centerId }), [centerId]);
  const filters = useMemo(
    () => ({
      from,
      to,
    }),
    [from, to],
  );

  const overviewQuery = useAnalyticsOverview(filters, analyticsContext);
  const coursesMediaQuery = useAnalyticsCoursesMedia(filters, analyticsContext);
  const learnersQuery = useAnalyticsLearnersEnrollments(
    filters,
    analyticsContext,
  );
  const devicesQuery = useAnalyticsDevicesRequests(filters, analyticsContext);

  const isLoadingAny =
    overviewQuery.isFetching ||
    coursesMediaQuery.isFetching ||
    learnersQuery.isFetching ||
    devicesQuery.isFetching;

  const resetFilters = () => {
    setFrom(sessionDefaultRange.from);
    setTo(sessionDefaultRange.to);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Track performance across courses, learners, devices, and media for this center."
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          { label: "Analytics" },
        ]}
        actions={
          <Link href={`/centers/${centerId}`}>
            <Button variant="outline">Back to Center</Button>
          </Link>
        }
      />

      <AnalyticsFiltersBar
        isPlatformAdmin={false}
        defaultFrom={sessionDefaultRange.from}
        defaultTo={sessionDefaultRange.to}
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        onReset={resetFilters}
        isLoading={isLoadingAny}
      />

      <AnalyticsOverviewPanel
        data={overviewQuery.data}
        isLoading={overviewQuery.isLoading}
        isError={overviewQuery.isError}
      />

      <AnalyticsCoursesMediaPanel
        data={coursesMediaQuery.data}
        isLoading={coursesMediaQuery.isLoading}
        isError={coursesMediaQuery.isError}
      />

      <AnalyticsLearnersEnrollmentsPanel
        data={learnersQuery.data}
        isLoading={learnersQuery.isLoading}
        isError={learnersQuery.isError}
      />

      <AnalyticsDevicesRequestsPanel
        data={devicesQuery.data}
        isLoading={devicesQuery.isLoading}
        isError={devicesQuery.isError}
      />
    </div>
  );
}
