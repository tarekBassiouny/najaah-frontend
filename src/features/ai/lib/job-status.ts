import type { AIJobStatus } from "@/features/ai/types/ai";

export const AI_JOB_STATUS = {
  pending: 0,
  processing: 1,
  completed: 2,
  failed: 3,
  approved: 4,
  published: 5,
  discarded: 6,
} as const;

export type AIJobStatusBadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

type AIJobLike = {
  status?: number | null;
  error_message?: string | null;
};

export function isTerminalAIJobStatus(status: number): boolean {
  return (
    status === AI_JOB_STATUS.failed ||
    status === AI_JOB_STATUS.approved ||
    status === AI_JOB_STATUS.published ||
    status === AI_JOB_STATUS.discarded
  );
}

export function shouldPollAIJob(status: number): boolean {
  return (
    status === AI_JOB_STATUS.pending || status === AI_JOB_STATUS.processing
  );
}

export function isRetryingAIJob(job: AIJobLike | null | undefined): boolean {
  return (
    Number(job?.status ?? -1) === AI_JOB_STATUS.pending &&
    typeof job?.error_message === "string" &&
    job.error_message.trim().length > 0
  );
}

export function aiJobStatusBadge(
  status: number,
  isRetrying = false,
): {
  label: string;
  tone: AIJobStatusBadgeTone;
} {
  if (isRetrying) {
    return { label: "Retrying", tone: "warning" };
  }

  switch (status) {
    case AI_JOB_STATUS.pending:
      return { label: "Pending", tone: "neutral" };
    case AI_JOB_STATUS.processing:
      return { label: "Processing", tone: "info" };
    case AI_JOB_STATUS.completed:
      return { label: "Completed", tone: "success" };
    case AI_JOB_STATUS.failed:
      return { label: "Failed", tone: "danger" };
    case AI_JOB_STATUS.approved:
      return { label: "Approved", tone: "success" };
    case AI_JOB_STATUS.published:
      return { label: "Published", tone: "success" };
    case AI_JOB_STATUS.discarded:
      return { label: "Discarded", tone: "warning" };
    default:
      return { label: "Unknown", tone: "neutral" };
  }
}

export function toAIJobStatus(value: number): AIJobStatus | null {
  switch (value) {
    case AI_JOB_STATUS.pending:
    case AI_JOB_STATUS.processing:
    case AI_JOB_STATUS.completed:
    case AI_JOB_STATUS.failed:
    case AI_JOB_STATUS.approved:
    case AI_JOB_STATUS.published:
    case AI_JOB_STATUS.discarded:
      return value;
    default:
      return null;
  }
}
