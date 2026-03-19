"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useModal } from "@/components/ui/modal-store";
import {
  useDeleteVideoTranscript,
  useSaveVideoTranscript,
  useVideoTranscript,
} from "@/features/videos/hooks/use-videos";
import type { Video } from "@/features/videos/types/video";
import { useTranslation } from "@/features/localization";
import {
  getAdminApiFirstFieldError,
  getAdminApiErrorMessage,
  getAdminResponseMessage,
} from "@/lib/admin-response";
import { resolveVideoTranscriptReadiness } from "@/lib/ai-source-readiness";

type VideoTranscriptPanelProps = {
  centerId?: string | number | null;
  video?: Video | null;
};

function transcriptBadgeVariant(readinessKey: "ready" | "missing" | "unknown") {
  if (readinessKey === "ready") return "success" as const;
  if (readinessKey === "missing") return "warning" as const;
  return "secondary" as const;
}

function validateTranscriptFile(file: File | null): string | null {
  if (!file) return null;

  const extension = file.name.split(".").pop()?.trim().toLowerCase() ?? "";
  const mimeType = file.type.trim().toLowerCase();
  const allowedExtensions = new Set(["txt", "vtt", "srt"]);
  const allowedMimeTypes = new Set([
    "",
    "text/plain",
    "text/vtt",
    "application/x-subrip",
    "application/octet-stream",
  ]);

  if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(mimeType)) {
    return "unsupported";
  }

  return null;
}

