export type AgentExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | (string & {});

export type AgentType =
  | "content_publishing"
  | "enrollment"
  | "analytics"
  | "notification"
  | (string & {});

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
  status?: AgentExecutionStatus | number;
  page?: number;
  perPage?: number;
  centerId?: string | number;
  initiatedBy?: string | number;
};

export type ExecuteAgentPayload = {
  targetId: string | number;
  context?: Record<string, unknown>;
  centerId: string | number;
};

export type AvailableAgent = {
  type: string;
  name?: string;
  description?: string;
  steps?: string[];
  [key: string]: unknown;
};

export type ExecuteGenericAgentPayload = {
  agent_type: string;
  center_id: string | number;
  context?: Record<string, unknown>;
  [key: string]: unknown;
};

export const AGENT_TYPE_LABELS: Record<string, string> = {
  content_publishing: "Content Publishing",
  enrollment: "Enrollment Management",
  analytics: "Analytics Report",
  notification: "Notification",
};

export const AGENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
};
