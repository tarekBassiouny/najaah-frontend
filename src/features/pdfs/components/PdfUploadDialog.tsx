"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useModal } from "@/components/ui/modal-store";
import { usePdfUpload } from "@/features/pdfs/context/pdf-upload-context";
import {
  useCreatePdf,
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
  formatBytesPerSecond,
  formatEtaSeconds,
} from "@/features/videos/lib/upload-metrics";
import {
  getAdminApiErrorMessage,
  getAdminResponseMessage,
} from "@/lib/admin-response";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/features/localization";

type PdfUploadDialogProps = {
  centerId: string | number;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  pdf?: Pdf | null;
  onSuccess?: (_message: string) => void;
  onUploaded?: (_message: string) => void;
};

type UploadPhase =
  | "idle"
  | "creating"
  | "uploading"
  | "finalizing"
  | "ready"
  | "failed";

type PdfSourceMode = "upload" | "url";
const PDF_MIME_LABEL = "application/pdf";

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

function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

function isPdfFile(file: File) {
  const name = file.name.toLowerCase();
  return file.type === "application/pdf" || name.endsWith(".pdf");
}

function isUploadCanceled(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }
  const maybeError = error as { code?: unknown; name?: unknown };
  return (
    maybeError.code === "ERR_CANCELED" || maybeError.name === "CanceledError"
  );
}

