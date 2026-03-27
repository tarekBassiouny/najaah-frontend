"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { AIContentTargetType } from "@/features/ai/types/ai";
import { useTranslation } from "@/features/localization";
import type { ReviewLocale } from "@/features/ai/lib/review-payload";
import type { AIContentLanguage } from "@/features/ai/types/ai";

type ReviewEditPanelProps = {
  targetType: AIContentTargetType;
  jobLanguage: AIContentLanguage;
  activeLocale: ReviewLocale;
  onActiveLocaleChange: (_value: ReviewLocale) => void;
  isAnyJobActionPending: boolean;
  summaryTitle: string;
  summaryContent: string;
  quizTitle: string;
  quizDescription: string;
  quizQuestionsCount: number;
  assignmentTitle: string;
  assignmentDescription: string;
  assignmentMaxPoints: number | null;
  assignmentPassingScore: number | null;
  assignmentSubmissionTypes: string;
  flashcardsTitle: string;
  flashcardsCount: number;
  interactiveTitle: string;
  interactiveInstructions: string;
  interactiveStepsCount: number;
  reviewJson: string;
  reviewJsonError: string | null;
  onUpdatePayloadStringField: (_paths: string[][], _value: string) => void;
  onUpdatePayloadNumberField: (_paths: string[][], _value: string) => void;
  onUpdatePayloadNumberArrayField: (_paths: string[][], _value: string) => void;
  onReviewJsonChange: (_value: string) => void;
};

