"use client";

import type React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AIContentLanguage,
  AIContentSourceType,
  AIContentTargetType,
} from "@/features/ai/types/ai";
import { cn } from "@/lib/utils";

type TranslateFn = (
  _key: string,
  _params?: Record<string, string | number>,
) => string;

type AICreateJobCardProps = {
  t: TranslateFn;
  showAdvancedCreate: boolean;
  onToggleAdvanced: () => void;
  isOptionsError: boolean;
  onRetryOptions: () => void;
  isOptionsLoading: boolean;
  providersCount: number;
  sourceReadinessTitle?: string | null;
  sourceReadinessDescription?: string | null;
  isSourceReadinessLoading: boolean;
  onSubmitCreateJob: (_event: React.FormEvent<HTMLFormElement>) => void;
  createValidationErrors: string[];
  createError: string | null;
  isCreatingJob: boolean;
  canGenerateAI: boolean;
  courseIdInput: string;
  onCourseIdChange: (_value: string) => void;
  language: AIContentLanguage;
  onLanguageChange: (_value: AIContentLanguage) => void;
  targetType: AIContentTargetType;
  onTargetTypeChange: (_value: AIContentTargetType) => void;
  targetTypes: readonly AIContentTargetType[];
  targetLabelMap: Record<AIContentTargetType, string>;
  sourceType: AIContentSourceType;
  onSourceTypeChange: (_value: AIContentSourceType) => void;
  sourceTypes: readonly AIContentSourceType[];
  sourceLabelMap: Record<AIContentSourceType, string>;
  sourceIdInput: string;
  onSourceIdChange: (_value: string) => void;
  targetIdInput: string;
  onTargetIdChange: (_value: string) => void;
  providerKey: string;
  onProviderChange: (_value: string) => void;
  modelKey: string;
  onModelChange: (_value: string) => void;
  providers: Array<{ key: string; label: string }>;
  availableModels: string[];
  generationConfigByTarget: Record<
    AIContentTargetType,
    Record<string, unknown>
  >;
  onUpdateGenerationConfig: (
    _target: AIContentTargetType,
    _updates: Record<string, unknown>,
  ) => void;
  onReset: () => void;
};

