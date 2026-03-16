import "../../setup/integration";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import React, { type PropsWithChildren } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  useCreateCourseQuiz,
  useCreateQuizQuestion,
  useQuizQuestions,
  useReorderQuizQuestions,
  useUpdateQuizQuestion,
} from "@/features/quizzes/hooks/use-quizzes";
import { server } from "../msw/server";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("quiz builder flow (integration with MSW)", () => {
  beforeEach(() => {
    let quizIdSeed = 900;
    let questionIdSeed = 5000;

    const questionsByQuiz = new Map<
      number,
      Array<Record<string, unknown> & { id: number; order_index: number }>
    >();

    server.use(
      http.post(
        "/api/v1/admin/centers/:centerId/courses/:courseId/quizzes",
        async ({ params, request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          const quiz = {
            id: quizIdSeed++,
            center_id: Number(params.centerId),
            course_id: Number(params.courseId),
            questions_count: 0,
            ...body,
          };

          return HttpResponse.json({
            success: true,
            message: "Quiz created",
            data: quiz,
          });
        },
      ),

      http.get(
        "/api/v1/admin/centers/:centerId/quizzes/:quizId/questions",
        ({ params }) => {
          const quizId = Number(params.quizId);
          const questions = questionsByQuiz.get(quizId) ?? [];
          const sorted = [...questions].sort(
            (a, b) => a.order_index - b.order_index,
          );

          return HttpResponse.json({
            success: true,
            data: sorted,
          });
        },
      ),

      http.post(
        "/api/v1/admin/centers/:centerId/quizzes/:quizId/questions",
        async ({ params, request }) => {
          const quizId = Number(params.quizId);
          const body = (await request.json()) as Record<string, unknown>;
          const existing = questionsByQuiz.get(quizId) ?? [];
          const nextQuestion = {
            id: questionIdSeed++,
            order_index: existing.length + 1,
            ...body,
          };

          questionsByQuiz.set(quizId, [...existing, nextQuestion]);

          return HttpResponse.json({
            success: true,
            message: "Question created",
            data: nextQuestion,
          });
        },
      ),

      http.put(
        "/api/v1/admin/centers/:centerId/quizzes/:quizId/questions/reorder",
        async ({ params, request }) => {
          const quizId = Number(params.quizId);
          const payload = (await request.json()) as { question_ids?: number[] };
          const requestedOrder = Array.isArray(payload.question_ids)
            ? payload.question_ids.map(Number)
            : [];
          const existing = questionsByQuiz.get(quizId) ?? [];
          const next = [...existing];

          requestedOrder.forEach((questionId, index) => {
            const found = next.find((question) => question.id === questionId);
            if (found) {
              found.order_index = index + 1;
            }
          });

          questionsByQuiz.set(quizId, next);

          return HttpResponse.json({
            success: true,
            message: "Questions reordered",
            data: null,
          });
        },
      ),

      http.put(
        "/api/v1/admin/centers/:centerId/quizzes/:quizId/questions/:questionId",
        async ({ params, request }) => {
          const quizId = Number(params.quizId);
          const questionId = Number(params.questionId);
          const body = (await request.json()) as Record<string, unknown>;
          const existing = questionsByQuiz.get(quizId) ?? [];
          const updated = existing.map((question) =>
            question.id === questionId ? { ...question, ...body } : question,
          );
          const question =
            updated.find((item) => item.id === questionId) ?? null;

          questionsByQuiz.set(quizId, updated);

          return HttpResponse.json({
            success: true,
            message: "Question updated",
            data: question,
          });
        },
      ),
    );
  });

  it("creates quiz, adds questions, reorders, and saves edits", async () => {
    const centerId = 3;
    const courseId = 4;

    const createQuizHook = renderHook(() => useCreateCourseQuiz(), {
      wrapper: createWrapper(),
    });

    let quizId = 0;
    await act(async () => {
      const createdQuiz = await createQuizHook.result.current.mutateAsync({
        centerId,
        courseId,
        payload: {
          title_translations: { en: "Quiz Builder Flow" },
        },
      });
      quizId = Number(createdQuiz.id);
    });

    const createQuestionHook = renderHook(() => useCreateQuizQuestion(), {
      wrapper: createWrapper(),
    });

    let firstQuestionId = 0;
    let secondQuestionId = 0;

    await act(async () => {
      const firstQuestion = await createQuestionHook.result.current.mutateAsync(
        {
          centerId,
          quizId,
          payload: {
            question_translations: { en: "First question" },
            question_type: 0,
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
          },
        },
      );
      firstQuestionId = Number(firstQuestion.id);

      const secondQuestion =
        await createQuestionHook.result.current.mutateAsync({
          centerId,
          quizId,
          payload: {
            question_translations: { en: "Second question" },
            question_type: 1,
            answers: [
              {
                answer_translations: { en: "B1" },
                is_correct: true,
                order_index: 1,
              },
              {
                answer_translations: { en: "B2" },
                is_correct: true,
                order_index: 2,
              },
            ],
          },
        });
      secondQuestionId = Number(secondQuestion.id);
    });

    const reorderHook = renderHook(() => useReorderQuizQuestions(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await reorderHook.result.current.mutateAsync({
        centerId,
        quizId,
        questionIds: [secondQuestionId, firstQuestionId],
      });
    });

    const updateHook = renderHook(() => useUpdateQuizQuestion(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await updateHook.result.current.mutateAsync({
        centerId,
        quizId,
        questionId: firstQuestionId,
        payload: {
          question_translations: { en: "First question (edited)" },
        },
      });
    });

    const questionsHook = renderHook(() => useQuizQuestions(centerId, quizId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(questionsHook.result.current.isSuccess).toBe(true);
    });

    const questions = questionsHook.result.current.data ?? [];
    expect(questions.map((item) => Number(item.id))).toEqual([
      secondQuestionId,
      firstQuestionId,
    ]);
    expect(questions[1]?.question_translations?.en).toBe(
      "First question (edited)",
    );
  });
});
