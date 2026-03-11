"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deletePdf } from "@/features/pdfs/services/pdfs.service";
import type { Pdf } from "@/features/pdfs/types/pdf";
import { useTranslation } from "@/features/localization";
import {
  getAdminApiErrorMessage,
  getAdminResponseMessage,
  isAdminRequestSuccessful,
} from "@/lib/admin-response";

type BulkDeletePdfsDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  pdfs: Pdf[];
  centerId: string | number;
  onSuccess?: (_message: string) => void;
};

const DELETE_CONFIRM_TEXT = "DELETE";

function getPdfTitle(pdf: Pdf) {
  if (pdf.title_translations?.en) return pdf.title_translations.en;
  if (pdf.title_translations?.ar) return pdf.title_translations.ar;
  if (pdf.title) return String(pdf.title);
  return null;
}

type DeleteResult = {
  total: number;
  deleted: number;
  failed: Array<{ id: string | number; title: string; reason: string }>;
};

export function BulkDeletePdfsDialog({
  open,
  onOpenChange,
  pdfs,
  centerId,
  onSuccess,
}: BulkDeletePdfsDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<DeleteResult | null>(null);
  const [confirmationText, setConfirmationText] = useState("");
  const resolveTitle = (pdf: Pdf) =>
    getPdfTitle(pdf) ??
    t("pages.pdfs.dialogs.bulkDelete.fallbackPdf", { id: String(pdf.id) });

  const handleDeletePdfs = async () => {
    if (pdfs.length === 0) {
      setErrorMessage(t("pages.pdfs.dialogs.bulkDelete.errors.noSelection"));
      return;
    }
    if (confirmationText !== DELETE_CONFIRM_TEXT) {
      setErrorMessage(
        t("pages.pdfs.dialogs.bulkDelete.errors.confirmText", {
          value: DELETE_CONFIRM_TEXT,
        }),
      );
      return;
    }

    setErrorMessage(null);
    setIsDeleting(true);

    const deleteResult: DeleteResult = {
      total: pdfs.length,
      deleted: 0,
      failed: [],
    };

    for (const pdf of pdfs) {
      try {
        const response = await deletePdf(centerId, pdf.id);
        if (!isAdminRequestSuccessful(response)) {
          deleteResult.failed.push({
            id: pdf.id,
            title: resolveTitle(pdf),
            reason: getAdminResponseMessage(
              response,
              t("pages.pdfs.dialogs.bulkDelete.errors.deleteOneFailed"),
            ),
          });
          continue;
        }

        deleteResult.deleted += 1;
      } catch (error) {
        deleteResult.failed.push({
          id: pdf.id,
          title: resolveTitle(pdf),
          reason: getAdminApiErrorMessage(
            error,
            t("pages.pdfs.dialogs.bulkDelete.errors.deleteOneFailed"),
          ),
        });
      }
    }

    await queryClient.invalidateQueries({ queryKey: ["pdfs", centerId] });
    setIsDeleting(false);
    setResult(deleteResult);

    if (deleteResult.failed.length === 0) {
      const message =
        deleteResult.deleted === 1
          ? t("pages.pdfs.dialogs.bulkDelete.messages.deletedSingle", {
              count: deleteResult.deleted,
            })
          : t("pages.pdfs.dialogs.bulkDelete.messages.deletedPlural", {
              count: deleteResult.deleted,
            });
      onSuccess?.(message);
      onOpenChange(false);
      return;
    }

    if (deleteResult.deleted > 0) {
      setErrorMessage(
        t("pages.pdfs.dialogs.bulkDelete.messages.partialDelete", {
          deleted: deleteResult.deleted,
          total: deleteResult.total,
        }),
      );
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setErrorMessage(null);
    setResult(null);
    setConfirmationText("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle>{t("pages.pdfs.dialogs.bulkDelete.title")}</DialogTitle>
          <DialogDescription>
            {pdfs.length === 1
              ? t("pages.pdfs.dialogs.bulkDelete.descriptionSingle", {
                  count: pdfs.length,
                })
              : t("pages.pdfs.dialogs.bulkDelete.descriptionPlural", {
                  count: pdfs.length,
                })}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
          {t("pages.pdfs.dialogs.bulkDelete.irreversible")}
        </div>

        <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("pages.pdfs.dialogs.bulkDelete.selectedLabel")}
          </p>
          <div className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
            {pdfs.slice(0, 5).map((pdf) => (
              <p key={String(pdf.id)}>• {resolveTitle(pdf)}</p>
            ))}
            {pdfs.length > 5 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("pages.pdfs.dialogs.bulkDelete.moreSelected", {
                  count: pdfs.length - 5,
                })}
              </p>
            ) : null}
          </div>
        </div>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>
              {t("pages.pdfs.dialogs.bulkDelete.errorTitle")}
            </AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {result ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300">
            <div className="flex flex-wrap gap-3">
              <span>
                {t("pages.pdfs.dialogs.bulkDelete.summary.total", {
                  count: result.total,
                })}
              </span>
              <span>
                {t("pages.pdfs.dialogs.bulkDelete.summary.deleted", {
                  count: result.deleted,
                })}
              </span>
              <span>
                {t("pages.pdfs.dialogs.bulkDelete.summary.failed", {
                  count: result.failed.length,
                })}
              </span>
            </div>

            {result.failed.length > 0 ? (
              <div className="mt-3 space-y-1 text-xs text-red-700 dark:text-red-300">
                {result.failed.map((item) => (
                  <p key={String(item.id)}>
                    {item.title}: {item.reason}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("pages.pdfs.dialogs.bulkDelete.confirmLabel", {
              value: DELETE_CONFIRM_TEXT,
            })}
          </label>
          <input
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-gray-700 dark:bg-gray-900"
            disabled={isDeleting}
          />
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            {t("common.actions.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeletePdfs}
            disabled={isDeleting || confirmationText !== DELETE_CONFIRM_TEXT}
          >
            {isDeleting
              ? t("common.actions.deleting")
              : t("pages.pdfs.dialogs.bulkDelete.actions.deletePdfs")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
