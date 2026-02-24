"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import {
  useAttachSectionPdf,
  useAttachSectionVideo,
  useCreateSection,
  useReorderSections,
  useSections,
} from "@/features/sections/hooks/use-sections";
import { getSectionApiErrorMessage } from "@/features/sections/lib/api-error";
import type { Section } from "@/features/sections/types/section";
import { cn } from "@/lib/utils";

type CourseSectionsOverviewProps = {
  centerId: string | number;
  courseId: string | number;
  managerHref: string;
};

type Feedback = {
  type: "success" | "error";
  message: string;
};

type MediaDialogState = {
  type: "video" | "pdf";
  sectionId: string | number;
  sectionTitle: string;
} | null;

const OVERVIEW_SECTIONS_LIMIT = 200;

function getSectionTitle(section: Section) {
  return section.title ?? section.name ?? `Section #${section.id}`;
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
}: CourseSectionsOverviewProps) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [orderedSections, setOrderedSections] = useState<Section[]>([]);
  const [draggingId, setDraggingId] = useState<string | number | null>(null);
  const [dragStartOrder, setDragStartOrder] = useState<Array<string | number>>(
    [],
  );
  const [expandedSections, setExpandedSections] = useState<
    Array<string | number>
  >([]);
  const [mediaDialog, setMediaDialog] = useState<MediaDialogState>(null);
  const [mediaId, setMediaId] = useState("");
  const [mediaIdError, setMediaIdError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createSortOrder, setCreateSortOrder] = useState("");

  const { data, isLoading, isError, isFetching } = useSections(
    centerId,
    courseId,
    { page: 1, per_page: OVERVIEW_SECTIONS_LIMIT },
  );
  const { mutate: reorderSections, isPending: isReordering } =
    useReorderSections();
  const { mutate: createSection, isPending: isCreatingSection } =
    useCreateSection();
  const { mutate: attachVideo, isPending: isAttachingVideo } =
    useAttachSectionVideo();
  const { mutate: attachPdf, isPending: isAttachingPdf } = useAttachSectionPdf();

  const sortedSections = useMemo(
    () => [...(data?.items ?? [])].sort((a, b) => getSectionOrder(a) - getSectionOrder(b)),
    [data?.items],
  );

  useEffect(() => {
    setOrderedSections(sortedSections);
  }, [sortedSections]);

  const isBusy =
    isReordering || isCreatingSection || isAttachingVideo || isAttachingPdf;
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
        payload: { ordered_ids: nextOrderedIds },
      },
      {
        onSuccess: () => {
          setFeedback({
            type: "success",
            message: "Sections reordered successfully.",
          });
        },
        onError: (error) => {
          setOrderedSections(sortedSections);
          setFeedback({
            type: "error",
            message: getSectionApiErrorMessage(
              error,
              "Failed to reorder sections.",
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
    if (!title) {
      setFeedback({
        type: "error",
        message: "Section title is required.",
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
          message: "Sort order must be a non-negative integer.",
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
          title_translations: { en: title },
          ...(typeof sortOrder === "number" ? { sort_order: sortOrder } : {}),
        },
      },
      {
        onSuccess: (createdSection) => {
          setCreateTitle("");
          setCreateSortOrder("");
          setIsCreateDialogOpen(false);
          setFeedback({
            type: "success",
            message: getResponseMessage(
              createdSection,
              "Section created successfully.",
            ),
          });
        },
        onError: (error) => {
          setFeedback({
            type: "error",
            message: getSectionApiErrorMessage(error, "Failed to create section."),
          });
        },
      },
    );
  };

  const openMediaDialog = (type: "video" | "pdf", section: Section) => {
    setMediaDialog({
      type,
      sectionId: section.id,
      sectionTitle: getSectionTitle(section),
    });
    setMediaId("");
    setMediaIdError(null);
  };

  const closeMediaDialog = () => {
    if (isBusy) return;
    setMediaDialog(null);
    setMediaId("");
    setMediaIdError(null);
  };

  const handleAttachMedia = () => {
    if (!mediaDialog) return;

    const value = mediaId.trim();
    const parsedId = Number(value);
    const isValid = Number.isInteger(parsedId) && parsedId > 0;

    if (!isValid) {
      setMediaIdError("Enter a valid positive numeric ID.");
      return;
    }

    setMediaIdError(null);

    const onSuccess = () => {
      closeMediaDialog();
      setFeedback({
        type: "success",
        message:
          mediaDialog.type === "video"
            ? "Video attached successfully."
            : "PDF attached successfully.",
      });
    };

    const onError = (error: unknown) => {
      setFeedback({
        type: "error",
        message: getSectionApiErrorMessage(error, "Failed to attach media."),
      });
    };

    if (mediaDialog.type === "video") {
      attachVideo(
        {
          centerId,
          courseId,
          sectionId: mediaDialog.sectionId,
          payload: { video_id: parsedId },
        },
        { onSuccess, onError },
      );
      return;
    }

    attachPdf(
      {
        centerId,
        courseId,
        sectionId: mediaDialog.sectionId,
        payload: { pdf_id: parsedId },
      },
      { onSuccess, onError },
    );
  };

  return (
    <>
      <Card>
        <CardContent className="space-y-4 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Course Content
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Drag sections to reorder. Quickly attach videos or PDFs by ID.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="gap-2"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <span className="text-lg leading-none">+</span>
                Add Section
              </Button>
              <Link href={managerHref}>
                <Button size="sm" variant="outline">
                  Manage Sections
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

          {isLoading ? (
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
          ) : isError ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load sections.
            </p>
          ) : orderedSections.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              No sections yet. Add the first section to get started.
            </div>
          ) : (
            <div
              className={cn(
                "space-y-2 transition-opacity",
                isFetching && !isLoading ? "opacity-60" : "opacity-100",
              )}
            >
              {orderedSections.map((section, index) => {
                const sectionKey = String(section.id ?? `section-${index}`);
                const sectionId = section.id ?? sectionKey;
                const isExpanded = expandedSections.includes(sectionId);
                const videos = Array.isArray(section.videos) ? section.videos : [];
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
                        aria-label="Toggle section details"
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
                        {getSectionTitle(section)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {videoCount} {videoCount === 1 ? "video" : "videos"} •{" "}
                        {pdfCount} PDFs
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => openMediaDialog("video", section)}
                        disabled={isBusy}
                      >
                        <span className="text-lg leading-none">+</span>
                        Video
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => openMediaDialog("pdf", section)}
                        disabled={isBusy}
                      >
                        <span className="text-lg leading-none">+</span>
                        PDF
                      </Button>
                    </div>

                    {isExpanded ? (
                      <div className="w-full border-t border-gray-200 bg-white pt-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-dark dark:text-gray-300">
                        {videos.length === 0 && pdfs.length === 0 ? (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            No content yet.
                          </p>
                        ) : (
                          <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-dark">
                            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                              {videos.map((video, videoIndex) => (
                                <li
                                  key={`${sectionKey}-video-${video.id ?? videoIndex}`}
                                  className="flex items-center gap-3 px-3 py-3 text-sm"
                                >
                                  <Badge variant="secondary">Video</Badge>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {video.title ?? video.name ?? "Untitled video"}
                                    </p>
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {formatDuration(video.duration)}
                                  </span>
                                </li>
                              ))}

                              {pdfs.map((pdf, pdfIndex) => (
                                <li
                                  key={`${sectionKey}-pdf-${pdf.id ?? pdfIndex}`}
                                  className="flex items-center gap-3 px-3 py-3 text-sm"
                                >
                                  <Badge variant="secondary">PDF</Badge>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {pdf.title ?? pdf.name ?? "Untitled PDF"}
                                    </p>
                                  </div>
                                </li>
                              ))}
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
            <DialogTitle>Add Section</DialogTitle>
            <DialogDescription>
              Create a new section quickly from the overview workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="create-section-title">Title *</Label>
              <Input
                id="create-section-title"
                value={createTitle}
                onChange={(event) => setCreateTitle(event.target.value)}
                placeholder="e.g., Introduction"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-section-sort-order">Sort Order</Label>
              <Input
                id="create-section-sort-order"
                type="number"
                min={0}
                value={createSortOrder}
                onChange={(event) => setCreateSortOrder(event.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isBusy}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateSection} disabled={isBusy}>
              {isCreatingSection ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!mediaDialog} onOpenChange={(open) => (!open ? closeMediaDialog() : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mediaDialog?.type === "video" ? "Attach Video" : "Attach PDF"}
            </DialogTitle>
            <DialogDescription>
              {mediaDialog
                ? `Provide the ${mediaDialog.type.toUpperCase()} ID for ${mediaDialog.sectionTitle}.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="overview-media-id">Media ID</Label>
            <Input
              id="overview-media-id"
              value={mediaId}
              onChange={(event) => setMediaId(event.target.value)}
              placeholder="e.g., 123"
            />
            {mediaIdError ? (
              <p className="text-sm text-red-600 dark:text-red-400">{mediaIdError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeMediaDialog} disabled={isBusy}>
              Cancel
            </Button>
            <Button onClick={handleAttachMedia} disabled={isBusy}>
              {isAttachingVideo || isAttachingPdf ? "Saving..." : "Attach"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
