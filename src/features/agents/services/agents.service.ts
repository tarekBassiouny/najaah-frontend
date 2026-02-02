import { http } from "@/lib/http";
import type {
  AgentExecution,
  AgentExecutionFilters,
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

export async function listAgentExecutions(
  filters: AgentExecutionFilters = {},
): Promise<PaginatedResponse<AgentExecution>> {
  const params = new URLSearchParams();

  if (filters.agentType) params.set("agent_type", filters.agentType);
  if (filters.status) params.set("status", filters.status);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.perPage) params.set("per_page", String(filters.perPage));

  const { data } = await http.get("/api/v1/admin/agents/executions", { params });

  return {
    data: data?.data ?? [],
    meta: {
      currentPage: data?.meta?.current_page ?? 1,
      lastPage: data?.meta?.last_page ?? 1,
      perPage: data?.meta?.per_page ?? 15,
      total: data?.meta?.total ?? 0,
    },
  };
}

export async function getAgentExecution(id: string | number): Promise<AgentExecution> {
  const { data } = await http.get(`/api/v1/admin/agents/executions/${id}`);
  return data?.data;
}

export async function executeContentPublishing(
  payload: ExecuteAgentPayload,
): Promise<AgentExecution> {
  const { data } = await http.post("/api/v1/admin/agents/content-publishing/execute", {
    course_id: payload.targetId,
    ...payload.context,
  });
  return data?.data;
}

export async function executeBulkEnrollment(
  payload: ExecuteAgentPayload & { studentIds: (string | number)[] },
): Promise<AgentExecution> {
  const { data } = await http.post("/api/v1/admin/agents/enrollment/bulk", {
    course_id: payload.targetId,
    student_ids: payload.studentIds,
    ...payload.context,
  });
  return data?.data;
}
