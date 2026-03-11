"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HardDeletePanel } from "@/components/ui/hard-delete-panel";
import { useDeletePdf } from "@/features/pdfs/hooks/use-pdfs";
import type { Pdf } from "@/features/pdfs/types/pdf";
import { useTranslation } from "@/features/localization";
import {
  getAdminApiErrorMessage,
  getAdminResponseMessage,
  isAdminRequestSuccessful,
} from "@/lib/admin-response";

type DeletePdfDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  centerId?: string | number | null;
  pdf?: Pdf | null;
  onSuccess?: (_message: string) => void;
};

export function DeletePdfDialog({
  open,
  onOpenChange,
  centerId,
  pdf,
  onSuccess,
}: DeletePdfDialogProps) {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeletePdf();

  const handleDelete = () => {
    if (!pdf || !centerId) return;
    setErrorMessage(null);

    deleteMutation.mutate(
      { centerId, pdfId: pdf.id },
      {
        onSuccess: (response) => {
          if (!isAdminRequestSuccessful(response)) {
            setErrorMessage(
              getAdminResponseMessage(
                response,
                t("pages.pdfs.dialogs.delete.errors.deleteFailed"),
              ),
            );
            return;
          }

          const message = getAdminResponseMessage(
            response,
            t("pages.pdfs.dialogs.delete.messages.deleted"),
          );
          onOpenChange(false);
          onSuccess?.(message);
        },
        onError: (error) => {
          setErrorMessage(
            getAdminApiErrorMessage(
              error,
              t("pages.pdfs.dialogs.delete.errors.deleteFailed"),
            ),
          );
        },
      },
    );
  };

  const pdfTitle = pdf?.title ? String(pdf.title) : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (deleteMutation.isPending) return;
        if (!nextOpen) setErrorMessage(null);
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {t("pages.pdfs.dialogs.delete.title")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("pages.pdfs.dialogs.delete.description")}
          </DialogDescription>
        </DialogHeader>
        <HardDeletePanel
          title={t("pages.pdfs.dialogs.delete.title")}
          entityName={pdfTitle}
          entityFallback={t("pages.pdfs.dialogs.delete.entityFallback")}
          confirmButtonLabel={t(
            "pages.pdfs.dialogs.delete.actions.confirmDelete",
          )}
          pendingLabel={t("common.actions.deleting")}
          errorTitle={t("pages.pdfs.dialogs.delete.errors.couldNotDelete")}
          confirmLabel={t("pages.pdfs.dialogs.delete.confirmLabel", {
            value: "DELETE",
          })}
          irreversibleText={t("pages.pdfs.dialogs.delete.irreversible")}
          warningPrefix={t("pages.pdfs.dialogs.delete.warningPrefix")}
          cancelButtonLabel={t("common.actions.cancel")}
          errorMessage={errorMessage}
          isPending={deleteMutation.isPending}
          onCancel={() => onOpenChange(false)}
          onConfirm={handleDelete}
          resetKey={open ? (pdf?.id ?? "pdf") : null}
        />
      </DialogContent>
    </Dialog>
  );
}
