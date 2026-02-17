"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAgentExecution } from "../hooks/use-agent-executions";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format-date-time";
import { AGENT_STATUS_LABELS, AGENT_TYPE_LABELS } from "../types/agent";

type AgentExecutionDetailsProps = {
  executionId: string | number;
};

function formatLabel(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function prettyJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

export function AgentExecutionDetails({
  executionId,
}: AgentExecutionDetailsProps) {
  const { data, isLoading, isError } = useAgentExecution(executionId, {
    enabled: Boolean(executionId),
    refetchInterval: (query) => {
      const status = String(
        (query.state?.data as { status?: string | null } | undefined)?.status ??
          "",
      ).toLowerCase();

      return status === "running" || status === "pending" ? 2_000 : false;
    },
  });

  const statusKey = String(data?.status ?? "pending").toLowerCase();
  const isRunning = statusKey === "running" || statusKey === "pending";

  const progress = useMemo(() => {
    if (!data?.stepsCompleted?.length) return 0;
    const completed = data.stepsCompleted.filter(
      (step) => step.status === "completed",
    ).length;
    return Math.round((completed / data.stepsCompleted.length) * 100);
  }, [data?.stepsCompleted]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Execution #${executionId}`}
        description="Track status, steps, and payloads for this agent run."
        actions={
          <Link href="/agents/executions">
            <Button variant="outline">Back to executions</Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-52 w-full" />
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
          Failed to load execution details.
        </div>
      ) : null}

      {!isLoading && !isError && data ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>
                  {AGENT_TYPE_LABELS[data.agentType] ??
                    formatLabel(String(data.agentType))}
                </span>
                <Badge
                  variant={
                    isRunning
                      ? "info"
                      : statusKey === "completed"
                        ? "success"
                        : statusKey === "failed"
                          ? "error"
                          : "secondary"
                  }
                >
                  {AGENT_STATUS_LABELS[statusKey] ?? formatLabel(statusKey)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <p>
                <span className="font-medium text-gray-900 dark:text-white">
                  Target:
                </span>{" "}
                {data.targetName ?? data.targetId ?? data.targetType ?? "—"}
              </p>
              <p>
                <span className="font-medium text-gray-900 dark:text-white">
                  Started:
                </span>{" "}
                {formatDateTime(data.startedAt ?? data.createdAt)}
              </p>
              <p>
                <span className="font-medium text-gray-900 dark:text-white">
                  Completed:
                </span>{" "}
                {data.completedAt ? formatDateTime(data.completedAt) : "—"}
              </p>
              <p>
                <span className="font-medium text-gray-900 dark:text-white">
                  Initiated by:
                </span>{" "}
                {data.initiatedBy?.name ?? "System"}
              </p>
              <p>
                <span className="font-medium text-gray-900 dark:text-white">
                  Progress:
                </span>{" "}
                {progress}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Execution Steps</CardTitle>
            </CardHeader>
            <CardContent>
              {data.stepsCompleted?.length ? (
                <ul className="space-y-2">
                  {data.stepsCompleted.map((step, index) => (
                    <li
                      key={`${step.name}-${index}`}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700"
                    >
                      <span>{step.name}</span>
                      <Badge
                        variant={
                          step.status === "completed"
                            ? "success"
                            : step.status === "failed"
                              ? "error"
                              : step.status === "pending"
                                ? "warning"
                                : "secondary"
                        }
                      >
                        {formatLabel(step.status)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No step details available.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Context</CardTitle>
              </CardHeader>
              <CardContent className="min-w-0">
                <pre className="max-h-[60vh] w-full overflow-auto rounded-lg bg-gray-950 p-3 text-xs text-gray-100 sm:max-h-[28rem]">
                  {prettyJson(data.context)}
                </pre>
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Result</CardTitle>
              </CardHeader>
              <CardContent className="min-w-0">
                <pre className="max-h-[60vh] w-full overflow-auto rounded-lg bg-gray-950 p-3 text-xs text-gray-100 sm:max-h-[28rem]">
                  {prettyJson(data.result)}
                </pre>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
