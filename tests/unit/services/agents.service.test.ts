import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  executeAgent,
  getAgentExecution,
  listAgentExecutions,
  listAvailableAgents,
} from "@/features/agents/services/agents.service";
import { http } from "@/lib/http";

vi.mock("@/lib/http", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedHttp = http as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

describe("agents.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes listAgentExecutions from snake_case payload", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 11,
            agent_type: "content_publishing",
            status: 2,
            status_key: "completed",
            target_type: "course",
            target_type_class: "Course",
            target_id: 9,
            target: { id: 9, type: "Course" },
            context: { dry_run: false },
            result: { ok: true },
            steps_completed: ["publish_course"],
            initiator: { id: 1, name: "Admin" },
            created_at: "2026-02-05T10:00:00Z",
            updated_at: "2026-02-05T10:00:02Z",
          },
        ],
        meta: { page: 2, last_page: 3, per_page: 15, total: 44 },
      },
    });

    const result = await listAgentExecutions({ page: 2, perPage: 15 });

    expect(result.meta).toEqual({
      currentPage: 2,
      lastPage: 3,
      perPage: 15,
      total: 44,
    });
    expect(result.data[0]).toMatchObject({
      id: 11,
      agentType: "content_publishing",
      targetType: "course",
      targetId: 9,
      targetName: "Course",
      initiatedBy: { id: 1, name: "Admin" },
    });
  });

  it("returns available agents from wrapped data map", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        data: {
          content_publishing: {
            type: "content_publishing",
            name: "Content Publishing",
          },
        },
      },
    });

    await expect(listAvailableAgents()).resolves.toEqual([
      { type: "content_publishing", name: "Content Publishing" },
    ]);
  });

  it("calls generic execute endpoint and normalizes response", async () => {
    mockedHttp.post.mockResolvedValueOnce({
      data: {
        data: {
          id: 99,
          agent_type: "enrollment",
          status: 0,
          status_key: "pending",
          target_type: "course",
          target_id: 3,
          context: { batch: true },
          steps_completed: ["queued"],
          initiator: { id: 2, name: "Operator" },
          created_at: "2026-02-05T12:00:00Z",
          updated_at: "2026-02-05T12:00:00Z",
        },
      },
    });

    const result = await executeAgent({
      agent_type: "enrollment",
      center_id: 2,
      context: { course_id: 3 },
    });

    expect(mockedHttp.post).toHaveBeenCalledWith(
      "/api/v1/admin/agents/execute",
      {
        agent_type: "enrollment",
        center_id: 2,
        context: { course_id: 3 },
      },
    );
    expect(result).toMatchObject({
      id: 99,
      agentType: "enrollment",
      status: "pending",
      targetType: "course",
      targetId: 3,
    });
  });

  it("normalizes single execution payload", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        data: {
          id: 7,
          agent_type: "analytics",
          status: 3,
          status_key: "failed",
          target_type: "center",
          target_id: 1,
          context: {},
          result: { error: "boom" },
          steps_completed: [],
          initiator: { id: 5, name: "Admin" },
          created_at: "2026-02-05T10:00:00Z",
          updated_at: "2026-02-05T10:00:01Z",
        },
      },
    });

    await expect(getAgentExecution(7)).resolves.toMatchObject({
      id: 7,
      agentType: "analytics",
      status: "failed",
      result: { error: "boom" },
    });
  });
});
