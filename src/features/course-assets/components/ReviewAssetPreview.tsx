"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { EditablePayload } from "@/features/ai/lib/review-payload";
import {
  readArrayFromPaths,
  readLocalizedStringFromPaths,
  readLocalizedTextValue,
  type ReviewLocale,
} from "@/features/ai/lib/review-payload";
import type { AIContentTargetType } from "@/features/ai/types/ai";
import { useTranslation } from "@/features/localization";

type ReviewAssetPreviewProps = {
  targetType: AIContentTargetType;
  payload: EditablePayload;
  activeLocale: ReviewLocale;
};

export function ReviewAssetPreview({
  targetType,
  payload,
  activeLocale,
}: ReviewAssetPreviewProps) {
  switch (targetType) {
    case "summary":
      return (
        <SummaryPreviewPanel payload={payload} activeLocale={activeLocale} />
      );
    case "quiz":
      return <QuizPreviewPanel payload={payload} activeLocale={activeLocale} />;
    case "flashcards":
      return (
        <FlashcardsPreviewPanel payload={payload} activeLocale={activeLocale} />
      );
    case "assignment":
      return (
        <AssignmentPreviewPanel payload={payload} activeLocale={activeLocale} />
      );
    case "interactive_activity":
      return (
        <InteractivePreviewPanel
          payload={payload}
          activeLocale={activeLocale}
        />
      );
    default:
      return null;
  }
}

function SummaryPreviewPanel({
  payload,
  activeLocale,
}: {
  payload: EditablePayload;
  activeLocale: ReviewLocale;
}) {
  const { t } = useTranslation();
  const title = readLocalizedStringFromPaths(
    payload,
    [["title_translations"], ["title"]],
    activeLocale,
  );
  const content = readLocalizedStringFromPaths(
    payload,
    [["content_translations"], ["content"]],
    activeLocale,
  );

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

function QuizPreviewPanel({
  payload,
  activeLocale,
}: {
  payload: EditablePayload;
  activeLocale: ReviewLocale;
}) {
  const { t } = useTranslation();
  const title = readLocalizedStringFromPaths(
    payload,
    [["title_translations"], ["title"]],
    activeLocale,
  );
  const description = readLocalizedStringFromPaths(
    payload,
    [["description_translations"], ["description"]],
    activeLocale,
  );
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
      {description ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
          {description}
        </div>
      ) : null}
      <div className="max-h-96 space-y-2 overflow-auto">
        {questions.map((question, index) => {
          const questionText =
            readLocalizedTextValue(question.question, activeLocale) ||
            readLocalizedTextValue(question.text, activeLocale) ||
            readLocalizedTextValue(question.title, activeLocale) ||
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
                        readLocalizedTextValue(option.text, activeLocale) ||
                        readLocalizedTextValue(option.label, activeLocale) ||
                        readLocalizedTextValue(option.answer, activeLocale) ||
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

function FlashcardsPreviewPanel({
  payload,
  activeLocale,
}: {
  payload: EditablePayload;
  activeLocale: ReviewLocale;
}) {
  const { t } = useTranslation();
  const title = readLocalizedStringFromPaths(
    payload,
    [["title_translations"], ["title"]],
    activeLocale,
  );
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
            readLocalizedTextValue(card.front, activeLocale) ||
            readLocalizedTextValue(card.question, activeLocale) ||
            readLocalizedTextValue(card.term, activeLocale) ||
            "";
          const back =
            readLocalizedTextValue(card.back, activeLocale) ||
            readLocalizedTextValue(card.answer, activeLocale) ||
            readLocalizedTextValue(card.definition, activeLocale) ||
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

function AssignmentPreviewPanel({
  payload,
  activeLocale,
}: {
  payload: EditablePayload;
  activeLocale: ReviewLocale;
}) {
  const { t } = useTranslation();
  const title = readLocalizedStringFromPaths(
    payload,
    [["title_translations"], ["title"]],
    activeLocale,
  );
  const description = readLocalizedStringFromPaths(
    payload,
    [["description_translations"], ["description"]],
    activeLocale,
  );

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

function InteractivePreviewPanel({
  payload,
  activeLocale,
}: {
  payload: EditablePayload;
  activeLocale: ReviewLocale;
}) {
  const { t } = useTranslation();
  const title = readLocalizedStringFromPaths(
    payload,
    [["title_translations"], ["title"]],
    activeLocale,
  );
  const instructions = readLocalizedStringFromPaths(
    payload,
    [["instructions_translations"], ["instructions"]],
    activeLocale,
  );
  const steps = readArrayFromPaths(payload, [["steps"]]) as Array<
    Record<string, unknown>
  >;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t("pages.courseAssets.slotTypes.interactive_activity")}
        </p>
        <Badge variant="outline">
          {steps.length}{" "}
          {t("pages.centerAIContent.workspace.review.interactive.steps")}
        </Badge>
      </div>
      {title ? (
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      ) : null}
      {instructions ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
          {instructions}
        </div>
      ) : null}
      <div className="max-h-96 space-y-2 overflow-auto">
        {steps.map((step, index) => {
          const stepTitle =
            readLocalizedTextValue(step.title, activeLocale) ||
            readLocalizedTextValue(step.label, activeLocale) ||
            readLocalizedTextValue(step.prompt, activeLocale) ||
            `${index + 1}`;
          const stepContent =
            readLocalizedTextValue(step.content, activeLocale) ||
            readLocalizedTextValue(step.instructions, activeLocale) ||
            readLocalizedTextValue(step.description, activeLocale);

          return (
            <Card key={index} className="border-gray-200 dark:border-gray-700">
              <CardContent className="space-y-2 p-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {stepTitle}
                </p>
                {stepContent ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stepContent}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
        {steps.length === 0 && !instructions ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {t("pages.courseAssets.review.noContent")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
