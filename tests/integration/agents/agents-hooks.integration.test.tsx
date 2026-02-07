import "../../setup/integration";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  useAvailableAgents,
  useExecuteAgent,
} from "@/features/agents/hooks/use-agent-executions";
import { setAuthPermissions } from "@/lib/auth-state";

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("agents hooks (integration with MSW)", () => {
  beforeEach(() => {
    setAuthPermissions(["agent.view", "agent.execute"]);
  });

  it("loads available agents", async () => {
    const { result } = renderHook(() => useAvailableAgents(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.[0]).toMatchObject({
      type: "content_publishing",
      name: "Content Publishing",
    });
  });

  it("executes generic agent", async () => {
    const { result } = renderHook(() => useExecuteAgent(), { wrapper });

    await act(async () => {
      const response = await result.current.mutateAsync({
        agent_type: "content_publishing",
        center_id: 1,
        context: { course_id: 12 },
      });

      expect(response.id).toBe(99);
      expect(response.status).toBe("pending");
    });
  });
});
