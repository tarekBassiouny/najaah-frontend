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
import { useVideoUpload } from "@/features/videos/context/video-upload-context";
import {
  useCreateVideo,
  useCreateVideoUpload,
  useUpdateVideo,
} from "@/features/videos/hooks/use-videos";
import {
  createTusUploadController,
  type TusUploadController,
} from "@/features/videos/lib/tus-upload";
import type { Video, VideoSourceMode } from "@/features/videos/types/video";
import {
  getAdminApiErrorMessage,
  getAdminResponseMessage,
} from "@/lib/admin-response";

const REQUIRED_TITLE_MESSAGE = "English title is required.";

type UploadPhase =
  | "idle"
  | "creating"
  | "uploading"
  | "paused"
  | "processing"
  | "ready"
  | "failed";

type VideoFormDialogProps = {
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  centerId?: string | number | null;
  video?: Video | null;
  allowUploadMode?: boolean;
  onSuccess?: (_value: string) => void;
};

function resolveUploadSessionId(videoUploadSession?: {
  upload_session_id?: string | number;
  id?: string | number;
}) {
  return (
    videoUploadSession?.upload_session_id ?? videoUploadSession?.id ?? null
  );
}

function resolveUploadEndpoint(videoUploadSession?: {
  upload_endpoint?: string | null;
  upload_url?: string | null;
}) {
  const candidate =
    videoUploadSession?.upload_endpoint ?? videoUploadSession?.upload_url;
  return typeof candidate === "string" && candidate.trim()
    ? candidate.trim()
    : null;
}

