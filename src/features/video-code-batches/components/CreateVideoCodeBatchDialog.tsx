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
import { useCreateVideoCodeBatch } from "@/features/video-code-batches/hooks/use-video-code-batches";
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
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("100");
  const [viewLimitPerCode, setViewLimitPerCode] = useState("2");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setSelectedCourseId(coursePreset ? String(coursePreset.id) : null);
    setSelectedVideoId(videoPreset ? String(videoPreset.id) : null);
    setQuantity("100");
    setViewLimitPerCode("2");
    setErrorMessage(null);
  }, [coursePreset, open, videoPreset]);

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

  const handleSubmit = () => {
    setErrorMessage(null);

    const parsedQuantity = Number(quantity);
    const parsedViewLimit = Number(viewLimitPerCode);

    if (!resolvedCourseId) {
      setErrorMessage(dialogT("errors.selectCourse"));
      return;
    }

    if (!selectedVideoId && !videoPreset) {
      setErrorMessage(dialogT("errors.selectVideo"));
      return;
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1) {
      setErrorMessage(dialogT("errors.invalidQuantity"));
      return;
    }

    if (!Number.isFinite(parsedViewLimit) || parsedViewLimit < 1) {
      setErrorMessage(dialogT("errors.invalidViewLimit"));
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
          setErrorMessage(
            error instanceof Error
              ? error.message
              : dialogT("errors.createFailed"),
          );
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
          {errorMessage ? (
            <Alert variant="destructive">
              <AlertTitle>
                {t(
                  "auto.features.video_code_batches.components.createvideocodebatchdialog.errorTitle",
                )}
              </AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
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
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                disabled={isSubmitting}
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
                value={viewLimitPerCode}
                onChange={(event) => setViewLimitPerCode(event.target.value)}
                disabled={isSubmitting}
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
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? dialogT("creating") : dialogT("createBatch")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
