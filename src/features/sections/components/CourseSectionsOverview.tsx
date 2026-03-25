"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Thumbnail } from "@/components/ui/thumbnail";
import {
  useCreateSection,
  useReorderSections,
  useSections,
} from "@/features/sections/hooks/use-sections";
import { useTranslation } from "@/features/localization";
import { resolveTranslatedValue } from "@/lib/resolve-translated-value";
import { SectionMediaManagerDialog } from "@/features/sections/components/SectionMediaManagerDialog";
import { getSectionApiErrorMessage } from "@/features/sections/lib/api-error";
import type { Section } from "@/features/sections/types/section";
import { resolveVideoThumbnailState } from "@/features/videos/lib/video-thumbnail";
import type { Video } from "@/features/videos/types/video";
import { cn } from "@/lib/utils";

type CourseSectionsOverviewProps = {
  centerId: string | number;
  courseId: string | number;
  managerHref: string;
  initialSections?: unknown;
};

type Feedback = {
  type: "success" | "error";
  message: string;
};

type MediaManagerState = {
  mode: "video" | "pdf";
  section: Section;
} | null;

const OVERVIEW_SECTIONS_LIMIT = 100;
type TranslateFn = (
  _key: string,
  _params?: Record<string, string | number>,
) => string;

function normalizeSectionsValue(value: unknown): Section[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }

      const section = entry as Section;
      if (section.id == null || section.id === "") return null;
      return section;
    })
    .filter((section): section is Section => section != null);
}

function getSectionTitle(section: Section, t: TranslateFn, locale?: string) {
  return (
    resolveTranslatedValue(
      section.title_translations as Record<string, string> | null | undefined,
      locale ?? "en",
      section.title ?? section.name,
    ) ?? t("pages.sectionManager.unknown.sectionById", { id: section.id })
  );
}

function getSectionOrder(section: Section) {
  if (typeof section.sort_order === "number") {
    return section.sort_order;
  }

  if (typeof section.order_index === "number") {
    return section.order_index;
  }

  return Number.POSITIVE_INFINITY;
}

function getSectionMediaCount(section: Section, key: "videos" | "pdfs") {
  const countKey = `${key}_count`;
  const rawCount = section[countKey];
  if (typeof rawCount === "number") {
    return rawCount;
  }

  const list = section[key];
  return Array.isArray(list) ? list.length : 0;
}

function getResponseMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return fallback;
  }

  const message = (data as Record<string, unknown>)._response_message;
  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }

  return fallback;
}

