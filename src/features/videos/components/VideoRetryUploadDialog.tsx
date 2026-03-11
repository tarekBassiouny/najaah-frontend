"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { useModal } from "@/components/ui/modal-store";
import { useVideoUpload } from "@/features/videos/context/video-upload-context";
import { useCreateVideoUploadSession } from "@/features/videos/hooks/use-videos";
import {
  createTusUploadController,
  type TusUploadController,
} from "@/features/videos/lib/tus-upload";
import {
  formatBytesPerSecond,
  formatEtaSeconds,
} from "@/features/videos/lib/upload-metrics";
import type { Video, VideoUploadSession } from "@/features/videos/types/video";
import {
  getAdminApiErrorMessage,
  getAdminResponseMessage,
} from "@/lib/admin-response";
import { useTranslation } from "@/features/localization";

type UploadPhase =
  | "idle"
  | "creating"
  | "uploading"
  | "paused"
  | "processing"
  | "ready"
  | "failed";

type VideoRetryUploadDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  video?: Video | null;
  centerId?: string | number | null;
  onSuccess?: (_message: string) => void;
};

function resolveVideoTitle(video?: Video | null) {
  return (
    video?.title ??
    video?.title_translations?.en ??
    video?.title_translations?.ar ??
    null
  );
}

function resolveUploadSessionId(session: VideoUploadSession) {
  return (session.upload_session_id ?? session.id ?? null) as
    | string
    | number
    | null;
}

function resolveUploadEndpoint(session: VideoUploadSession) {
  const candidate = session.upload_endpoint ?? session.upload_url;
  return typeof candidate === "string" && candidate.trim()
    ? candidate.trim()
    : null;
}

function isVideoFile(file: File) {
  return file.type.startsWith("video/");
}

