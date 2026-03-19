"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HardDeletePanel } from "@/components/ui/hard-delete-panel";
import { useDeleteInstructor } from "@/features/instructors/hooks/use-instructors";
import type { Instructor } from "@/features/instructors/types/instructor";
import { useModal } from "@/components/ui/modal-store";
import { getInstructorApiErrorMessage } from "@/features/instructors/lib/api-error";
import { useTranslation } from "@/features/localization";

type DeleteInstructorDialogProps = {
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  instructor?: Instructor | null;
  scopeCenterId?: string | number | null;
  onSuccess?: (_value: string) => void;
};

export function DeleteInstructorDialog({
  open,
  onOpenChange,
  instructor,
  scopeCenterId,
  onSuccess,
}: DeleteInstructorDialogProps) {
  const { t } = useTranslation();
  const deletedMessage = t("pages.instructors.dialogs.delete.messages.deleted");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteInstructor({
    centerId: scopeCenterId ?? null,
  });
  const { showToast } = useModal();

  const handleDelete = () => {
    if (!instructor) return;
    setErrorMessage(null);

    deleteMutation.mutate(instructor.id, {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.(deletedMessage);
        showToast(deletedMessage, "success");
      },
      onError: (error) => {
        setErrorMessage(
          getInstructorApiErrorMessage(
            error,
            t("pages.instructors.dialogs.delete.errorMessage"),
          ),
        );
      },
    });
  };

  const instructorName = instructor?.name ? String(instructor.name) : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (deleteMutation.isPending) return;
        if (!nextOpen) setErrorMessage(null);
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="sr-only">
            {t("pages.instructors.dialogs.delete.title")}
          </DialogTitle>
        </DialogHeader>
        <HardDeletePanel
          title={t("pages.instructors.dialogs.delete.title")}
          entityName={instructorName}
          entityFallback={t("pages.instructors.dialogs.delete.entityFallback")}
          confirmText={t("pages.instructors.dialogs.delete.confirmText")}
          confirmLabel={t("pages.instructors.dialogs.delete.confirmLabel", {
            confirmText: t("pages.instructors.dialogs.delete.confirmText"),
          })}
          confirmButtonLabel={t(
            "pages.instructors.dialogs.delete.confirmButtonLabel",
          )}
          pendingLabel={t("pages.instructors.dialogs.delete.pendingLabel")}
          errorTitle={t("pages.instructors.dialogs.delete.errorTitle")}
          irreversibleText={t("pages.instructors.dialogs.delete.irreversible")}
          warningPrefix={t("pages.instructors.dialogs.delete.warningPrefix")}
          cancelButtonLabel={t("common.actions.cancel")}
          errorMessage={errorMessage}
          isPending={deleteMutation.isPending}
          onCancel={() => onOpenChange(false)}
          onConfirm={handleDelete}
          resetKey={open ? (instructor?.id ?? "instructor") : null}
        />
      </DialogContent>
    </Dialog>
  );
}
