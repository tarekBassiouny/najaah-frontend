"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/features/localization";
import type { AIContentLanguage } from "@/features/ai/types/ai";
import type { CourseAssetSourceReadiness } from "../lib/source-readiness";
import type { GenerateFormState, SelectedSource } from "../types/generate-form";
import { SLOT_ORDER } from "../types/generate-form";

type GenerateAssetsDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  selectedSource: SelectedSource | null;
  generateForm: GenerateFormState;
  language: AIContentLanguage;
  onLanguageChange: (_value: AIContentLanguage) => void;
  onFormChange: (
    _updater: (_prev: GenerateFormState) => GenerateFormState,
  ) => void;
  generateError: string | null;
  sourceReadiness: CourseAssetSourceReadiness;
  isSourceReadinessLoading: boolean;
  isCreatingBatch: boolean;
  selectedAssetsCount: number;
  onSubmit: () => void;
};

const SLOT_ICONS: Record<string, string> = {
  summary: "M4 6h16M4 10h16M4 14h10",
  quiz: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01",
  flashcards:
    "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  assignment:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  interactive_activity:
    "M9 9h6m-6 3h6m-9 8h12a2 2 0 002-2V8a2 2 0 00-2-2h-1l-1-1h-6L8 6H7a2 2 0 00-2 2v10a2 2 0 002 2z",
};

