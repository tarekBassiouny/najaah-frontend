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
                "Unable to delete PDF. Please try again.",
              ),
            );
            return;
          }

          const message = getAdminResponseMessage(
            response,
            "PDF deleted successfully.",
          );
          onOpenChange(false);
          onSuccess?.(message);
        },
        onError: (error) => {
          setErrorMessage(
            getAdminApiErrorMessage(
              error,
              "Unable to delete PDF. Please try again.",
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
          <DialogTitle className="sr-only">Delete PDF</DialogTitle>
          <DialogDescription className="sr-only">
            Permanently delete the selected PDF.
          </DialogDescription>
        </DialogHeader>
        <HardDeletePanel
          title="Delete PDF"
          entityName={pdfTitle}
          entityFallback="this PDF"
          confirmButtonLabel="Delete PDF"
          pendingLabel="Deleting..."
          errorTitle="Could not delete PDF"
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
