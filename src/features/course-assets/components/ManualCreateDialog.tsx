import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/features/localization";
import { buildManualEntryHref } from "../lib/build-manual-entry-href";
import type { SelectedSource } from "../types/generate-form";

type ManualCreateDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  source: SelectedSource | null;
  centerId: string;
  courseId: string;
  returnTo: string;
  canManageQuizzes: boolean;
  canManageAssignments: boolean;
};

export function ManualCreateDialog({
  open,
  onOpenChange,
  source,
  centerId,
  courseId,
  returnTo,
  canManageQuizzes,
  canManageAssignments,
}: ManualCreateDialogProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const handleCreate = (targetType: "quiz" | "assignment") => {
    if (!source) return;

    onOpenChange(false);
    router.push(
      buildManualEntryHref({
        centerId,
        courseId,
        targetType,
        sourceType: source.type,
        sourceId: source.id,
        sourceTitle: source.title,
        returnTo,
      }),
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("pages.courseAssets.manualModal.title")}</DialogTitle>
          <DialogDescription>
            {source
              ? t("pages.courseAssets.manualModal.descriptionWithSource", {
                  type:
                    source.type === "video"
                      ? t("pages.courseAssets.labels.video")
                      : t("pages.courseAssets.labels.pdf"),
                  title: source.title || `#${source.id}`,
                })
              : t("pages.courseAssets.manualModal.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary/50 dark:hover:bg-primary/10"
            onClick={() => handleCreate("quiz")}
            disabled={!canManageQuizzes}
          >
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {t("pages.courseAssets.actions.createQuiz")}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t("pages.courseAssets.manualModal.quizDescription")}
            </p>
          </button>

          <button
            type="button"
            className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary/50 dark:hover:bg-primary/10"
            onClick={() => handleCreate("assignment")}
            disabled={!canManageAssignments}
          >
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {t("pages.courseAssets.actions.createAssignment")}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t("pages.courseAssets.manualModal.assignmentDescription")}
            </p>
          </button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.actions.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
