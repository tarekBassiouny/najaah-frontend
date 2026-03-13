import { beforeEach, describe, expect, it, vi } from "vitest";
import { http } from "@/lib/http";
import {
  createQuizQuestion,
  deleteQuizQuestion,
  listQuizQuestions,
  reorderQuizQuestions,
  updateQuizQuestion,
} from "@/features/quizzes/services/quizzes.service";

vi.mock("@/lib/http", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("quizzes.service question endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists quiz questions", async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            question_translations: { en: "Q1" },
            question_type: 0,
          },
        ],
      },
    });

    const result = await listQuizQuestions(3, 12);

    expect(http.get).toHaveBeenCalledWith(
      "/api/v1/admin/centers/3/quizzes/12/questions",
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(1);
  });

  it("creates quiz question", async () => {
    vi.mocked(http.post).mockResolvedValue({
      data: {
        data: {
          id: 4,
          question_translations: { en: "Created" },
        },
      },
    });

    const payload = {
      question_translations: { en: "Created" },
      question_type: 0 as const,
      answers: [
        {
          answer_translations: { en: "A1" },
          is_correct: true,
          order_index: 1,
        },
        {
          answer_translations: { en: "A2" },
          is_correct: false,
          order_index: 2,
        },
      ],
    };

    const result = await createQuizQuestion(3, 12, payload);

    expect(http.post).toHaveBeenCalledWith(
      "/api/v1/admin/centers/3/quizzes/12/questions",
      payload,
    );
    expect(result.id).toBe(4);
  });

  it("updates quiz question", async () => {
    vi.mocked(http.put).mockResolvedValue({
      data: {
        data: {
          id: 7,
          question_translations: { en: "Updated" },
        },
      },
    });

    const payload = {
      question_translations: { en: "Updated" },
      question_type: 1 as const,
    };

    const result = await updateQuizQuestion(3, 12, 7, payload);

    expect(http.put).toHaveBeenCalledWith(
      "/api/v1/admin/centers/3/quizzes/12/questions/7",
      payload,
    );
    expect(result.id).toBe(7);
  });

  it("deletes quiz question", async () => {
    vi.mocked(http.delete).mockResolvedValue({
      data: { success: true, message: "Deleted" },
    });

    await deleteQuizQuestion(3, 12, 9);

    expect(http.delete).toHaveBeenCalledWith(
      "/api/v1/admin/centers/3/quizzes/12/questions/9",
    );
  });

  it("reorders quiz questions", async () => {
    vi.mocked(http.put).mockResolvedValue({
      data: { success: true, message: "Reordered" },
    });

    await reorderQuizQuestions(3, 12, [5, 4, 3]);

    expect(http.put).toHaveBeenCalledWith(
      "/api/v1/admin/centers/3/quizzes/12/questions/reorder",
      {
        question_ids: [5, 4, 3],
      },
    );
  });
});
