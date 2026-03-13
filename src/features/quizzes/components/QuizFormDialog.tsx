"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Textarea } from "@/components/ui/textarea";
import { useCreateCourseQuiz } from "@/features/quizzes/hooks/use-quizzes";
import type {
  CreateCourseQuizPayload,
  Quiz,
} from "@/features/quizzes/types/quiz";
import { useTranslation } from "@/features/localization";
import { getAdminApiErrorMessage } from "@/lib/admin-response";
import { can } from "@/lib/capabilities";

type QuizFormDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  centerId: string | number;
  courseId: string | number;
  initialAttachableType?: "none" | "course" | "section" | "video" | "pdf";
  initialAttachableId?: string | number | null;
  sourceContextLabel?: string | null;
  onSuccess?: (_quiz: Quiz) => void | Promise<void>;
};

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

function normalizeAttachableType(
  value: string | null | undefined,
): "none" | "course" | "section" | "video" | "pdf" {
  if (value === "none") return "none";
  if (value === "section") return "section";
  if (value === "video") return "video";
  if (value === "pdf") return "pdf";
  return "course";
}

export function QuizFormDialog({
  open,
  onOpenChange,
  centerId,
  courseId,
  initialAttachableType,
  initialAttachableId,
  sourceContextLabel,
  onSuccess,
}: QuizFormDialogProps) {
  const { t } = useTranslation();
  const canManageQuizzes = can("manage_quizzes");
  const { mutateAsync: createQuiz, isPending: isCreating } =
    useCreateCourseQuiz();

  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [passingScore, setPassingScore] = useState("");
  const [maxAttempts, setMaxAttempts] = useState("");
  const [attemptScorePolicy, setAttemptScorePolicy] = useState("0");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState("");
  const [isActive, setIsActive] = useState("true");
  const [isRequired, setIsRequired] = useState("false");
  const [attachableType, setAttachableType] = useState("course");
  const [attachableId, setAttachableId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setTitleEn("");
    setTitleAr("");
    setDescriptionEn("");
    setDescriptionAr("");
    setPassingScore("");
    setMaxAttempts("");
    setAttemptScorePolicy("0");
    setTimeLimitMinutes("");
    setIsActive("true");
    setIsRequired("false");
    setAttachableType(normalizeAttachableType(initialAttachableType));
    setAttachableId(
      initialAttachableId == null || initialAttachableId === ""
        ? ""
        : String(initialAttachableId),
    );
    setFormError(null);
  }, [initialAttachableId, initialAttachableType, open]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const normalizedTitleEn = titleEn.trim();
    if (!normalizedTitleEn) {
      setFormError(t("pages.courseQuizzes.errors.titleRequired"));
      return;
    }

    const payload: CreateCourseQuizPayload = {
      title_translations: {
        en: normalizedTitleEn,
        ar: titleAr.trim() || undefined,
      },
      description_translations:
        descriptionEn.trim() || descriptionAr.trim()
          ? {
              en: descriptionEn.trim() || undefined,
              ar: descriptionAr.trim() || undefined,
            }
          : undefined,
      attachable_type:
        attachableType === "none"
          ? undefined
          : (attachableType as "video" | "pdf" | "section" | "course"),
      attachable_id: parseOptionalNumber(attachableId),
      passing_score: parseOptionalNumber(passingScore),
      max_attempts: parseOptionalNumber(maxAttempts),
      attempt_score_policy: Number(attemptScorePolicy) as 0 | 1 | 2,
      time_limit_minutes: parseOptionalNumber(timeLimitMinutes),
      is_active: isActive === "true",
      is_required: isRequired === "true",
    };

    try {
      const createdQuiz = await createQuiz({
        centerId,
        courseId,
        payload,
      });

      onOpenChange(false);
      await onSuccess?.(createdQuiz);
    } catch (error) {
      setFormError(
        getAdminApiErrorMessage(
          error,
          t("pages.courseQuizzes.errors.createFailed"),
        ),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("pages.courseQuizzes.create.dialogTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("pages.courseQuizzes.create.dialogDescription")}
          </DialogDescription>
        </DialogHeader>

        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        {sourceContextLabel ? (
          <Alert>
            <AlertDescription>
              {t("pages.courseQuizzes.create.sourceContext", {
                source: sourceContextLabel,
              })}
            </AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quiz-title-en">
                {t("pages.courseQuizzes.fields.titleEn")}
              </Label>
              <Input
                id="quiz-title-en"
                value={titleEn}
                onChange={(event) => setTitleEn(event.target.value)}
                disabled={!canManageQuizzes || isCreating}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quiz-title-ar">
                {t("pages.courseQuizzes.fields.titleAr")}
              </Label>
              <Input
                id="quiz-title-ar"
                value={titleAr}
                onChange={(event) => setTitleAr(event.target.value)}
                disabled={!canManageQuizzes || isCreating}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quiz-description-en">
                {t("pages.courseQuizzes.fields.descriptionEn")}
              </Label>
              <Textarea
                id="quiz-description-en"
                rows={3}
                value={descriptionEn}
                onChange={(event) => setDescriptionEn(event.target.value)}
                disabled={!canManageQuizzes || isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quiz-description-ar">
                {t("pages.courseQuizzes.fields.descriptionAr")}
              </Label>
              <Textarea
                id="quiz-description-ar"
                rows={3}
                value={descriptionAr}
                onChange={(event) => setDescriptionAr(event.target.value)}
                disabled={!canManageQuizzes || isCreating}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="quiz-passing-score">
                {t("pages.courseQuizzes.fields.passingScore")}
              </Label>
              <Input
                id="quiz-passing-score"
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(event) => setPassingScore(event.target.value)}
                disabled={!canManageQuizzes || isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quiz-max-attempts">
                {t("pages.courseQuizzes.fields.maxAttempts")}
              </Label>
              <Input
                id="quiz-max-attempts"
                type="number"
                min={0}
                value={maxAttempts}
                onChange={(event) => setMaxAttempts(event.target.value)}
                disabled={!canManageQuizzes || isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quiz-time-limit">
                {t("pages.courseQuizzes.fields.timeLimitMinutes")}
              </Label>
              <Input
                id="quiz-time-limit"
                type="number"
                min={0}
                value={timeLimitMinutes}
                onChange={(event) => setTimeLimitMinutes(event.target.value)}
                disabled={!canManageQuizzes || isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quiz-score-policy">
                {t("pages.courseQuizzes.fields.scorePolicy")}
              </Label>
              <Select
                value={attemptScorePolicy}
                onValueChange={setAttemptScorePolicy}
                disabled={!canManageQuizzes || isCreating}
              >
                <SelectTrigger id="quiz-score-policy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">
                    {t("pages.courseQuizzes.scorePolicy.best")}
                  </SelectItem>
                  <SelectItem value="1">
                    {t("pages.courseQuizzes.scorePolicy.latest")}
                  </SelectItem>
                  <SelectItem value="2">
                    {t("pages.courseQuizzes.scorePolicy.average")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="quiz-attachable-type">
                {t("pages.courseQuizzes.fields.attachableType")}
              </Label>
              <Select
                value={attachableType}
                onValueChange={setAttachableType}
                disabled={!canManageQuizzes || isCreating}
              >
                <SelectTrigger id="quiz-attachable-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {t("common.labels.none")}
                  </SelectItem>
                  <SelectItem value="course">
                    {t("pages.courseQuizzes.attachable.course")}
                  </SelectItem>
                  <SelectItem value="section">
                    {t("pages.courseQuizzes.attachable.section")}
                  </SelectItem>
                  <SelectItem value="video">
                    {t("pages.courseQuizzes.attachable.video")}
                  </SelectItem>
                  <SelectItem value="pdf">
                    {t("pages.courseQuizzes.attachable.pdf")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quiz-attachable-id">
                {t("pages.courseQuizzes.fields.attachableId")}
              </Label>
              <Input
                id="quiz-attachable-id"
                type="number"
                min={1}
                value={attachableId}
                onChange={(event) => setAttachableId(event.target.value)}
                disabled={
                  !canManageQuizzes || isCreating || attachableType === "none"
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quiz-active">
                {t("pages.courseQuizzes.fields.isActive")}
              </Label>
              <Select
                value={isActive}
                onValueChange={setIsActive}
                disabled={!canManageQuizzes || isCreating}
              >
                <SelectTrigger id="quiz-active">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t("common.labels.yes")}</SelectItem>
                  <SelectItem value="false">{t("common.labels.no")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quiz-required">
                {t("pages.courseQuizzes.fields.isRequired")}
              </Label>
              <Select
                value={isRequired}
                onValueChange={setIsRequired}
                disabled={!canManageQuizzes || isCreating}
              >
                <SelectTrigger id="quiz-required">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t("common.labels.yes")}</SelectItem>
                  <SelectItem value="false">{t("common.labels.no")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              {t("common.actions.cancel")}
            </Button>
            <Button type="submit" disabled={!canManageQuizzes || isCreating}>
              {isCreating
                ? t("pages.courseQuizzes.actions.creating")
                : t("pages.courseQuizzes.actions.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
