"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import { useCenterCourses } from "@/features/courses/hooks/use-courses";
import { useVideos } from "@/features/videos/hooks/use-videos";
import { useTranslation } from "@/features/localization";
import {
  useCreateVideoCodeBatch,
  useVideoCodeBatchSettings,
} from "@/features/video-code-batches/hooks/use-video-code-batches";
import { getAdminApiAllValidationMessages } from "@/lib/admin-response";
import type { VideoCodeBatch } from "@/features/video-code-batches/types/video-code-batch";

type SelectionPreset = {
  id: string | number;
  label: string;
};

type CreateVideoCodeBatchDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  centerId: string | number;
  coursePreset?: SelectionPreset | null;
  videoPreset?: SelectionPreset | null;
  onCreated?: (_batch: VideoCodeBatch) => void;
  onCompleted?: () => void | Promise<void>;
};

const DEFAULT_BATCH_QUANTITY = 1000;
const DEFAULT_VIEW_LIMIT_PER_CODE = 10;
const MAX_BATCH_QUANTITY = 1000;
const MAX_VIEW_LIMIT_PER_CODE = 10;

export function CreateVideoCodeBatchDialog({
  open,
  onOpenChange,
  centerId,
  coursePreset = null,
  videoPreset = null,
  onCreated,
  onCompleted,
}: CreateVideoCodeBatchDialogProps) {
  const { t } = useTranslation();
  const dialogT = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      t(
        `auto.features.video_code_batches.components.createvideocodebatchdialog.${key}`,
        params,
      ),
    [t],
  );
  const createMutation = useCreateVideoCodeBatch();
  const settingsQuery = useVideoCodeBatchSettings(centerId, {
    enabled: open,
  });
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("100");
  const [viewLimitPerCode, setViewLimitPerCode] = useState("");
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const maxQuantity = settingsQuery.data?.max_quantity ?? null;
  const defaultViewLimit = settingsQuery.data?.default_view_limit ?? null;
  const effectiveMaxQuantity =
    maxQuantity != null && Number.isFinite(maxQuantity)
      ? Math.min(maxQuantity, MAX_BATCH_QUANTITY)
      : MAX_BATCH_QUANTITY;
  const effectiveDefaultViewLimit =
    defaultViewLimit != null && Number.isFinite(defaultViewLimit)
      ? Math.min(Math.max(defaultViewLimit, 1), MAX_VIEW_LIMIT_PER_CODE)
      : DEFAULT_VIEW_LIMIT_PER_CODE;

  useEffect(() => {
    if (!open) return;

    setSelectedCourseId(coursePreset ? String(coursePreset.id) : null);
    setSelectedVideoId(videoPreset ? String(videoPreset.id) : null);
    setQuantity(String(DEFAULT_BATCH_QUANTITY));
    setViewLimitPerCode(String(effectiveDefaultViewLimit));
    setErrorMessages([]);
  }, [coursePreset, effectiveDefaultViewLimit, open, videoPreset]);

  useEffect(() => {
    if (!open) return;

    setQuantity((current) => {
      if (current.trim().length === 0) {
        return String(DEFAULT_BATCH_QUANTITY);
      }

      const parsed = Number(current);
      if (!Number.isFinite(parsed)) {
        return String(DEFAULT_BATCH_QUANTITY);
      }

      if (parsed > effectiveMaxQuantity) {
        return String(effectiveMaxQuantity);
      }

      return current;
    });

    setViewLimitPerCode((current) => {
      if (current.trim().length === 0) {
        return String(effectiveDefaultViewLimit);
      }

      const parsed = Number(current);
      if (!Number.isFinite(parsed)) {
        return String(effectiveDefaultViewLimit);
      }

      if (parsed > MAX_VIEW_LIMIT_PER_CODE) {
        return String(MAX_VIEW_LIMIT_PER_CODE);
      }

      return current;
    });
  }, [effectiveDefaultViewLimit, effectiveMaxQuantity, open]);

  useEffect(() => {
    if (!open) return;
    if (videoPreset) return;
    setSelectedVideoId(null);
  }, [open, selectedCourseId, videoPreset]);

  const coursesQuery = useCenterCourses(
    {
      center_id: centerId,
      page: 1,
      per_page: 100,
      access_model: "video_code",
    },
    {
      enabled: open,
    },
  );

  const resolvedCourseId =
    coursePreset != null ? String(coursePreset.id) : (selectedCourseId ?? "");

  const videosQuery = useVideos(
    {
      centerId,
      page: 1,
      per_page: 100,
      course_id: resolvedCourseId || undefined,
    },
    {
      enabled: open && resolvedCourseId.length > 0,
    },
  );

  const courseOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    const mapped = (coursesQuery.data?.items ?? []).map((course) => ({
      value: String(course.id),
      label:
        course.title ??
        course.name ??
        (coursePreset?.id === course.id
          ? coursePreset.label
          : dialogT("courseWithId", { id: course.id })),
    }));

    if (
      coursePreset &&
      !mapped.some((option) => option.value === String(coursePreset.id))
    ) {
      mapped.unshift({
        value: String(coursePreset.id),
        label: coursePreset.label,
      });
    }

    return mapped;
  }, [coursePreset, coursesQuery.data?.items, dialogT]);

  const videoOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    const mapped = (videosQuery.data?.items ?? []).map((video) => ({
      value: String(video.id),
      label:
        video.title ??
        video.title_translations?.en ??
        video.title_translations?.ar ??
        (videoPreset?.id === video.id
          ? videoPreset.label
          : dialogT("videoWithId", { id: video.id })),
    }));

    if (
      videoPreset &&
      !mapped.some((option) => option.value === String(videoPreset.id))
    ) {
      mapped.unshift({
        value: String(videoPreset.id),
        label: videoPreset.label,
      });
    }

    return mapped;
  }, [dialogT, videoPreset, videosQuery.data?.items]);

  const isSubmitting = createMutation.isPending;
  const isPolicyLoading = settingsQuery.isLoading;

  const handleSubmit = () => {
    setErrorMessages([]);

    const parsedQuantity = Number(quantity);
    const parsedViewLimit = Number(viewLimitPerCode);
    const nextErrors: string[] = [];

    if (!resolvedCourseId) {
      nextErrors.push(dialogT("errors.selectCourse"));
    }

    if (!selectedVideoId && !videoPreset) {
      nextErrors.push(dialogT("errors.selectVideo"));
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1) {
      nextErrors.push(dialogT("errors.invalidQuantity"));
    } else if (
      parsedQuantity > effectiveMaxQuantity
    ) {
      nextErrors.push(
        dialogT("errors.maxQuantityExceeded", { count: effectiveMaxQuantity }),
      );
    }

    if (!Number.isFinite(parsedViewLimit) || parsedViewLimit < 1) {
      nextErrors.push(dialogT("errors.invalidViewLimit"));
    } else if (parsedViewLimit > MAX_VIEW_LIMIT_PER_CODE) {
      nextErrors.push(
        dialogT("errors.maxViewLimitExceeded", {
          count: MAX_VIEW_LIMIT_PER_CODE,
        }),
      );
    }

    if (nextErrors.length > 0) {
      setErrorMessages(nextErrors);
      return;
    }

    createMutation.mutate(
      {
        centerId,
        courseId: resolvedCourseId,
        videoId: videoPreset ? videoPreset.id : selectedVideoId!,
        payload: {
          quantity: parsedQuantity,
          view_limit_per_code: parsedViewLimit,
        },
      },
      {
        onSuccess: (batch) => {
          onCreated?.(batch);
          void onCompleted?.();
          onOpenChange(false);
        },
        onError: (error) => {
          // Extract per-field validation messages from the original axios error
          const cause = error instanceof Error ? error.cause : undefined;
          const fieldMessages = getAdminApiAllValidationMessages(cause);

          if (fieldMessages.length > 0) {
            setErrorMessages(fieldMessages);
          } else {
            setErrorMessages([
              error instanceof Error
                ? error.message
                : dialogT("errors.createFailed"),
            ]);
          }
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {t(
              "auto.features.video_code_batches.components.createvideocodebatchdialog.title",
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              "auto.features.video_code_batches.components.createvideocodebatchdialog.description",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {errorMessages.length > 0 ? (
            <Alert variant="destructive">
              <AlertTitle>
                {t(
                  "auto.features.video_code_batches.components.createvideocodebatchdialog.errorTitle",
                )}
              </AlertTitle>
              <AlertDescription>
                {errorMessages.length === 1 ? (
                  errorMessages[0]
                ) : (
                  <ul className="list-inside list-disc space-y-1">
                    {errorMessages.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="video-code-batch-course">{dialogT("course")}</Label>
            <SearchableSelect
              value={resolvedCourseId || null}
              onValueChange={(value) => setSelectedCourseId(value)}
              options={courseOptions}
              disabled={Boolean(coursePreset) || isSubmitting}
              placeholder={t(
                "auto.features.video_code_batches.components.createvideocodebatchdialog.selectCourse",
              )}
              searchPlaceholder={dialogT("searchCourses")}
              emptyMessage={t(
                "auto.features.video_code_batches.components.createvideocodebatchdialog.noCoursesFound",
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-code-batch-video">{dialogT("video")}</Label>
            <SearchableSelect
              value={videoPreset ? String(videoPreset.id) : selectedVideoId}
              onValueChange={(value) => setSelectedVideoId(value)}
              options={videoOptions}
              disabled={
                Boolean(videoPreset) || !resolvedCourseId || isSubmitting
              }
              placeholder={t(
                "auto.features.video_code_batches.components.createvideocodebatchdialog.selectVideo",
              )}
              searchPlaceholder={dialogT("searchVideos")}
              emptyMessage={
                resolvedCourseId
                  ? dialogT("noVideosForCourse")
                  : dialogT("selectCourseFirst")
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="video-code-batch-quantity">
                {dialogT("quantity")}
              </Label>
              <Input
                id="video-code-batch-quantity"
                type="number"
                min="1"
                max={
                  String(effectiveMaxQuantity)
                }
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                disabled={isSubmitting || isPolicyLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video-code-batch-view-limit">
                {t(
                  "auto.features.video_code_batches.components.createvideocodebatchdialog.viewLimitPerCode",
                )}
              </Label>
              <Input
                id="video-code-batch-view-limit"
                type="number"
                min="1"
                max={String(MAX_VIEW_LIMIT_PER_CODE)}
                value={viewLimitPerCode}
                onChange={(event) => setViewLimitPerCode(event.target.value)}
                disabled={isSubmitting || isPolicyLoading}
              />
            </div>
          </div>

          <Alert>
            <AlertTitle>
              {t(
                "auto.features.video_code_batches.components.createvideocodebatchdialog.batchLifecycle",
              )}
            </AlertTitle>
            <AlertDescription>
              {t(
                "auto.features.video_code_batches.components.createvideocodebatchdialog.batchLifecycleDescription",
              )}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t("common.actions.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isPolicyLoading}
          >
            {isSubmitting
              ? dialogT("creating")
              : dialogT("createBatch")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