function formatDuration(value: unknown) {
  if (value == null || value === "") return "—";

  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numeric)) {
    return String(value);
  }

  const totalSeconds = Math.max(0, Math.floor(numeric));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function CourseSectionsOverview({
  centerId,
  courseId,
  managerHref,
  initialSections,
}: CourseSectionsOverviewProps) {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [orderedSections, setOrderedSections] = useState<Section[]>([]);
  const [draggingId, setDraggingId] = useState<string | number | null>(null);
  const [dragStartOrder, setDragStartOrder] = useState<Array<string | number>>(
    [],
  );
  const [expandedSections, setExpandedSections] = useState<
    Array<string | number>
  >([]);
  const [mediaManagerState, setMediaManagerState] =
    useState<MediaManagerState>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createTitleAr, setCreateTitleAr] = useState("");
  const [createSortOrder, setCreateSortOrder] = useState("");
  const hasInitialSections = initialSections !== undefined;
  const normalizedInitialSections = useMemo(
    () => normalizeSectionsValue(initialSections),
    [initialSections],
  );
  const shouldQuerySections = !hasInitialSections;

  const { data, isLoading, isError, isFetching } = useSections(
    centerId,
    courseId,
    { page: 1, per_page: OVERVIEW_SECTIONS_LIMIT },
    { enabled: shouldQuerySections },
  );
  const { mutate: reorderSections, isPending: isReordering } =
    useReorderSections();
  const { mutate: createSection, isPending: isCreatingSection } =
    useCreateSection();

  const invalidateCourseDetails = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ["center-course", centerId, courseId],
    });
  }, [centerId, courseId, queryClient]);

  const sourceSections = useMemo(
    () =>
      hasInitialSections ? normalizedInitialSections : (data?.items ?? []),
    [hasInitialSections, normalizedInitialSections, data?.items],
  );

  const sortedSections = useMemo(
    () =>
      [...sourceSections].sort(
        (a, b) => getSectionOrder(a) - getSectionOrder(b),
      ),
    [sourceSections],
  );

  useEffect(() => {
    setOrderedSections(sortedSections);
  }, [sortedSections]);

  const isBusy = isReordering || isCreatingSection;
  const canReorder =
    orderedSections.length > 0 &&
    orderedSections.every((section) => section.id != null);

  const handleDragStart = (sectionId: string | number | null) => {
    if (!canReorder || sectionId == null) return;

    setDraggingId(sectionId);
    setDragStartOrder(
      orderedSections
        .map((section) => section.id)
        .filter((id): id is string | number => id != null),
    );
  };

  const handleDragOver = (targetId: string | number | null) => {
    if (
      !canReorder ||
      draggingId == null ||
      targetId == null ||
      draggingId === targetId
    ) {
      return;
    }

    setOrderedSections((prev) => {
      const fromIndex = prev.findIndex((section) => section.id === draggingId);
      const toIndex = prev.findIndex((section) => section.id === targetId);

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return prev;
      }

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleDrop = () => {
    if (!canReorder || draggingId == null) {
      setDraggingId(null);
      setDragStartOrder([]);
      return;
    }

    setDraggingId(null);

    const nextOrderedIds = orderedSections
      .map((section) => section.id)
      .filter((id): id is string | number => id != null);

    const hasChanged =
      nextOrderedIds.length !== dragStartOrder.length ||
      nextOrderedIds.some((id, index) => id !== dragStartOrder[index]);

    if (!hasChanged) {
      setDragStartOrder([]);
      return;
    }

    reorderSections(
      {
        centerId,
        courseId,
        payload: { sections: nextOrderedIds },
      },
      {
        onSuccess: () => {
          invalidateCourseDetails();
          setFeedback({
            type: "success",
            message: t("pages.courseSectionsOverview.messages.reordered"),
          });
        },
        onError: (error) => {
          setOrderedSections(sortedSections);
          setFeedback({
            type: "error",
            message: getSectionApiErrorMessage(
              error,
              t("pages.courseSectionsOverview.errors.reorderFailed"),
            ),
          });
        },
      },
    );

    setDragStartOrder([]);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const toggleExpanded = (sectionId: string | number) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId],
    );
  };

  const handleCreateSection = () => {
    const title = createTitle.trim();
    const titleAr = createTitleAr.trim();
    if (!title) {
      setFeedback({
        type: "error",
        message: t("pages.courseSectionsOverview.errors.titleRequired"),
      });
      return;
    }

    const sortOrderRaw = createSortOrder.trim();
    let sortOrder: number | undefined;

    if (sortOrderRaw) {
      const parsed = Number(sortOrderRaw);
      const isValid = Number.isInteger(parsed) && parsed >= 0;
      if (!isValid) {
        setFeedback({
          type: "error",
          message: t("pages.courseSectionsOverview.errors.sortOrderInvalid"),
        });
        return;
      }
      sortOrder = parsed;
    }

    createSection(
      {
        centerId,
        courseId,
        payload: {
          title_translations: {
            en: title,
            ...(titleAr ? { ar: titleAr } : {}),
          },
          ...(typeof sortOrder === "number" ? { sort_order: sortOrder } : {}),
        },
      },
      {
        onSuccess: (createdSection) => {
          invalidateCourseDetails();
          setCreateTitle("");
          setCreateTitleAr("");
          setCreateSortOrder("");
          setIsCreateDialogOpen(false);
          setFeedback({
            type: "success",
            message: getResponseMessage(
              createdSection,
              t("pages.courseSectionsOverview.messages.created"),
            ),
          });
        },
        onError: (error) => {
          setFeedback({
            type: "error",
            message: getSectionApiErrorMessage(
              error,
              t("pages.courseSectionsOverview.errors.createFailed"),
            ),
          });
        },
      },
    );
  };

  const openMediaManager = (mode: "video" | "pdf", section: Section) => {
    setMediaManagerState({ mode, section });
  };

  return (
    <>
      <Card>
        <CardContent className="space-y-4 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {t("pages.courseSectionsOverview.title")}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("pages.courseSectionsOverview.description")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                {t("pages.sectionManager.actions.addSection")}
              </Button>
              <Link href={managerHref}>
                <Button size="sm" variant="outline">
                  {t("pages.courseSectionsOverview.actions.manageSections")}
                </Button>
              </Link>
            </div>
          </div>

          {feedback ? (
            <div
              className={cn(
                "rounded-lg border px-3 py-2 text-sm",
                feedback.type === "success"
                  ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-200"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200",
              )}
            >
              {feedback.message}
            </div>
          ) : null}

          {shouldQuerySections && isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2 dark:border-gray-700"
                >
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="ml-auto h-8 w-28" />
                </div>
              ))}
            </div>
          ) : shouldQuerySections && isError ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              {t("pages.sectionManager.errors.loadFailed")}
            </p>
          ) : orderedSections.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              {t("pages.courseSectionsOverview.empty.noSections")}
            </div>
          ) : (
            <div
              className={cn(
                "space-y-2 transition-opacity",
                shouldQuerySections && isFetching && !isLoading
                  ? "opacity-60"
                  : "opacity-100",
              )}
            >
              {orderedSections.map((section, index) => {
                const sectionKey = String(section.id ?? `section-${index}`);
                const sectionId = section.id ?? sectionKey;
                const isExpanded = expandedSections.includes(sectionId);
                const videos = Array.isArray(section.videos)
                  ? section.videos
                  : [];
                const pdfs = Array.isArray(section.pdfs) ? section.pdfs : [];
                const videoCount = getSectionMediaCount(section, "videos");
                const pdfCount = getSectionMediaCount(section, "pdfs");

                return (
                  <div
                    key={sectionKey}
                    className={cn(
                      "flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm transition-[transform,opacity,box-shadow,border-color,background-color] duration-200 ease-out hover:border-gray-300 dark:border-gray-700 dark:bg-gray-dark dark:hover:border-gray-600",
                      draggingId === section.id
                        ? "border-primary/40 opacity-0 ring-2 ring-primary/20"
                        : "",
                    )}
                    draggable={!isBusy && canReorder}
                    onDragStart={() => handleDragStart(section.id ?? null)}
                    onDragOver={(event) => {
                      event.preventDefault();
                      handleDragOver(section.id ?? null);
                    }}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-2 text-gray-400 dark:text-gray-500",
                        !canReorder ? "opacity-40" : "cursor-grab",
                      )}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                      >
                        <circle cx="4" cy="4" r="1.3" />
                        <circle cx="4" cy="8" r="1.3" />
                        <circle cx="4" cy="12" r="1.3" />
                        <circle cx="10" cy="4" r="1.3" />
                        <circle cx="10" cy="8" r="1.3" />
                        <circle cx="10" cy="12" r="1.3" />
                      </svg>
                      <button
                        type="button"
                        className="inline-flex"
                        onClick={() => toggleExpanded(sectionId)}
                        aria-label={t(
                          "pages.courseSectionsOverview.actions.toggleDetails",
                        )}
                        disabled={isBusy}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className={cn(
                            "transition-transform duration-200",
                            isExpanded ? "rotate-180" : "rotate-0",
                          )}
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {getSectionTitle(section, t, locale)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {videoCount}{" "}
                        {t(
                          videoCount === 1
                            ? "pages.sectionManager.media.videoSingular"
                            : "pages.sectionManager.media.videoPlural",
                        )}{" "}
                        • {pdfCount}{" "}
                        {t(
                          pdfCount === 1
                            ? "pages.sectionManager.media.pdfSingular"
                            : "pages.sectionManager.media.pdfPlural",
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => openMediaManager("video", section)}
                        disabled={isBusy}
                      >
                        <span className="text-lg leading-none">+</span>
                        {t("pages.sectionManager.media.videoSingular")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => openMediaManager("pdf", section)}
                        disabled={isBusy}
                      >
                        <span className="text-lg leading-none">+</span>
                        {t("pages.sectionManager.media.pdfSingular")}
                      </Button>
                    </div>

                    {isExpanded ? (
                      <div className="w-full border-t border-gray-200 bg-white pt-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-dark dark:text-gray-300">
                        {videos.length === 0 && pdfs.length === 0 ? (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t("pages.courseSectionsOverview.empty.noContent")}
                          </p>
                        ) : (
                          <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-dark">
                            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                              {videos.map((video, videoIndex) => {
                                const thumbState = resolveVideoThumbnailState(
                                  video as unknown as Video,
                                );
                                return (
                                  <li
                                    key={`${sectionKey}-video-${video.id ?? videoIndex}`}
                                    className="flex items-center gap-3 px-3 py-2 text-sm"
                                  >
                                    <Thumbnail
                                      src={thumbState.imageUrl}
                                      widthPx={56}
                                      heightPx={36}
                                      className="h-9 w-14 flex-none rounded"
                                      fallback={
                                        <div className="flex h-9 w-14 flex-none items-center justify-center rounded bg-gray-100 dark:bg-gray-800">
                                          <svg
                                            className="h-4 w-4 text-gray-400 dark:text-gray-500"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={1.5}
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                                            />
                                          </svg>
                                        </div>
                                      }
                                    />
                                    <Badge variant="secondary">
                                      {t(
                                        "pages.sectionManager.media.videoSingular",
                                      )}
                                    </Badge>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {resolveTranslatedValue(
                                          video.title_translations as
                                            | Record<string, string>
                                            | null
                                            | undefined,
                                          locale,
                                          video.title ?? video.name,
                                        ) ??
                                          t(
                                            "pages.sectionManager.unknown.untitledVideo",
                                          )}
                                      </p>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                      {formatDuration(video.duration)}
                                    </span>
                                  </li>
                                );
                              })}

                              {pdfs.map((pdf, pdfIndex) => {
                                const pagesCount =
                                  typeof pdf.page_count === "number"
                                    ? (pdf.page_count as number)
                                    : typeof pdf.pages_count === "number"
                                      ? (pdf.pages_count as number)
                                      : null;
                                return (
                                  <li
                                    key={`${sectionKey}-pdf-${pdf.id ?? pdfIndex}`}
                                    className="flex items-center gap-3 px-3 py-2 text-sm"
                                  >
                                    <div className="flex h-9 w-14 flex-none items-center justify-center rounded bg-red-50 dark:bg-red-900/20">
                                      <svg
                                        className="h-5 w-5 text-red-400 dark:text-red-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                                        />
                                      </svg>
                                    </div>
                                    <Badge variant="secondary">
                                      {t(
                                        "pages.sectionManager.media.pdfSingular",
                                      )}
                                    </Badge>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {resolveTranslatedValue(
                                          pdf.title_translations as
                                            | Record<string, string>
                                            | null
                                            | undefined,
                                          locale,
                                          pdf.title ?? pdf.name,
                                        ) ??
                                          t(
                                            "pages.sectionManager.unknown.untitledPdf",
                                          )}
                                      </p>
                                    </div>
                                    {pagesCount != null ? (
                                      <span className="text-xs text-gray-400">
                                        {pagesCount}{" "}
                                        {t(
                                          pagesCount === 1
                                            ? "pages.courseSectionsOverview.media.pageSingular"
                                            : "pages.courseSectionsOverview.media.pagePlural",
                                        )}
                                      </span>
                                    ) : null}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          if (!isBusy) {
            setIsCreateDialogOpen(open);
            if (!open) {
              setCreateTitle("");
              setCreateSortOrder("");
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("pages.sectionManager.actions.addSection")}
            </DialogTitle>
            <DialogDescription>
              {t("pages.courseSectionsOverview.createDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-section-title-en">
                  {t(
                    "pages.courseSectionsOverview.createDialog.fields.titleEn",
                  )}
                </Label>
                <Input
                  id="create-section-title-en"
                  value={createTitle}
                  onChange={(event) => setCreateTitle(event.target.value)}
                  placeholder={t(
                    "pages.courseSectionsOverview.createDialog.placeholders.titleEn",
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-section-title-ar">
                  {t(
                    "pages.courseSectionsOverview.createDialog.fields.titleAr",
                  )}
                </Label>
                <Input
                  id="create-section-title-ar"
                  value={createTitleAr}
                  onChange={(event) => setCreateTitleAr(event.target.value)}
                  placeholder={t(
                    "pages.courseSectionsOverview.createDialog.placeholders.titleAr",
                  )}
                  dir="rtl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-section-sort-order">
                {t(
                  "pages.courseSectionsOverview.createDialog.fields.sortOrder",
                )}
              </Label>
              <Input
                id="create-section-sort-order"
                type="number"
                min={0}
                value={createSortOrder}
                onChange={(event) => setCreateSortOrder(event.target.value)}
                placeholder={t(
                  "pages.courseSectionsOverview.createDialog.placeholders.sortOrder",
                )}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isBusy}
            >
              {t("common.actions.cancel")}
            </Button>
            <Button onClick={handleCreateSection} disabled={isBusy}>
              {isCreatingSection
                ? t("pages.sectionManager.actions.creating")
                : t("common.actions.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SectionMediaManagerDialog
        open={Boolean(mediaManagerState)}
        onOpenChange={(open) => {
          if (!open) {
            setMediaManagerState(null);
          }
        }}
        mode={mediaManagerState?.mode ?? "video"}
        section={mediaManagerState?.section ?? null}
        centerId={centerId}
        courseId={courseId}
        onSuccess={(message) => {
          invalidateCourseDetails();
          setFeedback({
            type: "success",
            message,
          });
        }}
      />
    </>
  );
}
