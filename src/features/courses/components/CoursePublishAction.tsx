"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  useExecuteContentPublishing,
  useAgentExecution,
} from "@/features/agents";
import type { Course } from "../types/course";

type CoursePublishActionProps = {
  course: Course;
};

export function CoursePublishAction({ course }: CoursePublishActionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [executionId, setExecutionId] = useState<string | number | null>(null);
  const centerId =
    course.center?.id ?? (course as { center_id?: string | number }).center_id;

  const { mutate: executePublish, isPending: isStarting } =
    useExecuteContentPublishing();

  const { data: execution, isLoading: _isLoadingExecution } = useAgentExecution(
    executionId ?? undefined,
    {
      enabled: !!executionId,
      refetchInterval: executionId ? 2000 : undefined,
    },
  );

  const isPublished =
    course.status === "published" || course.status === "active";
  const isRunning = execution?.status === "running";
  const isCompleted = execution?.status === "completed";
  const isFailed = execution?.status === "failed";

  const handlePublish = () => {
    setIsDialogOpen(true);
  };

  const handleConfirmPublish = () => {
    if (!centerId) return;
    executePublish(
      { targetId: course.id, centerId },
      {
        onSuccess: (data) => {
          setExecutionId(data.id);
        },
        onError: () => {
          // Handle error
        },
      },
    );
  };

  const handleClose = () => {
    if (!isRunning) {
      setIsDialogOpen(false);
      setExecutionId(null);
    }
  };

  const progress = execution?.stepsCompleted
    ? (execution.stepsCompleted.filter((s) => s.status === "completed").length /
        6) *
      100
    : 0;

  return (
    <>
      <Button
        onClick={handlePublish}
        disabled={isPublished}
        className={isPublished ? "opacity-50" : ""}
      >
        <svg
          className="mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {isPublished ? "Published" : "Publish"}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {!executionId
                ? "Publish Course"
                : isCompleted
                  ? "Course Published"
                  : isFailed
                    ? "Publishing Failed"
                    : "Publishing Course..."}
            </DialogTitle>
            <DialogDescription>
              {!executionId
                ? "This will validate and publish the course, making it available to students."
                : isCompleted
                  ? "The course has been successfully published and is now available to students."
                  : isFailed
                    ? "An error occurred while publishing the course."
                    : "Please wait while we validate and publish your course."}
            </DialogDescription>
          </DialogHeader>

          {executionId && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Progress
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {execution?.stepsCompleted &&
                execution.stepsCompleted.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Steps
                    </p>
                    <ul className="space-y-1.5">
                      {execution.stepsCompleted.map((step, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          {step.status === "completed" ? (
                            <svg
                              className="h-4 w-4 text-green-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : step.status === "failed" ? (
                            <svg
                              className="h-4 w-4 text-red-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          ) : step.status === "pending" ? (
                            <div className="h-4 w-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                          ) : (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          )}
                          <span
                            className={
                              step.status === "completed"
                                ? "text-gray-900 dark:text-white"
                                : "text-gray-500 dark:text-gray-400"
                            }
                          >
                            {step.name}
                          </span>
                          {step.status === "completed" && (
                            <Badge
                              variant="success"
                              className="ml-auto text-xs"
                            >
                              Done
                            </Badge>
                          )}
                          {step.status === "failed" && (
                            <Badge variant="error" className="ml-auto text-xs">
                              Failed
                            </Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {isFailed && execution?.result?.error != null && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-900/20">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {String(execution.result.error)}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {!executionId ? (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmPublish} disabled={isStarting}>
                  {isStarting ? "Starting..." : "Confirm Publish"}
                </Button>
              </>
            ) : isCompleted || isFailed ? (
              <Button onClick={handleClose}>
                {isCompleted ? "Done" : "Close"}
              </Button>
            ) : (
              <Button variant="outline" disabled>
                Publishing...
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
