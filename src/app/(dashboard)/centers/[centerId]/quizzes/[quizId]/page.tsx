"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useModal } from "@/components/ui/modal-store";
import {
  useCreateQuizQuestion,
  useDeleteQuizQuestion,
  useQuizQuestions,
  useReorderQuizQuestions,
  useUpdateQuizQuestion,
} from "@/features/quizzes/hooks/use-quizzes";
import {
  validateQuizQuestionDraft,
  type QuizQuestionDraftAnswer,
  type QuizQuestionValidationCode,
} from "@/features/quizzes/lib/question-validation";
import type {
  CreateQuizQuestionPayload,
  QuizQuestionAnswer,
  QuizQuestion,
  QuizQuestionType,
} from "@/features/quizzes/types/quiz";
import { useTranslation } from "@/features/localization";
import { getAdminApiErrorMessage } from "@/lib/admin-response";
import { can } from "@/lib/capabilities";

type PageProps = {
  params: Promise<{ centerId: string; quizId: string }>;
};

type QuestionFormState = {
  questionEn: string;
  questionAr: string;
  questionType: QuizQuestionType;
  explanationEn: string;
  explanationAr: string;
  points: string;
  isActive: boolean;
  answers: Array<QuizQuestionDraftAnswer & { id?: number }>;
};

function defaultAnswers(): Array<QuizQuestionDraftAnswer & { id?: number }> {
  return [
    { textEn: "", textAr: "", isCorrect: true },
    { textEn: "", textAr: "", isCorrect: false },
  ];
}

function defaultFormState(): QuestionFormState {
  return {
    questionEn: "",
    questionAr: "",
    questionType: 0,
    explanationEn: "",
    explanationAr: "",
    points: "1",
    isActive: true,
    answers: defaultAnswers(),
  };
}

function toQuestionType(value: unknown): QuizQuestionType {
  const numeric = Number(value);
  return numeric === 1 ? 1 : 0;
}

function getQuestionText(question: QuizQuestion): string {
  const translations = question.question_translations ?? {};
  const en = typeof translations.en === "string" ? translations.en.trim() : "";
  if (en) return en;

  const ar = typeof translations.ar === "string" ? translations.ar.trim() : "";
  if (ar) return ar;

  const direct =
    typeof question.question === "string" ? question.question.trim() : "";
  if (direct) return direct;

  return `#${question.id}`;
}

function getExplanationText(question: QuizQuestion): string {
  const translations = question.explanation_translations ?? {};
  const en = typeof translations.en === "string" ? translations.en.trim() : "";
  if (en) return en;

  const ar = typeof translations.ar === "string" ? translations.ar.trim() : "";
  if (ar) return ar;

  const direct =
    typeof question.explanation === "string" ? question.explanation.trim() : "";
  return direct;
}

