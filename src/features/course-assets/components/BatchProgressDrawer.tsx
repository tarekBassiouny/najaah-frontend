import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAIJobs } from "@/features/ai/hooks/use-ai";
import { AI_JOB_STATUS, shouldPollAIJob } from "@/features/ai/lib/job-status";
import { useTranslation } from "@/features/localization";
import { BatchJobRow } from "./BatchJobRow";

type BatchProgressDrawerProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  centerId: string;
  courseId: string;
  batchKey: string | null;
  canReviewPublishAI: boolean;
  isCatalogFetching: boolean;
  onReviewJob: (_jobId: number, _batchKey: string | null) => void;
  onRefreshCatalog: () => Promise<unknown>;
};

export function BatchProgressDrawer({
  open,
  onOpenChange,
  centerId,
  courseId,
  batchKey,
  canReviewPublishAI,
  isCatalogFetching,
  onReviewJob,
  onRefreshCatalog,
}: BatchProgressDrawerProps) {
  const { t } = useTranslation();

  const {
    data: batchJobsResponse,
    isFetching: isBatchFetching,
    refetch: refetchBatchJobs,
  } = useAIJobs(
    centerId,
    {
      course_id: Number(courseId),
      batch_key: batchKey ?? undefined,
      per_page: 100,
    },
    {
      enabled: Boolean(batchKey && open),
      refetchInterval: (query) => {
        const jobs = query.state.data?.data ?? [];
        const hasRunningJobs = jobs.some((job) =>
          shouldPollAIJob(Number(job.status)),
        );
        return hasRunningJobs ? 4_000 : false;
      },
    },
  );

  const batchJobs = useMemo(
    () => batchJobsResponse?.data ?? [],
    [batchJobsResponse?.data],
  );

  const batchSummary = useMemo(() => {
    const summary = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      approved: 0,
      published: 0,
      discarded: 0,
    };

    batchJobs.forEach((job) => {
      switch (Number(job.status)) {
        case AI_JOB_STATUS.pending:
          summary.pending += 1;
          break;
        case AI_JOB_STATUS.processing:
          summary.processing += 1;
          break;
        case AI_JOB_STATUS.completed:
          summary.completed += 1;
          break;
        case AI_JOB_STATUS.failed:
          summary.failed += 1;
          break;
        case AI_JOB_STATUS.approved:
          summary.approved += 1;
          break;
        case AI_JOB_STATUS.published:
          summary.published += 1;
          break;
        case AI_JOB_STATUS.discarded:
          summary.discarded += 1;
          break;
        default:
          break;
      }
    });

    return summary;
  }, [batchJobs]);

  const hasRunningBatchJobs = useMemo(
    () => batchJobs.some((job) => shouldPollAIJob(Number(job.status))),
    [batchJobs],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("pages.courseAssets.batch.title")}</DialogTitle>
          <DialogDescription>
            {batchKey
              ? t("pages.courseAssets.batch.descriptionWithKey", {
                  key: batchKey,
                })
              : t("pages.courseAssets.batch.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid gap-2 text-xs text-gray-600 dark:text-gray-300 sm:grid-cols-3">
            <p>
              {t("pages.courseAssets.batch.summary.processing", {
                count: batchSummary.processing,
              })}
            </p>
            <p>
              {t("pages.courseAssets.batch.summary.completed", {
                count: batchSummary.completed,
              })}
            </p>
            <p>
              {t("pages.courseAssets.batch.summary.failed", {
                count: batchSummary.failed,
              })}
            </p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {hasRunningBatchJobs
              ? t("pages.courseAssets.batch.autoRefresh.running")
              : t("pages.courseAssets.batch.autoRefresh.stopped")}
          </p>

          {batchJobs.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("pages.courseAssets.batch.empty")}
            </p>
          ) : (
            batchJobs.map((job) => (
              <BatchJobRow
                key={job.id}
                job={job}
                canReviewPublishAI={canReviewPublishAI}
                activeBatchKey={batchKey}
                onReview={onReviewJob}
              />
            ))
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isBatchFetching}
          >
            {t("common.actions.close")}
          </Button>
          <Button
            variant="outline"
            onClick={() => void refetchBatchJobs()}
            disabled={!batchKey || isBatchFetching}
          >
            {isBatchFetching
              ? t("common.actions.loading")
              : t("common.actions.refresh")}
          </Button>
          <Button
            onClick={async () => {
              await onRefreshCatalog();
            }}
            disabled={isCatalogFetching}
          >
            {t("pages.courseAssets.actions.refreshCatalog")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
