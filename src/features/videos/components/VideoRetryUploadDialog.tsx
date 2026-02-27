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
import type { Video, VideoUploadSession } from "@/features/videos/types/video";
import {
  getAdminApiErrorMessage,
  getAdminResponseMessage,
} from "@/lib/admin-response";

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
    "video"
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
  const videoTitle = resolveVideoTitle(video);

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
      setUploadStatusText("Upload paused.");
      updateGlobalUpload(activeUploadId, {
        phase: "paused",
        statusText: "Upload paused.",
      });
    } catch (error) {
      const message = getAdminApiErrorMessage(error, "Failed to pause upload.");
      setFormError(message);
      showToast(message, "error");
    }
  };

  const handleResume = async () => {
    if (!activeUploadId) return;
    try {
      await resumeGlobalUpload(activeUploadId);
      setUploadPhase("uploading");
      setUploadStatusText("Uploading video...");
      updateGlobalUpload(activeUploadId, {
        phase: "uploading",
        statusText: "Uploading video...",
      });
    } catch (error) {
      const message = getAdminApiErrorMessage(
        error,
        "Failed to resume upload.",
      );
      setFormError(message);
      showToast(message, "error");
    }
  };

  const handleRetry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) return;

    if (!centerId || !video?.id) {
      setFormError("Select a center-scoped video before retrying upload.");
      return;
    }

    if (!file) {
      setFormError("Select a video file to upload.");
      return;
    }

    if (!isVideoFile(file)) {
      setFormError("Selected file must be a video.");
      return;
    }

    setFormError(null);
    setUploadPhase("creating");
    setUploadProgress(0);
    setUploadStatusText("Creating upload session...");
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
        throw new Error("Upload endpoint is missing from upload session.");
      }

      const sessionId = resolveUploadSessionId(createdSession);
      setUploadSessionId(sessionId);
      setUploadPhase("uploading");
      setUploadStatusText("Uploading video...");
      const uploadId = startGlobalUpload({
        centerId,
        videoId: video.id,
        source: "retry",
        fileName: file.name,
        uploadSessionId: sessionId,
        phase: "uploading",
        statusText: "Uploading video...",
      });
      createdUploadId = uploadId;
      setActiveUploadId(uploadId);

      const uploadController = createTusUploadController({
        file,
        uploadEndpoint,
        fingerprintKey: sessionId ?? `video:${String(video.id)}`,
        presignedHeaders: createdSession.presigned_headers ?? null,
        onProgress: ({ percentage }) => {
          if (isMountedRef.current) {
            setUploadProgress(percentage);
            setUploadPhase("uploading");
            setUploadStatusText("Uploading video...");
          }
          updateGlobalUpload(uploadId, {
            progress: percentage,
            phase: "uploading",
            statusText: "Uploading video...",
          });
        },
        onError: (uploadError) => {
          const message = uploadError.message || "Video upload failed.";
          if (isMountedRef.current) {
            setUploadPhase("failed");
            setFormError(message);
          }
          updateGlobalUpload(uploadId, {
            phase: "failed",
            statusText: message,
          });
          showToast(message, "error");
        },
        onSuccess: () => {
          if (isMountedRef.current) {
            setUploadProgress(100);
            setUploadPhase("processing");
            setUploadStatusText("Upload complete. Processing started...");
          }
          updateGlobalUpload(uploadId, {
            progress: 100,
            phase: "processing",
            statusText: "Upload complete. Processing started...",
          });
          const successMessage = getAdminResponseMessage(
            createdSession,
            "Uploaded. Processing started.",
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
        "Unable to start upload retry.",
      );
      if (isMountedRef.current) {
        setUploadPhase("failed");
        setFormError(message);
      }
      if (createdUploadId) {
        updateGlobalUpload(createdUploadId, {
          phase: "failed",
          statusText: message,
        });
      }
      showToast(message, "error");
    }
  };

  const submitLabel = (() => {
    if (createSessionMutation.isPending || isCreatingUpload)
      return "Creating Session...";
    if (isUploading) return "Uploading...";
    if (isProcessing) return "Processing...";
    if (uploadPhase === "failed") return "Retry Upload";
    return "Start Retry Upload";
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
          <DialogTitle>Retry Upload</DialogTitle>
          <DialogDescription>
            Upload a new file for{" "}
            <span className="font-medium">{videoTitle}</span> using resumable
            TUS upload.
          </DialogDescription>
        </DialogHeader>

        {formError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
            {formError}
          </div>
        ) : null}

        <form onSubmit={handleRetry} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-retry-file">Video File *</Label>
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
                <span>{uploadStatusText || "Preparing upload..."}</span>
                <span>{uploadProgress.toFixed(1)}%</span>
              </div>
              <Progress value={uploadProgress} />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handlePause}
                  disabled={!canPause}
                >
                  Pause
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleResume}
                  disabled={!canResume}
                >
                  Resume
                </Button>
                {uploadSessionId != null ? (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Session #{String(uploadSessionId)}
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
              {isBusy ? "Minimize" : "Cancel"}
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
