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
  useClearVideoThumbnail,
  useCreateVideo,
  useCreateVideoUpload,
  useUploadVideoThumbnail,
  useUpdateVideo,
} from "@/features/videos/hooks/use-videos";
import {
  createTusUploadController,
  type TusUploadController,
} from "@/features/videos/lib/tus-upload";
import {
  formatBytesPerSecond,
  formatEtaSeconds,
} from "@/features/videos/lib/upload-metrics";
import {
  resolvePersistableThumbnailUrl,
  resolveVideoThumbnailState,
} from "@/features/videos/lib/video-thumbnail";
import type { Video, VideoSourceMode } from "@/features/videos/types/video";
import {
  getAdminApiErrorMessage,
  getAdminResponseMessage,
} from "@/lib/admin-response";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/features/localization";

const MAX_THUMBNAIL_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_THUMBNAIL_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

function formatFileSize(bytes: number) {
  if (bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  const precision = value >= 100 || exponent === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[exponent]}`;
}

function formatDurationInput(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function resolveDurationInputValue(video?: Video | null) {
  if (!video) return "";

  if (
    typeof video.duration_seconds === "number" &&
    video.duration_seconds >= 0
  ) {
    return formatDurationInput(video.duration_seconds);
  }

  if (typeof video.duration === "number" && video.duration >= 0) {
    return formatDurationInput(video.duration);
  }

  if (typeof video.duration === "string" && video.duration.trim()) {
    const trimmed = video.duration.trim();
    const numericValue = Number(trimmed);
    if (!Number.isNaN(numericValue)) {
      return formatDurationInput(numericValue);
    }
    return trimmed;
  }

  return "";
}

function isUrlBasedVideo(video?: Video | null) {
  if (!video) return false;

  const sourceType = String(video.source_type ?? "")
    .trim()
    .toLowerCase();

  if (sourceType === "0" || sourceType === "url") return true;
  if (sourceType === "1" || sourceType === "upload" || sourceType === "bunny") {
    return false;
  }

  return Boolean(video.source_url);
}

function parseDurationInput(
  value: string,
): { ok: true; value: number | null } | { ok: false; messageKey: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: true, value: null };
  }

  if (/^\d+$/.test(trimmed)) {
    return { ok: true, value: Number(trimmed) };
  }

  if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(trimmed)) {
    const segments = trimmed.split(":").map(Number);

    if (segments.some((segment) => Number.isNaN(segment))) {
      return {
        ok: false,
        messageKey: "pages.videos.dialogs.form.errors.durationInvalid",
      };
    }

    if (segments.length === 2) {
      const [minutes, seconds] = segments;
      return { ok: true, value: minutes * 60 + seconds };
    }

    const [hours, minutes, seconds] = segments;
    return { ok: true, value: hours * 3600 + minutes * 60 + seconds };
  }

  return {
    ok: false,
    messageKey: "pages.videos.dialogs.form.errors.durationInvalid",
  };
}

function resolveHasCustomThumbnail(video?: Video | null) {
  if (!video) return false;

  if (typeof video.has_custom_thumbnail === "boolean") {
    return video.has_custom_thumbnail;
  }

  return (
    typeof video.custom_thumbnail_url === "string" &&
    video.custom_thumbnail_url.trim().length > 0
  );
}

export function VideoFormDialog({
  open,
  onOpenChange,
  centerId,
  video,
  allowUploadMode = true,
  onSuccess,
}: VideoFormDialogProps) {
  const { t } = useTranslation();
  const { showToast } = useModal();
  const isEditMode = Boolean(video);
  const createVideoMutation = useCreateVideo();
  const createUploadVideoMutation = useCreateVideoUpload();
  const updateVideoMutation = useUpdateVideo();
  const uploadThumbnailMutation = useUploadVideoThumbnail();
  const clearThumbnailMutation = useClearVideoThumbnail();
  const uploadControllerRef = useRef<TusUploadController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
  const [durationInput, setDurationInput] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
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
  const [isDragActive, setIsDragActive] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [resolvedThumbnailVideo, setResolvedThumbnailVideo] =
    useState<Video | null>(null);

  const isMutating =
    createVideoMutation.isPending ||
    createUploadVideoMutation.isPending ||
    updateVideoMutation.isPending;
  const isThumbnailMutating =
    uploadThumbnailMutation.isPending || clearThumbnailMutation.isPending;
  const isUploading = uploadPhase === "uploading";
  const isProcessing = uploadPhase === "processing";
  const isCreatingUpload = uploadPhase === "creating";
  const isPaused = uploadPhase === "paused";
  const hasActiveUpload =
    isCreatingUpload || isUploading || isPaused || isProcessing;
  const isBusy = isMutating || hasActiveUpload || isThumbnailMutating;
  const canPause = uploadPhase === "uploading";
  const canResume = uploadPhase === "paused";
  const uploadPausedText = t("pages.videos.dialogs.form.status.uploadPaused");
  const uploadingVideoText = t(
    "pages.videos.dialogs.form.status.uploadingVideo",
  );
  const creatingSessionText = t(
    "pages.videos.dialogs.form.status.creatingUploadSession",
  );
  const processingStartedText = t(
    "pages.videos.dialogs.form.status.processingStarted",
  );
  const preparingUploadText = t(
    "pages.videos.dialogs.form.status.preparingUpload",
  );

  const selectedFileLabel = useMemo(() => {
    if (!file) return "";
    const sizeMb = file.size / (1024 * 1024);
    return `${file.name} (${sizeMb.toFixed(sizeMb >= 100 ? 0 : 1)} MB)`;
  }, [file]);
  const parsedTags = useMemo(() => parseTags(tagsInput), [tagsInput]);
  const showsManualDuration = !isEditMode
    ? sourceMode === "url" || !allowUploadMode
    : isUrlBasedVideo(video);
  const urlThumbnailPreview = useMemo(() => {
    const previewSourceUrl =
      !isEditMode && (sourceMode === "url" || !allowUploadMode)
        ? sourceUrl.trim()
        : isEditMode && isUrlBasedVideo(video)
          ? String(video?.source_url ?? "").trim()
          : "";

    if (!previewSourceUrl) return null;

    return resolveVideoThumbnailState({
      id: "preview",
      source_type: "url",
      source_url: previewSourceUrl,
      thumbnail_url: resolvePersistableThumbnailUrl(previewSourceUrl),
    });
  }, [allowUploadMode, isEditMode, sourceMode, sourceUrl, video]);
  const currentThumbnailVideo = resolvedThumbnailVideo ?? video ?? null;
  const currentThumbnailState = useMemo(
    () =>
      currentThumbnailVideo
        ? resolveVideoThumbnailState(currentThumbnailVideo)
        : null,
    [currentThumbnailVideo],
  );
  const hasCustomThumbnail = resolveHasCustomThumbnail(currentThumbnailVideo);
  const selectedThumbnailLabel = useMemo(() => {
    if (!thumbnailFile) return "";
    const sizeMb = thumbnailFile.size / (1024 * 1024);
    return `${thumbnailFile.name} (${sizeMb.toFixed(sizeMb >= 100 ? 0 : 1)} MB)`;
  }, [thumbnailFile]);

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
    setDurationInput("");
    setSourceUrl("");
    setFile(null);
    setFormError(null);
    setUploadPhase("idle");
    setUploadProgress(0);
    setUploadSpeedBps(null);
    setUploadEtaSeconds(null);
    setUploadStatusText("");
    setUploadSessionId(null);
    setActiveUploadId(null);
    setIsDragActive(false);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setThumbnailError(null);
    setResolvedThumbnailVideo(null);
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
    setThumbnailError(null);
    setUploadPhase("idle");
    setUploadProgress(0);
    setUploadSpeedBps(null);
    setUploadEtaSeconds(null);
    setUploadStatusText("");
    setUploadSessionId(null);
    setThumbnailError(null);
    setThumbnailFile(null);
    setThumbnailPreview(null);

    if (isEditMode && video) {
      setSourceMode(allowUploadMode ? "upload" : "url");
      setTitleEn(String(video.title_translations?.en ?? video.title ?? ""));
      setTitleAr(String(video.title_translations?.ar ?? ""));
      setDescriptionEn(
        String(video.description_translations?.en ?? video.description ?? ""),
      );
      setDescriptionAr(String(video.description_translations?.ar ?? ""));
      setTagsInput(Array.isArray(video.tags) ? video.tags.join(", ") : "");
      setDurationInput(resolveDurationInputValue(video));
      setSourceUrl("");
      setFile(null);
      setIsDragActive(false);
      setResolvedThumbnailVideo(video);
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
        t("pages.videos.dialogs.form.errors.pauseUploadFailed"),
      );
      setFormError(message);
      showToast(message, "error");
    }
  };

  const handleResumeUpload = async () => {
    if (!activeUploadId) return;
    try {
      await resumeGlobalUpload(activeUploadId);
      setUploadPhase("uploading");
      setUploadStatusText(uploadingVideoText);
      setUploadSpeedBps(null);
      setUploadEtaSeconds(null);
      updateGlobalUpload(activeUploadId, {
        phase: "uploading",
        statusText: uploadingVideoText,
        bytesPerSecond: null,
        etaSeconds: null,
      });
    } catch (error) {
      const message = getAdminApiErrorMessage(
        error,
        t("pages.videos.dialogs.form.errors.resumeUploadFailed"),
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
      const message = t("pages.videos.dialogs.form.messages.uploadStopped");
      showToast(message, "success");
      setFormError(null);
      resetCreateState();
      onOpenChange(false);
    } catch (error) {
      const message = getAdminApiErrorMessage(
        error,
        t("pages.videos.dialogs.form.errors.stopUploadFailed"),
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

  const validateThumbnail = (nextFile: File) => {
    if (!ALLOWED_THUMBNAIL_MIME_TYPES.includes(nextFile.type)) {
      return t("pages.videos.dialogs.form.errors.invalidThumbnailType");
    }

    if (nextFile.size > MAX_THUMBNAIL_SIZE_BYTES) {
      return t("pages.videos.dialogs.form.errors.thumbnailTooLarge");
    }

    return null;
  };

  const handleThumbnailFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const nextFile = event.target.files?.[0] ?? null;
    setThumbnailError(null);

    if (!nextFile) {
      setThumbnailFile(null);
      setThumbnailPreview(null);
      return;
    }

    const validationError = validateThumbnail(nextFile);
    if (validationError) {
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setThumbnailError(validationError);
      event.target.value = "";
      return;
    }

    setThumbnailFile(nextFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (!isMountedRef.current) return;
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(nextFile);
  };

  const uploadSelectedThumbnail = async (videoId: string | number) => {
    if (!centerId) {
      setThumbnailError(
        t("pages.videos.dialogs.form.errors.centerRequiredForThumbnailUpload"),
      );
      return null;
    }

    if (!thumbnailFile) {
      return null;
    }

    try {
      const savedVideo = await uploadThumbnailMutation.mutateAsync({
        centerId,
        videoId,
        thumbnail: thumbnailFile,
      });
      if (isMountedRef.current) {
        setResolvedThumbnailVideo(savedVideo);
        setThumbnailFile(null);
        setThumbnailPreview(null);
        setThumbnailError(null);
      }
      return savedVideo;
    } catch (error) {
      const message = getAdminApiErrorMessage(
        error,
        t("pages.videos.dialogs.form.errors.thumbnailUploadFailed"),
      );
      if (isMountedRef.current) {
        setThumbnailError(message);
      }
      showToast(message, "error");
      return null;
    }
  };

  const handleThumbnailUpload = async () => {
    if (!video) {
      setThumbnailError(
        t("pages.videos.dialogs.form.errors.saveBeforeThumbnailUpload"),
      );
      return;
    }

    if (!thumbnailFile) {
      setThumbnailError(
        t("pages.videos.dialogs.form.errors.thumbnailFileRequired"),
      );
      return;
    }

    const savedVideo = await uploadSelectedThumbnail(video.id);
    if (!savedVideo) return;

    const successMessage = getAdminResponseMessage(
      savedVideo,
      t("pages.videos.dialogs.form.messages.thumbnailUpdated"),
    );
    showToast(successMessage, "success");
  };

  const handleThumbnailReset = async () => {
    if (!centerId) {
      setThumbnailError(
        t("pages.videos.dialogs.form.errors.centerRequiredForThumbnailReset"),
      );
      return;
    }

    if (!video) {
      setThumbnailError(
        t("pages.videos.dialogs.form.errors.saveBeforeThumbnailReset"),
      );
      return;
    }

    try {
      const resetVideo = await clearThumbnailMutation.mutateAsync({
        centerId,
        videoId: video.id,
      });
      if (isMountedRef.current) {
        setResolvedThumbnailVideo(resetVideo);
        setThumbnailFile(null);
        setThumbnailPreview(null);
        setThumbnailError(null);
      }
      const successMessage = getAdminResponseMessage(
        resetVideo,
        t("pages.videos.dialogs.form.messages.thumbnailReset"),
      );
      showToast(successMessage, "success");
    } catch (error) {
      const message = getAdminApiErrorMessage(
        error,
        t("pages.videos.dialogs.form.errors.thumbnailResetFailed"),
      );
      if (isMountedRef.current) {
        setThumbnailError(message);
      }
      showToast(message, "error");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) return;

    if (!centerId) {
      setFormError(t("pages.videos.dialogs.form.errors.centerRequired"));
      return;
    }

    setFormError(null);
    setThumbnailError(null);

    const titleTranslations = buildTranslations(titleEn, titleAr, {
      requireEn: true,
    });
    if (!titleTranslations?.en) {
      setFormError(t("pages.videos.dialogs.form.errors.englishTitleRequired"));
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
    const parsedDuration = parseDurationInput(durationInput);
    if (!parsedDuration.ok) {
      setFormError(t(parsedDuration.messageKey));
      return;
    }

    const resolvedThumbnailUrl =
      sourceMode === "url" || !allowUploadMode
        ? resolvePersistableThumbnailUrl(sourceUrl)
        : null;

    if (isEditMode && video) {
      try {
        let updatedVideo = await updateVideoMutation.mutateAsync({
          centerId,
          videoId: video.id,
          payload: {
            title_translations: normalizedTitleTranslations,
            ...(descriptionTranslations &&
            Object.keys(descriptionTranslations).length
              ? { description_translations: descriptionTranslations }
              : {}),
            tags,
            ...(isUrlBasedVideo(video)
              ? {
                  duration_seconds: parsedDuration.value,
                }
              : {}),
          },
        });

        if (thumbnailFile) {
          const thumbnailUpdatedVideo = await uploadSelectedThumbnail(video.id);
          if (thumbnailUpdatedVideo) {
            updatedVideo = thumbnailUpdatedVideo;
          }
        }

        const successMessage = getAdminResponseMessage(
          updatedVideo,
          t("pages.videos.dialogs.form.messages.videoUpdated"),
        );
        showToast(successMessage, "success");
        onSuccess?.(successMessage);
        onOpenChange(false);
      } catch (error) {
        const message = getAdminApiErrorMessage(
          error,
          t("pages.videos.dialogs.form.errors.videoUpdateFailed"),
        );
        setFormError(message);
        showToast(message, "error");
      }
      return;
    }

    if (sourceMode === "url" || !allowUploadMode) {
      const normalizedUrl = sourceUrl.trim();
      if (!normalizedUrl) {
        setFormError(t("pages.videos.dialogs.form.errors.videoUrlRequired"));
        return;
      }

      try {
        new URL(normalizedUrl);
      } catch {
        setFormError(t("pages.videos.dialogs.form.errors.videoUrlInvalid"));
        return;
      }

      try {
        let createdVideo = await createVideoMutation.mutateAsync({
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
            duration_seconds: parsedDuration.value,
            ...(resolvedThumbnailUrl
              ? { thumbnail_url: resolvedThumbnailUrl }
              : {}),
          },
        });

        if (thumbnailFile && createdVideo?.id != null) {
          const thumbnailUpdatedVideo = await uploadSelectedThumbnail(
            createdVideo.id,
          );
          if (thumbnailUpdatedVideo) {
            createdVideo = thumbnailUpdatedVideo;
          }
        }

        const successMessage = getAdminResponseMessage(
          createdVideo,
          t("pages.videos.dialogs.form.messages.videoCreated"),
        );
        showToast(successMessage, "success");
        onSuccess?.(successMessage);
        onOpenChange(false);
      } catch (error) {
        const message = getAdminApiErrorMessage(
          error,
          t("pages.videos.dialogs.form.errors.videoCreateFailed"),
        );
        setFormError(message);
        showToast(message, "error");
      }
      return;
    }

    if (!file) {
      setFormError(t("pages.videos.dialogs.form.errors.videoFileRequired"));
      return;
    }

    if (!isVideoFile(file)) {
      setFormError(t("pages.videos.dialogs.form.errors.videoFileInvalid"));
      return;
    }

    setUploadPhase("creating");
    setUploadProgress(0);
    setUploadSpeedBps(null);
    setUploadEtaSeconds(null);
    setUploadStatusText(creatingSessionText);
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
        throw new Error(
          t("pages.videos.dialogs.form.errors.uploadSessionMissingData"),
        );
      }

      if (thumbnailFile) {
        await uploadSelectedThumbnail(videoId);
      }

      const sessionId = resolveUploadSessionId(uploadSession);
      setUploadSessionId(sessionId);
      setUploadPhase("uploading");
      setUploadStatusText(uploadingVideoText);
      const uploadId = startGlobalUpload({
        centerId,
        videoId,
        source: "create",
        fileName: file.name,
        uploadSessionId: sessionId,
        phase: "uploading",
        statusText: uploadingVideoText,
      });
      createdUploadId = uploadId;
      setActiveUploadId(uploadId);

      const uploadController = createTusUploadController({
        file,
        uploadEndpoint,
        fingerprintKey: sessionId ?? `video:${String(videoId)}`,
        presignedHeaders: uploadSession?.presigned_headers ?? null,
        onProgress: ({ percentage, bytesPerSecond, etaSeconds }) => {
          if (isMountedRef.current) {
            setUploadProgress(percentage);
            setUploadPhase("uploading");
            setUploadStatusText(uploadingVideoText);
            setUploadSpeedBps(bytesPerSecond);
            setUploadEtaSeconds(etaSeconds);
          }
          updateGlobalUpload(uploadId, {
            progress: percentage,
            phase: "uploading",
            statusText: uploadingVideoText,
            bytesPerSecond,
            etaSeconds,
          });
        },
        onError: (uploadError) => {
          const message =
            uploadError.message ||
            t("pages.videos.dialogs.form.errors.uploadFailed");
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
            setUploadStatusText(processingStartedText);
            setUploadSpeedBps(null);
            setUploadEtaSeconds(null);
          }
          updateGlobalUpload(uploadId, {
            progress: 100,
            phase: "processing",
            statusText: processingStartedText,
            bytesPerSecond: null,
            etaSeconds: null,
          });
          const successMessage = getAdminResponseMessage(
            createdUpload,
            t("pages.videos.dialogs.form.messages.uploadedProcessingStarted"),
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
        t("pages.videos.dialogs.form.errors.uploadStartFailed"),
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
      return updateVideoMutation.isPending
        ? t("common.actions.saving")
        : t("pages.videos.dialogs.form.actions.saveChanges");
    }
    if (sourceMode === "url") {
      return createVideoMutation.isPending
        ? t("pages.videos.dialogs.form.actions.creating")
        : t("pages.videos.dialogs.form.actions.createVideo");
    }
    if (isCreatingUpload || createUploadVideoMutation.isPending) {
      return t("pages.videos.dialogs.form.actions.creatingSession");
    }
    if (isUploading) {
      return t("pages.videos.dialogs.form.actions.uploading");
    }
    if (isProcessing) {
      return t("pages.videos.dialogs.form.actions.processing");
    }
    if (uploadPhase === "failed") {
      return t("pages.videos.dialogs.form.actions.retryUpload");
    }
    return t("pages.videos.dialogs.form.actions.createAndUpload");
  })();

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
          <DialogHeader className="space-y-3">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                VD
              </div>
              <div className="space-y-1">
                <DialogTitle>
                  {isEditMode
                    ? t("pages.videos.dialogs.form.title.edit")
                    : t("pages.videos.dialogs.form.title.create")}
                </DialogTitle>
                <DialogDescription>
                  {isEditMode
                    ? t("pages.videos.dialogs.form.description.edit")
                    : t("pages.videos.dialogs.form.description.create")}
                </DialogDescription>
                <p className="text-xs text-gray-400">
                  {isEditMode
                    ? t("pages.videos.dialogs.form.mode.edit")
                    : t("pages.videos.dialogs.form.mode.create")}
                </p>
              </div>
            </div>
            {!isEditMode ? (
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                  {t("pages.videos.dialogs.form.steps.source")}
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                  {t("pages.videos.dialogs.form.steps.metadata")}
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                  {t("pages.videos.dialogs.form.steps.uploadOrCreate")}
                </span>
              </div>
            ) : null}
          </DialogHeader>

          {formError ? (
            <Alert variant="destructive">
              <AlertTitle>
                {t("pages.videos.dialogs.form.errors.couldNotSave")}
              </AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isEditMode ? (
              <div className="space-y-2">
                <Label>
                  {t("pages.videos.dialogs.form.fields.sourceMode")}
                </Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(
                    (allowUploadMode
                      ? (["upload", "url"] as VideoSourceMode[])
                      : (["url"] as VideoSourceMode[])) as VideoSourceMode[]
                  ).map((mode) => (
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
                            `pages.videos.dialogs.form.sourceMode.${mode}.label`,
                          )}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {t(
                          `pages.videos.dialogs.form.sourceMode.${mode}.description`,
                        )}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t("pages.videos.dialogs.form.sections.metadata.title")}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("pages.videos.dialogs.form.sections.metadata.description")}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="video-title-en">
                    {t("pages.videos.dialogs.form.fields.titleEn")}
                  </Label>
                  <Input
                    id="video-title-en"
                    value={titleEn}
                    onChange={(event) => setTitleEn(event.target.value)}
                    placeholder={t(
                      "pages.videos.dialogs.form.placeholders.titleEn",
                    )}
                    disabled={isBusy}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video-title-ar">
                    {t("pages.videos.dialogs.form.fields.titleAr")}
                  </Label>
                  <Input
                    id="video-title-ar"
                    value={titleAr}
                    onChange={(event) => setTitleAr(event.target.value)}
                    placeholder={t(
                      "pages.videos.dialogs.form.placeholders.titleAr",
                    )}
                    dir="rtl"
                    disabled={isBusy}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="video-description-en">
                    {t("pages.videos.dialogs.form.fields.descriptionEn")}
                  </Label>
                  <Textarea
                    id="video-description-en"
                    value={descriptionEn}
                    onChange={(event) => setDescriptionEn(event.target.value)}
                    rows={3}
                    placeholder={t(
                      "pages.videos.dialogs.form.placeholders.descriptionEn",
                    )}
                    disabled={isBusy}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video-description-ar">
                    {t("pages.videos.dialogs.form.fields.descriptionAr")}
                  </Label>
                  <Textarea
                    id="video-description-ar"
                    value={descriptionAr}
                    onChange={(event) => setDescriptionAr(event.target.value)}
                    rows={3}
                    placeholder={t(
                      "pages.videos.dialogs.form.placeholders.descriptionAr",
                    )}
                    dir="rtl"
                    disabled={isBusy}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-tags">
                  {t("pages.videos.dialogs.form.fields.tags")}
                </Label>
                <Input
                  id="video-tags"
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                  placeholder={t("pages.videos.dialogs.form.placeholders.tags")}
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
                    {t("pages.videos.dialogs.form.hints.tags")}
                  </p>
                )}
              </div>

              {showsManualDuration ? (
                <div className="space-y-2">
                  <Label htmlFor="video-duration">
                    {t("pages.videos.dialogs.form.fields.duration")}
                  </Label>
                  <Input
                    id="video-duration"
                    value={durationInput}
                    onChange={(event) => setDurationInput(event.target.value)}
                    placeholder={t(
                      "pages.videos.dialogs.form.placeholders.duration",
                    )}
                    disabled={isBusy}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("pages.videos.dialogs.form.hints.duration")}
                  </p>
                </div>
              ) : null}
            </section>

            <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t("pages.videos.dialogs.form.sections.thumbnail.title")}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t(
                    "pages.videos.dialogs.form.sections.thumbnail.description",
                  )}{" "}
                  {isEditMode
                    ? t("pages.videos.dialogs.form.sections.thumbnail.editHint")
                    : t(
                        "pages.videos.dialogs.form.sections.thumbnail.createHint",
                      )}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleThumbnailFileChange}
                  disabled={isBusy}
                />
                {isEditMode ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleThumbnailUpload}
                    disabled={!thumbnailFile || isBusy}
                  >
                    {uploadThumbnailMutation.isPending
                      ? t("pages.videos.dialogs.form.actions.uploading")
                      : t("pages.videos.dialogs.form.actions.uploadThumbnail")}
                  </Button>
                ) : null}
                {isEditMode && hasCustomThumbnail ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleThumbnailReset}
                    disabled={isBusy}
                  >
                    {clearThumbnailMutation.isPending
                      ? t("pages.videos.dialogs.form.actions.resetting")
                      : t("pages.videos.dialogs.form.actions.resetToDefault")}
                  </Button>
                ) : null}
              </div>

              {selectedThumbnailLabel ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-900/50">
                  <span className="truncate text-gray-600 dark:text-gray-300">
                    {t("pages.videos.dialogs.form.selectedLabel", {
                      value: selectedThumbnailLabel,
                    })}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setThumbnailFile(null);
                      setThumbnailPreview(null);
                      setThumbnailError(null);
                    }}
                    disabled={isBusy}
                  >
                    {t("common.actions.remove")}
                  </Button>
                </div>
              ) : null}

              <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3 dark:border-gray-800 dark:bg-gray-950/40">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t("pages.videos.dialogs.form.thumbnailPreview.title")}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {thumbnailPreview
                        ? t(
                            "pages.videos.dialogs.form.thumbnailPreview.localPreview",
                          )
                        : isEditMode
                          ? t(
                              "pages.videos.dialogs.form.thumbnailPreview.currentFromApi",
                            )
                          : t(
                              "pages.videos.dialogs.form.thumbnailPreview.selectPrompt",
                            )}
                    </p>
                  </div>
                  {isEditMode ? (
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600 shadow-sm dark:bg-gray-900 dark:text-gray-300">
                      {hasCustomThumbnail
                        ? t("pages.videos.dialogs.form.thumbnailPreview.custom")
                        : t(
                            "pages.videos.dialogs.form.thumbnailPreview.default",
                          )}
                    </span>
                  ) : null}
                </div>
                {thumbnailPreview || currentThumbnailState?.imageUrl ? (
                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        thumbnailPreview ??
                        currentThumbnailState?.imageUrl ??
                        ""
                      }
                      alt={t("pages.videos.dialogs.form.thumbnailPreview.alt")}
                      className="h-44 w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-44 w-full flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-4 text-center dark:border-gray-700 dark:bg-gray-900">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {currentThumbnailState?.fallbackLabel ??
                        t(
                          "pages.videos.dialogs.form.thumbnailPreview.noThumbnail",
                        )}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {currentThumbnailState?.fallbackHint ??
                        t(
                          "pages.videos.dialogs.form.thumbnailPreview.noThumbnailHint",
                        )}
                    </p>
                  </div>
                )}
              </div>

              {thumbnailError ? (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {thumbnailError}
                </p>
              ) : null}
            </section>

            {!isEditMode && sourceMode === "url" ? (
              <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t("pages.videos.dialogs.form.sections.urlSource.title")}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t(
                      "pages.videos.dialogs.form.sections.urlSource.description",
                    )}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video-source-url">
                    {t("pages.videos.dialogs.form.fields.videoUrl")}
                  </Label>
                  <Input
                    id="video-source-url"
                    value={sourceUrl}
                    onChange={(event) => setSourceUrl(event.target.value)}
                    placeholder={t(
                      "pages.videos.dialogs.form.placeholders.videoUrl",
                    )}
                    disabled={isBusy}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("pages.videos.dialogs.form.hints.videoUrl")}
                  </p>
                </div>
                {urlThumbnailPreview ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3 dark:border-gray-800 dark:bg-gray-950/40">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {t(
                            "pages.videos.dialogs.form.thumbnailPreview.title",
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {urlThumbnailPreview.source === "backend"
                            ? t(
                                "pages.videos.dialogs.form.thumbnailPreview.urlBackend",
                              )
                            : t(
                                "pages.videos.dialogs.form.thumbnailPreview.urlPreviewOnly",
                              )}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600 shadow-sm dark:bg-gray-900 dark:text-gray-300">
                        {urlThumbnailPreview.providerLabel}
                      </span>
                    </div>
                    {urlThumbnailPreview.imageUrl ? (
                      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={urlThumbnailPreview.imageUrl}
                          alt={t(
                            "pages.videos.dialogs.form.thumbnailPreview.providerAlt",
                            {
                              provider: urlThumbnailPreview.providerLabel,
                            },
                          )}
                          className="h-44 w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-44 w-full flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-4 text-center dark:border-gray-700 dark:bg-gray-900">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {urlThumbnailPreview.fallbackLabel}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {urlThumbnailPreview.fallbackHint ??
                            t(
                              "pages.videos.dialogs.form.thumbnailPreview.noThumbnailAvailable",
                            )}
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}
              </section>
            ) : null}

            {!isEditMode && sourceMode === "upload" ? (
              <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t("pages.videos.dialogs.form.sections.uploadSource.title")}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t(
                      "pages.videos.dialogs.form.sections.uploadSource.description",
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video-upload-file">
                    {t("pages.videos.dialogs.form.fields.videoFile")}
                  </Label>
                  <input
                    ref={fileInputRef}
                    id="video-upload-file"
                    type="file"
                    accept="video/*"
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
                            "pages.videos.dialogs.form.actions.replaceSelectedFile",
                          )
                        : t("pages.videos.dialogs.form.actions.dropVideoFile")}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t("pages.videos.dialogs.form.hints.browseFromDevice")}
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
                        {t("pages.videos.dialogs.form.actions.browseFile")}
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
                      {formatFileSize(file.size)} •{" "}
                      {file.type ||
                        t("pages.videos.dialogs.form.videoFileFallbackMime")}
                    </p>
                  </div>
                ) : null}

                {uploadPhase !== "idle" ? (
                  <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        {t(
                          `pages.videos.dialogs.form.uploadPhase.${uploadPhase}`,
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
                        {t("pages.videos.dialogs.form.metrics.speed")}:{" "}
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                          {formatBytesPerSecond(uploadSpeedBps)}
                        </span>
                      </span>
                      <span>
                        {t("pages.videos.dialogs.form.metrics.eta")}:{" "}
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
                        onClick={handlePauseUpload}
                        disabled={!canPause}
                      >
                        {t("pages.videos.dialogs.form.actions.pause")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleResumeUpload}
                        disabled={!canResume}
                      >
                        {t("pages.videos.dialogs.form.actions.resume")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleStopUpload}
                        className="text-red-600 hover:text-red-700"
                      >
                        {t("pages.videos.dialogs.form.actions.stop")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleMinimizeUpload}
                      >
                        {t("pages.videos.dialogs.form.actions.minimize")}
                      </Button>
                      {uploadSessionId != null ? (
                        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                          {t("pages.videos.dialogs.form.session", {
                            id: String(uploadSessionId),
                          })}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {selectedFileLabel ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("pages.videos.dialogs.form.selectedLabel", {
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
                  ? t("pages.videos.dialogs.form.actions.minimize")
                  : t("common.actions.cancel")}
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