export function ReviewEditPanel({
  targetType,
  jobLanguage,
  activeLocale,
  onActiveLocaleChange,
  isAnyJobActionPending,
  summaryTitle,
  summaryContent,
  quizTitle,
  quizDescription,
  quizQuestionsCount,
  assignmentTitle,
  assignmentDescription,
  assignmentMaxPoints,
  assignmentPassingScore,
  assignmentSubmissionTypes,
  flashcardsTitle,
  flashcardsCount,
  interactiveTitle,
  interactiveInstructions,
  interactiveStepsCount,
  reviewJson,
  reviewJsonError,
  onUpdatePayloadStringField,
  onUpdatePayloadNumberField,
  onUpdatePayloadNumberArrayField,
  onReviewJsonChange,
}: ReviewEditPanelProps) {
  const { t } = useTranslation();
  const [showJsonEditor, setShowJsonEditor] = useState(false);

  return (
    <div className="space-y-4">
      {jobLanguage === "both" ? (
        <Tabs
          value={activeLocale}
          onValueChange={(value) => onActiveLocaleChange(value as ReviewLocale)}
        >
          <TabsList className="inline-flex rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900">
            <TabsTrigger value="ar" className="w-auto">
              {t("pages.centerAIContent.workspace.review.locales.ar")}
            </TabsTrigger>
            <TabsTrigger value="en" className="w-auto">
              {t("pages.centerAIContent.workspace.review.locales.en")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      ) : null}

      {targetType === "summary" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="review-summary-title">
              {t("pages.centerAIContent.workspace.review.summary.title")}
            </Label>
            <Input
              id="review-summary-title"
              value={summaryTitle}
              onChange={(event) =>
                onUpdatePayloadStringField(
                  [["title_translations"], ["title"]],
                  event.target.value,
                )
              }
              disabled={isAnyJobActionPending}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="review-summary-content">
              {t("pages.centerAIContent.workspace.review.summary.content")}
            </Label>
            <Textarea
              id="review-summary-content"
              rows={6}
              value={summaryContent}
              onChange={(event) =>
                onUpdatePayloadStringField(
                  [["content_translations"], ["content"]],
                  event.target.value,
                )
              }
              disabled={isAnyJobActionPending}
            />
          </div>
        </div>
      ) : null}

      {targetType === "quiz" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="review-quiz-title">
              {t("pages.centerAIContent.workspace.review.quiz.title")}
            </Label>
            <Input
              id="review-quiz-title"
              value={quizTitle}
              onChange={(event) =>
                onUpdatePayloadStringField(
                  [["title_translations"], ["title"]],
                  event.target.value,
                )
              }
              disabled={isAnyJobActionPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-quiz-questions-count">
              {t("pages.centerAIContent.workspace.review.quiz.questions")}
            </Label>
            <Input
              id="review-quiz-questions-count"
              value={String(quizQuestionsCount)}
              disabled
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="review-quiz-description">
              {t("pages.centerAIContent.workspace.review.quiz.description")}
            </Label>
            <Textarea
              id="review-quiz-description"
              rows={5}
              value={quizDescription}
              onChange={(event) =>
                onUpdatePayloadStringField(
                  [["description_translations"], ["description"]],
                  event.target.value,
                )
              }
              disabled={isAnyJobActionPending}
            />
          </div>
        </div>
      ) : null}

      {targetType === "assignment" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="review-assignment-title">
              {t("pages.centerAIContent.workspace.review.assignment.title")}
            </Label>
            <Input
              id="review-assignment-title"
              value={assignmentTitle}
              onChange={(event) =>
                onUpdatePayloadStringField(
                  [["title_translations"], ["title"]],
                  event.target.value,
                )
              }
              disabled={isAnyJobActionPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-assignment-max-points">
              {t("pages.centerAIContent.workspace.review.assignment.maxPoints")}
            </Label>
            <Input
              id="review-assignment-max-points"
              type="number"
              value={
                assignmentMaxPoints == null ? "" : String(assignmentMaxPoints)
              }
              onChange={(event) =>
                onUpdatePayloadNumberField([["max_points"]], event.target.value)
              }
              disabled={isAnyJobActionPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-assignment-passing-score">
              {t(
                "pages.centerAIContent.workspace.review.assignment.passingScore",
              )}
            </Label>
            <Input
              id="review-assignment-passing-score"
              type="number"
              value={
                assignmentPassingScore == null
                  ? ""
                  : String(assignmentPassingScore)
              }
              onChange={(event) =>
                onUpdatePayloadNumberField(
                  [["passing_score"]],
                  event.target.value,
                )
              }
              disabled={isAnyJobActionPending}
            />
          </div>
          <div className="space-y-2 lg:col-span-4">
            <Label htmlFor="review-assignment-description">
              {t(
                "pages.centerAIContent.workspace.review.assignment.description",
              )}
            </Label>
            <Textarea
              id="review-assignment-description"
              rows={5}
              value={assignmentDescription}
              onChange={(event) =>
                onUpdatePayloadStringField(
                  [["description_translations"], ["description"]],
                  event.target.value,
                )
              }
              disabled={isAnyJobActionPending}
            />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="review-assignment-submission-types">
              {t(
                "pages.centerAIContent.workspace.review.assignment.submissionTypes",
              )}
            </Label>
            <Input
              id="review-assignment-submission-types"
              value={assignmentSubmissionTypes}
              onChange={(event) =>
                onUpdatePayloadNumberArrayField(
                  [["submission_types"]],
                  event.target.value,
                )
              }
              placeholder="0,1,2"
              disabled={isAnyJobActionPending}
            />
          </div>
        </div>
      ) : null}

      {targetType === "flashcards" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="review-flashcards-title">
              {t("pages.centerAIContent.workspace.review.flashcards.title")}
            </Label>
            <Input
              id="review-flashcards-title"
              value={flashcardsTitle}
              onChange={(event) =>
                onUpdatePayloadStringField(
                  [["title_translations"], ["title"]],
                  event.target.value,
                )
              }
              disabled={isAnyJobActionPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-flashcards-count">
              {t("pages.centerAIContent.workspace.review.flashcards.cards")}
            </Label>
            <Input
              id="review-flashcards-count"
              value={String(flashcardsCount)}
              disabled
            />
          </div>
        </div>
      ) : null}

      {targetType === "interactive_activity" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="review-interactive-title">
              {t("pages.centerAIContent.workspace.review.interactive.title")}
            </Label>
            <Input
              id="review-interactive-title"
              value={interactiveTitle}
              onChange={(event) =>
                onUpdatePayloadStringField(
                  [["title_translations"], ["title"]],
                  event.target.value,
                )
              }
              disabled={isAnyJobActionPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-interactive-steps-count">
              {t("pages.centerAIContent.workspace.review.interactive.steps")}
            </Label>
            <Input
              id="review-interactive-steps-count"
              value={String(interactiveStepsCount)}
              disabled
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="review-interactive-instructions">
              {t(
                "pages.centerAIContent.workspace.review.interactive.instructions",
              )}
            </Label>
            <Textarea
              id="review-interactive-instructions"
              rows={4}
              value={interactiveInstructions}
              onChange={(event) =>
                onUpdatePayloadStringField(
                  [["instructions_translations"], ["instructions"]],
                  event.target.value,
                )
              }
              disabled={isAnyJobActionPending}
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowJsonEditor(!showJsonEditor)}
        >
          {showJsonEditor
            ? t("pages.courseAssets.review.hideJson")
            : t("pages.courseAssets.review.showJson")}
        </Button>

        {showJsonEditor ? (
          <div className="space-y-2">
            <Label htmlFor="review-json-editor">
              {t("pages.centerAIContent.workspace.details.reviewJson")}
            </Label>
            <Textarea
              id="review-json-editor"
              rows={10}
              value={reviewJson}
              onChange={(event) => onReviewJsonChange(event.target.value)}
              className="font-mono text-xs"
              disabled={isAnyJobActionPending}
            />
            {reviewJsonError ? (
              <p className="text-sm text-red-600 dark:text-red-400">
                {reviewJsonError}
              </p>
            ) : null}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("pages.centerAIContent.workspace.details.reviewHint")}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
