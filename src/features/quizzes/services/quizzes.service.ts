import { http } from "@/lib/http";
import { normalizeAdminActionResult } from "@/lib/admin-response";
import type {
  CourseQuizzesResponse,
  CreateQuizQuestionPayload,
  CreateCourseQuizPayload,
  ListCourseQuizzesParams,
  QuizQuestion,
  UpdateQuizQuestionPayload,
  Quiz,
} from "@/features/quizzes/types/quiz";

type RawResponse<T = unknown> = {
  data?: T;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildCourseQuizzesPath(
  centerId: string | number,
  courseId: string | number,
) {
  return `/api/v1/admin/centers/${centerId}/courses/${courseId}/quizzes`;
}

function buildQuizItemPath(centerId: string | number, quizId: string | number) {
  return `/api/v1/admin/centers/${centerId}/quizzes/${quizId}`;
}

function buildQuizQuestionsPath(
  centerId: string | number,
  quizId: string | number,
) {
  return `/api/v1/admin/centers/${centerId}/quizzes/${quizId}/questions`;
}

function normalizeCourseQuizzesResponse(
  payload: unknown,
  fallback: ListCourseQuizzesParams,
): CourseQuizzesResponse {
  const record = asRecord(payload);
  const dataNode = Object.prototype.hasOwnProperty.call(record, "data")
    ? record.data
    : payload;

  const normalizedDataNode = asRecord(dataNode);
  const items = asArray<Quiz>(
    Array.isArray(dataNode) ? dataNode : (normalizedDataNode.data ?? dataNode),
  );

  const meta = asRecord(record.meta ?? normalizedDataNode.meta);
  const page =
    toNumber(
      meta.page ?? meta.current_page ?? normalizedDataNode.page,
      fallback.page,
    ) || fallback.page;
  const perPage =
    toNumber(meta.per_page ?? normalizedDataNode.per_page, fallback.per_page) ||
    fallback.per_page;
  const total = toNumber(meta.total ?? normalizedDataNode.total, items.length);
  const lastPage =
    toNumber(
      meta.last_page ??
        normalizedDataNode.last_page ??
        Math.max(1, Math.ceil(total / Math.max(perPage, 1))),
      1,
    ) || 1;

  return {
    items,
    page,
    perPage,
    total,
    lastPage,
  };
}

export async function listCourseQuizzes(
  params: ListCourseQuizzesParams,
): Promise<CourseQuizzesResponse> {
  const { data } = await http.get<RawResponse>(
    buildCourseQuizzesPath(params.centerId, params.courseId),
    {
      params: {
        page: params.page,
        per_page: params.per_page,
        active_only: params.active_only,
      },
    },
  );

  return normalizeCourseQuizzesResponse(data, params);
}

export async function createCourseQuiz(
  centerId: string | number,
  courseId: string | number,
  payload: CreateCourseQuizPayload,
): Promise<Quiz> {
  const { data } = await http.post<RawResponse<Quiz>>(
    buildCourseQuizzesPath(centerId, courseId),
    payload,
  );

  const record = asRecord(data);
  return (record.data ?? data) as Quiz;
}

export async function deleteCenterQuiz(
  centerId: string | number,
  quizId: string | number,
) {
  const { data } = await http.delete(buildQuizItemPath(centerId, quizId));
  return normalizeAdminActionResult(data);
}

function normalizeQuizQuestionsResponse(payload: unknown): QuizQuestion[] {
  const record = asRecord(payload);
  const dataNode = Object.prototype.hasOwnProperty.call(record, "data")
    ? record.data
    : payload;

  const normalizedDataNode = asRecord(dataNode);
  const items = asArray<QuizQuestion>(
    Array.isArray(dataNode) ? dataNode : (normalizedDataNode.data ?? dataNode),
  );

  return items;
}

export async function listQuizQuestions(
  centerId: string | number,
  quizId: string | number,
): Promise<QuizQuestion[]> {
  const { data } = await http.get<RawResponse>(
    buildQuizQuestionsPath(centerId, quizId),
  );

  return normalizeQuizQuestionsResponse(data);
}

export async function createQuizQuestion(
  centerId: string | number,
  quizId: string | number,
  payload: CreateQuizQuestionPayload,
): Promise<QuizQuestion> {
  const { data } = await http.post<RawResponse<QuizQuestion>>(
    buildQuizQuestionsPath(centerId, quizId),
    payload,
  );

  const record = asRecord(data);
  return (record.data ?? data) as QuizQuestion;
}

export async function updateQuizQuestion(
  centerId: string | number,
  quizId: string | number,
  questionId: string | number,
  payload: UpdateQuizQuestionPayload,
): Promise<QuizQuestion> {
  const { data } = await http.put<RawResponse<QuizQuestion>>(
    `${buildQuizQuestionsPath(centerId, quizId)}/${questionId}`,
    payload,
  );

  const record = asRecord(data);
  return (record.data ?? data) as QuizQuestion;
}

export async function deleteQuizQuestion(
  centerId: string | number,
  quizId: string | number,
  questionId: string | number,
) {
  const { data } = await http.delete(
    `${buildQuizQuestionsPath(centerId, quizId)}/${questionId}`,
  );
  return normalizeAdminActionResult(data);
}

export async function reorderQuizQuestions(
  centerId: string | number,
  quizId: string | number,
  questionIds: number[],
) {
  const { data } = await http.put(
    `${buildQuizQuestionsPath(centerId, quizId)}/reorder`,
    {
      question_ids: questionIds,
    },
  );

  return normalizeAdminActionResult(data);
}
