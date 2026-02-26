"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  useCreatePdfUploadSession,
  useFinalizePdfUploadSession,
  useUpdatePdf,
} from "@/features/pdfs/hooks/use-pdfs";
import {
  uploadPdfToStorage,
  type FinalizePdfUploadSessionPayload,
} from "@/features/pdfs/services/pdfs.service";
import type { Pdf, PdfUploadSession } from "@/features/pdfs/types/pdf";
import {
  getAdminApiErrorMessage,
  getAdminResponseMessage,
} from "@/lib/admin-response";
import { useModal } from "@/components/ui/modal-store";

type PdfUploadDialogProps = {
  centerId: string | number;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  pdf?: Pdf | null;
  onSuccess?: (_message: string) => void;
  onUploaded?: (_message: string) => void;
};

function resolveUploadSessionId(session: PdfUploadSession) {
  return session.upload_session_id ?? session.id;
}

function resolveUploadEndpoint(session: PdfUploadSession) {
  const candidate = session.upload_endpoint ?? session.upload_url;
  return typeof candidate === "string" && candidate.trim()
    ? candidate.trim()
    : null;
}

function resolveRequiredHeaders(
  session: PdfUploadSession,
): Record<string, string> {
  const rawHeaders = session.required_headers;
  if (
    !rawHeaders ||
    typeof rawHeaders !== "object" ||
    Array.isArray(rawHeaders)
  ) {
    return {};
  }

  const normalizedEntries = Object.entries(rawHeaders)
    .filter(([key, value]) => key && value != null)
    .map(([key, value]) => [key, String(value)] as const);

  return Object.fromEntries(normalizedEntries);
}

function buildTranslations(enValue: string, arValue: string) {
  const normalizedEn = enValue.trim();
  const normalizedAr = arValue.trim();

  return {
    ...(normalizedEn ? { en: normalizedEn } : {}),
    ...(normalizedAr ? { ar: normalizedAr } : {}),
  };
}

function isPdfFile(file: File) {
  const name = file.name.toLowerCase();
  return file.type === "application/pdf" || name.endsWith(".pdf");
}

