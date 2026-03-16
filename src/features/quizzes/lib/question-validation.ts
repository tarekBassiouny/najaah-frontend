import type { QuizQuestionType } from "@/features/quizzes/types/quiz";

export type QuizQuestionValidationCode =
  | "question_required"
  | "answers_min"
  | "answers_max"
  | "answer_required"
  | "single_correct_exactly_one"
  | "multiple_correct_at_least_one";

export type QuizQuestionDraftAnswer = {
  textEn: string;
  textAr?: string;
  isCorrect: boolean;
};

export type QuizQuestionDraft = {
  questionEn: string;
  questionType: QuizQuestionType;
  answers: QuizQuestionDraftAnswer[];
};

export function validateQuizQuestionDraft(
  draft: QuizQuestionDraft,
): QuizQuestionValidationCode[] {
  const errors: QuizQuestionValidationCode[] = [];

  if (!draft.questionEn.trim()) {
    errors.push("question_required");
  }

  const cleanedAnswers = draft.answers.filter(
    (answer) => answer.textEn.trim().length > 0,
  );

  if (cleanedAnswers.length < 2) {
    errors.push("answers_min");
  }

  if (cleanedAnswers.length > 10) {
    errors.push("answers_max");
  }

  if (draft.answers.some((answer) => !answer.textEn.trim())) {
    errors.push("answer_required");
  }

  const correctCount = cleanedAnswers.filter(
    (answer) => answer.isCorrect,
  ).length;
  if (draft.questionType === 0 && correctCount !== 1) {
    errors.push("single_correct_exactly_one");
  }

  if (draft.questionType === 1 && correctCount < 1) {
    errors.push("multiple_correct_at_least_one");
  }

  return Array.from(new Set(errors));
}
