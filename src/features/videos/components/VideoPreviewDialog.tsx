"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePreviewVideo } from "@/features/videos/hooks/use-videos";
import type { Video } from "@/features/videos/types/video";
import { formatDateTime } from "@/lib/format-date-time";
import {
  getAdminApiErrorMessage,
  getAdminResponseMessage,
} from "@/lib/admin-response";
import { useModal } from "@/components/ui/modal-store";
import { useTranslation } from "@/features/localization";

type VideoPreviewDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  video?: Video | null;
  centerId?: string | number | null;
};

type PreviewState = {
  embedUrl: string | null;
  expiresAt: string | null;
  expires: number | null;
};

const INITIAL_PREVIEW_STATE: PreviewState = {
  embedUrl: null,
  expiresAt: null,
  expires: null,
};

function resolveVideoTitle(video?: Video | null) {
  return (
    video?.title ??
    video?.title_translations?.en ??
    video?.title_translations?.ar ??
    null
  );
}

export function VideoPreviewDialog({
  open,
  onOpenChange,
  video,
  centerId,
}: VideoPreviewDialogProps) {
  const { t } = useTranslation();
  const { showToast } = useModal();
  const { mutateAsync: requestPreview, isPending } = usePreviewVideo();
  const requestKeyRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<PreviewState>(INITIAL_PREVIEW_STATE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      requestKeyRef.current = null;
      setErrorMessage(null);
      setPreview(INITIAL_PREVIEW_STATE);
      return;
    }

    const requestKey = `${String(centerId ?? "")}:${String(video?.id ?? "")}`;
    if (requestKeyRef.current === requestKey) {
      return;
    }
    requestKeyRef.current = requestKey;

    setErrorMessage(null);
    setPreview(INITIAL_PREVIEW_STATE);

    if (!video?.id || !centerId) {
      setErrorMessage(
        t("pages.videos.dialogs.preview.errors.missingCenterVideo"),
      );
      return;
    }

    let isActive = true;

    requestPreview({
      centerId,
      videoId: video.id,
    })
      .then((response) => {
        if (!isActive) return;
        setPreview({
          embedUrl: response.embed_url ?? null,
          expiresAt: response.expires_at ?? null,
          expires: response.expires ?? null,
        });
      })
      .catch((error) => {
        if (!isActive) return;
        const message = getAdminApiErrorMessage(
          error,
          t("pages.videos.dialogs.preview.errors.generateFailed"),
        );
        setErrorMessage(message);
        showToast(message, "error");
      });

    return () => {
      isActive = false;
    };
  }, [centerId, open, requestPreview, showToast, t, video?.id]);

  const title =
    resolveVideoTitle(video) ?? t("pages.videos.dialogs.preview.titleFallback");
  const description = getAdminResponseMessage(
    video,
    t("pages.videos.dialogs.preview.descriptionFallback"),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-5xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {preview.expiresAt ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Badge variant="secondary">
              {t("pages.videos.dialogs.preview.badges.signedUrl")}
            </Badge>
            <span>
              {t("pages.videos.dialogs.preview.expiresAt", {
                value: formatDateTime(preview.expiresAt),
              })}
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Badge variant="secondary">
              {t("pages.videos.dialogs.preview.badges.directSource")}
            </Badge>
            <span>{t("pages.videos.dialogs.preview.noExpiry")}</span>
          </div>
        )}

        {isPending ? (
          <div className="flex h-[420px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-400">
            {t("pages.videos.dialogs.preview.loading")}
          </div>
        ) : errorMessage ? (
          <div className="flex h-[420px] items-center justify-center rounded-lg border border-red-200 bg-red-50 px-6 text-center text-sm text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
            {errorMessage}
          </div>
        ) : preview.embedUrl ? (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
              <iframe
                src={preview.embedUrl}
                title={`${title} preview`}
                className="h-[420px] w-full bg-black"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.open(
                    preview.embedUrl!,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
              >
                {t("pages.videos.dialogs.preview.actions.openInNewTab")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex h-[420px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-400">
            {t("pages.videos.dialogs.preview.unavailable")}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
