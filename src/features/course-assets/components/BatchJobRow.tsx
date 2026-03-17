import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { aiJobStatusBadge, AI_JOB_STATUS } from "@/features/ai/lib/job-status";
import type { AIContentJob } from "@/features/ai/types/ai";
import { useTranslation } from "@/features/localization";
import {
  isCourseAssetSlotType,
  STATUS_BADGE_VARIANTS,
} from "../lib/slot-badge";

type BatchJobRowProps = {
  job: AIContentJob;
  canReviewPublishAI: boolean;
  activeBatchKey: string | null;
  onReview: (_jobId: number, _batchKey: string | null) => void;
};

export function BatchJobRow({
  job,
  canReviewPublishAI,
  activeBatchKey,
  onReview,
}: BatchJobRowProps) {
  const { t } = useTranslation();
  const statusMeta = aiJobStatusBadge(Number(job.status));
  const targetLabel = isCourseAssetSlotType(job.target_type)
    ? t(`pages.courseAssets.slotTypes.${job.target_type}`)
    : job.target_type;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {targetLabel}
        </p>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_BADGE_VARIANTS[statusMeta.tone]}>
            {job.status_label || statusMeta.label}
          </Badge>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            #{job.id}
          </span>
        </div>
        {job.error_message ? (
          <p className="text-xs text-red-600 dark:text-red-400">
            {job.error_message}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {canReviewPublishAI &&
        (Number(job.status) === AI_JOB_STATUS.completed ||
          Number(job.status) === AI_JOB_STATUS.approved) ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onReview(Number(job.id), activeBatchKey ?? job.batch_key ?? null)
            }
          >
            {t("pages.courseAssets.actions.review")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
