"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "pre_approved"
  | "active"
  | "cancelled"
  | "deactivated"
  | string;

type RequestActionButtonsProps = {
  status: RequestStatus;
  decidedByName?: string | null;
  decidedAt?: string | null;
  onApprove?: () => void;
  onReject?: () => void;
  onPreApprove?: () => void;
  showPreApprove?: boolean;
  isApproving?: boolean;
  isRejecting?: boolean;
  isPreApproving?: boolean;
  size?: "sm" | "default";
  className?: string;
};

function normalizeStatus(status: string): string {
  return status.trim().toLowerCase().replace(/[_-]/g, "_");
}

function isPendingStatus(status: string): boolean {
  const normalized = normalizeStatus(status);
  return normalized === "pending";
}

function isPreApprovedStatus(status: string): boolean {
  const normalized = normalizeStatus(status);
  return normalized === "pre_approved";
}

function isApprovedStatus(status: string): boolean {
  const normalized = normalizeStatus(status);
  return ["approved", "active", "enrolled", "confirmed"].includes(normalized);
}

function isRejectedStatus(status: string): boolean {
  const normalized = normalizeStatus(status);
  return ["rejected", "cancelled", "canceled"].includes(normalized);
}

function formatRelativeTime(
  dateString: string | null | undefined,
): string | null {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return null;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  } catch {
    return null;
  }
}

export function RequestActionButtons({
  status,
  decidedByName,
  decidedAt,
  onApprove,
  onReject,
  onPreApprove,
  showPreApprove = false,
  isApproving = false,
  isRejecting = false,
  isPreApproving = false,
  size = "sm",
  className,
}: RequestActionButtonsProps) {
  const isPending = isPendingStatus(status);
  const isPreApproved = isPreApprovedStatus(status);
  const isApproved = isApprovedStatus(status);
  const isRejected = isRejectedStatus(status);
  const showActions = isPending || isPreApproved;

  const relativeTime = formatRelativeTime(decidedAt);
  const decisionInfo = decidedByName
    ? `by ${decidedByName}${relativeTime ? ` · ${relativeTime}` : ""}`
    : relativeTime
      ? relativeTime
      : null;

  if (!showActions) {
    return (
      <div className={cn("flex flex-col items-end text-right", className)}>
        {isApproved ? (
          <span className="text-xs font-medium text-green-600 dark:text-green-400">
            Approved
          </span>
        ) : isRejected ? (
          <span className="text-xs font-medium text-red-600 dark:text-red-400">
            Rejected
          </span>
        ) : null}
        {decisionInfo ? (
          <span className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            {decisionInfo}
          </span>
        ) : null}
      </div>
    );
  }

  const buttonSize = size === "sm" ? "h-7 px-2 text-xs" : "h-8 px-3 text-sm";
  const isDisabled = isApproving || isRejecting || isPreApproving;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {showPreApprove && isPending ? (
        <Button
          type="button"
          variant="outline"
          className={cn(
            buttonSize,
            "border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30",
          )}
          onClick={onPreApprove}
          disabled={isDisabled || !onPreApprove}
        >
          {isPreApproving ? "..." : "Pre-Approve"}
        </Button>
      ) : null}

      <Button
        type="button"
        variant="outline"
        className={cn(
          buttonSize,
          "border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30",
        )}
        onClick={onApprove}
        disabled={isDisabled || !onApprove}
      >
        {isApproving ? "..." : "Approve"}
      </Button>

      <Button
        type="button"
        variant="outline"
        className={cn(
          buttonSize,
          "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30",
        )}
        onClick={onReject}
        disabled={isDisabled || !onReject}
      >
        {isRejecting ? "..." : "Reject"}
      </Button>
    </div>
  );
}
