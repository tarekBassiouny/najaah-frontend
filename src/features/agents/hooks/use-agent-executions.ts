import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listAgentExecutions,
  getAgentExecution,
  listAvailableAgents,
  executeAgent,
  executeContentPublishing,
  executeBulkEnrollment,
} from "../services/agents.service";
import type {
  AgentExecutionFilters,
  ExecuteGenericAgentPayload,
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

export function useAvailableAgents() {
  return useQuery({
    queryKey: ["available-agents"],
    queryFn: listAvailableAgents,
    staleTime: 60_000,
  });
}

export function useExecuteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ExecuteGenericAgentPayload) => executeAgent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-executions"] });
    },
  });
}
