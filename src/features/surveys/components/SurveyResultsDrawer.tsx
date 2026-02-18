"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/ui/stats-card";
import { useSurveyAnalytics } from "@/features/surveys/hooks/use-surveys";
import { normalizeSurveyAnalytics } from "@/features/surveys/services/surveys.service";
import type {
  SurveyAnalyticsQuestionView,
  Survey,
} from "@/features/surveys/types/survey";
import { AnalyticsBarChart } from "@/features/analytics/components/charts/AnalyticsBarChart";
import { AnalyticsDonutChart } from "@/features/analytics/components/charts/AnalyticsDonutChart";
import { cn } from "@/lib/utils";

type SurveyResultsDrawerProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  survey?: Survey | null;
  centerId?: string | number | null;
  initialTab?: SurveyResultsTab;
};

export type SurveyResultsTab = "overview" | "questions" | "responses" | "raw";
type TopOptionInsight = {
  questionTitle: string;
  optionLabel: string;
  count: number;
};

const TAB_OPTIONS: Array<{ id: SurveyResultsTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "questions", label: "Questions" },
  { id: "responses", label: "Responses" },
  { id: "raw", label: "Raw" },
];

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

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatPrimitive(value: unknown) {
  if (value == null) return "—";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value: string | null | undefined) {
  const date = parseDate(value);
  if (!date) return "—";
  return date.toLocaleString();
}

function getWindowStatus(survey?: Survey | null) {
  const now = new Date();
  const start = parseDate(survey?.start_at ?? null);
  const end = parseDate(survey?.end_at ?? null);

  if (!start && !end) return { label: "No Window", tone: "secondary" as const };
  if (start && now < start)
    return { label: "Upcoming", tone: "warning" as const };
  if (end && now > end) return { label: "Ended", tone: "default" as const };
  return { label: "Active Window", tone: "success" as const };
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  if (value < 0.1 && value > 0) return "<0.1%";
  return `${value.toFixed(value < 10 ? 1 : 0)}%`;
}

function getSubmittedCount(
  survey: Survey | null | undefined,
  metricCandidates: Array<{ label: string; value: number }>,
) {
  const fromSurvey = toNumber(survey?.submitted_users_count);
  if (fromSurvey != null) return fromSurvey;

  const foundMetric = metricCandidates.find(({ label }) => {
    const normalized = label.toLowerCase();
    return (
      normalized.includes("total responses") ||
      normalized === "responses" ||
      normalized.includes("submitted") ||
      normalized.includes("submission") ||
      normalized.includes("completed") ||
      normalized.endsWith("responses")
    );
  });

  return foundMetric?.value ?? 0;
}

function getTopOption(
  questions: SurveyAnalyticsQuestionView[],
): TopOptionInsight | null {
  let top: TopOptionInsight | null = null;

  questions.forEach((question) => {
    question.options.forEach((option) => {
      if (!top || option.count > top.count) {
        top = {
          questionTitle: question.title,
          optionLabel: option.label,
          count: option.count,
        };
      }
    });
  });

  return top;
}

