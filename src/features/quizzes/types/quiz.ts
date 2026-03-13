export type QuizAttemptScorePolicy = 0 | 1 | 2;

export type QuizAttachableType = "video" | "pdf" | "section" | "course";
export type QuizQuestionType = 0 | 1;

export type Quiz = {
  id: number;
  center_id?: number;
  course_id?: number;
  title?: string | null;
  title_translations?: Record<string, string> | null;
  description?: string | null;
  description_translations?: Record<string, string> | null;
  attachable_type?: QuizAttachableType | null;
  attachable_id?: number | null;
  passing_score?: number | null;
  max_attempts?: number | null;
  attempt_score_policy?: QuizAttemptScorePolicy | null;
  time_limit_minutes?: number | null;
  is_active?: boolean;
  is_required?: boolean;
  questions_count?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type ListCourseQuizzesParams = {
  centerId: string | number;
  courseId: string | number;
  page: number;
  per_page: number;
  active_only?: boolean;
};

export type CourseQuizzesResponse = {
  items: Quiz[];
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
};

export type CreateCourseQuizPayload = {
  title_translations: {
    en: string;
    ar?: string;
  };
  description_translations?: {
    en?: string;
    ar?: string;
  };
  attachable_type?: QuizAttachableType;
  attachable_id?: number;
  passing_score?: number;
  max_attempts?: number;
  attempt_score_policy?: QuizAttemptScorePolicy;
  time_limit_minutes?: number;
  is_active?: boolean;
  is_required?: boolean;
};

export type QuizQuestionAnswer = {
  id?: number;
  answer?: string | null;
  answer_translations?: Record<string, string> | null;
  is_correct?: boolean;
  order_index?: number | null;
  [key: string]: unknown;
};

export type QuizQuestion = {
  id: number;
  quiz_id?: number;
  question?: string | null;
  question_translations?: Record<string, string> | null;
  question_type?: QuizQuestionType | number | null;
  explanation?: string | null;
  explanation_translations?: Record<string, string> | null;
  points?: number | null;
  order_index?: number | null;
  is_active?: boolean;
  answers?: QuizQuestionAnswer[] | null;
  [key: string]: unknown;
};

export type QuizQuestionAnswerPayload = {
  id?: number;
  answer_translations: {
    en: string;
    ar?: string;
  };
  is_correct: boolean;
  order_index: number;
};

export type CreateQuizQuestionPayload = {
  question_translations: {
    en: string;
    ar?: string;
  };
  question_type: QuizQuestionType;
  explanation_translations?: {
    en?: string;
    ar?: string;
  };
  points?: number;
  is_active?: boolean;
  answers: QuizQuestionAnswerPayload[];
};

export type UpdateQuizQuestionPayload = Partial<
  Omit<CreateQuizQuestionPayload, "question_type" | "answers">
> & {
  question_type?: QuizQuestionType;
  answers?: QuizQuestionAnswerPayload[];
};
