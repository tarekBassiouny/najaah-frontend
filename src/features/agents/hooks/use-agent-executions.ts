import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listAgentExecutions,
  getAgentExecution,
  executeContentPublishing,
  executeBulkEnrollment,
} from "../services/agents.service";
import type {
  AgentExecutionFilters,
  ExecuteAgentPayload,
} from "../types/agent";

export function useAgentExecutions(filters: AgentExecutionFilters = {}) {
  return useQuery({
    queryKey: ["agent-executions", filters],
    queryFn: () => listAgentExecutions(filters),
    placeholderData: (previous) => previous,
  });
}

export function useAgentExecution(
  id: string | number | undefined,
  options?: { enabled?: boolean; refetchInterval?: number },
) {
  return useQuery({
    queryKey: ["agent-execution", id],
    queryFn: () => getAgentExecution(id!),
    enabled: !!id && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval,
  });
}

export function useExecuteContentPublishing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: executeContentPublishing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-executions"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useExecuteBulkEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: ExecuteAgentPayload & { studentIds: (string | number)[] },
    ) => executeBulkEnrollment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-executions"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}