function buildTranslations(
  enValue: string,
  arValue: string,
  options?: { requireEn?: boolean },
) {
  const normalizedEn = enValue.trim();
  const normalizedAr = arValue.trim();

  if (options?.requireEn && !normalizedEn) {
    return null;
  }

  const result: Record<string, string> = {};
  if (normalizedEn) result.en = normalizedEn;
  if (normalizedAr) result.ar = normalizedAr;
  return result;
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

function isVideoFile(file: File) {
  return file.type.startsWith("video/");
}

function resolveModeLabel(sourceMode: VideoSourceMode) {
  return sourceMode === "upload" ? "Upload File" : "Video URL";
}

export function VideoFormDialog({
  open,
  onOpenChange,
  centerId,
  video,
  allowUploadMode = true,
  onSuccess,
}: VideoFormDialogProps) {
  const { showToast } = useModal();
  const isEditMode = Boolean(video);
  const createVideoMutation = useCreateVideo();
  const createUploadVideoMutation = useCreateVideoUpload();
  const updateVideoMutation = useUpdateVideo();
  const uploadControllerRef = useRef<TusUploadController | null>(null);
  const isMountedRef = useRef(false);
  const {
    startUpload: startGlobalUpload,
    updateUpload: updateGlobalUpload,
    attachController: attachGlobalController,
    pauseUpload: pauseGlobalUpload,
    resumeUpload: resumeGlobalUpload,
    minimize: minimizeGlobalUpload,
    stopUpload: stopGlobalUpload,
  } = useVideoUpload();

  const [sourceMode, setSourceMode] = useState<VideoSourceMode>("upload");
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [uploadSessionId, setUploadSessionId] = useState<
    string | number | null
  >(null);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);

  const isMutating =
    createVideoMutation.isPending ||
    createUploadVideoMutation.isPending ||
    updateVideoMutation.isPending;
  const isUploading = uploadPhase === "uploading";
  const isProcessing = uploadPhase === "processing";
  const isCreatingUpload = uploadPhase === "creating";
  const isPaused = uploadPhase === "paused";
  const hasActiveUpload =
    isCreatingUpload || isUploading || isPaused || isProcessing;
  const isBusy = isMutating || hasActiveUpload;
  const canPause = uploadPhase === "uploading";
  const canResume = uploadPhase === "paused";

  const selectedFileLabel = useMemo(() => {
    if (!file) return "";
    const sizeMb = file.size / (1024 * 1024);
    return `${file.name} (${sizeMb.toFixed(sizeMb >= 100 ? 0 : 1)} MB)`;
  }, [file]);

  const stopUploadLifecycle = useCallback(async () => {
    if (uploadControllerRef.current) {
      try {
        await uploadControllerRef.current.abort();
      } catch {
        // Ignore upload abort failures while dialog is resetting.
      }
      uploadControllerRef.current = null;
    }
    if (activeUploadId) {
      attachGlobalController(activeUploadId, null);
    }
  }, [activeUploadId, attachGlobalController]);

  const resetCreateState = useCallback(() => {
    setSourceMode("upload");
    setTitleEn("");
    setTitleAr("");
    setDescriptionEn("");
    setDescriptionAr("");
    setTagsInput("");
    setSourceUrl("");
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

    setFormError(null);
    setUploadPhase("idle");
    setUploadProgress(0);
    setUploadStatusText("");
    setUploadSessionId(null);

    if (isEditMode && video) {
      setSourceMode(allowUploadMode ? "upload" : "url");
      setTitleEn(String(video.title_translations?.en ?? video.title ?? ""));
      setTitleAr(String(video.title_translations?.ar ?? ""));
      setDescriptionEn(
        String(video.description_translations?.en ?? video.description ?? ""),
      );
      setDescriptionAr(String(video.description_translations?.ar ?? ""));
      setTagsInput(Array.isArray(video.tags) ? video.tags.join(", ") : "");
      setSourceUrl("");
      setFile(null);
      return;
    }

    resetCreateState();
    if (!allowUploadMode) {
      setSourceMode("url");
    }
  }, [allowUploadMode, isEditMode, open, resetCreateState, video]);

  const handlePauseUpload = async () => {
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

  const handleResumeUpload = async () => {
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

  const handleMinimizeUpload = () => {
    minimizeGlobalUpload();
    onOpenChange(false);
  };

  const handleStopUpload = async () => {
    try {
      if (activeUploadId) {
        await stopGlobalUpload(activeUploadId);
      }
      uploadControllerRef.current = null;
      const message = "Upload stopped.";
      showToast(message, "success");
      setFormError(null);
      resetCreateState();
      onOpenChange(false);
    } catch (error) {
      const message = getAdminApiErrorMessage(error, "Failed to stop upload.");
      setFormError(message);
      showToast(message, "error");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) return;

    if (!centerId) {
      setFormError("Select a center before creating a video.");
      return;
    }

    setFormError(null);

    const titleTranslations = buildTranslations(titleEn, titleAr, {
      requireEn: true,
    });
    if (!titleTranslations?.en) {
      setFormError(REQUIRED_TITLE_MESSAGE);
      return;
    }
    const normalizedTitleTranslations: { en: string; ar?: string } = {
      en: titleTranslations.en,
      ...(titleTranslations.ar ? { ar: titleTranslations.ar } : {}),
    };

    const descriptionTranslations = buildTranslations(
      descriptionEn,
      descriptionAr,
    );
    const tags = parseTags(tagsInput);

    if (isEditMode && video) {
      try {
        const updatedVideo = await updateVideoMutation.mutateAsync({
          centerId,
          videoId: video.id,
          payload: {
            title_translations: normalizedTitleTranslations,
            ...(descriptionTranslations &&
            Object.keys(descriptionTranslations).length
              ? { description_translations: descriptionTranslations }
              : {}),
            tags,
          },
        });
        const successMessage = getAdminResponseMessage(
          updatedVideo,
          "Video updated successfully.",
        );
        showToast(successMessage, "success");
        onSuccess?.(successMessage);
        onOpenChange(false);
      } catch (error) {
        const message = getAdminApiErrorMessage(
          error,
          "Unable to update video.",
        );
        setFormError(message);
        showToast(message, "error");
      }
      return;
    }

    if (sourceMode === "url" || !allowUploadMode) {
      const normalizedUrl = sourceUrl.trim();
      if (!normalizedUrl) {
        setFormError("Video URL is required for URL mode.");
        return;
      }

      try {
        new URL(normalizedUrl);
      } catch {
        setFormError("Enter a valid video URL.");
        return;
      }

      try {
        const createdVideo = await createVideoMutation.mutateAsync({
          centerId,
          payload: {
            source_type: "url",
            source_url: normalizedUrl,
            title_translations: normalizedTitleTranslations,
            ...(descriptionTranslations &&
            Object.keys(descriptionTranslations).length
              ? { description_translations: descriptionTranslations }
              : {}),
            tags,
          },
        });
        const successMessage = getAdminResponseMessage(
          createdVideo,
          "Video created successfully.",
        );
        showToast(successMessage, "success");
        onSuccess?.(successMessage);
        onOpenChange(false);
      } catch (error) {
        const message = getAdminApiErrorMessage(
          error,
          "Unable to create video.",
        );
        setFormError(message);
        showToast(message, "error");
      }
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

    setUploadPhase("creating");
    setUploadProgress(0);
    setUploadStatusText("Creating upload session...");
    let createdUploadId: string | null = null;

    try {
      const createdUpload = await createUploadVideoMutation.mutateAsync({
        centerId,
        payload: {
          title_translations: normalizedTitleTranslations,
          ...(descriptionTranslations &&
          Object.keys(descriptionTranslations).length
            ? { description_translations: descriptionTranslations }
            : {}),
          tags,
          original_filename: file.name,
          file_size_bytes: file.size,
          mime_type: file.type || "video/mp4",
        },
      });

      const createdVideo = createdUpload.video;
      const uploadSession = createdUpload.upload_session;
      const videoId = createdVideo?.id;
      const uploadEndpoint = resolveUploadEndpoint(uploadSession);

      if (!videoId || !uploadEndpoint) {
        throw new Error("Upload session is missing endpoint or video ID.");
      }

      const sessionId = resolveUploadSessionId(uploadSession);
      setUploadSessionId(sessionId);
      setUploadPhase("uploading");
      setUploadStatusText("Uploading video...");
      const uploadId = startGlobalUpload({
        centerId,
        videoId,
        source: "create",
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
        fingerprintKey: sessionId ?? `video:${String(videoId)}`,
        presignedHeaders: uploadSession?.presigned_headers ?? null,
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
            createdUpload,
            "Uploaded. Processing started.",
          );
          showToast(successMessage, "success");
          onSuccess?.(successMessage);
          attachGlobalController(uploadId, null);
          setActiveUploadId(null);
          uploadControllerRef.current = null;
          if (isMountedRef.current) {
            resetCreateState();
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
        "Unable to start video upload.",
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

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && hasActiveUpload) {
      minimizeGlobalUpload();
      onOpenChange(false);
      return;
    }

    if (!nextOpen) {
      void stopUploadLifecycle();
      resetCreateState();
    }

    onOpenChange(nextOpen);
  };

  const submitLabel = (() => {
    if (isEditMode) {
      return updateVideoMutation.isPending ? "Saving..." : "Save Changes";
    }
    if (sourceMode === "url") {
      return createVideoMutation.isPending ? "Creating..." : "Create Video";
    }
    if (isCreatingUpload || createUploadVideoMutation.isPending) {
      return "Creating Session...";
    }
    if (isUploading) {
      return "Uploading...";
    }
    if (isProcessing) {
      return "Processing...";
    }
    if (uploadPhase === "failed") {
      return "Retry Upload";
    }
    return "Create & Upload";
  })();

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Video" : "Create Video"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update video metadata."
                : "Create a video using file upload or an external URL."}
            </DialogDescription>
          </DialogHeader>

          {formError ? (
            <Alert variant="destructive">
              <AlertTitle>Could not save video</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isEditMode ? (
              <div className="space-y-2">
                <Label>Source Mode</Label>
                <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
                  {(
                    (allowUploadMode
                      ? (["upload", "url"] as VideoSourceMode[])
                      : (["url"] as VideoSourceMode[])) as VideoSourceMode[]
                  ).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                        sourceMode === mode
                          ? "bg-white text-primary shadow-sm dark:bg-gray-900"
                          : "text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                      }`}
                      onClick={() => {
                        setSourceMode(mode);
                        setFormError(null);
                      }}
                      disabled={isBusy}
                    >
                      {resolveModeLabel(mode)}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="video-title-en">Title (English) *</Label>
                <Input
                  id="video-title-en"
                  value={titleEn}
                  onChange={(event) => setTitleEn(event.target.value)}
                  placeholder="e.g., Lesson 1"
                  disabled={isBusy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="video-title-ar">Title (Arabic)</Label>
                <Input
                  id="video-title-ar"
                  value={titleAr}
                  onChange={(event) => setTitleAr(event.target.value)}
                  placeholder="e.g., الدرس الأول"
                  dir="rtl"
                  disabled={isBusy}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="video-description-en">
                  Description (English)
                </Label>
                <Textarea
                  id="video-description-en"
                  value={descriptionEn}
                  onChange={(event) => setDescriptionEn(event.target.value)}
                  rows={3}
                  placeholder="Optional"
                  disabled={isBusy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="video-description-ar">
                  Description (Arabic)
                </Label>
                <Textarea
                  id="video-description-ar"
                  value={descriptionAr}
                  onChange={(event) => setDescriptionAr(event.target.value)}
                  rows={3}
                  placeholder="اختياري"
                  dir="rtl"
                  disabled={isBusy}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-tags">Tags</Label>
              <Input
                id="video-tags"
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                placeholder="comma,separated,tags"
                disabled={isBusy}
              />
            </div>

            {!isEditMode && sourceMode === "url" ? (
              <div className="space-y-2">
                <Label htmlFor="video-source-url">Video URL *</Label>
                <Input
                  id="video-source-url"
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  disabled={isBusy}
                />
              </div>
            ) : null}

            {!isEditMode && sourceMode === "upload" ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="video-upload-file">Video File *</Label>
                  <Input
                    id="video-upload-file"
                    type="file"
                    accept="video/*"
                    onChange={(event) => {
                      setFile(event.target.files?.[0] ?? null);
                      setFormError(null);
                    }}
                    disabled={isBusy}
                  />
                  {selectedFileLabel ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedFileLabel}
                    </p>
                  ) : null}
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
                        onClick={handlePauseUpload}
                        disabled={!canPause}
                      >
                        Pause
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleResumeUpload}
                        disabled={!canResume}
                      >
                        Resume
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleStopUpload}
                        className="text-red-600 hover:text-red-700"
                      >
                        Stop
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleMinimizeUpload}
                      >
                        Minimize
                      </Button>
                      {uploadSessionId != null ? (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Session #{String(uploadSessionId)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogOpenChange(false)}
              >
                {hasActiveUpload ? "Minimize" : "Cancel"}
              </Button>
              <Button type="submit" disabled={isBusy}>
                {submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
