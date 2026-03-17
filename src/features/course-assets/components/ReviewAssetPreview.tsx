"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { EditablePayload } from "@/features/ai/lib/review-payload";
import {
  readArrayFromPaths,
  readStringFromPaths,
} from "@/features/ai/lib/review-payload";
import type { AIContentTargetType } from "@/features/ai/types/ai";
import { useTranslation } from "@/features/localization";

type ReviewAssetPreviewProps = {
  targetType: AIContentTargetType;
  payload: EditablePayload;
};

export function ReviewAssetPreview({
  targetType,
  payload,
}: ReviewAssetPreviewProps) {
  switch (targetType) {
    case "summary":
      return <SummaryPreviewPanel payload={payload} />;
    case "quiz":
      return <QuizPreviewPanel payload={payload} />;
    case "flashcards":
      return <FlashcardsPreviewPanel payload={payload} />;
    case "assignment":
      return <AssignmentPreviewPanel payload={payload} />;
    default:
      return null;
  }
}

function SummaryPreviewPanel({ payload }: { payload: EditablePayload }) {
  const { t } = useTranslation();
  const title = readStringFromPaths(payload, [
    ["title"],
    ["title_translations", "en"],
  ]);
  const content = readStringFromPaths(payload, [
    ["content"],
    ["content_translations", "en"],
  ]);

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {t("pages.courseAssets.slotTypes.summary")}
      </p>
      {title ? (
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      ) : null}
      {content ? (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            {content}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {t("pages.courseAssets.review.noContent")}
        </p>
      )}
    </div>
  );
}

function QuizPreviewPanel({ payload }: { payload: EditablePayload }) {
  const { t } = useTranslation();
  const title = readStringFromPaths(payload, [
    ["title"],
    ["title_translations", "en"],
  ]);
  const questions = readArrayFromPaths(payload, [["questions"]]) as Array<
    Record<string, unknown>
  >;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t("pages.courseAssets.slotTypes.quiz")}
        </p>
        <Badge variant="outline">
          {questions.length} {t("pages.courseAssets.review.questions")}
        </Badge>
      </div>
      {title ? (
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      ) : null}
      <div className="max-h-96 space-y-2 overflow-auto">
        {questions.map((question, index) => {
          const questionText =
            (question.question as string) ||
            (question.text as string) ||
            (question.title as string) ||
            "";
          const options = Array.isArray(question.options)
            ? (question.options as Array<Record<string, unknown>>)
            : [];

          return (
            <Card key={index} className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  <span className="mr-2 text-gray-400">{index + 1}.</span>
                  {questionText}
                </p>
                {options.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {options.map((option, optionIndex) => {
                      const optionText =
                        (option.text as string) ||
                        (option.label as string) ||
                        (option.answer as string) ||
                        String(option);
                      const isCorrect =
                        option.is_correct === true || option.correct === true;

                      return (
                        <div
                          key={optionIndex}
                          className={`flex items-center gap-2 rounded px-2 py-1 text-xs ${
                            isCorrect
                              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          <span className="shrink-0">
                            {isCorrect ? "\u2713" : "\u25CB"}
                          </span>
                          <span>{optionText}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
        {questions.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {t("pages.courseAssets.review.noContent")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function FlashcardsPreviewPanel({ payload }: { payload: EditablePayload }) {
  const { t } = useTranslation();
  const title = readStringFromPaths(payload, [
    ["title"],
    ["title_translations", "en"],
  ]);
  const cards = readArrayFromPaths(payload, [["cards"]]) as Array<
    Record<string, unknown>
  >;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t("pages.courseAssets.slotTypes.flashcards")}
        </p>
        <Badge variant="outline">
          {cards.length} {t("pages.courseAssets.review.cards")}
        </Badge>
      </div>
      {title ? (
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      ) : null}
      <div className="max-h-96 space-y-2 overflow-auto">
        {cards.map((card, index) => {
          const front =
            (card.front as string) ||
            (card.question as string) ||
            (card.term as string) ||
            "";
          const back =
            (card.back as string) ||
            (card.answer as string) ||
            (card.definition as string) ||
            "";

          return (
            <div
              key={index}
              className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="bg-gray-50 p-3 dark:bg-gray-900/40">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t("pages.courseAssets.review.front")}
                </p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {front}
                </p>
              </div>
              <div className="bg-white p-3 dark:bg-gray-900">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t("pages.courseAssets.review.back")}
                </p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {back}
                </p>
              </div>
            </div>
          );
        })}
        {cards.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {t("pages.courseAssets.review.noContent")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function AssignmentPreviewPanel({ payload }: { payload: EditablePayload }) {
  const { t } = useTranslation();
  const title = readStringFromPaths(payload, [
    ["title"],
    ["title_translations", "en"],
  ]);
  const description = readStringFromPaths(payload, [
    ["description"],
    ["description_translations", "en"],
  ]);

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {t("pages.courseAssets.slotTypes.assignment")}
      </p>
      {title ? (
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      ) : null}
      {description ? (
        <div className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
          {description}
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {t("pages.courseAssets.review.noContent")}
        </p>
      )}
    </div>
  );
}
