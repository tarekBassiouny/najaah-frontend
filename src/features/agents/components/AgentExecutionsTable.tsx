"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/format-date-time";
import { useTenant } from "@/app/tenant-provider";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import {
  useAgentExecutions,
  useAvailableAgents,
} from "../hooks/use-agent-executions";
import {
  AGENT_STATUS_LABELS,
  AGENT_TYPE_LABELS,
  type AgentExecutionStatus,
} from "../types/agent";
import { ExecuteAgentDialog } from "./ExecuteAgentDialog";

const DEFAULT_PER_PAGE = 10;

const badgeVariantByStatus: Record<
  string,
  "default" | "info" | "warning" | "success" | "error" | "secondary"
> = {
  pending: "warning",
  running: "info",
  completed: "success",
  failed: "error",
};

function formatLabel(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function AgentExecutionsTable() {
  const { centerId } = useTenant();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const [agentType, setAgentType] = useState<string>("all");
  const [executionId, setExecutionId] = useState("");
  const [isRunDialogOpen, setIsRunDialogOpen] = useState(false);

  const filters = useMemo(
    () => ({
      page,
      perPage: DEFAULT_PER_PAGE,
      status:
        status && status !== "all"
          ? (status as AgentExecutionStatus)
          : undefined,
      agentType: agentType && agentType !== "all" ? agentType : undefined,
      centerId: centerId ?? undefined,
    }),
    [agentType, centerId, page, status],
  );

  const { data, isLoading, isFetching, isError } = useAgentExecutions(filters);
  const { data: availableAgents = [], isLoading: isLoadingAgents } =
    useAvailableAgents();
  const canExecuteAgents = availableAgents.length > 0;
  const items = data?.data ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / DEFAULT_PER_PAGE));
  const isLoadingState = isLoading || isFetching;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;

  useEffect(() => {
    setPage(1);
  }, [centerId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent Executions"
        description="Monitor and run background workflows."
        actions={
          <div className="flex items-center gap-2">
            <Input
              value={executionId}
              onChange={(event) => setExecutionId(event.target.value)}
              placeholder="Execution ID"
              className="w-40"
            />
            <Link
              href={executionId ? `/agents/executions/${executionId}` : "#"}
            >
              <Button variant="outline" disabled={!executionId}>
                Open
              </Button>
            </Link>
            <Button
              onClick={() => setIsRunDialogOpen(true)}
              disabled={!canExecuteAgents || isLoadingAgents}
              title={
                isLoadingAgents
                  ? "Checking available agents..."
                  : !canExecuteAgents
                    ? "No agents available for your role"
                    : undefined
              }
            >
              Run Agent
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="w-full sm:w-56">
          <CenterPicker
            className="w-full min-w-0"
            hideWhenCenterScoped={false}
          />
        </div>
        <div className="w-full sm:w-52">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-56">
          <Select value={agentType} onValueChange={setAgentType}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by agent type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agent types</SelectItem>
              <SelectItem value="content_publishing">
                Content Publishing
              </SelectItem>
              <SelectItem value="enrollment">Enrollment</SelectItem>
              <SelectItem value="analytics">Analytics</SelectItem>
              <SelectItem value="notification">Notification</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
          Failed to load agent executions. Please try again.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Started</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingState
              ? Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-8 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              : null}

            {showEmptyState ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  No executions found for the selected filters.
                </TableCell>
              </TableRow>
            ) : null}

            {!isLoadingState &&
              !showEmptyState &&
              items.map((execution) => {
                const statusKey = String(
                  execution.status ?? "pending",
                ).toLowerCase();
                return (
                  <TableRow key={execution.id}>
                    <TableCell className="font-medium">
                      {execution.id}
                    </TableCell>
                    <TableCell>
                      {AGENT_TYPE_LABELS[execution.agentType] ??
                        formatLabel(String(execution.agentType))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={badgeVariantByStatus[statusKey] ?? "secondary"}
                      >
                        {AGENT_STATUS_LABELS[statusKey] ??
                          formatLabel(statusKey)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {execution.targetName ??
                        execution.targetId ??
                        execution.targetType ??
                        "—"}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(
                        execution.startedAt ?? execution.createdAt,
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/agents/executions/${execution.id}`}>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Page {meta?.currentPage ?? page} of{" "}
          {Math.max(1, meta?.lastPage ?? maxPage)}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || isFetching}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setPage((current) =>
                Math.min(meta?.lastPage ?? maxPage, current + 1),
              )
            }
            disabled={page >= (meta?.lastPage ?? maxPage) || isFetching}
          >
            Next
          </Button>
        </div>
      </div>

      {canExecuteAgents ? (
        <ExecuteAgentDialog
          open={isRunDialogOpen}
          onOpenChange={setIsRunDialogOpen}
          onExecuted={(id) => setExecutionId(String(id))}
        />
      ) : null}
    </div>
  );
}