function getAnswerText(answer: QuizQuestionAnswer): string {
  const translations = answer.answer_translations;

  const en = typeof translations?.en === "string" ? translations.en.trim() : "";
  if (en) return en;

  const ar = typeof translations?.ar === "string" ? translations.ar.trim() : "";
  if (ar) return ar;

  const direct = typeof answer.answer === "string" ? answer.answer.trim() : "";
  return direct;
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

export default function QuizBuilderPage({ params }: PageProps) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { showToast } = useModal();
  const { centerId, quizId } = use(params);
  const courseId = searchParams.get("course_id");
  const queryReturnToRaw = searchParams.get("return_to") ?? "";
  const queryReturnTo = useMemo(() => {
    const normalized = queryReturnToRaw.trim();
    if (!normalized) return "";
    return normalized.startsWith(`/centers/${centerId}/`) ? normalized : "";
  }, [centerId, queryReturnToRaw]);
  const canManageQuizzes = can("manage_quizzes");
  const backHref =
    queryReturnTo ||
    (courseId
      ? `/centers/${centerId}/courses/${courseId}/quizzes`
      : `/centers/${centerId}/courses`);

  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(
    null,
  );
  const [form, setForm] = useState<QuestionFormState>(defaultFormState);
  const [formErrors, setFormErrors] = useState<QuizQuestionValidationCode[]>(
    [],
  );
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

  const {
    data: questionsData,
    isLoading: isQuestionsLoading,
    isError: isQuestionsError,
    error: questionsError,
    refetch: refetchQuestions,
  } = useQuizQuestions(centerId, quizId);

  const { mutateAsync: createQuestion, isPending: isCreatingQuestion } =
    useCreateQuizQuestion();
  const { mutateAsync: updateQuestion, isPending: isUpdatingQuestion } =
    useUpdateQuizQuestion();
  const { mutateAsync: deleteQuestion, isPending: isDeletingQuestion } =
    useDeleteQuizQuestion();
  const { mutateAsync: reorderQuestions, isPending: isReorderingQuestions } =
    useReorderQuizQuestions();

  const isSubmittingForm = isCreatingQuestion || isUpdatingQuestion;
  const isAnyActionPending =
    isSubmittingForm || isDeletingQuestion || isReorderingQuestions;

  const questions = useMemo(() => {
    const items = questionsData ?? [];
    return [...items].sort((left, right) => {
      const leftOrder = Number(left.order_index ?? 0);
      const rightOrder = Number(right.order_index ?? 0);
      if (leftOrder === rightOrder) {
        return left.id - right.id;
      }
      return leftOrder - rightOrder;
    });
  }, [questionsData]);

  const resetForm = () => {
    setEditingQuestionId(null);
    setForm(defaultFormState());
    setFormErrors([]);
    setFormErrorMessage(null);
  };

  const mapValidationCodeToMessage = (code: QuizQuestionValidationCode) => {
    switch (code) {
      case "question_required":
        return t("pages.quizBuilder.validation.questionRequired");
      case "answers_min":
        return t("pages.quizBuilder.validation.answersMin");
      case "answers_max":
        return t("pages.quizBuilder.validation.answersMax");
      case "answer_required":
        return t("pages.quizBuilder.validation.answerRequired");
      case "single_correct_exactly_one":
        return t("pages.quizBuilder.validation.singleCorrect");
      case "multiple_correct_at_least_one":
        return t("pages.quizBuilder.validation.multipleCorrect");
      default:
        return code;
    }
  };

  const handleLoadQuestionForEdit = (question: QuizQuestion) => {
    const answers =
      Array.isArray(question.answers) && question.answers.length > 0
        ? question.answers.map((answer) => ({
            id: Number(answer.id),
            textEn: getAnswerText(answer),
            textAr:
              typeof answer.answer_translations?.ar === "string"
                ? answer.answer_translations.ar
                : "",
            isCorrect: Boolean(answer.is_correct),
          }))
        : defaultAnswers();

    setEditingQuestionId(question.id);
    setForm({
      questionEn:
        typeof question.question_translations?.en === "string"
          ? question.question_translations.en
          : getQuestionText(question),
      questionAr:
        typeof question.question_translations?.ar === "string"
          ? question.question_translations.ar
          : "",
      questionType: toQuestionType(question.question_type),
      explanationEn:
        typeof question.explanation_translations?.en === "string"
          ? question.explanation_translations.en
          : getExplanationText(question),
      explanationAr:
        typeof question.explanation_translations?.ar === "string"
          ? question.explanation_translations.ar
          : "",
      points:
        question.points == null || Number.isNaN(Number(question.points))
          ? "1"
          : String(question.points),
      isActive: question.is_active !== false,
      answers,
    });
    setFormErrors([]);
    setFormErrorMessage(null);
  };

  const setAnswer = (
    index: number,
    updater: (
      _current: QuizQuestionDraftAnswer & {
        id?: number;
      },
    ) => QuizQuestionDraftAnswer & { id?: number },
  ) => {
    setForm((current) => ({
      ...current,
      answers: current.answers.map((answer, answerIndex) =>
        answerIndex === index ? updater(answer) : answer,
      ),
    }));
  };

  const addAnswer = () => {
    setForm((current) => {
      if (current.answers.length >= 10) {
        return current;
      }
      return {
        ...current,
        answers: [
          ...current.answers,
          { textEn: "", textAr: "", isCorrect: false },
        ],
      };
    });
  };

  const removeAnswer = (index: number) => {
    setForm((current) => {
      if (current.answers.length <= 2) return current;
      return {
        ...current,
        answers: current.answers.filter(
          (_, answerIndex) => answerIndex !== index,
        ),
      };
    });
  };

  const buildPayload = (): CreateQuizQuestionPayload => {
    const answers = form.answers
      .filter((answer) => answer.textEn.trim().length > 0)
      .map((answer, index) => ({
        id: answer.id,
        answer_translations: {
          en: answer.textEn.trim(),
          ar: answer.textAr?.trim() || undefined,
        },
        is_correct: answer.isCorrect,
        order_index: index + 1,
      }));

    return {
      question_translations: {
        en: form.questionEn.trim(),
        ar: form.questionAr.trim() || undefined,
      },
      question_type: form.questionType,
      explanation_translations:
        form.explanationEn.trim() || form.explanationAr.trim()
          ? {
              en: form.explanationEn.trim() || undefined,
              ar: form.explanationAr.trim() || undefined,
            }
          : undefined,
      points: parseOptionalNumber(form.points),
      is_active: form.isActive,
      answers,
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormErrorMessage(null);

    const validationErrors = validateQuizQuestionDraft({
      questionEn: form.questionEn,
      questionType: form.questionType,
      answers: form.answers,
    });

    if (validationErrors.length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setFormErrors([]);

    const payload = buildPayload();

    try {
      if (editingQuestionId) {
        await updateQuestion({
          centerId,
          quizId,
          questionId: editingQuestionId,
          payload,
        });
        showToast(t("pages.quizBuilder.toasts.updated"), "success");
      } else {
        await createQuestion({
          centerId,
          quizId,
          payload,
        });
        showToast(t("pages.quizBuilder.toasts.created"), "success");
      }

      resetForm();
      await refetchQuestions();
    } catch (error) {
      setFormErrorMessage(
        getAdminApiErrorMessage(
          error,
          t("pages.quizBuilder.errors.saveFailed"),
        ),
      );
    }
  };

  const handleDelete = async (questionId: number) => {
    const confirmed = window.confirm(
      t("pages.quizBuilder.confirm.deleteQuestion"),
    );
    if (!confirmed) return;

    try {
      await deleteQuestion({
        centerId,
        quizId,
        questionId,
      });
      showToast(t("pages.quizBuilder.toasts.deleted"), "success");

      if (editingQuestionId === questionId) {
        resetForm();
      }

      await refetchQuestions();
    } catch (error) {
      showToast(
        getAdminApiErrorMessage(
          error,
          t("pages.quizBuilder.errors.deleteFailed"),
        ),
        "error",
      );
    }
  };

  const handleMoveQuestion = async (questionId: number, direction: -1 | 1) => {
    const currentIds = questions.map((question) => Number(question.id));
    const currentIndex = currentIds.findIndex((id) => id === questionId);
    if (currentIndex < 0) return;

    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= currentIds.length) return;

    const nextIds = [...currentIds];
    [nextIds[currentIndex], nextIds[nextIndex]] = [
      nextIds[nextIndex],
      nextIds[currentIndex],
    ];

    try {
      await reorderQuestions({
        centerId,
        quizId,
        questionIds: nextIds,
      });
      showToast(t("pages.quizBuilder.toasts.reordered"), "success");
      await refetchQuestions();
    } catch (error) {
      showToast(
        getAdminApiErrorMessage(
          error,
          t("pages.quizBuilder.errors.reorderFailed"),
        ),
        "error",
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.quizBuilder.title", { id: quizId })}
        description={t("pages.quizBuilder.description")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href={backHref}>
              <Button variant="outline">
                {t("pages.quizBuilder.backToQuizzes")}
              </Button>
            </Link>
          </div>
        }
      />

      {!canManageQuizzes ? (
        <Alert>
          <AlertTitle>
            {t("pages.courseQuizzes.permission.readOnlyTitle")}
          </AlertTitle>
          <AlertDescription>
            {t("pages.courseQuizzes.permission.readOnlyDescription")}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>
              {editingQuestionId
                ? t("pages.quizBuilder.form.editTitle")
                : t("pages.quizBuilder.form.createTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="question-en">
                    {t("pages.quizBuilder.form.fields.questionEn")}
                  </Label>
                  <Input
                    id="question-en"
                    value={form.questionEn}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        questionEn: event.target.value,
                      }))
                    }
                    disabled={!canManageQuizzes || isAnyActionPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="question-ar">
                    {t("pages.quizBuilder.form.fields.questionAr")}
                  </Label>
                  <Input
                    id="question-ar"
                    value={form.questionAr}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        questionAr: event.target.value,
                      }))
                    }
                    disabled={!canManageQuizzes || isAnyActionPending}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="question-type">
                    {t("pages.quizBuilder.form.fields.questionType")}
                  </Label>
                  <Select
                    value={String(form.questionType)}
                    onValueChange={(value) => {
                      const nextType = toQuestionType(value);
                      setForm((current) => ({
                        ...current,
                        questionType: nextType,
                        answers:
                          nextType === 0
                            ? current.answers.map((answer, index) => ({
                                ...answer,
                                isCorrect: index === 0,
                              }))
                            : current.answers,
                      }));
                    }}
                    disabled={!canManageQuizzes || isAnyActionPending}
                  >
                    <SelectTrigger id="question-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">
                        {t("pages.quizBuilder.form.questionTypes.single")}
                      </SelectItem>
                      <SelectItem value="1">
                        {t("pages.quizBuilder.form.questionTypes.multiple")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="question-points">
                    {t("pages.quizBuilder.form.fields.points")}
                  </Label>
                  <Input
                    id="question-points"
                    type="number"
                    min={0}
                    step="0.5"
                    value={form.points}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        points: event.target.value,
                      }))
                    }
                    disabled={!canManageQuizzes || isAnyActionPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="question-active">
                    {t("pages.quizBuilder.form.fields.isActive")}
                  </Label>
                  <Select
                    value={form.isActive ? "true" : "false"}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        isActive: value === "true",
                      }))
                    }
                    disabled={!canManageQuizzes || isAnyActionPending}
                  >
                    <SelectTrigger id="question-active">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">
                        {t("common.labels.yes")}
                      </SelectItem>
                      <SelectItem value="false">
                        {t("common.labels.no")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="explanation-en">
                    {t("pages.quizBuilder.form.fields.explanationEn")}
                  </Label>
                  <Textarea
                    id="explanation-en"
                    rows={3}
                    value={form.explanationEn}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        explanationEn: event.target.value,
                      }))
                    }
                    disabled={!canManageQuizzes || isAnyActionPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="explanation-ar">
                    {t("pages.quizBuilder.form.fields.explanationAr")}
                  </Label>
                  <Textarea
                    id="explanation-ar"
                    rows={3}
                    value={form.explanationAr}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        explanationAr: event.target.value,
                      }))
                    }
                    disabled={!canManageQuizzes || isAnyActionPending}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t("pages.quizBuilder.form.answersTitle")}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAnswer}
                    disabled={
                      !canManageQuizzes ||
                      isAnyActionPending ||
                      form.answers.length >= 10
                    }
                  >
                    {t("pages.quizBuilder.form.actions.addAnswer")}
                  </Button>
                </div>

                <div className="space-y-3">
                  {form.answers.map((answer, index) => (
                    <div
                      key={`answer-${index}`}
                      className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                    >
                      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
                        <Input
                          value={answer.textEn}
                          onChange={(event) =>
                            setAnswer(index, (current) => ({
                              ...current,
                              textEn: event.target.value,
                            }))
                          }
                          placeholder={t(
                            "pages.quizBuilder.form.fields.answerEn",
                          )}
                          disabled={!canManageQuizzes || isAnyActionPending}
                        />
                        <Input
                          value={answer.textAr ?? ""}
                          onChange={(event) =>
                            setAnswer(index, (current) => ({
                              ...current,
                              textAr: event.target.value,
                            }))
                          }
                          placeholder={t(
                            "pages.quizBuilder.form.fields.answerAr",
                          )}
                          disabled={!canManageQuizzes || isAnyActionPending}
                        />
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <input
                            type={
                              form.questionType === 0 ? "radio" : "checkbox"
                            }
                            name={`answer-correct-${form.questionType}`}
                            checked={answer.isCorrect}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              setForm((current) => ({
                                ...current,
                                answers: current.answers.map(
                                  (item, answerIndex) => {
                                    if (form.questionType === 0) {
                                      return {
                                        ...item,
                                        isCorrect:
                                          answerIndex === index
                                            ? checked
                                            : false,
                                      };
                                    }

                                    if (answerIndex !== index) return item;
                                    return {
                                      ...item,
                                      isCorrect: checked,
                                    };
                                  },
                                ),
                              }));
                            }}
                            disabled={!canManageQuizzes || isAnyActionPending}
                          />
                          <span>
                            {t("pages.quizBuilder.form.fields.correct")}
                          </span>
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAnswer(index)}
                          disabled={
                            !canManageQuizzes ||
                            isAnyActionPending ||
                            form.answers.length <= 2
                          }
                        >
                          {t("common.actions.remove")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {formErrors.length > 0 ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    <ul className="list-disc space-y-1 ps-4">
                      {formErrors.map((errorCode) => (
                        <li key={errorCode}>
                          {mapValidationCodeToMessage(errorCode)}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}

              {formErrorMessage ? (
                <Alert variant="destructive">
                  <AlertDescription>{formErrorMessage}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="submit"
                  disabled={!canManageQuizzes || isAnyActionPending}
                >
                  {isSubmittingForm
                    ? t("common.actions.saving")
                    : editingQuestionId
                      ? t("pages.quizBuilder.form.actions.update")
                      : t("pages.quizBuilder.form.actions.create")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isAnyActionPending}
                >
                  {t("pages.quizBuilder.form.actions.reset")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("pages.quizBuilder.list.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isQuestionsError ? (
              <Alert variant="destructive">
                <AlertTitle>{t("common.messages.loadFailed")}</AlertTitle>
                <AlertDescription>
                  {getAdminApiErrorMessage(
                    questionsError,
                    t("pages.quizBuilder.errors.loadFailed"),
                  )}
                </AlertDescription>
              </Alert>
            ) : null}

            {isQuestionsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 w-full" />
                ))}
              </div>
            ) : questions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("pages.quizBuilder.list.empty")}
              </p>
            ) : (
              questions.map((question, index) => {
                const questionType = toQuestionType(question.question_type);
                const answers = Array.isArray(question.answers)
                  ? question.answers
                  : [];

                return (
                  <div
                    key={question.id}
                    className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">
                          {t("pages.quizBuilder.list.questionNumber", {
                            number: index + 1,
                          })}
                        </Badge>
                        <Badge
                          variant={questionType === 0 ? "info" : "secondary"}
                        >
                          {questionType === 0
                            ? t("pages.quizBuilder.form.questionTypes.single")
                            : t(
                                "pages.quizBuilder.form.questionTypes.multiple",
                              )}
                        </Badge>
                        {question.points != null ? (
                          <Badge variant="outline">
                            {t("pages.quizBuilder.list.points", {
                              points: question.points,
                            })}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveQuestion(question.id, -1)}
                          disabled={
                            !canManageQuizzes ||
                            isAnyActionPending ||
                            index === 0
                          }
                        >
                          {t("pages.quizBuilder.list.actions.moveUp")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveQuestion(question.id, 1)}
                          disabled={
                            !canManageQuizzes ||
                            isAnyActionPending ||
                            index === questions.length - 1
                          }
                        >
                          {t("pages.quizBuilder.list.actions.moveDown")}
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {getQuestionText(question)}
                    </p>

                    {answers.length > 0 ? (
                      <div className="space-y-1 text-xs">
                        {answers.map((answer, answerIndex) => (
                          <div
                            key={`${question.id}-answer-${answer.id ?? answerIndex}`}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-300"
                          >
                            <span>•</span>
                            <span>{getAnswerText(answer)}</span>
                            {answer.is_correct ? (
                              <Badge variant="success">
                                {t("pages.quizBuilder.list.correct")}
                              </Badge>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadQuestionForEdit(question)}
                        disabled={!canManageQuizzes || isAnyActionPending}
                      >
                        {t("common.actions.edit")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(question.id)}
                        disabled={!canManageQuizzes || isAnyActionPending}
                      >
                        {t("common.actions.delete")}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
