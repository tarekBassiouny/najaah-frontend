"use client";

import { type Dispatch, type SetStateAction } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AI_JOB_STATUS,
  aiJobStatusBadge,
  isRetryingAIJob,
} from "@/features/ai/lib/job-status";
import type {
  AIContentJob,
  AIContentSourceType,
  AIContentTargetType,
  AIJobsListMeta,
} from "@/features/ai/types/ai";
import { formatDateTime } from "@/lib/format-date-time";

const STATUS_BADGE_VARIANTS = {
  neutral: "outline",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "error",
} as const;

function toStatusFilterValue(value: string): "all" | `${number}` {
  if (value === "all") return "all";

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return "all";
  return `${parsed}`;
}

export type AIJobsFilterState = {
  courseId: string;
  batchKey: string;
  targetType: AIContentTargetType | "all";
  status: "all" | `${number}`;
  page: number;
  perPage: number;
};

type AIJobsCardProps = {
  t: (_key: string) => string;
  filters: AIJobsFilterState;
  setFilters: Dispatch<SetStateAction<AIJobsFilterState>>;
  targetTypes: AIContentTargetType[];
  targetLabelMap: Record<AIContentTargetType, string>;
  sourceLabelMap: Record<AIContentSourceType, string>;
  statusFilterValues: readonly number[];
  jobs: AIContentJob[];
  jobsMeta: AIJobsListMeta;
  selectedJobId: number | null;
  isJobsLoading: boolean;
  isJobsFetching: boolean;
  isJobsError: boolean;
  canGenerateAI: boolean;
  isDiscardingJob: boolean;
  onSelectJob: (_jobId: number) => void;
  onDiscardJob: (_jobId: number) => void;
  onRefetchJobs: () => void;
};

export function AIJobsCard({
  t,
  filters,
  setFilters,
  targetTypes,
  targetLabelMap,
  sourceLabelMap,
  statusFilterValues,
  jobs,
  jobsMeta,
  selectedJobId,
  isJobsLoading,
  isJobsFetching,
  isJobsError,
  canGenerateAI,
  isDiscardingJob,
  onSelectJob,
  onDiscardJob,
  onRefetchJobs,
}: AIJobsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("pages.centerAIContent.workspace.jobs.title")}</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("pages.centerAIContent.workspace.jobs.description")}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="jobs-filter-course-id">
              {t("pages.centerAIContent.workspace.jobs.filters.courseId")}
            </Label>
            <Input
              id="jobs-filter-course-id"
              type="number"
              min={1}
              value={filters.courseId}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  courseId: event.target.value,
                  page: 1,
                }))
              }
              placeholder="4"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobs-filter-batch-key">
              {t("pages.centerAIContent.workspace.jobs.filters.batchKey")}
            </Label>
            <Input
              id="jobs-filter-batch-key"
              value={filters.batchKey}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  batchKey: event.target.value,
                  page: 1,
                }))
              }
              placeholder="uuid"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobs-filter-target-type">
              {t("pages.centerAIContent.workspace.jobs.filters.targetType")}
            </Label>
            <Select
              value={filters.targetType}
              onValueChange={(value) => {
                const nextType =
                  value === "all" ? "all" : (value as AIContentTargetType);

                setFilters((current) => ({
                  ...current,
                  targetType: nextType,
                  page: 1,
                }));
              }}
            >
              <SelectTrigger id="jobs-filter-target-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.labels.all")}</SelectItem>
                {targetTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {targetLabelMap[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobs-filter-status">
              {t("pages.centerAIContent.workspace.jobs.filters.status")}
            </Label>
            <Select
              value={filters.status}
              onValueChange={(value) => {
                const nextStatus = toStatusFilterValue(value);
                setFilters((current) => ({
                  ...current,
                  status: nextStatus,
                  page: 1,
                }));
              }}
            >
              <SelectTrigger id="jobs-filter-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.labels.all")}</SelectItem>
                {statusFilterValues.map((status) => {
                  const badge = aiJobStatusBadge(status);
                  return (
                    <SelectItem key={status} value={String(status)}>
                      {t(
                        `pages.centerAIContent.workspace.statusLabels.${badge.label.toLowerCase()}`,
                      )}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={onRefetchJobs}
              disabled={isJobsFetching}
            >
              {isJobsFetching
                ? t("common.actions.loading")
                : t("common.actions.refresh")}
            </Button>
          </div>
        </div>

        {isJobsError ? (
          <Alert variant="destructive">
            <AlertTitle>{t("common.messages.loadFailed")}</AlertTitle>
            <AlertDescription>
              {t("pages.centerAIContent.workspace.jobs.loadFailed")}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="rounded-xl border border-gray-200 dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t("pages.centerAIContent.workspace.jobs.columns.job")}
                </TableHead>
                <TableHead>
                  {t("pages.centerAIContent.workspace.jobs.columns.target")}
                </TableHead>
                <TableHead>
                  {t("pages.centerAIContent.workspace.jobs.columns.source")}
                </TableHead>
                <TableHead>
                  {t("pages.centerAIContent.workspace.jobs.columns.model")}
                </TableHead>
                <TableHead>
                  {t("pages.centerAIContent.workspace.jobs.columns.status")}
                </TableHead>
                <TableHead>
                  {t("pages.centerAIContent.workspace.jobs.columns.createdAt")}
                </TableHead>
                <TableHead>{t("common.labels.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isJobsLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`job-skeleton-${index}`}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : jobs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    {t("pages.centerAIContent.workspace.jobs.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => {
                  const isRetrying = isRetryingAIJob(job);
                  const badge = aiJobStatusBadge(
                    Number(job.status),
                    isRetrying,
                  );
                  const statusLabel = isRetrying
                    ? t("pages.centerAIContent.workspace.statusLabels.retrying")
                    : job.status_label ||
                      t(
                        `pages.centerAIContent.workspace.statusLabels.${badge.label.toLowerCase()}`,
                      );

                  return (
                    <TableRow
                      key={job.id}
                      data-state={
                        selectedJobId === job.id ? "selected" : undefined
                      }
                    >
                      <TableCell className="font-medium">#{job.id}</TableCell>
                      <TableCell>
                        {targetLabelMap[job.target_type] ?? job.target_type}
                      </TableCell>
                      <TableCell>
                        {sourceLabelMap[job.source_type] ?? job.source_type} #
                        {job.source_id}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>{job.ai_provider || "-"}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {job.ai_model || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE_VARIANTS[badge.tone]}>
                          {statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {job.created_at
                          ? formatDateTime(String(job.created_at))
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onSelectJob(job.id)}
                          >
                            {t("common.actions.view")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDiscardJob(job.id)}
                            disabled={
                              !canGenerateAI ||
                              isDiscardingJob ||
                              job.status === AI_JOB_STATUS.discarded ||
                              job.status === AI_JOB_STATUS.published
                            }
                          >
                            {t(
                              "pages.centerAIContent.workspace.jobs.actions.discard",
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationControls
          page={jobsMeta.page}
          lastPage={jobsMeta.last_page}
          perPage={filters.perPage}
          onPerPageChange={(nextPerPage) => {
            setFilters((current) => ({
              ...current,
              perPage: nextPerPage,
              page: 1,
            }));
          }}
          onPageChange={(nextPage) => {
            setFilters((current) => ({
              ...current,
              page: nextPage,
            }));
          }}
          isFetching={isJobsFetching}
        />
      </CardContent>
    </Card>
  );
}
