"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsBarChart } from "./charts/AnalyticsBarChart";
import type { AnalyticsCoursesMedia } from "@/features/analytics/types/analytics";

type AnalyticsCoursesMediaPanelProps = {
  data?: AnalyticsCoursesMedia;
  isLoading?: boolean;
  isError?: boolean;
};

export function AnalyticsCoursesMediaPanel({
  data,
  isLoading,
  isError,
}: AnalyticsCoursesMediaPanelProps) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Courses & media analytics unavailable</AlertTitle>
        <AlertDescription>
          Failed to load courses/media metrics.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading || !data) {
    return <Skeleton className="h-80 w-full" />;
  }

  const courseStatus = data.courses.by_status;
  const videoStatus = data.media.videos.by_upload_status;
  const pdfStatus = data.media.pdfs.by_upload_status;

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Courses by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsBarChart
              categories={[
                "Draft",
                "Uploading",
                "Ready",
                "Published",
                "Archived",
              ]}
              values={[
                courseStatus.draft,
                courseStatus.uploading,
                courseStatus.ready,
                courseStatus.published,
                courseStatus.archived,
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Media Upload Status</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsBarChart
              categories={[
                "Vid Pending",
                "Vid Processing",
                "Vid Ready",
                "PDF Pending",
                "PDF Ready",
              ]}
              values={[
                videoStatus.pending + videoStatus.uploading,
                videoStatus.processing,
                videoStatus.ready,
                pdfStatus.pending + pdfStatus.processing,
                pdfStatus.ready,
              ]}
              color="#13c296"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Courses by Enrollments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.courses.top_by_enrollments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No top courses data in this range.
              </p>
            ) : (
              data.courses.top_by_enrollments.slice(0, 8).map((row) => (
                <div
                  key={row.course_id}
                  className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 dark:border-gray-800"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {row.title ?? `Course #${row.course_id}`}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {row.enrollments.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
