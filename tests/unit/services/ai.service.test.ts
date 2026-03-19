import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  approveJob,
  createJob,
  discardJob,
  getCenterOptions,
  getCenterProviders,
  getJob,
  getSystemProviders,
  listJobs,
  publishJob,
  reviewJob,
  updateCenterProvider,
  updateSystemProvider,
} from "@/features/ai/services/ai.service";
import { http } from "@/lib/http";

vi.mock("@/lib/http", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedHttp = http as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("ai.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads system providers", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            key: "gemini",
            label: "Google Gemini",
            is_enabled: true,
            configured: true,
            default_model: "gemini-2.0-flash",
            models: ["gemini-2.0-flash"],
            has_custom_api_key: true,
          },
        ],
      },
    });

    const result = await getSystemProviders();

    expect(mockedHttp.get).toHaveBeenCalledWith("/api/v1/admin/ai/providers");
    expect(result.data).toHaveLength(1);
    expect(result.data[0].key).toBe("gemini");
  });

  it("updates system and center providers using contract paths", async () => {
    mockedHttp.put.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          key: "gemini",
          label: "Gemini",
          is_enabled: true,
          configured: true,
          default_model: "gemini-2.0-flash",
          models: ["gemini-2.0-flash"],
          has_custom_api_key: true,
        },
      },
    });
    mockedHttp.put.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          key: "gemini",
          label: "Gemini",
          enabled: true,
          configured: true,
          default_model: "gemini-2.0-flash",
          models: ["gemini-2.0-flash"],
          limits: {
            daily_job_limit: 10,
            monthly_job_limit: 300,
            daily_token_limit: 10000,
            monthly_token_limit: 300000,
            max_input_chars: 20000,
            max_output_chars: 12000,
            max_concurrent_jobs: 2,
            default_output_token_estimate: 1024,
          },
          system_enabled: true,
          center_enabled: true,
          has_custom_api_key: false,
        },
      },
    });

    await updateSystemProvider("gemini", {
      is_enabled: true,
      models: ["gemini-2.0-flash"],
      default_model: "gemini-2.0-flash",
    });

    await updateCenterProvider(7, "gemini", {
      is_enabled: true,
      allowed_models: ["gemini-2.0-flash"],
      default_model: "gemini-2.0-flash",
    });

    expect(mockedHttp.put).toHaveBeenNthCalledWith(
      1,
      "/api/v1/admin/ai/providers/gemini",
      {
        is_enabled: true,
        models: ["gemini-2.0-flash"],
        default_model: "gemini-2.0-flash",
      },
    );

    expect(mockedHttp.put).toHaveBeenNthCalledWith(
      2,
      "/api/v1/admin/centers/7/ai/providers/gemini",
      {
        is_enabled: true,
        allowed_models: ["gemini-2.0-flash"],
        default_model: "gemini-2.0-flash",
      },
    );
  });

  it("loads center providers and options with enabled_only=true by default", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [],
      },
    });
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          default_provider: "gemini",
          providers: [],
        },
      },
    });

    await getCenterProviders(3);
    await getCenterOptions(3);

    expect(mockedHttp.get).toHaveBeenNthCalledWith(
      1,
      "/api/v1/admin/centers/3/ai/providers",
    );
    expect(mockedHttp.get).toHaveBeenNthCalledWith(
      2,
      "/api/v1/admin/centers/3/ai/options",
      {
        params: {
          enabled_only: true,
        },
      },
    );
  });

  it("creates and lists jobs with normalized list meta", async () => {
    mockedHttp.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          id: 41,
          center_id: 3,
          course_id: 8,
          source_type: "section",
          source_id: 11,
          target_type: "summary",
          target_id: null,
          status: 0,
          status_label: "Pending",
          generation_config: null,
          generated_payload: null,
          reviewed_payload: null,
          ai_provider: "gemini",
          ai_model: "gemini-2.0-flash",
          estimated_input_tokens: 0,
          estimated_output_tokens: 0,
          error_message: null,
          started_at: null,
          completed_at: null,
          published_at: null,
          created_at: "2026-03-12T00:00:00Z",
          updated_at: "2026-03-12T00:00:00Z",
        },
      },
    });

    mockedHttp.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          data: [
            {
              id: 41,
              center_id: 3,
              course_id: 8,
              source_type: "section",
              source_id: 11,
              target_type: "summary",
              target_id: null,
              status: 1,
              status_label: "Processing",
              generation_config: null,
              generated_payload: null,
              reviewed_payload: null,
              ai_provider: "gemini",
              ai_model: "gemini-2.0-flash",
              estimated_input_tokens: 100,
              estimated_output_tokens: 500,
              error_message: null,
              started_at: "2026-03-12T00:00:01Z",
              completed_at: null,
              published_at: null,
              created_at: "2026-03-12T00:00:00Z",
              updated_at: "2026-03-12T00:00:01Z",
            },
          ],
          meta: {
            page: 2,
            per_page: 20,
            total: 47,
            last_page: 3,
          },
        },
      },
    });

    const created = await createJob(3, {
      course_id: 8,
      source_type: "section",
      source_id: 11,
      target_type: "summary",
      language: "ar",
      ai_provider: "gemini",
      ai_model: "gemini-2.0-flash",
      generation_config: {
        length: "medium",
      },
    });

    const list = await listJobs(3, {
      course_id: 8,
      target_type: "summary",
      status: 1,
      page: 2,
      per_page: 20,
    });

    expect(created.data.id).toBe(41);
    expect(mockedHttp.get).toHaveBeenCalledWith(
      "/api/v1/admin/centers/3/ai-content/jobs",
      {
        params: {
          course_id: 8,
          target_type: "summary",
          status: 1,
          page: 2,
          per_page: 20,
        },
      },
    );

    expect(list.meta).toEqual({
      page: 2,
      per_page: 20,
      total: 47,
      last_page: 3,
    });
    expect(list.data[0].status).toBe(1);
  });

  it("fetches and transitions job state (review/approve/publish/discard)", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          id: 12,
          status: 2,
        },
      },
    });
    mockedHttp.patch.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          id: 12,
          status: 4,
        },
      },
    });
    mockedHttp.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          id: 12,
          status: 4,
        },
      },
    });
    mockedHttp.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          job: {
            id: 12,
            status: 5,
          },
          publication: {
            target_type: "summary",
            target_id: 55,
          },
        },
      },
    });
    mockedHttp.delete.mockResolvedValueOnce({
      data: {
        success: true,
        data: null,
      },
    });

    await getJob(3, 12);
    await reviewJob(3, 12, { title: "Reviewed" });
    await approveJob(3, 12);
    const published = await publishJob(3, 12);
    const discarded = await discardJob(3, 12);

    expect(mockedHttp.patch).toHaveBeenCalledWith(
      "/api/v1/admin/centers/3/ai-content/jobs/12/review",
      {
        reviewed_payload: { title: "Reviewed" },
      },
    );
    expect(mockedHttp.post).toHaveBeenNthCalledWith(
      1,
      "/api/v1/admin/centers/3/ai-content/jobs/12/approve",
    );
    expect(mockedHttp.post).toHaveBeenNthCalledWith(
      2,
      "/api/v1/admin/centers/3/ai-content/jobs/12/publish",
    );
    expect(mockedHttp.delete).toHaveBeenCalledWith(
      "/api/v1/admin/centers/3/ai-content/jobs/12",
    );

    expect(published.data.publication.target_id).toBe(55);
    expect(discarded.data).toBeNull();
  });
});