export function GenerateAssetsDialog({
  open,
  onOpenChange,
  selectedSource,
  generateForm,
  language,
  onLanguageChange,
  onFormChange,
  generateError,
  sourceReadiness,
  isSourceReadinessLoading,
  isCreatingBatch,
  selectedAssetsCount,
  onSubmit,
}: GenerateAssetsDialogProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setStep(1);
    onOpenChange(nextOpen);
  };

  const stepLabel = (index: 1 | 2 | 3) =>
    step === index
      ? "bg-primary text-white"
      : step > index
        ? "bg-primary/20 text-primary dark:bg-primary/30"
        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";

  const enabledAssets = SLOT_ORDER.filter((s) => generateForm[s]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("pages.courseAssets.generateModal.title")}
          </DialogTitle>
          <DialogDescription>
            {selectedSource
              ? t("pages.courseAssets.generateModal.descriptionWithSource", {
                  type:
                    selectedSource.type === "video"
                      ? t("pages.courseAssets.labels.video")
                      : t("pages.courseAssets.labels.pdf"),
                  title: selectedSource.title || `#${selectedSource.id}`,
                })
              : t("pages.courseAssets.generateModal.description")}
          </DialogDescription>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                stepLabel(1),
              )}
            >
              {t("pages.courseAssets.wizard.step1")}
            </span>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                stepLabel(2),
              )}
            >
              {t("pages.courseAssets.wizard.step2")}
            </span>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                stepLabel(3),
              )}
            >
              {t("pages.courseAssets.wizard.step3")}
            </span>
          </div>
        </DialogHeader>

        {step === 1 ? (
          <GenerateWizardStepSelect
            selectedSource={selectedSource}
            generateForm={generateForm}
            language={language}
            onLanguageChange={onLanguageChange}
            onFormChange={onFormChange}
          />
        ) : step === 2 ? (
          <GenerateWizardStepConfigure
            generateForm={generateForm}
            onFormChange={onFormChange}
            enabledAssets={enabledAssets}
          />
        ) : (
          <GenerateWizardStepPreview
            selectedSource={selectedSource}
            generateForm={generateForm}
            enabledAssets={enabledAssets}
            language={language}
          />
        )}

        {generateError ? (
          <Alert variant="destructive">
            <AlertDescription>{generateError}</AlertDescription>
          </Alert>
        ) : null}

        {isSourceReadinessLoading ? (
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
        ) : !sourceReadiness.isReady ? (
          <Alert>
            <AlertTitle>
              {t(`pages.courseAssets.readiness.${sourceReadiness.key}.title`)}
            </AlertTitle>
            <AlertDescription>
              {t(
                `pages.courseAssets.readiness.${sourceReadiness.key}.description`,
              )}
            </AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isCreatingBatch}
          >
            {t("common.actions.cancel")}
          </Button>

          {step > 1 ? (
            <Button
              variant="outline"
              onClick={() => setStep((step - 1) as 1 | 2)}
              disabled={isCreatingBatch}
            >
              {t("pages.courseAssets.wizard.back")}
            </Button>
          ) : null}

          {step < 3 ? (
            <Button
              onClick={() => setStep((step + 1) as 2 | 3)}
              disabled={
                (step === 1 && selectedAssetsCount === 0) ||
                isSourceReadinessLoading ||
                !sourceReadiness.isReady
              }
            >
              {t("pages.courseAssets.wizard.next")}
            </Button>
          ) : (
            <Button
              onClick={onSubmit}
              disabled={
                isCreatingBatch ||
                selectedAssetsCount === 0 ||
                isSourceReadinessLoading ||
                !sourceReadiness.isReady
              }
            >
              {isCreatingBatch
                ? t("pages.courseAssets.actions.generating")
                : t("pages.courseAssets.actions.generateSelected")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Step 1: Select Assets ─── */

type StepSelectProps = {
  selectedSource: SelectedSource | null;
  generateForm: GenerateFormState;
  language: AIContentLanguage;
  onLanguageChange: (_value: AIContentLanguage) => void;
  onFormChange: (
    _updater: (_prev: GenerateFormState) => GenerateFormState,
  ) => void;
};

function GenerateWizardStepSelect({
  selectedSource,
  generateForm,
  language,
  onLanguageChange,
  onFormChange,
}: StepSelectProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {selectedSource ? (
        <div className="space-y-1 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("pages.courseAssets.generateModal.source")}
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {selectedSource.type === "video"
              ? t("pages.courseAssets.labels.video")
              : t("pages.courseAssets.labels.pdf")}
            : {selectedSource.title || `#${selectedSource.id}`}
          </p>
          {selectedSource.sectionTitle ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("pages.courseAssets.generateModal.section")}:{" "}
              {selectedSource.sectionTitle}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label>{t("pages.courseAssets.generateModal.language")}</Label>
        <Select
          value={language}
          onValueChange={(value) =>
            onLanguageChange(value as AIContentLanguage)
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ar">
              {t("pages.courseAssets.generateModal.languageOptions.ar")}
            </SelectItem>
            <SelectItem value="en">
              {t("pages.courseAssets.generateModal.languageOptions.en")}
            </SelectItem>
            <SelectItem value="both">
              {t("pages.courseAssets.generateModal.languageOptions.both")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("pages.courseAssets.generateModal.assets")}</Label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("pages.courseAssets.generateModal.assetsHint")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SLOT_ORDER.map((slotType) => {
            const isActive = Boolean(generateForm[slotType]);
            return (
              <button
                key={slotType}
                type="button"
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-4 text-left transition",
                  isActive
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30 dark:bg-primary/10"
                    : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600",
                )}
                onClick={() =>
                  onFormChange((prev) => ({
                    ...prev,
                    [slotType]: !prev[slotType],
                  }))
                }
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    isActive
                      ? "bg-primary/10 text-primary dark:bg-primary/20"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
                  )}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={SLOT_ICONS[slotType]}
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t(`pages.courseAssets.slotTypes.${slotType}`)}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {t(`pages.courseAssets.wizard.slotHints.${slotType}`)}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition",
                    isActive
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 dark:border-gray-600",
                  )}
                >
                  {isActive ? (
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Step 2: Configure ─── */

type StepConfigureProps = {
  generateForm: GenerateFormState;
  onFormChange: (
    _updater: (_prev: GenerateFormState) => GenerateFormState,
  ) => void;
  enabledAssets: string[];
};

function GenerateWizardStepConfigure({
  generateForm,
  onFormChange,
  enabledAssets,
}: StepConfigureProps) {
  const { t } = useTranslation();

  if (enabledAssets.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        {t("pages.courseAssets.wizard.noAssetsSelected")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {enabledAssets.includes("summary") ? (
        <SummaryConfigSection
          generateForm={generateForm}
          onFormChange={onFormChange}
        />
      ) : null}
      {enabledAssets.includes("quiz") ? (
        <QuizConfigSection
          generateForm={generateForm}
          onFormChange={onFormChange}
        />
      ) : null}
      {enabledAssets.includes("flashcards") ? (
        <FlashcardsConfigSection
          generateForm={generateForm}
          onFormChange={onFormChange}
        />
      ) : null}
      {enabledAssets.includes("assignment") ? (
        <AssignmentConfigSection
          generateForm={generateForm}
          onFormChange={onFormChange}
        />
      ) : null}
      {enabledAssets.includes("interactive_activity") ? (
        <InteractiveActivityConfigSection
          generateForm={generateForm}
          onFormChange={onFormChange}
        />
      ) : null}
    </div>
  );
}

/* ─── Step 3: Preview & Submit ─── */

type StepPreviewProps = {
  selectedSource: SelectedSource | null;
  generateForm: GenerateFormState;
  enabledAssets: string[];
  language: AIContentLanguage;
};

function GenerateWizardStepPreview({
  selectedSource,
  generateForm,
  enabledAssets,
  language,
}: StepPreviewProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {selectedSource ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("pages.courseAssets.generateModal.source")}
          </p>
          <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
            {selectedSource.type === "video"
              ? t("pages.courseAssets.labels.video")
              : t("pages.courseAssets.labels.pdf")}
            : {selectedSource.title || `#${selectedSource.id}`}
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {t("pages.courseAssets.wizard.previewTitle")}
        </p>
        <Badge variant="secondary" className="w-fit">
          {t("pages.courseAssets.generateModal.language")}:{" "}
          {t(`pages.courseAssets.generateModal.languageOptions.${language}`)}
        </Badge>

        {enabledAssets.map((assetType) => (
          <div
            key={assetType}
            className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {t(`pages.courseAssets.slotTypes.${assetType}`)}
              </p>
              <Badge variant="info">
                {t("pages.courseAssets.wizard.enabled")}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
              {assetType === "summary" ? (
                <>
                  <Badge variant="outline">
                    {t("pages.courseAssets.generateModal.summary.length")}:{" "}
                    {t(
                      `pages.courseAssets.generateModal.summary.lengthOptions.${generateForm.summaryLength}`,
                    )}
                  </Badge>
                  {generateForm.summaryIncludeKeyPoints ? (
                    <Badge variant="outline">
                      {t(
                        "pages.courseAssets.generateModal.summary.includeKeyPoints",
                      )}
                    </Badge>
                  ) : null}
                </>
              ) : null}
              {assetType === "quiz" ? (
                <>
                  <Badge variant="outline">
                    {t("pages.courseAssets.generateModal.quiz.questionCount")}:{" "}
                    {generateForm.quizQuestionCount}
                  </Badge>
                  <Badge variant="outline">
                    {t("pages.courseAssets.generateModal.quiz.difficulty")}:{" "}
                    {t(
                      `pages.courseAssets.generateModal.quiz.difficultyOptions.${generateForm.quizDifficulty}`,
                    )}
                  </Badge>
                </>
              ) : null}
              {assetType === "flashcards" ? (
                <Badge variant="outline">
                  {t("pages.courseAssets.generateModal.flashcards.cardCount")}:{" "}
                  {generateForm.flashcardsCount}
                </Badge>
              ) : null}
              {assetType === "assignment" ? (
                <>
                  <Badge variant="outline">
                    {t("pages.courseAssets.generateModal.assignment.style")}:{" "}
                    {t(
                      `pages.courseAssets.generateModal.assignment.styleOptions.${generateForm.assignmentStyle}`,
                    )}
                  </Badge>
                  <Badge variant="outline">
                    {t("pages.courseAssets.generateModal.assignment.maxPoints")}
                    : {generateForm.assignmentMaxPoints}
                  </Badge>
                </>
              ) : null}
              {assetType === "interactive_activity" ? (
                <>
                  <Badge variant="outline">
                    {t(
                      "pages.courseAssets.generateModal.interactiveActivity.style",
                    )}
                    :{" "}
                    {t(
                      `pages.courseAssets.generateModal.interactiveActivity.styleOptions.${generateForm.interactiveActivityStyle}`,
                    )}
                  </Badge>
                  <Badge variant="outline">
                    {t(
                      "pages.courseAssets.generateModal.interactiveActivity.stepsCount",
                    )}
                    : {generateForm.interactiveActivityStepsCount}
                  </Badge>
                  {generateForm.interactiveActivityIncludeReflection ? (
                    <Badge variant="outline">
                      {t(
                        "pages.courseAssets.generateModal.interactiveActivity.includeReflection",
                      )}
                    </Badge>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Config Sections (unchanged from Phase 1) ─── */

type ConfigSectionProps = {
  generateForm: GenerateFormState;
  onFormChange: (
    _updater: (_prev: GenerateFormState) => GenerateFormState,
  ) => void;
};

function SummaryConfigSection({
  generateForm,
  onFormChange,
}: ConfigSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <p className="text-sm font-medium text-gray-900 dark:text-white">
        {t("pages.courseAssets.slotTypes.summary")}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{t("pages.courseAssets.generateModal.summary.length")}</Label>
          <Select
            value={generateForm.summaryLength}
            onValueChange={(value) =>
              onFormChange((prev) => ({
                ...prev,
                summaryLength: value as "short" | "medium" | "long",
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short">
                {t(
                  "pages.courseAssets.generateModal.summary.lengthOptions.short",
                )}
              </SelectItem>
              <SelectItem value="medium">
                {t(
                  "pages.courseAssets.generateModal.summary.lengthOptions.medium",
                )}
              </SelectItem>
              <SelectItem value="long">
                {t(
                  "pages.courseAssets.generateModal.summary.lengthOptions.long",
                )}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
          <input
            type="checkbox"
            checked={generateForm.summaryIncludeKeyPoints}
            onChange={(event) =>
              onFormChange((prev) => ({
                ...prev,
                summaryIncludeKeyPoints: event.target.checked,
              }))
            }
          />
          <span>
            {t("pages.courseAssets.generateModal.summary.includeKeyPoints")}
          </span>
        </label>
      </div>
    </div>
  );
}

function QuizConfigSection({ generateForm, onFormChange }: ConfigSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <p className="text-sm font-medium text-gray-900 dark:text-white">
        {t("pages.courseAssets.slotTypes.quiz")}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>
            {t("pages.courseAssets.generateModal.quiz.questionCount")}
          </Label>
          <Input
            type="number"
            min={1}
            max={50}
            value={generateForm.quizQuestionCount}
            onChange={(event) =>
              onFormChange((prev) => ({
                ...prev,
                quizQuestionCount: event.target.value,
              }))
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("pages.courseAssets.generateModal.quiz.difficulty")}</Label>
          <Select
            value={generateForm.quizDifficulty}
            onValueChange={(value) =>
              onFormChange((prev) => ({
                ...prev,
                quizDifficulty: value as "easy" | "medium" | "hard",
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">
                {t(
                  "pages.courseAssets.generateModal.quiz.difficultyOptions.easy",
                )}
              </SelectItem>
              <SelectItem value="medium">
                {t(
                  "pages.courseAssets.generateModal.quiz.difficultyOptions.medium",
                )}
              </SelectItem>
              <SelectItem value="hard">
                {t(
                  "pages.courseAssets.generateModal.quiz.difficultyOptions.hard",
                )}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>
          {t("pages.courseAssets.generateModal.quiz.questionStyles")}
        </Label>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
            <input
              type="checkbox"
              checked={generateForm.quizStyleSingleChoice}
              onChange={(event) =>
                onFormChange((prev) => ({
                  ...prev,
                  quizStyleSingleChoice: event.target.checked,
                }))
              }
            />
            <span>
              {t(
                "pages.courseAssets.generateModal.quiz.styleOptions.singleChoice",
              )}
            </span>
          </label>
          <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
            <input
              type="checkbox"
              checked={generateForm.quizStyleMultipleChoice}
              onChange={(event) =>
                onFormChange((prev) => ({
                  ...prev,
                  quizStyleMultipleChoice: event.target.checked,
                }))
              }
            />
            <span>
              {t(
                "pages.courseAssets.generateModal.quiz.styleOptions.multipleChoice",
              )}
            </span>
          </label>
          <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
            <input
              type="checkbox"
              checked={generateForm.quizStyleTrueFalse}
              onChange={(event) =>
                onFormChange((prev) => ({
                  ...prev,
                  quizStyleTrueFalse: event.target.checked,
                }))
              }
            />
            <span>
              {t(
                "pages.courseAssets.generateModal.quiz.styleOptions.trueFalse",
              )}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

function FlashcardsConfigSection({
  generateForm,
  onFormChange,
}: ConfigSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <p className="text-sm font-medium text-gray-900 dark:text-white">
        {t("pages.courseAssets.slotTypes.flashcards")}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>
            {t("pages.courseAssets.generateModal.flashcards.cardCount")}
          </Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={generateForm.flashcardsCount}
            onChange={(event) =>
              onFormChange((prev) => ({
                ...prev,
                flashcardsCount: event.target.value,
              }))
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label>
            {t("pages.courseAssets.generateModal.flashcards.focus")}
          </Label>
          <div className="grid gap-2">
            <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
              <input
                type="checkbox"
                checked={generateForm.flashcardsFocusDefinitions}
                onChange={(event) =>
                  onFormChange((prev) => ({
                    ...prev,
                    flashcardsFocusDefinitions: event.target.checked,
                  }))
                }
              />
              <span>
                {t(
                  "pages.courseAssets.generateModal.flashcards.focusOptions.definitions",
                )}
              </span>
            </label>
            <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
              <input
                type="checkbox"
                checked={generateForm.flashcardsFocusConcepts}
                onChange={(event) =>
                  onFormChange((prev) => ({
                    ...prev,
                    flashcardsFocusConcepts: event.target.checked,
                  }))
                }
              />
              <span>
                {t(
                  "pages.courseAssets.generateModal.flashcards.focusOptions.concepts",
                )}
              </span>
            </label>
            <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
              <input
                type="checkbox"
                checked={generateForm.flashcardsFocusFormulas}
                onChange={(event) =>
                  onFormChange((prev) => ({
                    ...prev,
                    flashcardsFocusFormulas: event.target.checked,
                  }))
                }
              />
              <span>
                {t(
                  "pages.courseAssets.generateModal.flashcards.focusOptions.formulas",
                )}
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssignmentConfigSection({
  generateForm,
  onFormChange,
}: ConfigSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <p className="text-sm font-medium text-gray-900 dark:text-white">
        {t("pages.courseAssets.slotTypes.assignment")}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>
            {t("pages.courseAssets.generateModal.assignment.style")}
          </Label>
          <Select
            value={generateForm.assignmentStyle}
            onValueChange={(value) =>
              onFormChange((prev) => ({
                ...prev,
                assignmentStyle: value as "practice" | "essay" | "project",
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="practice">
                {t(
                  "pages.courseAssets.generateModal.assignment.styleOptions.practice",
                )}
              </SelectItem>
              <SelectItem value="essay">
                {t(
                  "pages.courseAssets.generateModal.assignment.styleOptions.essay",
                )}
              </SelectItem>
              <SelectItem value="project">
                {t(
                  "pages.courseAssets.generateModal.assignment.styleOptions.project",
                )}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>
            {t("pages.courseAssets.generateModal.assignment.maxPoints")}
          </Label>
          <Input
            type="number"
            min={1}
            value={generateForm.assignmentMaxPoints}
            onChange={(event) =>
              onFormChange((prev) => ({
                ...prev,
                assignmentMaxPoints: event.target.value,
              }))
            }
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>
          {t("pages.courseAssets.generateModal.assignment.submissionTypes")}
        </Label>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
            <input
              type="checkbox"
              checked={generateForm.assignmentAllowFile}
              onChange={(event) =>
                onFormChange((prev) => ({
                  ...prev,
                  assignmentAllowFile: event.target.checked,
                }))
              }
            />
            <span>
              {t(
                "pages.courseAssets.generateModal.assignment.submissionTypeOptions.file",
              )}
            </span>
          </label>
          <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
            <input
              type="checkbox"
              checked={generateForm.assignmentAllowText}
              onChange={(event) =>
                onFormChange((prev) => ({
                  ...prev,
                  assignmentAllowText: event.target.checked,
                }))
              }
            />
            <span>
              {t(
                "pages.courseAssets.generateModal.assignment.submissionTypeOptions.text",
              )}
            </span>
          </label>
          <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
            <input
              type="checkbox"
              checked={generateForm.assignmentAllowLink}
              onChange={(event) =>
                onFormChange((prev) => ({
                  ...prev,
                  assignmentAllowLink: event.target.checked,
                }))
              }
            />
            <span>
              {t(
                "pages.courseAssets.generateModal.assignment.submissionTypeOptions.link",
              )}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

function InteractiveActivityConfigSection({
  generateForm,
  onFormChange,
}: ConfigSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <p className="text-sm font-medium text-gray-900 dark:text-white">
        {t("pages.courseAssets.slotTypes.interactive_activity")}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>
            {t("pages.courseAssets.generateModal.interactiveActivity.style")}
          </Label>
          <Select
            value={generateForm.interactiveActivityStyle}
            onValueChange={(value) =>
              onFormChange((prev) => ({
                ...prev,
                interactiveActivityStyle: value as
                  | "steps"
                  | "scenario"
                  | "practice",
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="steps">
                {t(
                  "pages.courseAssets.generateModal.interactiveActivity.styleOptions.steps",
                )}
              </SelectItem>
              <SelectItem value="scenario">
                {t(
                  "pages.courseAssets.generateModal.interactiveActivity.styleOptions.scenario",
                )}
              </SelectItem>
              <SelectItem value="practice">
                {t(
                  "pages.courseAssets.generateModal.interactiveActivity.styleOptions.practice",
                )}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>
            {t(
              "pages.courseAssets.generateModal.interactiveActivity.stepsCount",
            )}
          </Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={generateForm.interactiveActivityStepsCount}
            onChange={(event) =>
              onFormChange((prev) => ({
                ...prev,
                interactiveActivityStepsCount: event.target.value,
              }))
            }
          />
        </div>
      </div>
      <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
        <input
          type="checkbox"
          checked={generateForm.interactiveActivityIncludeReflection}
          onChange={(event) =>
            onFormChange((prev) => ({
              ...prev,
              interactiveActivityIncludeReflection: event.target.checked,
            }))
          }
        />
        <span>
          {t(
            "pages.courseAssets.generateModal.interactiveActivity.includeReflection",
          )}
        </span>
      </label>
    </div>
  );
}
