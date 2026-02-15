import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assignSurvey,
  closeSurvey,
  createSurvey,
  deleteSurvey,
  getSurvey,
  listSurveyTargetStudents,
  listSurveys,
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
        data: [{ id: 1, title: "S" }],
      },
    });

    const result = await listSurveys({ page: 2, per_page: 15, search: "" });

    expect(mockedHttp.get).toHaveBeenCalledWith("/api/v1/admin/surveys", {
      params: {
        page: 2,
        per_page: 15,
        search: undefined,
        center_id: undefined,
      },
    });

    expect(result).toEqual({
      items: [{ id: 1, title: "S" }],
      page: 2,
      perPage: 15,
      total: 1,
      lastPage: 1,
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
    await expect(updateSurvey(10, { title_translations: { en: "A", ar: "A" } })).resolves.toEqual({ id: 10 });
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
          center_id: undefined,
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
});