export function AICreateJobCard({
  t,
  showAdvancedCreate,
  onToggleAdvanced,
  isOptionsError,
  onRetryOptions,
  isOptionsLoading,
  providersCount,
  sourceReadinessTitle,
  sourceReadinessDescription,
  isSourceReadinessLoading,
  onSubmitCreateJob,
  createValidationErrors,
  createError,
  isCreatingJob,
  canGenerateAI,
  courseIdInput,
  onCourseIdChange,
  language,
  onLanguageChange,
  targetType,
  onTargetTypeChange,
  targetTypes,
  targetLabelMap,
  sourceType,
  onSourceTypeChange,
  sourceTypes,
  sourceLabelMap,
  sourceIdInput,
  onSourceIdChange,
  targetIdInput,
  onTargetIdChange,
  providerKey,
  onProviderChange,
  modelKey,
  onModelChange,
  providers,
  availableModels,
  generationConfigByTarget,
  onUpdateGenerationConfig,
  onReset,
}: AICreateJobCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>
            {t("pages.centerAIContent.workspace.create.title")}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onToggleAdvanced}>
            {showAdvancedCreate
              ? t("pages.centerAIContent.workspace.create.hideAdvanced")
              : t("pages.centerAIContent.workspace.create.showAdvanced")}
          </Button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("pages.centerAIContent.workspace.create.description")}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isOptionsError ? (
          <Alert variant="destructive">
            <AlertTitle>{t("common.messages.loadFailed")}</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                {t("pages.centerAIContent.workspace.create.loadOptionsFailed")}
              </p>
              <Button variant="outline" size="sm" onClick={onRetryOptions}>
                {t("common.actions.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {!isOptionsLoading && providersCount === 0 ? (
          <Alert>
            <AlertTitle>
              {t("pages.centerAIContent.workspace.create.noProvidersTitle")}
            </AlertTitle>
            <AlertDescription>
              {t(
                "pages.centerAIContent.workspace.create.noProvidersDescription",
              )}
            </AlertDescription>
          </Alert>
        ) : null}

        {!showAdvancedCreate ? (
          <Alert>
            <AlertDescription>
              {t("pages.centerAIContent.workspace.create.advancedHint")}
            </AlertDescription>
          </Alert>
        ) : null}

        {showAdvancedCreate && isSourceReadinessLoading ? (
          <Alert>
            <AlertTitle>
              {t("pages.centerAIContent.workspace.readiness.loadingTitle")}
            </AlertTitle>
            <AlertDescription>
              {t(
                "pages.centerAIContent.workspace.readiness.loadingDescription",
              )}
            </AlertDescription>
          </Alert>
        ) : null}

        {showAdvancedCreate &&
        !isSourceReadinessLoading &&
        sourceReadinessTitle &&
        sourceReadinessDescription ? (
          <Alert>
            <AlertTitle>{sourceReadinessTitle}</AlertTitle>
            <AlertDescription>{sourceReadinessDescription}</AlertDescription>
          </Alert>
        ) : null}

        <form
          onSubmit={onSubmitCreateJob}
          className={cn("space-y-4", !showAdvancedCreate && "hidden")}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ai-course-id">
                {t("pages.centerAIContent.workspace.create.fields.courseId")}
              </Label>
              <Input
                id="ai-course-id"
                type="number"
                min={1}
                value={courseIdInput}
                onChange={(event) => onCourseIdChange(event.target.value)}
                placeholder="4"
                disabled={isCreatingJob}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-language">
                {t("pages.centerAIContent.workspace.create.fields.language")}
              </Label>
              <Select
                value={language}
                onValueChange={(value) =>
                  onLanguageChange(value as AIContentLanguage)
                }
                disabled={isCreatingJob}
              >
                <SelectTrigger id="ai-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">
                    {t("pages.centerAIContent.workspace.languages.ar")}
                  </SelectItem>
                  <SelectItem value="en">
                    {t("pages.centerAIContent.workspace.languages.en")}
                  </SelectItem>
                  <SelectItem value="both">
                    {t("pages.centerAIContent.workspace.languages.both")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-target-type">
                {t("pages.centerAIContent.workspace.create.fields.targetType")}
              </Label>
              <Select
                value={targetType}
                onValueChange={(value) =>
                  onTargetTypeChange(value as AIContentTargetType)
                }
                disabled={isCreatingJob}
              >
                <SelectTrigger id="ai-target-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {targetTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {targetLabelMap[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="ai-source-type">
                {t("pages.centerAIContent.workspace.create.fields.sourceType")}
              </Label>
              <Select
                value={sourceType}
                onValueChange={(value) =>
                  onSourceTypeChange(value as AIContentSourceType)
                }
                disabled={isCreatingJob}
              >
                <SelectTrigger id="ai-source-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sourceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {sourceLabelMap[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-source-id">
                {t("pages.centerAIContent.workspace.create.fields.sourceId")}
              </Label>
              <Input
                id="ai-source-id"
                type="number"
                min={1}
                value={sourceIdInput}
                onChange={(event) => onSourceIdChange(event.target.value)}
                placeholder="19"
                disabled={isCreatingJob}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-target-id">
                {t("pages.centerAIContent.workspace.create.fields.targetId")}
              </Label>
              <Input
                id="ai-target-id"
                type="number"
                min={1}
                value={targetIdInput}
                onChange={(event) => onTargetIdChange(event.target.value)}
                placeholder={t(
                  "pages.centerAIContent.workspace.create.targetIdPlaceholder",
                )}
                disabled={isCreatingJob}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ai-provider">
                {t("pages.centerAIContent.workspace.create.fields.provider")}
              </Label>
              <Select
                value={providerKey}
                onValueChange={(value) => onProviderChange(value)}
                disabled={isCreatingJob || providersCount === 0}
              >
                <SelectTrigger id="ai-provider">
                  <SelectValue
                    placeholder={t(
                      "pages.centerAIContent.workspace.create.providerPlaceholder",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.key} value={provider.key}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-model">
                {t("pages.centerAIContent.workspace.create.fields.model")}
              </Label>
              <Select
                value={modelKey}
                onValueChange={(value) => onModelChange(value)}
                disabled={isCreatingJob || availableModels.length === 0}
              >
                <SelectTrigger id="ai-model">
                  <SelectValue
                    placeholder={t(
                      "pages.centerAIContent.workspace.create.modelPlaceholder",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="border-dashed border-gray-300 dark:border-gray-700">
            <CardContent className="space-y-4 py-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {t("pages.centerAIContent.workspace.create.configTitle", {
                  target: targetLabelMap[targetType],
                })}
              </p>

              {targetType === "quiz" ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="quiz-question-count">
                      {t(
                        "pages.centerAIContent.workspace.create.config.quiz.questionCount",
                      )}
                    </Label>
                    <Input
                      id="quiz-question-count"
                      type="number"
                      min={1}
                      max={50}
                      value={String(
                        generationConfigByTarget.quiz.question_count ?? 10,
                      )}
                      onChange={(event) =>
                        onUpdateGenerationConfig("quiz", {
                          question_count: Number(event.target.value || 0),
                        })
                      }
                      disabled={isCreatingJob}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quiz-difficulty">
                      {t(
                        "pages.centerAIContent.workspace.create.config.quiz.difficulty",
                      )}
                    </Label>
                    <Select
                      value={String(
                        generationConfigByTarget.quiz.difficulty ?? "medium",
                      )}
                      onValueChange={(value) =>
                        onUpdateGenerationConfig("quiz", {
                          difficulty: value,
                        })
                      }
                      disabled={isCreatingJob}
                    >
                      <SelectTrigger id="quiz-difficulty">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">
                          {t("pages.centerAIContent.workspace.difficulty.easy")}
                        </SelectItem>
                        <SelectItem value="medium">
                          {t(
                            "pages.centerAIContent.workspace.difficulty.medium",
                          )}
                        </SelectItem>
                        <SelectItem value="hard">
                          {t("pages.centerAIContent.workspace.difficulty.hard")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quiz-explanations">
                      {t(
                        "pages.centerAIContent.workspace.create.config.quiz.explanations",
                      )}
                    </Label>
                    <Select
                      value={String(
                        Boolean(
                          generationConfigByTarget.quiz.include_explanations,
                        ),
                      )}
                      onValueChange={(value) =>
                        onUpdateGenerationConfig("quiz", {
                          include_explanations: value === "true",
                        })
                      }
                      disabled={isCreatingJob}
                    >
                      <SelectTrigger id="quiz-explanations">
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
              ) : null}

              {targetType === "assignment" ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="assignment-type">
                      {t(
                        "pages.centerAIContent.workspace.create.config.assignment.type",
                      )}
                    </Label>
                    <Select
                      value={String(
                        generationConfigByTarget.assignment.assignment_type ??
                          "homework",
                      )}
                      onValueChange={(value) =>
                        onUpdateGenerationConfig("assignment", {
                          assignment_type: value,
                        })
                      }
                      disabled={isCreatingJob}
                    >
                      <SelectTrigger id="assignment-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homework">
                          {t(
                            "pages.centerAIContent.workspace.create.config.assignment.types.homework",
                          )}
                        </SelectItem>
                        <SelectItem value="project">
                          {t(
                            "pages.centerAIContent.workspace.create.config.assignment.types.project",
                          )}
                        </SelectItem>
                        <SelectItem value="exam_prep">
                          {t(
                            "pages.centerAIContent.workspace.create.config.assignment.types.examPrep",
                          )}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignment-max-points">
                      {t(
                        "pages.centerAIContent.workspace.create.config.assignment.maxPoints",
                      )}
                    </Label>
                    <Input
                      id="assignment-max-points"
                      type="number"
                      min={1}
                      value={String(
                        generationConfigByTarget.assignment.max_points ?? 100,
                      )}
                      onChange={(event) =>
                        onUpdateGenerationConfig("assignment", {
                          max_points: Number(event.target.value || 0),
                        })
                      }
                      disabled={isCreatingJob}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignment-passing-score">
                      {t(
                        "pages.centerAIContent.workspace.create.config.assignment.passingScore",
                      )}
                    </Label>
                    <Input
                      id="assignment-passing-score"
                      type="number"
                      min={0}
                      value={String(
                        generationConfigByTarget.assignment.passing_score ?? 60,
                      )}
                      onChange={(event) =>
                        onUpdateGenerationConfig("assignment", {
                          passing_score: Number(event.target.value || 0),
                        })
                      }
                      disabled={isCreatingJob}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignment-submission-types">
                      {t(
                        "pages.centerAIContent.workspace.create.config.assignment.submissionTypes",
                      )}
                    </Label>
                    <Input
                      id="assignment-submission-types"
                      value={String(
                        (
                          generationConfigByTarget.assignment
                            .submission_types as number[] | undefined
                        )
                          ?.filter((item) => Number.isFinite(Number(item)))
                          .join(",") ?? "0",
                      )}
                      onChange={(event) =>
                        onUpdateGenerationConfig("assignment", {
                          submission_types: event.target.value
                            .split(",")
                            .map((item) => Number(item.trim()))
                            .filter((item) => Number.isFinite(item)),
                        })
                      }
                      placeholder="0,1"
                      disabled={isCreatingJob}
                    />
                  </div>
                </div>
              ) : null}

              {targetType === "summary" ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="summary-length">
                      {t(
                        "pages.centerAIContent.workspace.create.config.summary.length",
                      )}
                    </Label>
                    <Select
                      value={String(
                        generationConfigByTarget.summary.length ?? "medium",
                      )}
                      onValueChange={(value) =>
                        onUpdateGenerationConfig("summary", {
                          length: value,
                        })
                      }
                      disabled={isCreatingJob}
                    >
                      <SelectTrigger id="summary-length">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">
                          {t("pages.centerAIContent.workspace.length.short")}
                        </SelectItem>
                        <SelectItem value="medium">
                          {t("pages.centerAIContent.workspace.length.medium")}
                        </SelectItem>
                        <SelectItem value="long">
                          {t("pages.centerAIContent.workspace.length.long")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="summary-tone">
                      {t(
                        "pages.centerAIContent.workspace.create.config.summary.tone",
                      )}
                    </Label>
                    <Select
                      value={String(
                        generationConfigByTarget.summary.tone ?? "simple",
                      )}
                      onValueChange={(value) =>
                        onUpdateGenerationConfig("summary", {
                          tone: value,
                        })
                      }
                      disabled={isCreatingJob}
                    >
                      <SelectTrigger id="summary-tone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">
                          {t("pages.centerAIContent.workspace.tone.simple")}
                        </SelectItem>
                        <SelectItem value="academic">
                          {t("pages.centerAIContent.workspace.tone.academic")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="summary-bullets">
                      {t(
                        "pages.centerAIContent.workspace.create.config.summary.bullets",
                      )}
                    </Label>
                    <Select
                      value={String(
                        Boolean(generationConfigByTarget.summary.bullet_points),
                      )}
                      onValueChange={(value) =>
                        onUpdateGenerationConfig("summary", {
                          bullet_points: value === "true",
                        })
                      }
                      disabled={isCreatingJob}
                    >
                      <SelectTrigger id="summary-bullets">
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
                  <div className="space-y-2">
                    <Label htmlFor="summary-key-terms">
                      {t(
                        "pages.centerAIContent.workspace.create.config.summary.keyTerms",
                      )}
                    </Label>
                    <Select
                      value={String(
                        Boolean(
                          generationConfigByTarget.summary.include_key_terms,
                        ),
                      )}
                      onValueChange={(value) =>
                        onUpdateGenerationConfig("summary", {
                          include_key_terms: value === "true",
                        })
                      }
                      disabled={isCreatingJob}
                    >
                      <SelectTrigger id="summary-key-terms">
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
              ) : null}

              {targetType === "flashcards" ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="flashcards-count">
                      {t(
                        "pages.centerAIContent.workspace.create.config.flashcards.cardsCount",
                      )}
                    </Label>
                    <Input
                      id="flashcards-count"
                      type="number"
                      min={1}
                      max={100}
                      value={String(
                        generationConfigByTarget.flashcards.cards_count ?? 20,
                      )}
                      onChange={(event) =>
                        onUpdateGenerationConfig("flashcards", {
                          cards_count: Number(event.target.value || 0),
                        })
                      }
                      disabled={isCreatingJob}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="flashcards-difficulty">
                      {t(
                        "pages.centerAIContent.workspace.create.config.flashcards.difficulty",
                      )}
                    </Label>
                    <Select
                      value={String(
                        generationConfigByTarget.flashcards.difficulty ??
                          "medium",
                      )}
                      onValueChange={(value) =>
                        onUpdateGenerationConfig("flashcards", {
                          difficulty: value,
                        })
                      }
                      disabled={isCreatingJob}
                    >
                      <SelectTrigger id="flashcards-difficulty">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">
                          {t("pages.centerAIContent.workspace.difficulty.easy")}
                        </SelectItem>
                        <SelectItem value="medium">
                          {t(
                            "pages.centerAIContent.workspace.difficulty.medium",
                          )}
                        </SelectItem>
                        <SelectItem value="hard">
                          {t("pages.centerAIContent.workspace.difficulty.hard")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="flashcards-definitions">
                      {t(
                        "pages.centerAIContent.workspace.create.config.flashcards.definitions",
                      )}
                    </Label>
                    <Select
                      value={String(
                        Boolean(
                          generationConfigByTarget.flashcards
                            .include_definitions,
                        ),
                      )}
                      onValueChange={(value) =>
                        onUpdateGenerationConfig("flashcards", {
                          include_definitions: value === "true",
                        })
                      }
                      disabled={isCreatingJob}
                    >
                      <SelectTrigger id="flashcards-definitions">
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
              ) : null}

              {targetType === "interactive_activity" ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="interactive-style">
                      {t(
                        "pages.centerAIContent.workspace.create.config.interactive.style",
                      )}
                    </Label>
                    <Select
                      value={String(
                        generationConfigByTarget.interactive_activity
                          .activity_style ?? "steps",
                      )}
                      onValueChange={(value) =>
                        onUpdateGenerationConfig("interactive_activity", {
                          activity_style: value,
                        })
                      }
                      disabled={isCreatingJob}
                    >
                      <SelectTrigger id="interactive-style">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="steps">
                          {t(
                            "pages.centerAIContent.workspace.activityStyle.steps",
                          )}
                        </SelectItem>
                        <SelectItem value="scenario">
                          {t(
                            "pages.centerAIContent.workspace.activityStyle.scenario",
                          )}
                        </SelectItem>
                        <SelectItem value="practice">
                          {t(
                            "pages.centerAIContent.workspace.activityStyle.practice",
                          )}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interactive-steps-count">
                      {t(
                        "pages.centerAIContent.workspace.create.config.interactive.stepsCount",
                      )}
                    </Label>
                    <Input
                      id="interactive-steps-count"
                      type="number"
                      min={1}
                      max={20}
                      value={String(
                        generationConfigByTarget.interactive_activity
                          .steps_count ?? 5,
                      )}
                      onChange={(event) =>
                        onUpdateGenerationConfig("interactive_activity", {
                          steps_count: Number(event.target.value || 0),
                        })
                      }
                      disabled={isCreatingJob}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interactive-estimated-minutes">
                      {t(
                        "pages.centerAIContent.workspace.create.config.interactive.minutes",
                      )}
                    </Label>
                    <Input
                      id="interactive-estimated-minutes"
                      type="number"
                      min={1}
                      value={String(
                        generationConfigByTarget.interactive_activity
                          .estimated_minutes ?? 15,
                      )}
                      onChange={(event) =>
                        onUpdateGenerationConfig("interactive_activity", {
                          estimated_minutes: Number(event.target.value || 0),
                        })
                      }
                      disabled={isCreatingJob}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interactive-reflection">
                      {t(
                        "pages.centerAIContent.workspace.create.config.interactive.reflection",
                      )}
                    </Label>
                    <Select
                      value={String(
                        Boolean(
                          generationConfigByTarget.interactive_activity
                            .include_reflection,
                        ),
                      )}
                      onValueChange={(value) =>
                        onUpdateGenerationConfig("interactive_activity", {
                          include_reflection: value === "true",
                        })
                      }
                      disabled={isCreatingJob}
                    >
                      <SelectTrigger id="interactive-reflection">
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
              ) : null}
            </CardContent>
          </Card>

          {createValidationErrors.length > 0 ? (
            <Alert variant="destructive">
              <AlertTitle>
                {t("pages.centerAIContent.workspace.validation.title")}
              </AlertTitle>
              <AlertDescription>
                <ul className="list-disc space-y-1 ps-4">
                  {createValidationErrors.map((errorMessage, index) => (
                    <li key={`${errorMessage}-${index}`}>{errorMessage}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          {createError ? (
            <Alert variant="destructive">
              <AlertDescription>{createError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="submit"
              disabled={
                isCreatingJob ||
                !canGenerateAI ||
                isOptionsLoading ||
                isSourceReadinessLoading ||
                Boolean(sourceReadinessDescription) ||
                providersCount === 0 ||
                !providerKey ||
                !modelKey
              }
            >
              {isCreatingJob
                ? t("pages.centerAIContent.workspace.create.actions.submitting")
                : t("pages.centerAIContent.workspace.create.actions.submit")}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              disabled={isCreatingJob}
            >
              {t("pages.centerAIContent.workspace.create.actions.reset")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