export function PdfUploadDialog({
  centerId,
  open,
  onOpenChange,
  pdf,
  onSuccess,
  onUploaded,
}: PdfUploadDialogProps) {
  const { showToast } = useModal();
  const isEditMode = Boolean(pdf);

  const {
    mutateAsync: createUploadSessionAsync,
    isPending: isCreatingSession,
  } = useCreatePdfUploadSession();
  const {
    mutateAsync: finalizeUploadSessionAsync,
    isPending: isFinalizingSession,
  } = useFinalizePdfUploadSession();
  const { mutateAsync: updatePdfAsync, isPending: isUpdatingPdf } =
    useUpdatePdf();

  const [file, setFile] = useState<File | null>(null);
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isUploadingStorage, setIsUploadingStorage] = useState(false);

  const isBusy =
    isCreatingSession ||
    isUploadingStorage ||
    isFinalizingSession ||
    isUpdatingPdf;

  const selectedFileLabel = useMemo(() => {
    if (!file) return "";
    const sizeKb = Math.max(1, Math.ceil(file.size / 1024));
    return `${file.name} (${sizeKb} KB)`;
  }, [file]);

  useEffect(() => {
    if (!open) return;

    setFormError(null);
    setIsUploadingStorage(false);
    if (isEditMode && pdf) {
      setFile(null);
      setTitleEn(String(pdf.title_translations?.en ?? pdf.title ?? ""));
      setTitleAr(String(pdf.title_translations?.ar ?? ""));
      setDescriptionEn(
        String(pdf.description_translations?.en ?? pdf.description ?? ""),
      );
      setDescriptionAr(String(pdf.description_translations?.ar ?? ""));
      return;
    }

    setFile(null);
    setTitleEn("");
    setTitleAr("");
    setDescriptionEn("");
    setDescriptionAr("");
  }, [open, isEditMode, pdf]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) return;

    const normalizedTitleEn = titleEn.trim();
    if (!normalizedTitleEn) {
      setFormError("English title is required.");
      return;
    }

    setFormError(null);
    const titleTranslations = buildTranslations(titleEn, titleAr);
    const descriptionTranslations = buildTranslations(
      descriptionEn,
      descriptionAr,
    );

    try {
      if (isEditMode && pdf) {
        const updatedPdf = await updatePdfAsync({
          centerId,
          pdfId: pdf.id,
          payload: {
            title_translations: titleTranslations,
            description_translations: descriptionTranslations,
          },
        });

        const successMessage = getAdminResponseMessage(
          updatedPdf,
          "PDF updated successfully.",
        );
        showToast(successMessage, "success");
        onSuccess?.(successMessage);
        onUploaded?.(successMessage);
        onOpenChange(false);
        return;
      }

      if (!file) {
        setFormError("Select a PDF file to upload.");
        return;
      }

      if (!isPdfFile(file)) {
        setFormError("Only PDF files are allowed.");
        return;
      }

      const fileSizeKb = Math.max(1, Math.ceil(file.size / 1024));
      const session = await createUploadSessionAsync({
        centerId,
        payload: {
          original_filename: file.name,
          file_size_kb: fileSizeKb,
        },
      });

      const uploadSessionId = resolveUploadSessionId(session);
      const uploadEndpoint = resolveUploadEndpoint(session);
      if (!uploadSessionId || !uploadEndpoint) {
        throw new Error("Upload session is missing endpoint or identifier.");
      }

      setIsUploadingStorage(true);
      await uploadPdfToStorage(
        uploadEndpoint,
        file,
        resolveRequiredHeaders(session),
      );
      setIsUploadingStorage(false);

      const finalizePayload: FinalizePdfUploadSessionPayload = {
        title_translations: titleTranslations,
        ...(Object.keys(descriptionTranslations).length > 0
          ? { description_translations: descriptionTranslations }
          : {}),
      };

      const finalizedSession = await finalizeUploadSessionAsync({
        centerId,
        uploadSessionId,
        payload: finalizePayload,
      });

      if (Number(finalizedSession.upload_status) === 3) {
        throw new Error(
          finalizedSession.error_message ||
            "Upload finalized with a failed processing status.",
        );
      }

      const successMessage = getAdminResponseMessage(
        finalizedSession,
        "PDF uploaded successfully.",
      );
      showToast(successMessage, "success");
      onSuccess?.(successMessage);
      onUploaded?.(successMessage);
      onOpenChange(false);
    } catch (error) {
      setIsUploadingStorage(false);
      const message =
        error instanceof Error && error.message
          ? error.message
          : getAdminApiErrorMessage(
              error,
              isEditMode ? "Failed to update PDF." : "Failed to upload PDF.",
            );
      setFormError(message);
      showToast(message, "error");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isBusy && !nextOpen) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit PDF" : "Upload PDF"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update PDF metadata and translations."
              : "Create upload session, upload file to storage, then finalize metadata."}
          </DialogDescription>
        </DialogHeader>

        {formError ? (
          <Alert variant="destructive">
            <AlertTitle>
              {isEditMode ? "Update failed" : "Upload failed"}
            </AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isEditMode ? null : (
            <div className="space-y-2">
              <Label htmlFor="pdf-upload-file">PDF File *</Label>
              <Input
                id="pdf-upload-file"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null;
                  setFile(nextFile);
                }}
                disabled={isBusy}
              />
              {selectedFileLabel ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedFileLabel}
                </p>
              ) : null}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pdf-title-en">Title (English) *</Label>
              <Input
                id="pdf-title-en"
                value={titleEn}
                onChange={(event) => setTitleEn(event.target.value)}
                placeholder="e.g., Lesson Notes"
                disabled={isBusy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pdf-title-ar">Title (Arabic)</Label>
              <Input
                id="pdf-title-ar"
                value={titleAr}
                onChange={(event) => setTitleAr(event.target.value)}
                placeholder="e.g., ملاحظات الدرس"
                dir="rtl"
                disabled={isBusy}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pdf-description-en">Description (English)</Label>
              <textarea
                id="pdf-description-en"
                value={descriptionEn}
                onChange={(event) => setDescriptionEn(event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                disabled={isBusy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pdf-description-ar">Description (Arabic)</Label>
              <textarea
                id="pdf-description-ar"
                value={descriptionAr}
                onChange={(event) => setDescriptionAr(event.target.value)}
                rows={3}
                dir="rtl"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                disabled={isBusy}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isBusy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isBusy}>
              {isEditMode
                ? isUpdatingPdf
                  ? "Saving..."
                  : "Save Changes"
                : isCreatingSession
                  ? "Creating session..."
                  : isUploadingStorage
                    ? "Uploading file..."
                    : isFinalizingSession
                      ? "Finalizing..."
                      : "Upload PDF"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
