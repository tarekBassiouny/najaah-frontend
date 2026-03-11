"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useModal } from "@/components/ui/modal-store";
import {
  type GlobalVideoUpload,
  useVideoUpload,
} from "@/features/videos/context/video-upload-context";
import {
  formatBytesPerSecond,
  formatEtaSeconds,
} from "@/features/videos/lib/upload-metrics";
import { getAdminApiErrorMessage } from "@/lib/admin-response";
import { useTranslation } from "@/features/localization";

function isTransferActive(upload: GlobalVideoUpload) {
  return (
    upload.phase === "creating" ||
    upload.phase === "uploading" ||
    upload.phase === "paused"
  );
}

export function VideoUploadDock() {
  const { t } = useTranslation();
  const { showToast } = useModal();
  const {
    uploads,
    hasActiveTransfers,
    isMinimized,
    minimize,
    restore,
    pauseUpload,
    resumeUpload,
    stopUpload,
    clearUpload,
    clearFinishedUploads,
  } = useVideoUpload();

  if (uploads.length === 0) return null;

  const activeCount = uploads.filter((upload) =>
    isTransferActive(upload),
  ).length;
  const latestProgress =
    uploads[uploads.length - 1] != null
      ? uploads[uploads.length - 1].progress
      : 0;
  const resolvePhaseLabel = (phase: GlobalVideoUpload["phase"]) => {
    const key = `pages.videos.uploadDock.phase.${phase}`;
    const translated = t(key);
    return translated === key ? phase : translated;
  };

  const withErrorToast = async (
    action: () => Promise<void>,
    fallback: string,
    successMessage?: string,
  ) => {
    try {
      await action();
      if (successMessage) {
        showToast(successMessage, "success");
      }
    } catch (error) {
      showToast(getAdminApiErrorMessage(error, fallback), "error");
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[60]">
        <Button
          type="button"
          onClick={restore}
          className="h-auto rounded-full px-4 py-2"
        >
          {t("pages.videos.uploadDock.minimized.label", {
            count: uploads.length,
          })}{" "}
          {activeCount > 0 ? `• ${Math.round(latestProgress)}%` : ""}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[60] w-[min(94vw,460px)] rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t("pages.videos.uploadDock.title")}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {uploads.length === 1
              ? t("pages.videos.uploadDock.summary.single", {
                  count: uploads.length,
                })
              : t("pages.videos.uploadDock.summary.plural", {
                  count: uploads.length,
                })}
            {hasActiveTransfers
              ? ` • ${t("pages.videos.uploadDock.summary.active", {
                  count: activeCount,
                })}`
              : ` • ${t("pages.videos.uploadDock.summary.allIdle")}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={minimize}>
            {t("pages.videos.uploadDock.actions.minimize")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={clearFinishedUploads}
          >
            {t("pages.videos.uploadDock.actions.clearFinished")}
          </Button>
        </div>
      </div>

      <div className="mt-3 max-h-[50vh] space-y-3 overflow-y-auto pr-1">
        {uploads.map((upload) => {
          const canPause = upload.phase === "uploading";
          const canResume = upload.phase === "paused";
          const canStop =
            upload.phase === "creating" ||
            upload.phase === "uploading" ||
            upload.phase === "paused";

          return (
            <div
              key={upload.id}
              className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-medium text-gray-800 dark:text-gray-100">
                    {upload.fileName}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {upload.statusText}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => clearUpload(upload.id)}
                  disabled={isTransferActive(upload)}
                >
                  {t("pages.videos.uploadDock.actions.hide")}
                </Button>
              </div>

              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                  <span className="capitalize">
                    {resolvePhaseLabel(upload.phase)}
                  </span>
                  <span>{upload.progress.toFixed(1)}%</span>
                </div>
                <Progress value={upload.progress} />
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400">
                  <span>
                    {t("pages.videos.uploadDock.metrics.speed")}:{" "}
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {formatBytesPerSecond(upload.bytesPerSecond)}
                    </span>
                  </span>
                  <span>
                    {t("pages.videos.uploadDock.metrics.eta")}:{" "}
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {formatEtaSeconds(upload.etaSeconds)}
                    </span>
                  </span>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    withErrorToast(
                      () => pauseUpload(upload.id),
                      t("pages.videos.uploadDock.errors.pauseFailed"),
                    )
                  }
                  disabled={!canPause}
                >
                  {t("pages.videos.uploadDock.actions.pause")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    withErrorToast(
                      () => resumeUpload(upload.id),
                      t("pages.videos.uploadDock.errors.resumeFailed"),
                    )
                  }
                  disabled={!canResume}
                >
                  {t("pages.videos.uploadDock.actions.resume")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() =>
                    withErrorToast(
                      () => stopUpload(upload.id),
                      t("pages.videos.uploadDock.errors.stopFailed"),
                      t("pages.videos.uploadDock.messages.stopped"),
                    )
                  }
                  disabled={!canStop}
                >
                  {t("pages.videos.uploadDock.actions.stop")}
                </Button>
                {upload.uploadSessionId != null ? (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t("pages.videos.uploadDock.session", {
                      id: String(upload.uploadSessionId),
                    })}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
