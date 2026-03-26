"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useModal } from "@/components/ui/modal-store";
import { Thumbnail } from "@/components/ui/thumbnail";
import { useUploadCourseThumbnail } from "@/features/courses/hooks/use-courses";
import { useTranslation } from "@/features/localization";
import type { Course } from "@/features/courses/types/course";

const MAX_THUMBNAIL_SIZE_MB = 5;
const MAX_THUMBNAIL_SIZE_BYTES = MAX_THUMBNAIL_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type CourseThumbnailCardProps = {
  centerId: string | number;
  courseId: string | number;
  course: Course;
};

function resolveCurrentThumbnail(course: Course) {
  const url = course.thumbnail_url ?? course.thumbnail;
  return typeof url === "string" && url.trim() ? url.trim() : null;
}

export function CourseThumbnailCard({
  centerId,
  courseId,
  course,
}: CourseThumbnailCardProps) {
  const { t } = useTranslation();
  const { showToast } = useModal();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadMutation = useUploadCourseThumbnail();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentUrl = resolveCurrentThumbnail(course);
  const isBusy = uploadMutation.isPending;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setSelectedFile(null);
      setPreview(null);
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(t("pages.centerCourseDetail.thumbnail.errorInvalidType"));
      setSelectedFile(null);
      setPreview(null);
      return;
    }

    if (file.size > MAX_THUMBNAIL_SIZE_BYTES) {
      setError(
        t("pages.centerCourseDetail.thumbnail.errorTooLarge", {
          max: MAX_THUMBNAIL_SIZE_MB,
        }),
      );
      setSelectedFile(null);
      setPreview(null);
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    setError(null);

    uploadMutation.mutate(
      { centerId, courseId, thumbnailFile: selectedFile },
      {
        onSuccess: () => {
          showToast(
            t("pages.centerCourseDetail.thumbnail.uploadSuccess"),
            "success",
          );
          setSelectedFile(null);
          setPreview(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        },
        onError: () => {
          setError(t("pages.centerCourseDetail.thumbnail.uploadFailed"));
        },
      },
    );
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const displayUrl = preview ?? currentUrl;

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {t("pages.centerCourseDetail.thumbnail.title")}
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("pages.centerCourseDetail.thumbnail.description")}
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/40">
          {displayUrl ? (
            <Thumbnail
              src={displayUrl}
              widthPx={400}
              heightPx={176}
              className="h-44 w-full"
              fallback={null}
            />
          ) : (
            <div className="flex h-44 w-full flex-col items-center justify-center text-center">
              <svg
                className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("pages.centerCourseDetail.thumbnail.noThumbnail")}
              </p>
            </div>
          )}
        </div>

        {preview ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("pages.centerCourseDetail.thumbnail.previewHint")}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={isBusy}
          />
          {selectedFile ? (
            <>
              <Button
                type="button"
                size="sm"
                onClick={handleUpload}
                disabled={isBusy}
              >
                {isBusy
                  ? t("pages.centerCourseDetail.thumbnail.uploading")
                  : t("pages.centerCourseDetail.thumbnail.upload")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleClear}
                disabled={isBusy}
              >
                {t("common.actions.cancel")}
              </Button>
            </>
          ) : null}
        </div>

        {error ? (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
