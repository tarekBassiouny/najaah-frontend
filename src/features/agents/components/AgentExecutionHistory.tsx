"use client";

import { useAgentExecutions } from "../hooks/use-agent-executions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { type AgentExecution, AGENT_TYPE_LABELS } from "../types/agent";

type AgentExecutionHistoryProps = {
  limit?: number;
  showViewAll?: boolean;
  className?: string;
};

const statusStyles: Record<
  string,
  {
    variant: "info" | "success" | "warning" | "error" | "secondary";
    label: string;
  }
> = {
  pending: { variant: "warning", label: "Pending" },
  running: { variant: "info", label: "Running" },
  completed: { variant: "success", label: "Completed" },
  failed: { variant: "error", label: "Failed" },
};

const typeIcons: Record<string, React.ReactNode> = {
  content_publishing: (
    <svg
      className="h-4 w-4"
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
  ),
  enrollment: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
      />
    </svg>
  ),
  analytics: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  notification: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  ),
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function ExecutionItem({ execution }: { execution: AgentExecution }) {
  const status = statusStyles[execution.status] ?? {
    variant: "secondary",
    label: execution.status,
  };
  const icon = typeIcons[execution.agentType] ?? typeIcons.content_publishing;
  const typeLabel =
    AGENT_TYPE_LABELS[execution.agentType] ?? execution.agentType;

  return (
    <div className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <div
        className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
          execution.status === "completed" &&
            "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
          execution.status === "running" &&
            "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
          execution.status === "pending" &&
            "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
          execution.status === "failed" &&
            "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
        )}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {typeLabel}
          </p>
          <Badge variant={status.variant} className="text-xs">
            {status.label}
          </Badge>
        </div>

        {execution.targetName && (
          <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
            {execution.targetName}
          </p>
        )}

        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          {formatTimeAgo(execution.createdAt)}
          {execution.initiatedBy && ` by ${execution.initiatedBy.name}`}
        </p>
      </div>

      {execution.status === "running" && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AgentExecutionHistory({
  limit = 5,
  showViewAll = true,
  className,
}: AgentExecutionHistoryProps) {
  const { data, isLoading, isError } = useAgentExecutions({ perPage: limit });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
        <p className="text-sm text-red-600 dark:text-red-400">
          Failed to load agent executions
        </p>
      </div>
    );
  }

  if (!data?.data?.length) {
    return (
      <EmptyState
        title="No agent executions yet"
        description="Agent workflow executions will appear here"
        className={cn("py-8", className)}
      />
    );
  }

  return (
    <div className={className}>
      <div className="space-y-1">
        {data.data.map((execution) => (
          <ExecutionItem key={execution.id} execution={execution} />
        ))}
      </div>

      {showViewAll && data.meta.total > limit && (
        <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Link href="/agents/executions">
            <Button variant="outline" size="sm" className="w-full">
              View all executions ({data.meta.total})
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
