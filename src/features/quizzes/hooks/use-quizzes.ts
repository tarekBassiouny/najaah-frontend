import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  createQuizQuestion,
  createCourseQuiz,
  deleteQuizQuestion,
  deleteCenterQuiz,
  listCourseQuizzes,
  listQuizQuestions,
  reorderQuizQuestions,
  updateQuizQuestion,
} from "@/features/quizzes/services/quizzes.service";
import type {
  CourseQuizzesResponse,
  CreateQuizQuestionPayload,
  CreateCourseQuizPayload,
  ListCourseQuizzesParams,
  QuizQuestion,
  UpdateQuizQuestionPayload,
} from "@/features/quizzes/types/quiz";

type UseCourseQuizzesOptions = Omit<
  UseQueryOptions<CourseQuizzesResponse>,
  "queryKey" | "queryFn"
>;

export function useCourseQuizzes(
  params: ListCourseQuizzesParams,
  options?: UseCourseQuizzesOptions,
) {
  return useQuery({
    queryKey: ["course-quizzes", params],
    queryFn: () => listCourseQuizzes(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useCreateCourseQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      payload,
    }: {
      centerId: string | number;
      courseId: string | number;
      payload: CreateCourseQuizPayload;
    }) => createCourseQuiz(centerId, courseId, payload),
    onSuccess: (_, { centerId, courseId }) => {
      queryClient.invalidateQueries({
        queryKey: ["course-quizzes", { centerId, courseId }],
      });
      queryClient.invalidateQueries({ queryKey: ["course-quizzes"] });
      queryClient.invalidateQueries({
        queryKey: ["center-course", centerId, courseId],
      });
    },
  });
}

export function useDeleteCenterQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      quizId,
    }: {
      centerId: string | number;
      quizId: string | number;
    }) => deleteCenterQuiz(centerId, quizId),
    onSuccess: (_, { centerId }) => {
      queryClient.invalidateQueries({
        queryKey: ["course-quizzes"],
      });
      queryClient.invalidateQueries({
        queryKey: ["center-course", centerId],
      });
    },
  });
}

type UseQuizQuestionsOptions = Omit<
  UseQueryOptions<QuizQuestion[]>,
  "queryKey" | "queryFn"
>;

export function useQuizQuestions(
  centerId: string | number | undefined,
  quizId: string | number | undefined,
  options?: UseQuizQuestionsOptions,
) {
  return useQuery({
    queryKey: ["quiz-questions", centerId, quizId],
    queryFn: () => listQuizQuestions(centerId!, quizId!),
    enabled: !!centerId && !!quizId,
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useCreateQuizQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      quizId,
      payload,
    }: {
      centerId: string | number;
      quizId: string | number;
      payload: CreateQuizQuestionPayload;
    }) => createQuizQuestion(centerId, quizId, payload),
    onSuccess: (_, { centerId, quizId }) => {
      queryClient.invalidateQueries({
        queryKey: ["quiz-questions", centerId, quizId],
      });
    },
  });
}

export function useUpdateQuizQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      quizId,
      questionId,
      payload,
    }: {
      centerId: string | number;
      quizId: string | number;
      questionId: string | number;
      payload: UpdateQuizQuestionPayload;
    }) => updateQuizQuestion(centerId, quizId, questionId, payload),
    onSuccess: (_, { centerId, quizId }) => {
      queryClient.invalidateQueries({
        queryKey: ["quiz-questions", centerId, quizId],
      });
    },
  });
}

export function useDeleteQuizQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      quizId,
      questionId,
    }: {
      centerId: string | number;
      quizId: string | number;
      questionId: string | number;
    }) => deleteQuizQuestion(centerId, quizId, questionId),
    onSuccess: (_, { centerId, quizId }) => {
      queryClient.invalidateQueries({
        queryKey: ["quiz-questions", centerId, quizId],
      });
    },
  });
}

export function useReorderQuizQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      quizId,
      questionIds,
    }: {
      centerId: string | number;
      quizId: string | number;
      questionIds: number[];
    }) => reorderQuizQuestions(centerId, quizId, questionIds),
    onSuccess: (_, { centerId, quizId }) => {
      queryClient.invalidateQueries({
        queryKey: ["quiz-questions", centerId, quizId],
      });
    },
  });
}
