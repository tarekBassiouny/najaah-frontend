import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assignSurvey,
  bulkCloseSurveys,
  bulkDeleteSurveys,
  bulkUpdateSurveyStatus,
  closeSurvey,
  createSurvey,
  deleteSurvey,
  getSurvey,
  getSurveyAnalytics,
  listSurveyTargetStudents,
  listSurveys,
  updateSurveyStatus,
  updateSurvey,
} from "@/features/surveys/services/surveys.service";
import { http } from "@/lib/http";

vi.mock("@/lib/http", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedHttp = http as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("surveys.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists surveys with normalized pagination fallback", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 1,
            title: "S",
            assignments: [{ type: "all" }],
            submitted_users_count: 4,
          },
        ],
      },
    });

    const result = await listSurveys({ page: 2, per_page: 15, search: "" });

    expect(mockedHttp.get).toHaveBeenCalledWith("/api/v1/admin/surveys", {
      params: {
        page: 2,
        per_page: 15,
        search: undefined,
        center_id: undefined,
        is_active: undefined,
        is_mandatory: undefined,
        type: undefined,
        start_from: undefined,
        start_to: undefined,
        end_from: undefined,
        end_to: undefined,
      },
    });

    expect(result).toEqual({
      items: [
        {
          id: 1,
          title: "S",
          assignments: [{ type: "all" }],
          submitted_users_count: 4,
        },
      ],
      page: 2,
      perPage: 15,
      total: 1,
      lastPage: 1,
    });
  });

  it("lists center-scoped surveys from center endpoint", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        data: [{ id: 11, title: "Center Survey" }],
      },
    });

    await listSurveys(
      { page: 1, per_page: 20, center_id: 999 },
      { centerId: 5 },
    );

    expect(mockedHttp.get).toHaveBeenCalledWith(
      "/api/v1/admin/centers/5/surveys",
      {
        params: {
          page: 1,
          per_page: 20,
          search: undefined,
          center_id: undefined,
          is_active: undefined,
          is_mandatory: undefined,
          type: undefined,
          start_from: undefined,
          start_to: undefined,
          end_from: undefined,
          end_to: undefined,
        },
      },
    );
  });

  it("passes all supported list filters", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        data: [],
        meta: { current_page: 3, per_page: 10, total: 0, last_page: 1 },
      },
    });

    await listSurveys({
      page: 3,
      per_page: 10,
      search: "math",
      is_active: true,
      is_mandatory: false,
      type: 2,
      start_from: "2026-02-01",
      start_to: "2026-02-28",
      end_from: "2026-03-01",
      end_to: "2026-03-31",
    });

    expect(mockedHttp.get).toHaveBeenCalledWith("/api/v1/admin/surveys", {
      params: {
        page: 3,
        per_page: 10,
        search: "math",
        center_id: undefined,
        is_active: true,
        is_mandatory: false,
        type: 2,
        start_from: "2026-02-01",
        start_to: "2026-02-28",
        end_from: "2026-03-01",
        end_to: "2026-03-31",
      },
    });
  });

  it("creates a survey", async () => {
    mockedHttp.post.mockResolvedValueOnce({ data: { data: { id: 2 } } });

    const result = await createSurvey({
      scope_type: 1,
      center_id: null,
      assignments: [{ type: "all" }],
      title_translations: { en: "Title", ar: "Title" },
      type: 1,
      is_active: true,
      is_mandatory: true,
      allow_multiple_submissions: false,
      questions: [
        {
          question_translations: { en: "Q", ar: "Q" },
          type: 4,
          is_required: true,
        },
      ],
    });

    expect(mockedHttp.post).toHaveBeenCalledWith(
      "/api/v1/admin/surveys",
      expect.objectContaining({
        scope_type: 1,
        assignments: [{ type: "all" }],
      }),
    );
    expect(result).toEqual({ id: 2 });
  });

  it("gets, updates, assigns, and closes a survey", async () => {
    mockedHttp.get.mockResolvedValueOnce({ data: { data: { id: 10 } } });
    mockedHttp.put.mockResolvedValueOnce({ data: { data: { id: 10 } } });
    mockedHttp.post.mockResolvedValueOnce({ data: { data: { id: 10 } } });
    mockedHttp.post.mockResolvedValueOnce({ data: { data: { id: 10 } } });

    await expect(getSurvey(10)).resolves.toEqual({ id: 10 });
    await expect(
      updateSurvey(10, { title_translations: { en: "A", ar: "A" } }),
    ).resolves.toEqual({ id: 10 });
    await expect(
      assignSurvey(10, { assignments: [{ type: "course", id: 5 }] }),
    ).resolves.toEqual({ id: 10 });
    await expect(closeSurvey(10)).resolves.toEqual({ id: 10 });

    expect(mockedHttp.get).toHaveBeenCalledWith("/api/v1/admin/surveys/10");
    expect(mockedHttp.put).toHaveBeenCalledWith("/api/v1/admin/surveys/10", {
      title_translations: { en: "A", ar: "A" },
    });
    expect(mockedHttp.post).toHaveBeenNthCalledWith(
      1,
      "/api/v1/admin/surveys/10/assign",
      { assignments: [{ type: "course", id: 5 }] },
    );
    expect(mockedHttp.post).toHaveBeenNthCalledWith(
      2,
      "/api/v1/admin/surveys/10/close",
    );
  });

  it("uses center-scoped endpoints for survey CRUD operations", async () => {
    mockedHttp.get.mockResolvedValueOnce({ data: { data: { id: 21 } } });
    mockedHttp.put.mockResolvedValueOnce({ data: { data: { id: 21 } } });
    mockedHttp.post.mockResolvedValueOnce({ data: { data: { id: 21 } } });
    mockedHttp.post.mockResolvedValueOnce({ data: { data: { id: 21 } } });
    mockedHttp.delete.mockResolvedValueOnce({});
    mockedHttp.get.mockResolvedValueOnce({ data: { data: { total: 3 } } });

    await expect(getSurvey(21, { centerId: 9 })).resolves.toEqual({ id: 21 });
    await expect(
      updateSurvey(
        21,
        { title_translations: { en: "B", ar: "B" } },
        { centerId: 9 },
      ),
    ).resolves.toEqual({ id: 21 });
    await expect(
      assignSurvey(
        21,
        { assignments: [{ type: "course", id: 5 }] },
        { centerId: 9 },
      ),
    ).resolves.toEqual({ id: 21 });
    await expect(closeSurvey(21, { centerId: 9 })).resolves.toEqual({ id: 21 });
    await expect(deleteSurvey(21, { centerId: 9 })).resolves.toBeUndefined();
    await expect(getSurveyAnalytics(21, { centerId: 9 })).resolves.toEqual({
      total: 3,
    });

    expect(mockedHttp.get).toHaveBeenNthCalledWith(
      1,
      "/api/v1/admin/centers/9/surveys/21",
    );
    expect(mockedHttp.put).toHaveBeenCalledWith(
      "/api/v1/admin/centers/9/surveys/21",
      {
        title_translations: { en: "B", ar: "B" },
      },
    );
    expect(mockedHttp.post).toHaveBeenNthCalledWith(
      1,
      "/api/v1/admin/centers/9/surveys/21/assign",
      { assignments: [{ type: "course", id: 5 }] },
    );
    expect(mockedHttp.post).toHaveBeenNthCalledWith(
      2,
      "/api/v1/admin/centers/9/surveys/21/close",
    );
    expect(mockedHttp.delete).toHaveBeenCalledWith(
      "/api/v1/admin/centers/9/surveys/21",
    );
    expect(mockedHttp.get).toHaveBeenNthCalledWith(
      2,
      "/api/v1/admin/centers/9/surveys/21/analytics",
    );
  });

  it("updates single survey status in system and center scopes", async () => {
    mockedHttp.put.mockResolvedValueOnce({ data: { data: { id: 77 } } });
    mockedHttp.put.mockResolvedValueOnce({ data: { data: { id: 88 } } });

    await expect(updateSurveyStatus(77, { is_active: false })).resolves.toEqual(
      { id: 77 },
    );
    await expect(
      updateSurveyStatus(88, { is_active: true }, { centerId: 4 }),
    ).resolves.toEqual({ id: 88 });

    expect(mockedHttp.put).toHaveBeenNthCalledWith(
      1,
      "/api/v1/admin/surveys/77/status",
      { is_active: false },
    );
    expect(mockedHttp.put).toHaveBeenNthCalledWith(
      2,
      "/api/v1/admin/centers/4/surveys/88/status",
      { is_active: true },
    );
  });

  it("bulk updates survey status and returns counts", async () => {
    mockedHttp.post.mockResolvedValueOnce({
      data: {
        data: {
          counts: {
            total: 3,
            updated: 2,
            skipped: 1,
            failed: 0,
          },
        },
      },
    });
    mockedHttp.post.mockResolvedValueOnce({
      data: {
        data: {
          counts: {
            total: 2,
            updated: 2,
            skipped: 0,
            failed: 0,
          },
        },
      },
    });

    const result = await bulkUpdateSurveyStatus({
      is_active: true,
      survey_ids: [1, 2, 3],
    });
    const centerResult = await bulkUpdateSurveyStatus(
      {
        is_active: false,
        survey_ids: [8, 9],
      },
      { centerId: 6 },
    );

    expect(mockedHttp.post).toHaveBeenCalledWith(
      "/api/v1/admin/surveys/bulk-status",
      {
        is_active: true,
        survey_ids: [1, 2, 3],
      },
    );
    expect(result).toEqual({
      counts: {
        total: 3,
        updated: 2,
        skipped: 1,
        failed: 0,
      },
    });
    expect(mockedHttp.post).toHaveBeenNthCalledWith(
      2,
      "/api/v1/admin/centers/6/surveys/bulk-status",
      {
        is_active: false,
        survey_ids: [8, 9],
      },
    );
    expect(centerResult).toEqual({
      counts: {
        total: 2,
        updated: 2,
        skipped: 0,
        failed: 0,
      },
    });
  });

  it("bulk closes surveys in system and center scopes", async () => {
    mockedHttp.post.mockResolvedValueOnce({
      data: {
        data: {
          counts: {
            total: 3,
            updated: 2,
            skipped: 1,
            failed: 0,
          },
        },
      },
    });
    mockedHttp.post.mockResolvedValueOnce({
      data: {
        data: {
          counts: {
            total: 2,
            updated: 2,
            skipped: 0,
            failed: 0,
          },
        },
      },
    });

    const result = await bulkCloseSurveys({ survey_ids: [1, 2, 3] });
    const centerResult = await bulkCloseSurveys(
      { survey_ids: [8, 9] },
      { centerId: 6 },
    );

    expect(mockedHttp.post).toHaveBeenNthCalledWith(
      1,
      "/api/v1/admin/surveys/bulk-close",
      {
        survey_ids: [1, 2, 3],
      },
    );
    expect(result).toEqual({
      counts: {
        total: 3,
        updated: 2,
        skipped: 1,
        failed: 0,
      },
    });
    expect(mockedHttp.post).toHaveBeenNthCalledWith(
      2,
      "/api/v1/admin/centers/6/surveys/bulk-close",
      {
        survey_ids: [8, 9],
      },
    );
    expect(centerResult).toEqual({
      counts: {
        total: 2,
        updated: 2,
        skipped: 0,
        failed: 0,
      },
    });
  });

  it("bulk deletes surveys in system and center scopes", async () => {
    mockedHttp.post.mockResolvedValueOnce({
      data: {
        data: {
          counts: {
            total: 3,
            updated: 2,
            skipped: 1,
            failed: 0,
          },
        },
      },
    });
    mockedHttp.post.mockResolvedValueOnce({
      data: {
        data: {
          counts: {
            total: 2,
            updated: 2,
            skipped: 0,
            failed: 0,
          },
        },
      },
    });

    const result = await bulkDeleteSurveys({ survey_ids: [1, 2, 3] });
    const centerResult = await bulkDeleteSurveys(
      { survey_ids: [8, 9] },
      { centerId: 6 },
    );

    expect(mockedHttp.post).toHaveBeenNthCalledWith(
      1,
      "/api/v1/admin/surveys/bulk-delete",
      {
        survey_ids: [1, 2, 3],
      },
    );
    expect(result).toEqual({
      counts: {
        total: 3,
        updated: 2,
        skipped: 1,
        failed: 0,
      },
    });
    expect(mockedHttp.post).toHaveBeenNthCalledWith(
      2,
      "/api/v1/admin/centers/6/surveys/bulk-delete",
      {
        survey_ids: [8, 9],
      },
    );
    expect(centerResult).toEqual({
      counts: {
        total: 2,
        updated: 2,
        skipped: 0,
        failed: 0,
      },
    });
  });

  it("deletes a survey", async () => {
    mockedHttp.delete.mockResolvedValueOnce({});
    await deleteSurvey(4);
    expect(mockedHttp.delete).toHaveBeenCalledWith("/api/v1/admin/surveys/4");
  });

  it("lists survey target students from the secure survey endpoint", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        data: {
          data: [{ id: 7, name: "Student A" }],
          meta: {
            current_page: 1,
            per_page: 100,
            total: 150,
            last_page: 2,
          },
        },
      },
    });

    const result = await listSurveyTargetStudents({
      scope_type: 1,
      page: 1,
      per_page: 100,
      search: "",
    });

    expect(mockedHttp.get).toHaveBeenCalledWith(
      "/api/v1/admin/surveys/target-students",
      {
        params: {
          scope_type: 1,
          status: undefined,
          search: undefined,
          page: 1,
          per_page: 100,
        },
      },
    );

    expect(result).toEqual({
      items: [{ id: 7, name: "Student A" }],
      page: 1,
      perPage: 100,
      total: 150,
      lastPage: 2,
    });
  });

  it("lists center target students from center endpoint", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        data: {
          data: [{ id: 12, name: "Center Student" }],
          meta: {
            current_page: 2,
            per_page: 20,
            total: 25,
            last_page: 2,
          },
        },
      },
    });

    const result = await listSurveyTargetStudents(
      {
        scope_type: 2,
        page: 2,
        per_page: 20,
        search: "a",
      },
      { centerId: 6 },
    );

    expect(mockedHttp.get).toHaveBeenCalledWith(
      "/api/v1/admin/centers/6/surveys/target-students",
      {
        params: {
          scope_type: 2,
          status: undefined,
          search: "a",
          page: 2,
          per_page: 20,
        },
      },
    );

    expect(result).toEqual({
      items: [{ id: 12, name: "Center Student" }],
      page: 2,
      perPage: 20,
      total: 25,
      lastPage: 2,
    });
  });
});
