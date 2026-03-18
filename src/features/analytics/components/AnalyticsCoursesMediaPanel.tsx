"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/ui/stats-card";
import { AnalyticsDonutChart } from "./charts/AnalyticsDonutChart";
import { AnalyticsRankedList } from "./AnalyticsRankedList";
import type { AnalyticsCoursesMedia } from "@/features/analytics/types/analytics";
import { useTranslation } from "@/features/localization";

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
  const { t } = useTranslation();

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>
          {t(
            "auto.features.analytics.components.analyticscoursesmediapanel.s1",
          )}
        </AlertTitle>
        <AlertDescription>
          {t(
            "auto.features.analytics.components.analyticscoursesmediapanel.s2",
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCard
              key={i}
              title={t("common.actions.loading")}
              value="-"
              loading
            />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const labels = data.labels ?? {};
  const courseStatus = data.courses.by_status;
  const videoStatus = data.media.videos.by_upload_status;
  const pdfStatus = data.media.pdfs.by_upload_status;

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title={
            labels.ready_to_publish ??
            t(
              "auto.features.analytics.components.analyticscoursesmediapanel.readyToPublish",
            )
          }
          value={data.courses.ready_to_publish}
          variant="success"
          animationDelay={0}
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatsCard
          title={
            labels.blocked_by_media ??
            t(
              "auto.features.analytics.components.analyticscoursesmediapanel.blockedByMedia",
            )
          }
          value={data.courses.blocked_by_media}
          variant="warning"
          animationDelay={80}
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          }
        />
        <StatsCard
          title={t(
            "auto.features.analytics.components.analyticscoursesmediapanel.totalVideos",
          )}
          value={data.media.videos.total}
          variant="info"
          animationDelay={160}
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z"
              />
            </svg>
          }
        />
        <StatsCard
          title={t(
            "auto.features.analytics.components.analyticscoursesmediapanel.totalPdfs",
          )}
          value={data.media.pdfs.total}
          variant="info"
          animationDelay={240}
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          }
        />
      </div>

      {/* Course Status Donut + Media Status Donuts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {t(
                "auto.features.analytics.components.analyticscoursesmediapanel.s3",
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsDonutChart
              labels={[
                labels.course_status?.draft ??
                  t(
                    "auto.features.analytics.components.analyticscoursesmediapanel.draft",
                  ),
                labels.course_status?.uploading ??
                  t(
                    "auto.features.analytics.components.analyticscoursesmediapanel.uploading",
                  ),
                labels.course_status?.ready ??
                  t(
                    "auto.features.analytics.components.analyticscoursesmediapanel.ready",
                  ),
                labels.course_status?.published ??
                  t(
                    "auto.features.analytics.components.analyticscoursesmediapanel.published",
                  ),
                labels.course_status?.archived ??
                  t(
                    "auto.features.analytics.components.analyticscoursesmediapanel.archived",
                  ),
              ]}
              values={[
                courseStatus.draft,
                courseStatus.uploading,
                courseStatus.ready,
                courseStatus.published,
                courseStatus.archived,
              ]}
              colors={["#94a3b8", "#f59e0b", "#13c296", "#3c50e0", "#6b7280"]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {t(
                "auto.features.analytics.components.analyticscoursesmediapanel.s4",
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  {labels.media_types?.videos ??
                    t(
                      "auto.features.analytics.components.analyticscoursesmediapanel.videos",
                    )}
                </p>
                <AnalyticsDonutChart
                  labels={[
                    labels.media_status?.pending ??
                      t(
                        "auto.features.analytics.components.analyticscoursesmediapanel.pending",
                      ),
                    labels.media_status?.processing ??
                      t(
                        "auto.features.analytics.components.analyticscoursesmediapanel.processing",
                      ),
                    labels.media_status?.ready ??
                      t(
                        "auto.features.analytics.components.analyticscoursesmediapanel.ready",
                      ),
                  ]}
                  values={[
                    videoStatus.pending + videoStatus.uploading,
                    videoStatus.processing,
                    videoStatus.ready,
                  ]}
                  colors={["#f59e0b", "#0ea5e9", "#13c296"]}
                  height={180}
                />
              </div>
              <div>
                <p className="mb-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  {labels.media_types?.pdfs ??
                    t(
                      "auto.features.analytics.components.analyticscoursesmediapanel.pdfs",
                    )}
                </p>
                <AnalyticsDonutChart
                  labels={[
                    labels.media_status?.pending ??
                      t(
                        "auto.features.analytics.components.analyticscoursesmediapanel.pending",
                      ),
                    labels.media_status?.processing ??
                      t(
                        "auto.features.analytics.components.analyticscoursesmediapanel.processing",
                      ),
                    labels.media_status?.ready ??
                      t(
                        "auto.features.analytics.components.analyticscoursesmediapanel.ready",
                      ),
                  ]}
                  values={[
                    pdfStatus.pending,
                    pdfStatus.processing,
                    pdfStatus.ready,
                  ]}
                  colors={["#f59e0b", "#0ea5e9", "#13c296"]}
                  height={180}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Courses by Enrollments */}
      <Card>
        <CardHeader>
          <CardTitle>
            {labels.top_by_enrollments ??
              t(
                "auto.features.analytics.components.analyticscoursesmediapanel.s5",
              )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnalyticsRankedList
            items={data.courses.top_by_enrollments.slice(0, 8).map((row) => ({
              label:
                row.title ??
                t(
                  "auto.features.analytics.components.analyticscoursesmediapanel.courseWithId",
                  { id: row.course_id },
                ),
              value: row.enrollments,
            }))}
            color="#3c50e0"
            emptyMessage={t(
              "auto.features.analytics.components.analyticscoursesmediapanel.s6",
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
