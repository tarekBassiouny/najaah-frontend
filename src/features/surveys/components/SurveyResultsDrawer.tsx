"use client";

import { useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/ui/stats-card";
import { useSurveyAnalytics } from "@/features/surveys/hooks/use-surveys";
import { normalizeSurveyAnalytics } from "@/features/surveys/services/surveys.service";
import { AnalyticsBarChart } from "@/features/analytics/components/charts/AnalyticsBarChart";
import { AnalyticsDonutChart } from "@/features/analytics/components/charts/AnalyticsDonutChart";
import type { Survey } from "@/features/surveys/types/survey";

type SurveyResultsDrawerProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  survey?: Survey | null;
};

function getSurveyTitle(survey?: Survey | null) {
  if (!survey) return "Survey Results";
  if (survey.title_translations?.en) return survey.title_translations.en;
  if (survey.title_translations?.ar) return survey.title_translations.ar;
  if (survey.title) return String(survey.title);
  return `Survey #${survey.id}`;
}

function isRatingQuestion(typeLabel: string) {
  return typeLabel.toLowerCase().includes("rating");
}

function formatPrimitive(value: unknown) {
  if (value == null) return "—";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function renderGenericData(data: unknown) {
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400">No data.</p>
      );
    }

    const previewItems = data.slice(0, 6);

    return (
      <div className="space-y-2">
        {previewItems.map((item, index) => {
          if (item && typeof item === "object") {
            const entries = Object.entries(
              item as Record<string, unknown>,
            ).slice(0, 5);

            return (
              <div
                key={index}
                className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/50"
              >
                {entries.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-2 py-0.5"
                  >
                    <span className="text-gray-500 dark:text-gray-400">
                      {key}
                    </span>
                    <span className="max-w-[65%] truncate text-gray-900 dark:text-white">
                      {formatPrimitive(value)}
                    </span>
                  </div>
                ))}
              </div>
            );
          }

          return (
            <div
              key={index}
              className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-300"
            >
              {formatPrimitive(item)}
            </div>
          );
        })}
      </div>
    );
  }

  if (data && typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);

    if (entries.length === 0) {
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400">No data.</p>
      );
    }

    return (
      <div className="space-y-2">
        {entries.slice(0, 12).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <span className="text-gray-500 dark:text-gray-400">{key}</span>
            <span className="max-w-[65%] truncate text-gray-900 dark:text-white">
              {formatPrimitive(value)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <p className="text-sm text-gray-500 dark:text-gray-400">
      {formatPrimitive(data)}
    </p>
  );
}

export function SurveyResultsDrawer({
  open,
  onOpenChange,
  survey,
}: SurveyResultsDrawerProps) {
  const surveyId = survey?.id;

  const { data, isLoading, isError, isFetching, refetch } = useSurveyAnalytics(
    surveyId,
    {
      enabled: open && Boolean(surveyId),
    },
  );

  const viewModel = useMemo(
    () => (data ? normalizeSurveyAnalytics(data) : null),
    [data],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="data-[state=open]:slide-in-from-right-1/2 data-[state=closed]:slide-out-to-right-1/2 data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-top-0 left-auto right-0 top-0 flex h-dvh w-full max-w-[760px] translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-l border-gray-200 p-0 shadow-2xl dark:border-gray-800 sm:rounded-none">
        <div className="flex h-full min-h-0 flex-1 flex-col">
          <DialogHeader className="border-b border-gray-200 p-6 dark:border-gray-800">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {getSurveyTitle(survey)}
            </DialogTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Survey analytics and response breakdown for survey #
              {surveyId ?? "—"}.
            </p>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
            {isLoading || isFetching ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
                </div>
                <Skeleton className="h-56 w-full" />
                <Skeleton className="h-48 w-full" />
              </>
            ) : null}

            {isError ? (
              <Alert variant="destructive">
                <AlertTitle>Failed to load survey analytics</AlertTitle>
                <AlertDescription className="space-y-3">
                  <p>Could not fetch survey results. Please try again.</p>
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            ) : null}

            {!isLoading && !isFetching && !isError && viewModel ? (
              <>
                {viewModel.metrics.length > 0 ? (
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Overview Metrics
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {viewModel.metrics.slice(0, 8).map((metric) => (
                        <StatsCard
                          key={metric.label}
                          title={metric.label}
                          value={metric.value.toLocaleString()}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Question Analytics
                  </h3>

                  {viewModel.questions.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
                      No question analytics available for this survey yet.
                    </div>
                  ) : (
                    viewModel.questions.map((question) => {
                      const labels = question.options.map(
                        (option) => option.label,
                      );
                      const values = question.options.map(
                        (option) => option.count,
                      );
                      const showDonut =
                        question.options.length > 0 &&
                        question.options.length <= 5 &&
                        !isRatingQuestion(question.typeLabel);

                      return (
                        <div
                          key={question.id}
                          className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {question.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {question.typeLabel} •{" "}
                                {question.totalResponses.toLocaleString()}{" "}
                                responses
                              </p>
                            </div>
                          </div>

                          {question.options.length > 0 ? (
                            showDonut ? (
                              <AnalyticsDonutChart
                                labels={labels}
                                values={values}
                                height={260}
                              />
                            ) : (
                              <AnalyticsBarChart
                                categories={labels}
                                values={values}
                                height={260}
                              />
                            )
                          ) : null}

                          {question.textResponses.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Text Responses
                              </p>
                              <div className="space-y-2">
                                {question.textResponses
                                  .slice(0, 10)
                                  .map((response, index) => (
                                    <div
                                      key={`${question.id}-text-${index}`}
                                      className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-300"
                                    >
                                      {response}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </section>

                {viewModel.extraSections.length > 0 ? (
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Additional Analytics Data
                    </h3>

                    <div className="space-y-3">
                      {viewModel.extraSections.map((section) => (
                        <div
                          key={section.title}
                          className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                        >
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {section.title}
                          </p>
                          {renderGenericData(section.data)}
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="space-y-2">
                  <details className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                    <summary className="cursor-pointer text-sm font-semibold text-gray-900 dark:text-white">
                      Raw Analytics Payload
                    </summary>
                    <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-gray-950 p-3 text-xs text-gray-100">
                      {JSON.stringify(viewModel.raw, null, 2)}
                    </pre>
                  </details>
                </section>
              </>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
