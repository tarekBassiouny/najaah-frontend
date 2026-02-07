import { http } from "@/lib/http";
import type {
  AgentExecution,
  AgentExecutionFilters,
  AvailableAgent,
  ExecuteGenericAgentPayload,
  ExecuteAgentPayload,
} from "../types/agent";

type PaginatedResponse<T> = {
  data: T[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
};

type RawResponse<T> = {
  data?: T;
  [key: string]: unknown;
};

type RawAgentExecution = Record<string, unknown>;

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeStep(step: unknown) {
  if (typeof step === "string") {
    return {
      name: step,
      status: "completed",
    } as AgentExecution["stepsCompleted"][number];
  }

  const node = getRecord(step);
  return {
    name: getString(node.name, "Step"),
    status: getString(
      node.status,
      "pending",
    ) as AgentExecution["stepsCompleted"][number]["status"],
    message: getString(node.message) || undefined,
    completedAt: getString(node.completedAt ?? node.completed_at) || undefined,
  };
}

function normalizeStatusKey(raw: Record<string, unknown>) {
  const statusKey = getString(raw.status_key ?? raw.statusKey);
  if (statusKey) return statusKey;

  const statusValue = raw.status;
  const numericStatus =
    typeof statusValue === "number"
      ? statusValue
      : Number.isFinite(Number(statusValue))
        ? Number(statusValue)
        : null;

  switch (numericStatus) {
    case 0:
      return "pending";
    case 1:
      return "running";
    case 2:
      return "completed";
    case 3:
      return "failed";
    default:
      return getString(raw.status, "pending");
  }
}

function normalizeTargetName(raw: Record<string, unknown>) {
  const target = getRecord(raw.target);
  return (
    getString(raw.targetName) ||
    getString(target.name) ||
    getString(target.type) ||
    getString(raw.target_type_class) ||
    undefined
  );
}

function normalizeAgentExecution(raw: RawAgentExecution): AgentExecution {
  const initiator = getRecord(raw.initiatedBy ?? raw.initiator);
  const context = getRecord(raw.context);
  const result = getRecord(raw.result);
  const stepsRaw = Array.isArray(raw.stepsCompleted ?? raw.steps_completed)
    ? (raw.stepsCompleted ?? raw.steps_completed)
    : [];

  return {
    id: (raw.id as string | number) ?? "",
    agentType: getString(raw.agentType ?? raw.agent_type, "content_publishing"),
    status: normalizeStatusKey(raw),
    targetType: getString(raw.targetType ?? raw.target_type),
    targetId: (raw.targetId ?? raw.target_id ?? "") as string | number,
    targetName: normalizeTargetName(raw),
    context,
    result: Object.keys(result).length ? result : undefined,
    stepsCompleted: (stepsRaw as unknown[]).map(normalizeStep),
    startedAt: getString(raw.startedAt ?? raw.started_at) || undefined,
    completedAt: getString(raw.completedAt ?? raw.completed_at) || undefined,
    initiatedBy: {
      id: (initiator.id as string | number) ?? "",
      name: getString(initiator.name, "System"),
    },
    createdAt: getString(raw.createdAt ?? raw.created_at),
    updatedAt: getString(raw.updatedAt ?? raw.updated_at),
  };
}

function normalizeStatusFilter(
  status: AgentExecutionFilters["status"],
): string | undefined {
  if (status == null) return undefined;
  if (typeof status === "number") return String(status);

  const statusKey = String(status).toLowerCase();
  if (["pending", "running", "completed", "failed"].includes(statusKey)) {
    return statusKey === "pending"
      ? "0"
      : statusKey === "running"
        ? "1"
        : statusKey === "completed"
          ? "2"
          : "3";
  }

  return statusKey;
}

export async function listAgentExecutions(
  filters: AgentExecutionFilters = {},
): Promise<PaginatedResponse<AgentExecution>> {
  const params = new URLSearchParams();

  if (filters.agentType) params.set("agent_type", filters.agentType);
  const status = normalizeStatusFilter(filters.status);
  if (status) params.set("status", status);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.perPage) params.set("per_page", String(filters.perPage));
  if (filters.centerId != null)
    params.set("center_id", String(filters.centerId));
  if (filters.initiatedBy != null)
    params.set("initiated_by", String(filters.initiatedBy));

  const { data } = await http.get("/api/v1/admin/agents/executions", {
    params,
  });

  const rawItems = Array.isArray(data?.data) ? data.data : [];

  return {
    data: rawItems.map((item: unknown) =>
      normalizeAgentExecution(getRecord(item)),
    ),
    meta: {
      currentPage: data?.meta?.page ?? 1,
      lastPage: data?.meta?.last_page ?? 1,
      perPage: data?.meta?.per_page ?? 15,
      total: data?.meta?.total ?? 0,
    },
  };
}

export async function getAgentExecution(
  id: string | number,
): Promise<AgentExecution> {
  const { data } = await http.get(`/api/v1/admin/agents/executions/${id}`);
  return normalizeAgentExecution(getRecord(data?.data ?? data));
}

export async function listAvailableAgents(): Promise<AvailableAgent[]> {
  const { data } = await http.get<RawResponse<AvailableAgent[]>>(
    "/api/v1/admin/agents/available",
  );

  if (Array.isArray(data?.data)) return data.data;
  if (data?.data && typeof data.data === "object") {
    return Object.values(data.data) as AvailableAgent[];
  }
  return Array.isArray(data) ? (data as unknown as AvailableAgent[]) : [];
}

export async function executeAgent(
  payload: ExecuteGenericAgentPayload,
): Promise<AgentExecution> {
  const { data } = await http.post<RawResponse<AgentExecution>>(
    "/api/v1/admin/agents/execute",
    payload,
  );
  return normalizeAgentExecution(getRecord(data?.data ?? data));
}

export async function executeContentPublishing(
  payload: ExecuteAgentPayload,
): Promise<AgentExecution> {
  const { data } = await http.post(
    "/api/v1/admin/agents/content-publishing/execute",
    {
      center_id: payload.centerId,
      context: {
        course_id: payload.targetId,
        ...payload.context,
      },
    },
  );
  return normalizeAgentExecution(getRecord(data?.data ?? data));
}

export async function executeBulkEnrollment(
  payload: ExecuteAgentPayload & { studentIds: (string | number)[] },
): Promise<AgentExecution> {
  const { data } = await http.post("/api/v1/admin/agents/enrollment/bulk", {
    center_id: payload.centerId,
    context: {
      course_id: payload.targetId,
      student_ids: payload.studentIds,
      ...payload.context,
    },
  });
  return normalizeAgentExecution(getRecord(data?.data ?? data));
}
