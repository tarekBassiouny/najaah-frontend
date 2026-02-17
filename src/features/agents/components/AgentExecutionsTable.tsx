"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ListingCard } from "@/components/ui/listing-card";
import { ListingFilters } from "@/components/ui/listing-filters";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";
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

const DEFAULT_PER_PAGE = 20;
const ALL_STATUS_VALUE = "all";
const ALL_AGENT_TYPE_VALUE = "all";

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

function buildExecutionLabel(params: {
  id: string;
  agentType?: string;
  target?: string;
}) {
  const typeLabel =
    AGENT_TYPE_LABELS[params.agentType ?? ""] ??
    formatLabel(String(params.agentType ?? "agent"));
  const suffix = params.target ? ` • ${params.target}` : "";
  return `#${params.id} • ${typeLabel}${suffix}`;
}

export function AgentExecutionsTable() {
  const router = useRouter();
  const { centerId, centerSlug } = useTenant();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(DEFAULT_PER_PAGE);
  const [status, setStatus] = useState<string>(ALL_STATUS_VALUE);
  const [agentType, setAgentType] = useState<string>(ALL_AGENT_TYPE_VALUE);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(
    null,
  );
  const [isRunDialogOpen, setIsRunDialogOpen] = useState(false);
  const filters = useMemo(
    () => ({
      page,
      perPage,
      status:
        status && status !== ALL_STATUS_VALUE
          ? (status as AgentExecutionStatus)
          : undefined,
      agentType:
        agentType && agentType !== ALL_AGENT_TYPE_VALUE ? agentType : undefined,
      centerId: centerId ?? undefined,
    }),
    [agentType, centerId, page, perPage, status],
  );

  const { data, isLoading, isFetching, isError } = useAgentExecutions(filters);
  const { data: availableAgents = [], isLoading: isLoadingAgents } =
    useAvailableAgents();

  const canExecuteAgents = availableAgents.length > 0;
  const items = useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const resolvedLastPage = Math.max(
    1,
    meta?.lastPage ?? Math.ceil(total / perPage) ?? 1,
  );
  const currentPage = meta?.currentPage ?? page;
  const isLoadingState = isLoading;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;
  const hasActiveFilters =
    status !== ALL_STATUS_VALUE ||
    agentType !== ALL_AGENT_TYPE_VALUE ||
    (!centerSlug && centerId != null);
  const activeFilterCount =
    (status !== ALL_STATUS_VALUE ? 1 : 0) +
    (agentType !== ALL_AGENT_TYPE_VALUE ? 1 : 0) +
    (!centerSlug && centerId != null ? 1 : 0);

  useEffect(() => {
    setPage(1);
    setSelectedExecutionId(null);
  }, [centerId]);

  useEffect(() => {
    if (page > resolvedLastPage) {
      setPage(resolvedLastPage);
    }
  }, [page, resolvedLastPage]);

  const executionOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    const options = items.map((execution) => {
      const id = String(execution.id);
      const target =
        execution.targetName ?? execution.targetId ?? execution.targetType;
      const statusKey = String(execution.status ?? "pending").toLowerCase();

      return {
        value: id,
        label: buildExecutionLabel({
          id,
          agentType: String(execution.agentType),
          target: target ? String(target) : undefined,
        }),
        description:
          AGENT_STATUS_LABELS[statusKey] ?? formatLabel(String(statusKey)),
      };
    });

    if (
      selectedExecutionId &&
      !options.some((option) => option.value === selectedExecutionId)
    ) {
      options.unshift({
        value: selectedExecutionId,
        label: `Execution #${selectedExecutionId}`,
        description: "Recently executed",
      });
    }

    return options;
  }, [items, selectedExecutionId]);

  const clearFilters = () => {
    setStatus(ALL_STATUS_VALUE);
    setAgentType(ALL_AGENT_TYPE_VALUE);
    setPage(1);
  };

  const handleOpenExecution = () => {
    if (!selectedExecutionId) return;
    router.push(`/agents/executions/${selectedExecutionId}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent Executions"
        description="Monitor and run background workflows with guided actions."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="w-full min-w-[18rem] sm:w-96">
              <SearchableSelect
                value={selectedExecutionId}
                onValueChange={setSelectedExecutionId}
                options={executionOptions}
                placeholder="Open execution"
                searchPlaceholder="Search recent executions..."
                emptyMessage="No executions found"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleOpenExecution}
              disabled={!selectedExecutionId}
            >
              Open
            </Button>
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

      <ListingCard className="overflow-hidden border border-gray-200 dark:border-gray-700">
        <ListingFilters
          activeCount={activeFilterCount}
          isFetching={isFetching}
          isLoading={isLoadingState}
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
          clearDisabled={!hasActiveFilters || isFetching}
          summary={`${total} execution${total === 1 ? "" : "s"}`}
          gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Center
            </p>
            <CenterPicker
              className="w-full min-w-0"
              hideWhenCenterScoped={false}
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Status
            </p>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUS_VALUE}>All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Agent Type
            </p>
            <Select
              value={agentType}
              onValueChange={(value) => {
                setAgentType(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by agent type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_AGENT_TYPE_VALUE}>
                  All agent types
                </SelectItem>
                <SelectItem value="content_publishing">
                  Content Publishing
                </SelectItem>
                <SelectItem value="enrollment">Enrollment</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="notification">Notification</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </ListingFilters>

        {isError ? (
          <div className="border-b border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
            Failed to load agent executions. Please try again.
          </div>
        ) : null}

        {showEmptyState ? (
          <div className="p-6">
            <EmptyState
              title="No executions found"
              description="Try adjusting the selected filters or run a new agent execution."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                          <Skeleton className="ml-auto h-5 w-5 rounded" />
                        </TableCell>
                      </TableRow>
                    ))
                  : null}

                {!isLoadingState &&
                  items.map((execution) => {
                    const statusKey = String(
                      execution.status ?? "pending",
                    ).toLowerCase();
                    return (
                      <TableRow
                        key={execution.id}
                        className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                      >
                        <TableCell className="font-medium">
                          {execution.id}
                        </TableCell>
                        <TableCell>
                          {AGENT_TYPE_LABELS[execution.agentType] ??
                            formatLabel(String(execution.agentType))}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              badgeVariantByStatus[statusKey] ?? "secondary"
                            }
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedExecutionId(String(execution.id));
                              router.push(`/agents/executions/${execution.id}`);
                            }}
                          >
                            Quick view
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        )}

        {!isError && resolvedLastPage > 1 ? (
          <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
            <PaginationControls
              page={currentPage}
              lastPage={resolvedLastPage}
              isFetching={isFetching}
              onPageChange={setPage}
              perPage={perPage}
              onPerPageChange={(value) => {
                setPerPage(value);
                setPage(1);
              }}
              size="sm"
            />
          </div>
        ) : null}
      </ListingCard>

      {canExecuteAgents ? (
        <ExecuteAgentDialog
          open={isRunDialogOpen}
          onOpenChange={setIsRunDialogOpen}
          onExecuted={(id) => setSelectedExecutionId(String(id))}
        />
      ) : null}
    </div>
  );
}