export function VideoTranscriptPanel({
  centerId,
  video,
}: VideoTranscriptPanelProps) {
  const { t } = useTranslation();
  const { showToast } = useModal();
  const videoId = video?.id;
  const transcriptQuery = useVideoTranscript(
    centerId ?? undefined,
    videoId ?? undefined,
    {
      enabled: Boolean(centerId && videoId),
    },
  );
  const { mutateAsync: saveTranscript, isPending: isSavingTranscript } =
    useSaveVideoTranscript();
  const { mutateAsync: deleteTranscript, isPending: isDeletingTranscript } =
    useDeleteVideoTranscript();

  const [draftTranscript, setDraftTranscript] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileError, setSelectedFileError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setDraftTranscript(transcriptQuery.data?.transcript ?? "");
    setSelectedFile(null);
    setSelectedFileError(null);
  }, [transcriptQuery.data?.transcript, videoId]);

  const transcriptState = useMemo(
    () => transcriptQuery.data ?? video,
    [transcriptQuery.data, video],
  );
  const readiness = resolveVideoTranscriptReadiness(transcriptState);
  const transcriptFormat =
    transcriptQuery.data?.transcript_format ?? video?.transcript_format ?? null;
  const transcriptSource =
    transcriptQuery.data?.transcript_source ?? video?.transcript_source ?? null;
  const transcriptSourceLabel =
    transcriptSource === "manual"
      ? t("pages.videos.dialogs.details.transcript.source.manual")
      : transcriptSource;
  const hasTranscript =
    transcriptQuery.data?.has_transcript ?? video?.has_transcript ?? false;

  const isBusy = isSavingTranscript || isDeletingTranscript;

  const handleSaveText = async () => {
    if (!centerId || !videoId || !draftTranscript.trim()) {
      return;
    }

    try {
      const response = await saveTranscript({
        centerId,
        videoId,
        payload: { transcript_text: draftTranscript.trim() },
      });
      showToast(
        getAdminResponseMessage(
          response,
          t("pages.videos.dialogs.details.transcript.toasts.saved"),
        ),
        "success",
      );
    } catch (error) {
      showToast(
        getAdminApiFirstFieldError(error) ??
          getAdminApiErrorMessage(
            error,
            t("pages.videos.dialogs.details.transcript.errors.saveFailed"),
          ),
        "error",
      );
    }
  };

  const handleUploadFile = async () => {
    if (!centerId || !videoId || !selectedFile || selectedFileError) {
      return;
    }

    try {
      const response = await saveTranscript({
        centerId,
        videoId,
        payload: {
          file: selectedFile,
          filename: selectedFile.name,
        },
      });
      showToast(
        getAdminResponseMessage(
          response,
          t("pages.videos.dialogs.details.transcript.toasts.saved"),
        ),
        "success",
      );
      setSelectedFile(null);
    } catch (error) {
      showToast(
        getAdminApiFirstFieldError(error) ??
          getAdminApiErrorMessage(
            error,
            t("pages.videos.dialogs.details.transcript.errors.saveFailed"),
          ),
        "error",
      );
    }
  };

  const handleDelete = async () => {
    if (!centerId || !videoId || !hasTranscript) {
      return;
    }

    try {
      const response = await deleteTranscript({ centerId, videoId });
      showToast(
        getAdminResponseMessage(
          response,
          t("pages.videos.dialogs.details.transcript.toasts.deleted"),
        ),
        "success",
      );
      setDraftTranscript("");
      setSelectedFile(null);
    } catch (error) {
      showToast(
        getAdminApiErrorMessage(
          error,
          t("pages.videos.dialogs.details.transcript.errors.deleteFailed"),
        ),
        "error",
      );
    }
  };

  return (
    <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs text-gray-500">
            {t("pages.videos.dialogs.details.fields.transcript")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={transcriptBadgeVariant(readiness.key)}>
              {t(
                `pages.videos.dialogs.details.transcript.status.${readiness.key}`,
              )}
            </Badge>
            {transcriptFormat ? (
              <Badge variant="secondary" className="uppercase">
                {transcriptFormat}
              </Badge>
            ) : null}
            {transcriptSource ? (
              <Badge variant="secondary">{transcriptSourceLabel}</Badge>
            ) : null}
          </div>
        </div>
        {hasTranscript ? (
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-600"
            disabled={isBusy}
            onClick={() => void handleDelete()}
          >
            {t("pages.videos.dialogs.details.transcript.actions.delete")}
          </Button>
        ) : null}
      </div>

      {readiness.key === "missing" ? (
        <Alert>
          <AlertTitle>
            {t("pages.videos.dialogs.details.transcript.missingTitle")}
          </AlertTitle>
          <AlertDescription>
            {t("pages.videos.dialogs.details.transcript.missingDescription")}
          </AlertDescription>
        </Alert>
      ) : null}

      {transcriptQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>
            {t("pages.videos.dialogs.details.transcript.errors.loadTitle")}
          </AlertTitle>
          <AlertDescription>
            {t("pages.videos.dialogs.details.transcript.errors.loadFailed")}
          </AlertDescription>
        </Alert>
      ) : null}

      {selectedFileError ? (
        <Alert variant="destructive">
          <AlertDescription>{selectedFileError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Textarea
          value={draftTranscript}
          onChange={(event) => setDraftTranscript(event.target.value)}
          rows={8}
          disabled={isBusy || transcriptQuery.isLoading}
          placeholder={t("pages.videos.dialogs.details.transcript.placeholder")}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => void handleSaveText()}
            disabled={isBusy || !draftTranscript.trim()}
          >
            {isSavingTranscript
              ? t("pages.videos.dialogs.details.transcript.actions.saving")
              : t("pages.videos.dialogs.details.transcript.actions.saveText")}
          </Button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t("pages.videos.dialogs.details.transcript.textHint")}
          </span>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-700">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {t("pages.videos.dialogs.details.transcript.uploadTitle")}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("pages.videos.dialogs.details.transcript.uploadHint")}
          </p>
        </div>
        <input
          type="file"
          accept=".txt,.vtt,.srt,text/plain,text/vtt,application/x-subrip"
          disabled={isBusy}
          onChange={(event) => {
            const nextFile = event.target.files?.[0] ?? null;
            const nextError = validateTranscriptFile(nextFile);
            setSelectedFile(nextError ? null : nextFile);
            setSelectedFileError(
              nextError
                ? t(
                    "pages.videos.dialogs.details.transcript.errors.unsupportedFile",
                  )
                : null,
            );
          }}
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 dark:text-gray-300 dark:file:bg-gray-800 dark:file:text-gray-200"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleUploadFile()}
            disabled={isBusy || !selectedFile || !!selectedFileError}
          >
            {isSavingTranscript
              ? t("pages.videos.dialogs.details.transcript.actions.uploading")
              : t("pages.videos.dialogs.details.transcript.actions.uploadFile")}
          </Button>
          {selectedFile ? (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {selectedFile.name}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
