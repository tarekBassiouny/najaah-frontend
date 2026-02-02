export type AgentExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export type AgentType =
  | "content_publishing"
  | "enrollment"
  | "analytics"
  | "notification";

export type AgentExecutionStep = {
  name: string;
  status: "pending" | "completed" | "failed" | "skipped";
  message?: string;
  completedAt?: string;
};

export type AgentExecution = {
  id: string | number;
  agentType: AgentType;
  status: AgentExecutionStatus;
  targetType: string;
  targetId: string | number;
  targetName?: string;
  context: Record<string, unknown>;
  result?: Record<string, unknown>;
  stepsCompleted: AgentExecutionStep[];
  startedAt?: string;
  completedAt?: string;
  initiatedBy: {
    id: string | number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type AgentExecutionFilters = {
  agentType?: AgentType;
  status?: AgentExecutionStatus;
  page?: number;
  perPage?: number;
};

export type ExecuteAgentPayload = {
  targetId: string | number;
  context?: Record<string, unknown>;
};

export const AGENT_TYPE_LABELS: Record<AgentType, string> = {
  content_publishing: "Content Publishing",
  enrollment: "Enrollment Management",
  analytics: "Analytics Report",
  notification: "Notification",
};

export const AGENT_STATUS_LABELS: Record<AgentExecutionStatus, string> = {
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
};