export function VideoRetryUploadDialog({
  open,
  onOpenChange,
  video,
  centerId,
  onSuccess,
}: VideoRetryUploadDialogProps) {
  const { t } = useTranslation();
  const { showToast } = useModal();
  const createSessionMutation = useCreateVideoUploadSession();
  const uploadControllerRef = useRef<TusUploadController | null>(null);
  const isMountedRef = useRef(false);
  const {
    startUpload: startGlobalUpload,
    updateUpload: updateGlobalUpload,
    attachController: attachGlobalController,
    pauseUpload: pauseGlobalUpload,
    resumeUpload: resumeGlobalUpload,
    minimize: minimizeGlobalUpload,
  } = useVideoUpload();

  const [file, setFile] = useState<File | null>(null);
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

  const isCreatingUpload = uploadPhase === "creating";
  const isUploading = uploadPhase === "uploading";
  const isProcessing = uploadPhase === "processing";
  const isPaused = uploadPhase === "paused";
  const isBusy =
    createSessionMutation.isPending ||
    isCreatingUpload ||
    isUploading ||
    isProcessing ||
    isPaused;
  const canPause = uploadPhase === "uploading";
  const canResume = uploadPhase === "paused";
  const videoTitle =
    resolveVideoTitle(video) ??
    t("pages.videos.dialogs.retryUpload.videoFallback");
  const uploadPausedText = t(
    "pages.videos.dialogs.retryUpload.status.uploadPaused",
  );
  const uploadingText = t("pages.videos.dialogs.retryUpload.status.uploading");
  const creatingSessionText = t(
    "pages.videos.dialogs.retryUpload.status.creatingSession",
  );
  const processingText = t(
    "pages.videos.dialogs.retryUpload.status.processing",
  );
  const preparingUploadText = t(
    "pages.videos.dialogs.retryUpload.status.preparingUpload",
  );

  const stopUploadLifecycle = useCallback(async () => {
    if (uploadControllerRef.current) {
      try {
        await uploadControllerRef.current.abort();
      } catch {
        // Ignore cancel errors.
      }
      uploadControllerRef.current = null;
    }
    if (activeUploadId) {
      attachGlobalController(activeUploadId, null);
    }
  }, [activeUploadId, attachGlobalController]);

  const resetState = useCallback(() => {
    setFile(null);
    setFormError(null);
    setUploadPhase("idle");
    setUploadProgress(0);
    setUploadSpeedBps(null);
    setUploadEtaSeconds(null);
    setUploadStatusText("");
    setUploadSessionId(null);
    setActiveUploadId(null);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    resetState();
  }, [open, resetState]);

  const handlePause = async () => {
    if (!activeUploadId) return;
    try {
      await pauseGlobalUpload(activeUploadId);
      setUploadPhase("paused");
      setUploadStatusText(uploadPausedText);
      setUploadSpeedBps(null);
      setUploadEtaSeconds(null);
      updateGlobalUpload(activeUploadId, {
        phase: "paused",
        statusText: uploadPausedText,
        bytesPerSecond: null,
        etaSeconds: null,
      });
    } catch (error) {
      const message = getAdminApiErrorMessage(
        error,
        t("pages.videos.dialogs.retryUpload.errors.pauseFailed"),
      );
      setFormError(message);
      showToast(message, "error");
    }
  };

  const handleResume = async () => {
    if (!activeUploadId) return;
    try {
      await resumeGlobalUpload(activeUploadId);
      setUploadPhase("uploading");
      setUploadStatusText(uploadingText);
      setUploadSpeedBps(null);
      setUploadEtaSeconds(null);
      updateGlobalUpload(activeUploadId, {
        phase: "uploading",
        statusText: uploadingText,
        bytesPerSecond: null,
        etaSeconds: null,
      });
    } catch (error) {
      const message = getAdminApiErrorMessage(
        error,
        t("pages.videos.dialogs.retryUpload.errors.resumeFailed"),
      );
      setFormError(message);
      showToast(message, "error");
    }
  };

  const handleRetry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) return;

    if (!centerId || !video?.id) {
      setFormError(
        t("pages.videos.dialogs.retryUpload.errors.missingCenterVideo"),
      );
      return;
    }

    if (!file) {
      setFormError(t("pages.videos.dialogs.retryUpload.errors.missingFile"));
      return;
    }

    if (!isVideoFile(file)) {
      setFormError(t("pages.videos.dialogs.retryUpload.errors.invalidFile"));
      return;
    }

    setFormError(null);
    setUploadPhase("creating");
    setUploadProgress(0);
    setUploadSpeedBps(null);
    setUploadEtaSeconds(null);
    setUploadStatusText(creatingSessionText);
    let createdUploadId: string | null = null;

    try {
      const createdSession = await createSessionMutation.mutateAsync({
        centerId,
        payload: {
          video_id: video.id,
          original_filename: file.name,
        },
      });

      const uploadEndpoint = resolveUploadEndpoint(createdSession);
      if (!uploadEndpoint) {
        throw new Error(
          t("pages.videos.dialogs.retryUpload.errors.missingEndpoint"),
        );
      }

      const sessionId = resolveUploadSessionId(createdSession);
      setUploadSessionId(sessionId);
      setUploadPhase("uploading");
      setUploadStatusText(uploadingText);
      const uploadId = startGlobalUpload({
        centerId,
        videoId: video.id,
        source: "retry",
        fileName: file.name,
        uploadSessionId: sessionId,
        phase: "uploading",
        statusText: uploadingText,
      });
      createdUploadId = uploadId;
      setActiveUploadId(uploadId);

      const uploadController = createTusUploadController({
        file,
        uploadEndpoint,
        fingerprintKey: sessionId ?? `video:${String(video.id)}`,
        presignedHeaders: createdSession.presigned_headers ?? null,
        onProgress: ({ percentage, bytesPerSecond, etaSeconds }) => {
          if (isMountedRef.current) {
            setUploadProgress(percentage);
            setUploadPhase("uploading");
            setUploadStatusText(uploadingText);
            setUploadSpeedBps(bytesPerSecond);
            setUploadEtaSeconds(etaSeconds);
          }
          updateGlobalUpload(uploadId, {
            progress: percentage,
            phase: "uploading",
            statusText: uploadingText,
            bytesPerSecond,
            etaSeconds,
          });
        },
        onError: (uploadError) => {
          const message =
            uploadError.message ||
            t("pages.videos.dialogs.retryUpload.errors.uploadFailed");
          if (isMountedRef.current) {
            setUploadPhase("failed");
            setFormError(message);
            setUploadSpeedBps(null);
            setUploadEtaSeconds(null);
          }
          updateGlobalUpload(uploadId, {
            phase: "failed",
            statusText: message,
            bytesPerSecond: null,
            etaSeconds: null,
          });
          showToast(message, "error");
        },
        onSuccess: () => {
          if (isMountedRef.current) {
            setUploadProgress(100);
            setUploadPhase("processing");
            setUploadStatusText(processingText);
            setUploadSpeedBps(null);
            setUploadEtaSeconds(null);
          }
          updateGlobalUpload(uploadId, {
            progress: 100,
            phase: "processing",
            statusText: processingText,
            bytesPerSecond: null,
            etaSeconds: null,
          });
          const successMessage = getAdminResponseMessage(
            createdSession,
            t("pages.videos.dialogs.retryUpload.messages.processingStarted"),
          );
          showToast(successMessage, "success");
          onSuccess?.(successMessage);
          attachGlobalController(uploadId, null);
          setActiveUploadId(null);
          uploadControllerRef.current = null;
          if (isMountedRef.current) {
            resetState();
            onOpenChange(false);
          }
        },
      });

      uploadControllerRef.current = uploadController;
      attachGlobalController(uploadId, uploadController);
      await uploadController.start();
    } catch (error) {
      const message = getAdminApiErrorMessage(
        error,
        t("pages.videos.dialogs.retryUpload.errors.retryStartFailed"),
      );
      if (isMountedRef.current) {
        setUploadPhase("failed");
        setFormError(message);
        setUploadSpeedBps(null);
        setUploadEtaSeconds(null);
      }
      if (createdUploadId) {
        updateGlobalUpload(createdUploadId, {
          phase: "failed",
          statusText: message,
          bytesPerSecond: null,
          etaSeconds: null,
        });
      }
      showToast(message, "error");
    }
  };

  const submitLabel = (() => {
    if (createSessionMutation.isPending || isCreatingUpload)
      return t("pages.videos.dialogs.retryUpload.actions.creatingSession");
    if (isUploading)
      return t("pages.videos.dialogs.retryUpload.actions.uploading");
    if (isProcessing)
      return t("pages.videos.dialogs.retryUpload.actions.processing");
    if (uploadPhase === "failed")
      return t("pages.videos.dialogs.retryUpload.actions.retryUpload");
    return t("pages.videos.dialogs.retryUpload.actions.startRetryUpload");
  })();

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isBusy) {
          minimizeGlobalUpload();
          onOpenChange(false);
          return;
        }
        if (!nextOpen) {
          void stopUploadLifecycle();
          resetState();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {t("pages.videos.dialogs.retryUpload.title")}
          </DialogTitle>
          <DialogDescription>
            {t("pages.videos.dialogs.retryUpload.description", {
              title: videoTitle,
            })}
          </DialogDescription>
        </DialogHeader>

        {formError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
            {formError}
          </div>
        ) : null}

        <form onSubmit={handleRetry} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-retry-file">
              {t("pages.videos.dialogs.retryUpload.fields.videoFile")}
            </Label>
            <Input
              id="video-retry-file"
              type="file"
              accept="video/*"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setFormError(null);
              }}
              disabled={isBusy}
            />
          </div>

          {uploadPhase !== "idle" ? (
            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <div className="flex items-center justify-between gap-2 text-xs text-gray-600 dark:text-gray-300">
                <span>{uploadStatusText || preparingUploadText}</span>
                <span>{uploadProgress.toFixed(1)}%</span>
              </div>
              <Progress value={uploadProgress} />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {t("pages.videos.dialogs.retryUpload.metrics.speed")}:{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {formatBytesPerSecond(uploadSpeedBps)}
                  </span>
                </span>
                <span>
                  {t("pages.videos.dialogs.retryUpload.metrics.eta")}:{" "}
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
                  onClick={handlePause}
                  disabled={!canPause}
                >
                  {t("pages.videos.dialogs.retryUpload.actions.pause")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleResume}
                  disabled={!canResume}
                >
                  {t("pages.videos.dialogs.retryUpload.actions.resume")}
                </Button>
                {uploadSessionId != null ? (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t("pages.videos.dialogs.retryUpload.session", {
                      id: String(uploadSessionId),
                    })}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {isBusy
                ? t("pages.videos.dialogs.retryUpload.actions.minimize")
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
