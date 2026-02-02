"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { useTenant } from "@/app/tenant-provider";
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

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDefaultDateRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - 30);

  return {
    from: toDateInput(from),
    to: toDateInput(to),
  };
}

export default function AnalyticsPage() {
  const tenant = useTenant();
  const isPlatformAdmin = !tenant.centerSlug;
  const defaultRange = getDefaultDateRange();

  const [draftFrom, setDraftFrom] = useState(defaultRange.from);
  const [draftTo, setDraftTo] = useState(defaultRange.to);
  const [draftTimezone, setDraftTimezone] = useState("UTC");

  const [appliedFrom, setAppliedFrom] = useState(defaultRange.from);
  const [appliedTo, setAppliedTo] = useState(defaultRange.to);
  const [appliedTimezone, setAppliedTimezone] = useState("UTC");

  const filters = useMemo(
    () => ({
      center_id: tenant.centerId ?? undefined,
      from: appliedFrom,
      to: appliedTo,
      timezone: appliedTimezone,
    }),
    [tenant.centerId, appliedFrom, appliedTo, appliedTimezone],
  );

  const overviewQuery = useAnalyticsOverview(filters);
  const coursesMediaQuery = useAnalyticsCoursesMedia(filters);
  const learnersQuery = useAnalyticsLearnersEnrollments(filters);
  const devicesQuery = useAnalyticsDevicesRequests(filters);

  const isLoadingAny =
    overviewQuery.isFetching ||
    coursesMediaQuery.isFetching ||
    learnersQuery.isFetching ||
    devicesQuery.isFetching;

  const applyFilters = () => {
    setAppliedFrom(draftFrom);
    setAppliedTo(draftTo);
    setAppliedTimezone(draftTimezone);
  };

  const resetFilters = () => {
    const nextRange = getDefaultDateRange();
    setDraftFrom(nextRange.from);
    setDraftTo(nextRange.to);
    setDraftTimezone("UTC");
    setAppliedFrom(nextRange.from);
    setAppliedTo(nextRange.to);
    setAppliedTimezone("UTC");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Track performance across courses, learners, devices, and media."
      />

      <AnalyticsFiltersBar
        isPlatformAdmin={isPlatformAdmin}
        from={draftFrom}
        to={draftTo}
        timezone={draftTimezone}
        onFromChange={setDraftFrom}
        onToChange={setDraftTo}
        onTimezoneChange={setDraftTimezone}
        onApply={applyFilters}
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