function parseNumericOptionLabel(label: string) {
  const match = label.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function getRatingStats(question: SurveyAnalyticsQuestionView) {
  if (!isRatingQuestion(question.typeLabel) || question.options.length === 0) {
    return null;
  }

  const buckets = question.options
    .map((option) => ({
      score: parseNumericOptionLabel(option.label),
      count: Math.max(0, Math.floor(option.count)),
    }))
    .filter((item): item is { score: number; count: number } =>
      item.score != null ? item.count > 0 : false,
    )
    .sort((a, b) => a.score - b.score);

  if (buckets.length === 0) return null;

  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  if (total === 0) return null;

  const weightedSum = buckets.reduce(
    (sum, bucket) => sum + bucket.score * bucket.count,
    0,
  );
  const mean = weightedSum / total;

  const middle = total / 2;
  let cumulative = 0;
  let median = buckets[buckets.length - 1].score;

  for (const bucket of buckets) {
    cumulative += bucket.count;
    if (cumulative >= middle) {
      median = bucket.score;
      break;
    }
  }

  return {
    mean,
    median,
    total,
  };
}

function renderGenericData(data: unknown) {
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400">No data.</p>
      );
    }

    const previewItems = data.slice(0, 8);

    return (
      <div className="space-y-2">
        {previewItems.map((item, index) => {
          if (item && typeof item === "object") {
            const entries = Object.entries(
              item as Record<string, unknown>,
            ).slice(0, 6);

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
  centerId,
  initialTab,
}: SurveyResultsDrawerProps) {
  const surveyId = survey?.id;
  const [activeTab, setActiveTab] = useState<SurveyResultsTab>("overview");
  const [questionSearch, setQuestionSearch] = useState("");
  const [responseSearch, setResponseSearch] = useState("");
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );
  const [questionViewModes, setQuestionViewModes] = useState<
    Record<string, "chart" | "table">
  >({});

  const { data, isLoading, isError, isFetching, refetch } = useSurveyAnalytics(
    surveyId,
    { centerId },
    {
      enabled: open && Boolean(surveyId),
    },
  );

  const viewModel = useMemo(
    () => (data ? normalizeSurveyAnalytics(data) : null),
    [data],
  );

  const submittedCount = useMemo(() => {
    if (!viewModel) return 0;
    return getSubmittedCount(survey, viewModel.metrics);
  }, [survey, viewModel]);

  const totalQuestions = viewModel?.questions.length ?? 0;
  const answeredQuestions =
    viewModel?.questions.filter((question) => question.totalResponses > 0)
      .length ?? 0;
  const totalTextResponses =
    viewModel?.questions.reduce(
      (sum, question) => sum + question.textResponses.length,
      0,
    ) ?? 0;

  const questionEngagement =
    totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  const topQuestion = useMemo(() => {
    if (!viewModel || viewModel.questions.length === 0) return null;
    return [...viewModel.questions].sort(
      (a, b) => b.totalResponses - a.totalResponses,
    )[0];
  }, [viewModel]);

  const topOption = useMemo<TopOptionInsight | null>(
    () => (viewModel ? getTopOption(viewModel.questions) : null),
    [viewModel],
  );

  const filteredQuestions = useMemo(() => {
    if (!viewModel) return [];
    const needle = questionSearch.trim().toLowerCase();
    if (!needle) return viewModel.questions;

    return viewModel.questions.filter((question) => {
      const haystack = `${question.title} ${question.typeLabel}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [questionSearch, viewModel]);

  useEffect(() => {
    if (!open) {
      setActiveTab("overview");
      setQuestionSearch("");
      setResponseSearch("");
      return;
    }

    setActiveTab(initialTab ?? "overview");
  }, [initialTab, open]);

  useEffect(() => {
    if (!open) return;

    const firstQuestion = filteredQuestions[0];
    if (!firstQuestion) {
      setSelectedQuestionId(null);
      return;
    }

    const exists = filteredQuestions.some(
      (question) => question.id === selectedQuestionId,
    );

    if (!exists) {
      setSelectedQuestionId(firstQuestion.id);
    }
  }, [open, filteredQuestions, selectedQuestionId]);

  const selectedQuestion = useMemo(() => {
    if (!selectedQuestionId) return null;
    return (
      filteredQuestions.find(
        (question) => question.id === selectedQuestionId,
      ) ?? null
    );
  }, [filteredQuestions, selectedQuestionId]);

  const textResponseItems = useMemo(() => {
    if (!viewModel) return [];

    const rows = viewModel.questions.flatMap((question) =>
      question.textResponses.map((text, index) => ({
        id: `${question.id}-${index}`,
        questionId: question.id,
        questionTitle: question.title,
        text,
      })),
    );

    const needle = responseSearch.trim().toLowerCase();
    if (!needle) return rows;

    return rows.filter((row) => {
      return (
        row.text.toLowerCase().includes(needle) ||
        row.questionTitle.toLowerCase().includes(needle)
      );
    });
  }, [responseSearch, viewModel]);

  const windowStatus = getWindowStatus(survey);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="data-[state=open]:slide-in-from-right-1/2 data-[state=closed]:slide-out-to-right-1/2 data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-top-0 inset-y-0 left-auto right-0 flex h-dvh max-h-none w-full max-w-[760px] translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-l border-gray-200 p-0 shadow-2xl dark:border-gray-800 sm:max-h-none sm:rounded-none">
        <div className="flex h-full min-h-0 flex-1 flex-col">
          <DialogHeader className="space-y-3 border-b border-gray-200 p-4 dark:border-gray-800 sm:p-6">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {getSurveyTitle(survey)}
            </DialogTitle>
            <DialogDescription>
              Survey analytics and response breakdown for survey #
              {surveyId ?? "—"}.
            </DialogDescription>
            <div className="flex flex-wrap gap-2">
              <Badge variant={survey?.is_active ? "success" : "default"}>
                {survey?.is_active ? "Active" : "Inactive"}
              </Badge>
              <Badge variant={survey?.is_mandatory ? "warning" : "secondary"}>
                {survey?.is_mandatory ? "Mandatory" : "Optional"}
              </Badge>
              <Badge variant={windowStatus.tone}>{windowStatus.label}</Badge>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sm:px-6">
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {TAB_OPTIONS.map((tab) => (
                  <Button
                    key={tab.id}
                    size="sm"
                    variant={activeTab === tab.id ? "default" : "outline"}
                    className="w-full sm:w-auto"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-5 p-4 sm:p-6">
              {isLoading || isFetching ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetch()}
                    >
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : null}

              {!isLoading && !isFetching && !isError && viewModel ? (
                <>
                  {activeTab === "overview" ? (
                    <section className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <StatsCard
                          title="Submitted Users"
                          value={submittedCount.toLocaleString()}
                        />
                        <StatsCard
                          title="Questions"
                          value={totalQuestions.toLocaleString()}
                        />
                        <StatsCard
                          title="Answered Questions"
                          value={`${answeredQuestions}/${totalQuestions || 0}`}
                        />
                        <StatsCard
                          title="Text Responses"
                          value={totalTextResponses.toLocaleString()}
                        />
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Response Health
                          </h3>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            {formatPercent(questionEngagement)}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${Math.max(0, Math.min(100, questionEngagement))}%`,
                            }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {answeredQuestions} of {totalQuestions} questions have
                          response data.
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Most Answered Question
                          </p>
                          <p className="mt-2 line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
                            {topQuestion?.title ?? "No question data"}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {topQuestion
                              ? `${topQuestion.totalResponses.toLocaleString()} responses`
                              : "Waiting for responses"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Most Selected Option
                          </p>
                          <p className="mt-2 line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
                            {topOption?.optionLabel ?? "No option data"}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {topOption
                              ? `${topOption.count.toLocaleString()} selections in ${topOption.questionTitle}`
                              : "No multiple-choice responses yet"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50 sm:col-span-2 lg:col-span-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Survey Window
                          </p>
                          <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                            {windowStatus.label}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {formatDateTime(survey?.start_at)} →{" "}
                            {formatDateTime(survey?.end_at)}
                          </p>
                        </div>
                      </div>

                      {viewModel.metrics.length > 0 ? (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Additional Metrics
                          </h4>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {viewModel.metrics.slice(0, 12).map((metric) => (
                              <div
                                key={metric.label}
                                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900"
                              >
                                <span className="text-gray-600 dark:text-gray-300">
                                  {metric.label}
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {metric.value.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </section>
                  ) : null}

                  {activeTab === "questions" ? (
                    <section className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          Question Analytics
                        </h3>
                        <Input
                          value={questionSearch}
                          onChange={(event) =>
                            setQuestionSearch(event.target.value)
                          }
                          placeholder="Search questions..."
                        />
                      </div>

                      {filteredQuestions.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
                          No question analytics available for this filter.
                        </div>
                      ) : (
                        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                          <div className="space-y-2 lg:sticky lg:top-[90px] lg:max-h-[65dvh] lg:overflow-y-auto">
                            {filteredQuestions.map((question, index) => (
                              <button
                                key={question.id}
                                type="button"
                                onClick={() =>
                                  setSelectedQuestionId(question.id)
                                }
                                className={cn(
                                  "w-full rounded-lg border px-3 py-2 text-left transition-colors",
                                  selectedQuestion?.id === question.id
                                    ? "border-primary bg-primary/5"
                                    : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800",
                                )}
                              >
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                  Q{index + 1}
                                </p>
                                <p className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
                                  {question.title}
                                </p>
                              </button>
                            ))}
                          </div>

                          {selectedQuestion ? (
                            <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="secondary">
                                    {selectedQuestion.typeLabel}
                                  </Badge>
                                  <Badge variant="info">
                                    {selectedQuestion.totalResponses.toLocaleString()}{" "}
                                    responses
                                  </Badge>
                                </div>
                                <p className="text-base font-semibold text-gray-900 dark:text-white">
                                  {selectedQuestion.title}
                                </p>
                              </div>

                              {selectedQuestion.options.length > 0 ? (
                                <>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant={
                                        (questionViewModes[
                                          selectedQuestion.id
                                        ] ?? "chart") === "chart"
                                          ? "default"
                                          : "outline"
                                      }
                                      onClick={() =>
                                        setQuestionViewModes((prev) => ({
                                          ...prev,
                                          [selectedQuestion.id]: "chart",
                                        }))
                                      }
                                    >
                                      Chart
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={
                                        (questionViewModes[
                                          selectedQuestion.id
                                        ] ?? "chart") === "table"
                                          ? "default"
                                          : "outline"
                                      }
                                      onClick={() =>
                                        setQuestionViewModes((prev) => ({
                                          ...prev,
                                          [selectedQuestion.id]: "table",
                                        }))
                                      }
                                    >
                                      Table
                                    </Button>
                                  </div>

                                  {(questionViewModes[selectedQuestion.id] ??
                                    "chart") === "chart" ? (
                                    selectedQuestion.options.length <= 5 &&
                                    !isRatingQuestion(
                                      selectedQuestion.typeLabel,
                                    ) ? (
                                      <AnalyticsDonutChart
                                        labels={selectedQuestion.options.map(
                                          (option) => option.label,
                                        )}
                                        values={selectedQuestion.options.map(
                                          (option) => option.count,
                                        )}
                                        height={260}
                                      />
                                    ) : (
                                      <AnalyticsBarChart
                                        categories={selectedQuestion.options.map(
                                          (option) => option.label,
                                        )}
                                        values={selectedQuestion.options.map(
                                          (option) => option.count,
                                        )}
                                        height={260}
                                      />
                                    )
                                  ) : (
                                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                                      <table className="w-full min-w-[360px] text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                                          <tr>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                                              Option
                                            </th>
                                            <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">
                                              Count
                                            </th>
                                            <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">
                                              Share
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {selectedQuestion.options.map(
                                            (option) => {
                                              const percent =
                                                selectedQuestion.totalResponses >
                                                0
                                                  ? (option.count /
                                                      selectedQuestion.totalResponses) *
                                                    100
                                                  : 0;

                                              return (
                                                <tr
                                                  key={option.label}
                                                  className="border-t border-gray-100 dark:border-gray-800"
                                                >
                                                  <td className="px-3 py-2 text-gray-800 dark:text-gray-100">
                                                    {option.label}
                                                  </td>
                                                  <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                                                    {option.count.toLocaleString()}
                                                  </td>
                                                  <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                                                    {formatPercent(percent)}
                                                  </td>
                                                </tr>
                                              );
                                            },
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}

                                  {isRatingQuestion(selectedQuestion.typeLabel)
                                    ? (() => {
                                        const stats =
                                          getRatingStats(selectedQuestion);
                                        if (!stats) return null;

                                        return (
                                          <div className="grid gap-3 sm:grid-cols-3">
                                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/50">
                                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Mean
                                              </p>
                                              <p className="text-base font-semibold text-gray-900 dark:text-white">
                                                {stats.mean.toFixed(2)}
                                              </p>
                                            </div>
                                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/50">
                                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Median
                                              </p>
                                              <p className="text-base font-semibold text-gray-900 dark:text-white">
                                                {stats.median}
                                              </p>
                                            </div>
                                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/50">
                                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Rated Responses
                                              </p>
                                              <p className="text-base font-semibold text-gray-900 dark:text-white">
                                                {stats.total.toLocaleString()}
                                              </p>
                                            </div>
                                          </div>
                                        );
                                      })()
                                    : null}
                                </>
                              ) : null}

                              {selectedQuestion.textResponses.length > 0 ? (
                                <div className="space-y-2">
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Text Responses (
                                    {selectedQuestion.textResponses.length})
                                  </p>
                                  <div className="space-y-2">
                                    {selectedQuestion.textResponses
                                      .slice(0, 10)
                                      .map((response, index) => (
                                        <div
                                          key={`${selectedQuestion.id}-text-${index}`}
                                          className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-300"
                                        >
                                          {response}
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </section>
                  ) : null}

                  {activeTab === "responses" ? (
                    <section className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          Qualitative Responses
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Aggregate text responses only. No respondent identity
                          is shown.
                        </p>
                        <Input
                          value={responseSearch}
                          onChange={(event) =>
                            setResponseSearch(event.target.value)
                          }
                          placeholder="Search text responses..."
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <StatsCard
                          title="Total Text Responses"
                          value={totalTextResponses.toLocaleString()}
                        />
                        <StatsCard
                          title="Questions With Text"
                          value={viewModel.questions
                            .filter(
                              (question) => question.textResponses.length > 0,
                            )
                            .length.toLocaleString()}
                        />
                        <StatsCard
                          title="Filtered Results"
                          value={textResponseItems.length.toLocaleString()}
                        />
                      </div>

                      {textResponseItems.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
                          No text responses matched your search.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {textResponseItems.slice(0, 100).map((item) => (
                            <div
                              key={item.id}
                              className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
                            >
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                {item.questionTitle}
                              </p>
                              <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                                {item.text}
                              </p>
                            </div>
                          ))}
                          {textResponseItems.length > 100 ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Showing first 100 matched responses for
                              performance.
                            </p>
                          ) : null}
                        </div>
                      )}
                    </section>
                  ) : null}

                  {activeTab === "raw" ? (
                    <section className="space-y-3">
                      {viewModel.extraSections.length > 0 ? (
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Additional Analytics Data
                          </h3>

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
                      ) : null}

                      <details className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                        <summary className="cursor-pointer text-sm font-semibold text-gray-900 dark:text-white">
                          Raw Analytics Payload
                        </summary>
                        <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-gray-950 p-3 text-xs text-gray-100">
                          {JSON.stringify(viewModel.raw, null, 2)}
                        </pre>
                      </details>
                    </section>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 bg-white/95 p-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sm:p-4">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
            >
              {isLoading || isFetching ? "Refreshing..." : "Refresh"}
            </Button>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