function formatFileSize(bytes: number) {
  if (bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  const precision = value >= 100 || exponent === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[exponent]}`;
}

export function PdfUploadDialog({
  centerId,
  open,
  onOpenChange,
  pdf,
  onSuccess,
  onUploaded,
}: PdfUploadDialogProps) {
  const { t } = useTranslation();
  const { showToast } = useModal();
  const isEditMode = Boolean(pdf);
  const createPdfMutation = useCreatePdf();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isMountedRef = useRef(false);
  const uploadAbortControllerRef = useRef<AbortController | null>(null);
  const wasStoppedByUserRef = useRef(false);
  const {
    startUpload: startGlobalUpload,
    updateUpload: updateGlobalUpload,
    attachAbortController: attachGlobalAbortController,
    minimize: minimizeGlobalUpload,
    stopUpload: stopGlobalUpload,
  } = usePdfUpload();

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
  const [sourceMode, setSourceMode] = useState<PdfSourceMode>("upload");
  const [sourceUrl, setSourceUrl] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeedBps, setUploadSpeedBps] = useState<number | null>(null);
  const [uploadEtaSeconds, setUploadEtaSeconds] = useState<number | null>(null);
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [uploadSessionId, setUploadSessionId] = useState<
    string | number | null
  >(null);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const isMutating =
    isCreatingSession ||
    isFinalizingSession ||
    isUpdatingPdf ||
    createPdfMutation.isPending;
  const hasActiveUpload =
    uploadPhase === "creating" ||
    uploadPhase === "uploading" ||
    uploadPhase === "finalizing";
  const isBusy = isMutating || hasActiveUpload;
  const creatingSessionText = t(
    "pages.pdfs.dialogs.upload.status.creatingUploadSession",
  );
  const uploadingText = t("pages.pdfs.dialogs.upload.status.uploadingPdf");
  const uploadCompleteText = t(
    "pages.pdfs.dialogs.upload.status.uploadCompleteFinalizing",
  );
  const preparingUploadText = t(
    "pages.pdfs.dialogs.upload.status.preparingUpload",
  );

  const selectedFileLabel = useMemo(() => {
    if (!file) return "";
    return `${file.name} (${formatFileSize(file.size)})`;
  }, [file]);
  const parsedTags = useMemo(() => parseTags(tagsInput), [tagsInput]);

  const resetCreateState = useCallback(() => {
    setFile(null);
    setSourceMode("upload");
    setSourceUrl("");
    setTitleEn("");
    setTitleAr("");
    setDescriptionEn("");
    setDescriptionAr("");
    setTagsInput("");
    setFormError(null);
    setUploadPhase("idle");
    setUploadProgress(0);
    setUploadSpeedBps(null);
    setUploadEtaSeconds(null);
    setUploadStatusText("");
    setUploadSessionId(null);
    setActiveUploadId(null);
    setIsDragActive(false);
    uploadAbortControllerRef.current = null;
    wasStoppedByUserRef.current = false;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    setFormError(null);
    setIsDragActive(false);

    if (isEditMode && pdf) {
      setFile(null);
      setTitleEn(String(pdf.title_translations?.en ?? pdf.title ?? ""));
      setTitleAr(String(pdf.title_translations?.ar ?? ""));
      setDescriptionEn(
        String(pdf.description_translations?.en ?? pdf.description ?? ""),
      );
      setDescriptionAr(String(pdf.description_translations?.ar ?? ""));
      setTagsInput(Array.isArray(pdf.tags) ? pdf.tags.join(", ") : "");
      setUploadPhase("idle");
      setUploadProgress(0);
      setUploadSpeedBps(null);
      setUploadEtaSeconds(null);
      setUploadStatusText("");
      setUploadSessionId(null);
      setActiveUploadId(null);
      return;
    }

    resetCreateState();
  }, [open, isEditMode, pdf, resetCreateState]);

  const handleMinimizeUpload = () => {
    minimizeGlobalUpload();
    onOpenChange(false);
  };

  const handleStopUpload = async () => {
    try {
      wasStoppedByUserRef.current = true;
      if (activeUploadId) {
        await stopGlobalUpload(activeUploadId);
      } else if (uploadAbortControllerRef.current) {
        uploadAbortControllerRef.current.abort();
      }

      const message = t("pages.pdfs.dialogs.upload.messages.uploadStopped");
      showToast(message, "success");
      resetCreateState();
      onOpenChange(false);
    } catch (error) {
      const message = getAdminApiErrorMessage(
        error,
        t("pages.pdfs.dialogs.upload.errors.stopUploadFailed"),
      );
      setFormError(message);
      showToast(message, "error");
    }
  };

  const applySelectedFile = (nextFile: File | null) => {
    setFile(nextFile);
    setIsDragActive(false);
    setFormError(null);
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && hasActiveUpload) {
      handleMinimizeUpload();
      return;
    }

    if (!nextOpen && isMutating) {
      return;
    }

    if (!nextOpen && !isEditMode) {
      resetCreateState();
    }

    onOpenChange(nextOpen);
  };

  const submitLabel = (() => {
    if (isEditMode) {
      return isUpdatingPdf
        ? t("common.actions.saving")
        : t("pages.pdfs.dialogs.upload.actions.saveChanges");
    }
    if (sourceMode === "url") {
      return createPdfMutation.isPending
        ? t("pages.pdfs.dialogs.upload.actions.creating")
        : t("pages.pdfs.dialogs.upload.actions.createPdf");
    }
    if (uploadPhase === "creating" || isCreatingSession) {
      return t("pages.pdfs.dialogs.upload.actions.creatingSession");
    }
    if (uploadPhase === "uploading") {
      return t("pages.pdfs.dialogs.upload.actions.uploading");
    }
    if (uploadPhase === "finalizing" || isFinalizingSession) {
      return t("pages.pdfs.dialogs.upload.actions.finalizing");
    }
    if (uploadPhase === "failed") {
      return t("pages.pdfs.dialogs.upload.actions.retryUpload");
    }
    return t("pages.pdfs.dialogs.upload.actions.createAndUpload");
  })();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) return;

    const normalizedTitleEn = titleEn.trim();
    if (!normalizedTitleEn) {
      setFormError(t("pages.pdfs.dialogs.upload.errors.englishTitleRequired"));
      return;
    }

    setFormError(null);
    const titleTranslations = buildTranslations(titleEn, titleAr);
    const descriptionTranslations = buildTranslations(
      descriptionEn,
      descriptionAr,
    );
    const tags = parseTags(tagsInput);
    let currentUploadId: string | null = null;

    try {
      if (isEditMode && pdf) {
        const updatedPdf = await updatePdfAsync({
          centerId,
          pdfId: pdf.id,
          payload: {
            title_translations: titleTranslations,
            description_translations: descriptionTranslations,
            tags,
          },
        });

        const successMessage = getAdminResponseMessage(
          updatedPdf,
          t("pages.pdfs.dialogs.upload.messages.updated"),
        );
        showToast(successMessage, "success");
        onSuccess?.(successMessage);
        onUploaded?.(successMessage);
        onOpenChange(false);
        return;
      }

      if (sourceMode === "url") {
        const normalizedUrl = sourceUrl.trim();
        if (!normalizedUrl) {
          setFormError(t("pages.pdfs.dialogs.upload.errors.urlRequired"));
          return;
        }

        try {
          new URL(normalizedUrl);
        } catch {
          setFormError(t("pages.pdfs.dialogs.upload.errors.urlInvalid"));
          return;
        }

        const createdPdf = await createPdfMutation.mutateAsync({
          centerId,
          payload: {
            source_type: "url",
            source_provider: "custom",
            source_url: normalizedUrl,
            title_translations: titleTranslations,
            tags,
            ...(Object.keys(descriptionTranslations).length > 0
              ? { description_translations: descriptionTranslations }
              : {}),
          },
        });

        const successMessage = getAdminResponseMessage(
          createdPdf,
          t("pages.pdfs.dialogs.upload.messages.created"),
        );
        showToast(successMessage, "success");
        onSuccess?.(successMessage);
        onUploaded?.(successMessage);
        onOpenChange(false);
        return;
      }

      if (!file) {
        setFormError(t("pages.pdfs.dialogs.upload.errors.fileRequired"));
        return;
      }

      if (!isPdfFile(file)) {
        setFormError(t("pages.pdfs.dialogs.upload.errors.invalidFileType"));
        return;
      }

      setUploadPhase("creating");
      setUploadProgress(0);
      setUploadSpeedBps(null);
      setUploadEtaSeconds(null);
      setUploadStatusText(creatingSessionText);

      const fileSizeKb = Math.max(1, Math.ceil(file.size / 1024));
      const session = await createUploadSessionAsync({
        centerId,
        payload: {
          original_filename: file.name,
          file_size_kb: fileSizeKb,
        },
      });

      const currentUploadSessionId = resolveUploadSessionId(session);
      const uploadEndpoint = resolveUploadEndpoint(session);
      if (!currentUploadSessionId || !uploadEndpoint) {
        throw new Error(
          t("pages.pdfs.dialogs.upload.errors.uploadSessionMissingData"),
        );
      }

      setUploadSessionId(currentUploadSessionId);
      setUploadPhase("uploading");
      setUploadStatusText(uploadingText);

      currentUploadId = startGlobalUpload({
        centerId,
        fileName: file.name,
        uploadSessionId: currentUploadSessionId,
        phase: "uploading",
        statusText: uploadingText,
      });
      setActiveUploadId(currentUploadId);

      const abortController = new AbortController();
      uploadAbortControllerRef.current = abortController;
      attachGlobalAbortController(currentUploadId, abortController);

      await uploadPdfToStorage(
        uploadEndpoint,
        file,
        resolveRequiredHeaders(session),
        {
          signal: abortController.signal,
          onProgress: ({ percentage, bytesPerSecond, etaSeconds }) => {
            if (isMountedRef.current) {
              setUploadProgress(percentage);
              setUploadPhase("uploading");
              setUploadStatusText(uploadingText);
              setUploadSpeedBps(bytesPerSecond);
              setUploadEtaSeconds(etaSeconds);
            }
            updateGlobalUpload(currentUploadId!, {
              progress: percentage,
              phase: "uploading",
              statusText: uploadingText,
              bytesPerSecond,
              etaSeconds,
            });
          },
        },
      );

      setUploadPhase("finalizing");
      setUploadStatusText(uploadCompleteText);
      setUploadSpeedBps(null);
      setUploadEtaSeconds(null);
      updateGlobalUpload(currentUploadId, {
        progress: 100,
        phase: "finalizing",
        statusText: uploadCompleteText,
        bytesPerSecond: null,
        etaSeconds: null,
      });

      const finalizePayload: FinalizePdfUploadSessionPayload = {
        title_translations: titleTranslations,
        tags,
        ...(Object.keys(descriptionTranslations).length > 0
          ? { description_translations: descriptionTranslations }
          : {}),
      };

      const finalizedSession = await finalizeUploadSessionAsync({
        centerId,
        uploadSessionId: currentUploadSessionId,
        payload: finalizePayload,
      });

      if (Number(finalizedSession.upload_status) === 3) {
        throw new Error(
          finalizedSession.error_message ||
            t("pages.pdfs.dialogs.upload.errors.finalizedFailedStatus"),
        );
      }

      const successMessage = getAdminResponseMessage(
        finalizedSession,
        t("pages.pdfs.dialogs.upload.messages.uploaded"),
      );
      showToast(successMessage, "success");
      onSuccess?.(successMessage);
      onUploaded?.(successMessage);

      updateGlobalUpload(currentUploadId, {
        progress: 100,
        phase: "ready",
        statusText: successMessage,
        bytesPerSecond: null,
        etaSeconds: null,
      });
      attachGlobalAbortController(currentUploadId, null);
      setActiveUploadId(null);
      uploadAbortControllerRef.current = null;

      if (isMountedRef.current) {
        resetCreateState();
        onOpenChange(false);
      }
    } catch (error) {
      const uploadWasCanceled = isUploadCanceled(error);
      if (uploadWasCanceled) {
        if (isMountedRef.current) {
          setUploadPhase("idle");
          setUploadProgress(0);
          setUploadSpeedBps(null);
          setUploadEtaSeconds(null);
          setUploadStatusText("");
        }
        wasStoppedByUserRef.current = false;
        return;
      }

      const message =
        error instanceof Error && error.message
          ? error.message
          : getAdminApiErrorMessage(
              error,
              t("pages.pdfs.dialogs.upload.errors.uploadFailed"),
            );

      if (isMountedRef.current) {
        setUploadPhase("failed");
        setFormError(message);
        setUploadSpeedBps(null);
        setUploadEtaSeconds(null);
      }

      const failedUploadId = currentUploadId ?? activeUploadId;
      if (failedUploadId) {
        updateGlobalUpload(failedUploadId, {
          phase: "failed",
          statusText: message,
          bytesPerSecond: null,
          etaSeconds: null,
        });
      }

      showToast(message, "error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader className="space-y-3">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
              PDF
            </div>
            <div className="space-y-1">
              <DialogTitle>
                {isEditMode
                  ? t("pages.pdfs.dialogs.upload.title.edit")
                  : t("pages.pdfs.dialogs.upload.title.create")}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? t("pages.pdfs.dialogs.upload.description.edit")
                  : t("pages.pdfs.dialogs.upload.description.create")}
              </DialogDescription>
              <p className="text-xs text-gray-400">
                {isEditMode
                  ? t("pages.pdfs.dialogs.upload.mode.edit")
                  : t("pages.pdfs.dialogs.upload.mode.create")}
              </p>
            </div>
          </div>
          {isEditMode ? null : (
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                {t("pages.pdfs.dialogs.upload.steps.source")}
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                {t("pages.pdfs.dialogs.upload.steps.metadata")}
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                {t("pages.pdfs.dialogs.upload.steps.uploadOrCreate")}
              </span>
            </div>
          )}
        </DialogHeader>

        {formError ? (
          <Alert variant="destructive">
            <AlertTitle>
              {isEditMode
                ? t("pages.pdfs.dialogs.upload.errors.updateFailedTitle")
                : t("pages.pdfs.dialogs.upload.errors.uploadFailedTitle")}
            </AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isEditMode ? null : (
            <div className="space-y-2">
              <Label>{t("pages.pdfs.dialogs.upload.fields.sourceMode")}</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {(["upload", "url"] as PdfSourceMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={cn(
                      "rounded-xl border px-3 py-3 text-left transition-colors",
                      sourceMode === mode
                        ? "border-primary/50 bg-primary/5 text-primary"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-600",
                    )}
                    onClick={() => {
                      setSourceMode(mode);
                      setFormError(null);
                    }}
                    disabled={isBusy}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                          sourceMode === mode
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300",
                        )}
                      >
                        {mode === "upload" ? "U" : "L"}
                      </span>
                      <span className="text-sm font-semibold">
                        {t(
                          `pages.pdfs.dialogs.upload.sourceMode.${mode}.label`,
                        )}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t(
                        `pages.pdfs.dialogs.upload.sourceMode.${mode}.description`,
                      )}
                    </p>
                    <p className="mt-2 text-[11px] font-medium text-gray-400 dark:text-gray-500">
                      {t("pages.pdfs.dialogs.upload.providerLabel")}:{" "}
                      {t(
                        `pages.pdfs.dialogs.upload.sourceMode.${mode}.provider`,
                      )}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {t("pages.pdfs.dialogs.upload.sections.metadata.title")}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("pages.pdfs.dialogs.upload.sections.metadata.description")}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pdf-title-en">
                  {t("pages.pdfs.dialogs.upload.fields.titleEn")}
                </Label>
                <Input
                  id="pdf-title-en"
                  value={titleEn}
                  onChange={(event) => setTitleEn(event.target.value)}
                  placeholder={t(
                    "pages.pdfs.dialogs.upload.placeholders.titleEn",
                  )}
                  disabled={isBusy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdf-title-ar">
                  {t("pages.pdfs.dialogs.upload.fields.titleAr")}
                </Label>
                <Input
                  id="pdf-title-ar"
                  value={titleAr}
                  onChange={(event) => setTitleAr(event.target.value)}
                  placeholder={t(
                    "pages.pdfs.dialogs.upload.placeholders.titleAr",
                  )}
                  dir="rtl"
                  disabled={isBusy}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pdf-description-en">
                  {t("pages.pdfs.dialogs.upload.fields.descriptionEn")}
                </Label>
                <Textarea
                  id="pdf-description-en"
                  value={descriptionEn}
                  onChange={(event) => setDescriptionEn(event.target.value)}
                  rows={3}
                  disabled={isBusy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdf-description-ar">
                  {t("pages.pdfs.dialogs.upload.fields.descriptionAr")}
                </Label>
                <Textarea
                  id="pdf-description-ar"
                  value={descriptionAr}
                  onChange={(event) => setDescriptionAr(event.target.value)}
                  rows={3}
                  dir="rtl"
                  disabled={isBusy}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdf-tags">
                {t("pages.pdfs.dialogs.upload.fields.tags")}
              </Label>
              <Input
                id="pdf-tags"
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                placeholder={t("pages.pdfs.dialogs.upload.placeholders.tags")}
                disabled={isBusy}
              />
              {parsedTags.length > 0 ? (
                <div className="flex flex-wrap gap-1 pt-1">
                  {parsedTags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                  {parsedTags.length > 4 ? (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      +{parsedTags.length - 4}
                    </span>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("pages.pdfs.dialogs.upload.hints.tags")}
                </p>
              )}
            </div>
          </section>

          {!isEditMode && sourceMode === "url" ? (
            <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {t("pages.pdfs.dialogs.upload.sections.urlSource.title")}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t(
                    "pages.pdfs.dialogs.upload.sections.urlSource.description",
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pdf-source-url">
                  {t("pages.pdfs.dialogs.upload.fields.pdfUrl")}
                </Label>
                <Input
                  id="pdf-source-url"
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  placeholder={t(
                    "pages.pdfs.dialogs.upload.placeholders.pdfUrl",
                  )}
                  disabled={isBusy}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("pages.pdfs.dialogs.upload.hints.pdfUrl")}
                </p>
              </div>
            </section>
          ) : null}

          {!isEditMode && sourceMode === "upload" ? (
            <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {t("pages.pdfs.dialogs.upload.sections.uploadSource.title")}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t(
                    "pages.pdfs.dialogs.upload.sections.uploadSource.description",
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pdf-upload-file">
                  {t("pages.pdfs.dialogs.upload.fields.pdfFile")}
                </Label>
                <input
                  ref={fileInputRef}
                  id="pdf-upload-file"
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  onChange={(event) => {
                    applySelectedFile(event.target.files?.[0] ?? null);
                  }}
                  disabled={isBusy}
                />
                <div
                  role="button"
                  tabIndex={isBusy ? -1 : 0}
                  onClick={() => {
                    if (!isBusy) fileInputRef.current?.click();
                  }}
                  onKeyDown={(event) => {
                    if (isBusy) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    if (!isBusy) setIsDragActive(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (!isBusy) setIsDragActive(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setIsDragActive(false);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (isBusy) return;
                    setIsDragActive(false);
                    const droppedFile = event.dataTransfer.files?.[0] ?? null;
                    applySelectedFile(droppedFile);
                  }}
                  className={cn(
                    "rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600",
                    isBusy && "cursor-not-allowed opacity-70",
                  )}
                >
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {file
                      ? t(
                          "pages.pdfs.dialogs.upload.actions.replaceSelectedFile",
                        )
                      : t("pages.pdfs.dialogs.upload.actions.dropPdfFile")}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t("pages.pdfs.dialogs.upload.hints.browseFromDevice")}
                  </p>
                  <div className="mt-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isBusy}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!isBusy) fileInputRef.current?.click();
                      }}
                    >
                      {t("pages.pdfs.dialogs.upload.actions.browseFile")}
                    </Button>
                  </div>
                </div>
              </div>

              {file ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-900/50">
                  <p className="font-medium text-gray-700 dark:text-gray-200">
                    {file.name}
                  </p>
                  <p className="mt-0.5 text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)} • {PDF_MIME_LABEL}
                  </p>
                </div>
              ) : null}

              {uploadPhase !== "idle" ? (
                <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                      {t(
                        `pages.pdfs.dialogs.upload.uploadPhase.${uploadPhase}`,
                      )}
                    </span>
                    <span>{uploadProgress.toFixed(1)}%</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    {uploadStatusText || preparingUploadText}
                  </div>
                  <Progress value={uploadProgress} />
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      {t("pages.pdfs.dialogs.upload.metrics.speed")}:{" "}
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        {formatBytesPerSecond(uploadSpeedBps)}
                      </span>
                    </span>
                    <span>
                      {t("pages.pdfs.dialogs.upload.metrics.eta")}:{" "}
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        {formatEtaSeconds(uploadEtaSeconds)}
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleStopUpload}
                      className="text-red-600 hover:text-red-700"
                      disabled={!hasActiveUpload}
                    >
                      {t("pages.pdfs.dialogs.upload.actions.stop")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleMinimizeUpload}
                      disabled={!hasActiveUpload}
                    >
                      {t("pages.pdfs.dialogs.upload.actions.minimize")}
                    </Button>
                    {uploadSessionId != null ? (
                      <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                        {t("pages.pdfs.dialogs.upload.session", {
                          id: String(uploadSessionId),
                        })}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {selectedFileLabel ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("pages.pdfs.dialogs.upload.selectedLabel", {
                    value: selectedFileLabel,
                  })}
                </p>
              ) : null}
            </section>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogOpenChange(false)}
            >
              {hasActiveUpload
                ? t("pages.pdfs.dialogs.upload.actions.minimize")
                : t("common.actions.cancel")}
            </Button>
            <Button type="submit" disabled={isBusy}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
