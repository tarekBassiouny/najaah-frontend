"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListingCard } from "@/components/ui/listing-card";
import { ListingFilters } from "@/components/ui/listing-filters";
import { PageHeader } from "@/components/ui/page-header";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAttachSectionPdf,
  useAttachSectionVideo,
  useCreateSection,
  useCreateSectionWithStructure,
  useDeleteSection,
  useDetachSectionPdf,
  useDetachSectionVideo,
  usePublishSection,
  useSections,
  useUnpublishSection,
} from "@/features/sections/hooks/use-sections";
import { getSectionApiErrorMessage } from "@/features/sections/lib/api-error";
import type { Section } from "@/features/sections/types/section";
import { cn } from "@/lib/utils";

const DEFAULT_PER_PAGE = 10;

type MediaAction =
  | "attach-video"
  | "detach-video"
  | "attach-pdf"
  | "detach-pdf";

type BulkAction = "publish" | "unpublish" | "delete";

type Feedback = {
  type: "success" | "error";
  message: string;
};

type SectionManagerProps = {
  centerId: string | number;
  courseId: string | number;
  backHref: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
};

type BadgeVariant = "success" | "warning" | "secondary" | "error" | "default";

const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
  published: { variant: "success", label: "Published" },
  active: { variant: "success", label: "Active" },
  draft: { variant: "secondary", label: "Draft" },
  pending: { variant: "warning", label: "Pending" },
  inactive: { variant: "default", label: "Inactive" },
  hidden: { variant: "default", label: "Hidden" },
  failed: { variant: "error", label: "Failed" },
};

function getSectionTitle(section: Section) {
  return section.title ?? section.name ?? `Section #${section.id}`;
}

function getStatusBadge(status: unknown) {
  const normalized = String(status ?? "draft")
    .trim()
    .toLowerCase();

  if (statusConfig[normalized]) {
    return statusConfig[normalized];
  }

  return {
    variant: "default" as const,
    label: normalized
      ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
      : "Unknown",
  };
}

function getVisibilityBadge(isVisible: unknown) {
  if (typeof isVisible === "boolean") {
    return isVisible
      ? { variant: "success" as const, label: "Visible" }
      : { variant: "default" as const, label: "Hidden" };
  }

  return { variant: "default" as const, label: "—" };
}

function getResponseMessage(data: unknown): string | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  const value = (data as Record<string, unknown>)._response_message;
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  return value.trim();
}

function parseMediaIds(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ids: [] as number[], error: null as string | null };
  }

  const tokens = trimmed
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const ids: number[] = [];
  for (const token of tokens) {
    const parsed = Number(token);
    const isValid = Number.isInteger(parsed) && parsed > 0;
    if (!isValid) {
      return {
        ids: [],
        error: `Invalid ID "${token}". Use positive numeric IDs separated by commas.`,
      };
    }
    ids.push(parsed);
  }

  return { ids: Array.from(new Set(ids)), error: null as string | null };
}

export function SectionManager({
  centerId,
  courseId,
  backHref,
  breadcrumbs,
}: SectionManagerProps) {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [mediaAction, setMediaAction] = useState<MediaAction | null>(null);
  const [mediaSectionId, setMediaSectionId] = useState<string | number | null>(
    null,
  );
  const [mediaValue, setMediaValue] = useState("");
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [selectedSections, setSelectedSections] = useState<
    Record<string, Section>
  >({});
  const [isBulkActing, setIsBulkActing] = useState(false);

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: query || undefined,
    }),
    [page, perPage, query],
  );

  const { data, isLoading, isError, isFetching } = useSections(
    centerId,
    courseId,
    params,
  );

  const { mutate: createSection, isPending: isCreating } = useCreateSection();
  const { mutate: createSectionWithStructure, isPending: isCreatingWithStructure } =
    useCreateSectionWithStructure();
  const {
    mutate: deleteSection,
    mutateAsync: deleteSectionAsync,
    isPending: isDeleting,
  } = useDeleteSection();
  const {
    mutate: publishSection,
    mutateAsync: publishSectionAsync,
    isPending: isPublishing,
  } = usePublishSection();
  const {
    mutate: unpublishSection,
    mutateAsync: unpublishSectionAsync,
    isPending: isUnpublishing,
  } = useUnpublishSection();
  const { mutate: attachVideo, isPending: isAttachingVideo } =
    useAttachSectionVideo();
  const { mutate: detachVideo, isPending: isDetachingVideo } =
    useDetachSectionVideo();
  const { mutate: attachPdf, isPending: isAttachingPdf } = useAttachSectionPdf();
  const { mutate: detachPdf, isPending: isDetachingPdf } = useDetachSectionPdf();

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? 0;
  const lastPage = data?.lastPage ?? 1;
  const isLoadingState = isLoading;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;
  const hasActiveFilters = search.trim().length > 0;
  const activeFilterCount = hasActiveFilters ? 1 : 0;
  const selectedIds = useMemo(
    () => Object.keys(selectedSections),
    [selectedSections],
  );
  const selectedCount = selectedIds.length;
  const selectedSectionsList = useMemo(
    () =>
      selectedIds
        .map((id) => selectedSections[id])
        .filter((section): section is Section => Boolean(section)),
    [selectedIds, selectedSections],
  );
  const pageSectionIds = useMemo(
    () => items.map((section) => String(section.id)),
    [items],
  );
  const isAllPageSelected =
    pageSectionIds.length > 0 &&
    pageSectionIds.every((id) => Boolean(selectedSections[id]));

  const isBusy =
    isCreating ||
    isCreatingWithStructure ||
    isDeleting ||
    isPublishing ||
    isUnpublishing ||
    isAttachingVideo ||
    isDetachingVideo ||
    isAttachingPdf ||
    isDetachingPdf ||
    isBulkActing;

  useEffect(() => {
    const nextQuery = search.trim();
    const timeout = setTimeout(() => {
      setPage(1);
      setQuery(nextQuery);
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
    setSearch("");
    setQuery("");
    setOpenMenuId(null);
    setSelectedSections({});
  }, [centerId, courseId]);

  useEffect(() => {
    setSelectedSections({});
    setOpenMenuId(null);
  }, [page, perPage, query]);

  useEffect(() => {
    if (!mediaAction) {
      setMediaValue("");
      setMediaError(null);
    }
  }, [mediaAction]);

  const toggleSectionSelection = (section: Section) => {
    const sectionId = String(section.id);
    setSelectedSections((prev) => {
      const next = { ...prev };
      if (next[sectionId]) {
        delete next[sectionId];
      } else {
        next[sectionId] = section;
      }
      return next;
    });
  };

  const toggleAllSelections = () => {
    if (isAllPageSelected) {
      setSelectedSections((prev) => {
        const next = { ...prev };
        pageSectionIds.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      return;
    }

    setSelectedSections((prev) => {
      const next = { ...prev };
      items.forEach((section) => {
        next[String(section.id)] = section;
      });
      return next;
    });
  };

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    const formData = new FormData(form);
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const sortOrderRaw = String(formData.get("sort_order") || "").trim();
    const videoIdsRaw = String(formData.get("video_ids") || "").trim();
    const pdfIdsRaw = String(formData.get("pdf_ids") || "").trim();

    if (!title) return;

    const parsedVideos = parseMediaIds(videoIdsRaw);
    if (parsedVideos.error) {
      setFeedback({ type: "error", message: parsedVideos.error });
      return;
    }

    const parsedPdfs = parseMediaIds(pdfIdsRaw);
    if (parsedPdfs.error) {
      setFeedback({ type: "error", message: parsedPdfs.error });
      return;
    }

    let sortOrder: number | undefined;
    if (sortOrderRaw) {
      const parsedSort = Number(sortOrderRaw);
      const isValidSort = Number.isInteger(parsedSort) && parsedSort >= 0;
      if (!isValidSort) {
        setFeedback({
          type: "error",
          message: "Sort order must be a non-negative integer.",
        });
        return;
      }
      sortOrder = parsedSort;
    }

    const hasStructureMedia =
      parsedVideos.ids.length > 0 || parsedPdfs.ids.length > 0;

    const basePayload = {
      title_translations: { en: title },
      ...(description
        ? { description_translations: { en: description } }
        : {}),
      ...(typeof sortOrder === "number" ? { sort_order: sortOrder } : {}),
    };

    if (hasStructureMedia) {
      createSectionWithStructure(
        {
          centerId,
          courseId,
          payload: {
            ...basePayload,
            ...(parsedVideos.ids.length > 0 ? { videos: parsedVideos.ids } : {}),
            ...(parsedPdfs.ids.length > 0 ? { pdfs: parsedPdfs.ids } : {}),
          },
        },
        {
          onSuccess: (createdSection) => {
            form.reset();
            const backendMessage =
              getResponseMessage(createdSection) ??
              "Section with structure created successfully.";
            setFeedback({
              type: "success",
              message: backendMessage,
            });
          },
          onError: (error) => {
            setFeedback({
              type: "error",
              message: getSectionApiErrorMessage(
                error,
                "Failed to create section with structure.",
              ),
            });
          },
        },
      );
      return;
    }

    createSection(
      {
        centerId,
        courseId,
        payload: basePayload,
      },
      {
        onSuccess: (createdSection) => {
          form.reset();
          const backendMessage =
            getResponseMessage(createdSection) ?? "Section created successfully.";
          setFeedback({
            type: "success",
            message: backendMessage,
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

  const handleTogglePublished = (section: Section) => {
    const status = String(section.status ?? "draft").toLowerCase();
    const isPublished = status === "published";

    const action = isPublished ? unpublishSection : publishSection;
    const successMessage = isPublished
      ? "Section unpublished successfully."
      : "Section published successfully.";
    const fallbackError = isPublished
      ? "Failed to unpublish section."
      : "Failed to publish section.";

    action(
      {
        centerId,
        courseId,
        sectionId: section.id,
      },
      {
        onSuccess: () => {
          setFeedback({ type: "success", message: successMessage });
        },
        onError: (error) => {
          setFeedback({
            type: "error",
            message: getSectionApiErrorMessage(error, fallbackError),
          });
        },
      },
    );
  };

  const handleDelete = (section: Section) => {
    const confirmed = window.confirm("Delete this section?");
    if (!confirmed) return;

    deleteSection(
      {
        centerId,
        courseId,
        sectionId: section.id,
      },
      {
        onSuccess: () => {
          setFeedback({ type: "success", message: "Section deleted successfully." });
        },
        onError: (error) => {
          setFeedback({
            type: "error",
            message: getSectionApiErrorMessage(error, "Failed to delete section."),
          });
        },
      },
    );
  };

  const handleBulkAction = async (action: BulkAction) => {
    if (selectedSectionsList.length === 0 || isBulkActing) return;

    const label =
      action === "publish"
        ? "Publish"
        : action === "unpublish"
          ? "Unpublish"
          : "Delete";
    const pastTenseLabel =
      action === "publish"
        ? "Published"
        : action === "unpublish"
          ? "Unpublished"
          : "Deleted";

    const confirmed = window.confirm(
      `${label} ${selectedSectionsList.length} selected section${
        selectedSectionsList.length === 1 ? "" : "s"
      }?`,
    );
    if (!confirmed) return;

    setIsBulkActing(true);

    const actionPromises = selectedSectionsList.map((section) => {
      const payload = {
        centerId,
        courseId,
        sectionId: section.id,
      };

      if (action === "publish") {
        return publishSectionAsync(payload);
      }

      if (action === "unpublish") {
        return unpublishSectionAsync(payload);
      }

      return deleteSectionAsync(payload);
    });

    const results = await Promise.allSettled(actionPromises);
    const successCount = results.filter((result) => result.status === "fulfilled").length;

    setIsBulkActing(false);
    setSelectedSections({});

    if (successCount === selectedSectionsList.length) {
      setFeedback({
        type: "success",
        message: `${pastTenseLabel} ${successCount} section${successCount === 1 ? "" : "s"} successfully.`,
      });
      return;
    }

    setFeedback({
      type: "error",
      message: `${pastTenseLabel} ${successCount} of ${selectedSectionsList.length} selected sections.`,
    });
  };

  const openMediaDialog = (action: MediaAction, sectionId: string | number) => {
    setMediaAction(action);
    setMediaSectionId(sectionId);
    setMediaValue("");
    setMediaError(null);
  };

  const closeMediaDialog = () => {
    if (isBusy) return;
    setMediaAction(null);
    setMediaSectionId(null);
  };

  const handleMediaSubmit = () => {
    if (!mediaAction || mediaSectionId == null) return;

    const value = mediaValue.trim();
    if (!value) {
      setMediaError("ID is required.");
      return;
    }

    setMediaError(null);

    const onSuccess = () => {
      setFeedback({
        type: "success",
        message: "Section media updated successfully.",
      });
      closeMediaDialog();
    };

    const onError = (error: unknown) => {
      setFeedback({
        type: "error",
        message: getSectionApiErrorMessage(error, "Failed to update section media."),
      });
    };

    if (mediaAction === "attach-video") {
      attachVideo(
        {
          centerId,
          courseId,
          sectionId: mediaSectionId,
          payload: { video_id: value },
        },
        { onSuccess, onError },
      );
      return;
    }

    if (mediaAction === "detach-video") {
      detachVideo(
        {
          centerId,
          courseId,
          sectionId: mediaSectionId,
          videoId: value,
        },
        { onSuccess, onError },
      );
      return;
    }

    if (mediaAction === "attach-pdf") {
      attachPdf(
        {
          centerId,
          courseId,
          sectionId: mediaSectionId,
          payload: { pdf_id: value },
        },
        { onSuccess, onError },
      );
      return;
    }

    detachPdf(
      {
        centerId,
        courseId,
        sectionId: mediaSectionId,
        pdfId: value,
      },
      { onSuccess, onError },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sections"
        description="Create and manage sections for this course"
        breadcrumbs={breadcrumbs}
        actions={
          <Link href={backHref}>
            <Button variant="outline">Back to Course</Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
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

          <ListingCard>
            <ListingFilters
              activeCount={activeFilterCount}
              isFetching={isFetching}
              isLoading={isLoading}
              hasActiveFilters={hasActiveFilters}
              onClear={() => {
                setSearch("");
                setQuery("");
                setPage(1);
              }}
              summary={
                <>
                  {total} {total === 1 ? "section" : "sections"}
                </>
              }
              gridClassName="grid-cols-1"
            >
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search sections..."
                  className="pl-10 pr-9 transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                    if (query) setQuery("");
                  }}
                  className={cn(
                    "absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300",
                    search.trim().length > 0
                      ? "opacity-100"
                      : "pointer-events-none opacity-0",
                  )}
                  aria-label="Clear search"
                  tabIndex={search.trim().length > 0 ? 0 : -1}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </ListingFilters>

            {isError ? (
              <div className="p-6">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Failed to load sections.
                </p>
              </div>
            ) : (
              <div
                className={cn(
                  "overflow-x-auto transition-opacity",
                  isFetching && !isLoading ? "opacity-60" : "opacity-100",
                )}
              >
                <Table className="min-w-[920px]">
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 dark:bg-gray-800/60">
                      <TableHead className="w-8">
                        <input
                          type="checkbox"
                          className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                          checked={isAllPageSelected}
                          onChange={toggleAllSelections}
                          disabled={isLoadingState || items.length === 0 || isBusy}
                          aria-label="Select all sections on this page"
                        />
                      </TableHead>
                      <TableHead className="font-medium">Title</TableHead>
                      <TableHead className="font-medium">Order</TableHead>
                      <TableHead className="font-medium">Status</TableHead>
                      <TableHead className="font-medium">Visibility</TableHead>
                      <TableHead className="w-10 text-right font-medium">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingState ? (
                      <>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index} className="animate-pulse">
                            <TableCell>
                              <Skeleton className="h-4 w-4" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-4 w-44" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-4 w-10" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-20 rounded-full" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-20 rounded-full" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="ml-auto h-4 w-6" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    ) : showEmptyState ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-48">
                          <EmptyState
                            title={query ? "No sections found" : "No sections yet"}
                            description={
                              query
                                ? "Try adjusting your search terms"
                                : "Create a section to start organizing this course"
                            }
                            className="border-0 bg-transparent"
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((section, index) => {
                        const status = getStatusBadge(section.status);
                        const visibility = getVisibilityBadge(section.is_visible);
                        const normalizedStatus = String(section.status ?? "draft")
                          .trim()
                          .toLowerCase();
                        const isPublished = normalizedStatus === "published";
                        const shouldOpenUp =
                          items.length > 4 && index >= items.length - 2;

                        return (
                          <TableRow
                            key={section.id}
                            className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                          >
                            <TableCell>
                              <input
                                type="checkbox"
                                className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                                checked={Boolean(selectedSections[String(section.id)])}
                                onChange={() => toggleSectionSelection(section)}
                                aria-label={`Select ${getSectionTitle(section)}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium text-gray-900 dark:text-white">
                              {getSectionTitle(section)}
                            </TableCell>
                            <TableCell className="text-gray-500 dark:text-gray-400">
                              {section.sort_order ?? section.order_index ?? "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={visibility.variant}>
                                {visibility.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end">
                                <Dropdown
                                  isOpen={openMenuId === section.id}
                                  setIsOpen={(value) =>
                                    setOpenMenuId(value ? section.id : null)
                                  }
                                >
                                  <DropdownTrigger className="text-gray-400 hover:text-gray-600">
                                    ⋮
                                  </DropdownTrigger>
                                  <DropdownContent
                                    align="end"
                                    className={cn(
                                      "w-44 rounded-md border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200",
                                      shouldOpenUp && "bottom-full mb-2 mt-0",
                                    )}
                                  >
                                    <button
                                      className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        handleTogglePublished(section);
                                      }}
                                      disabled={isBusy}
                                    >
                                      {isPublished ? "Unpublish" : "Publish"}
                                    </button>
                                    <button
                                      className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        openMediaDialog("attach-video", section.id);
                                      }}
                                      disabled={isBusy}
                                    >
                                      Attach Video
                                    </button>
                                    <button
                                      className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        openMediaDialog("detach-video", section.id);
                                      }}
                                      disabled={isBusy}
                                    >
                                      Detach Video
                                    </button>
                                    <button
                                      className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        openMediaDialog("attach-pdf", section.id);
                                      }}
                                      disabled={isBusy}
                                    >
                                      Attach PDF
                                    </button>
                                    <button
                                      className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        openMediaDialog("detach-pdf", section.id);
                                      }}
                                      disabled={isBusy}
                                    >
                                      Detach PDF
                                    </button>
                                    <button
                                      className="w-full rounded px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        handleDelete(section);
                                      }}
                                      disabled={isBusy}
                                    >
                                      Delete
                                    </button>
                                  </DropdownContent>
                                </Dropdown>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {selectedCount > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
                <div className="text-gray-500 dark:text-gray-400">
                  {selectedCount} selected
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction("publish")}
                    disabled={isBusy}
                  >
                    Publish
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction("unpublish")}
                    disabled={isBusy}
                  >
                    Unpublish
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-600"
                    onClick={() => handleBulkAction("delete")}
                    disabled={isBusy}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ) : null}

            {!isError && lastPage > 1 ? (
              <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                <PaginationControls
                  page={page}
                  lastPage={lastPage}
                  isFetching={isFetching}
                  onPageChange={setPage}
                  perPage={perPage}
                  onPerPageChange={(value) => {
                    setPerPage(value);
                    setPage(1);
                  }}
                  size="sm"
                />
              </div>
            ) : null}
          </ListingCard>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Section</CardTitle>
              <CardDescription>Quickly add a new section.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCreate}>
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Getting Started"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (EN)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={3}
                    placeholder="Optional section description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    name="sort_order"
                    type="number"
                    min={0}
                    placeholder="Optional, e.g., 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video_ids">Video IDs</Label>
                  <Input
                    id="video_ids"
                    name="video_ids"
                    placeholder="Optional, comma-separated (e.g., 12, 13)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pdf_ids">PDF IDs</Label>
                  <Input
                    id="pdf_ids"
                    name="pdf_ids"
                    placeholder="Optional, comma-separated (e.g., 21, 22)"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Adding video/PDF IDs uses the structure endpoint.
                </p>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isCreating || isCreatingWithStructure}
                >
                  {isCreating || isCreatingWithStructure
                    ? "Creating..."
                    : "Create Section"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <p>Add videos or PDFs to each section once created.</p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push(backHref)}
              >
                Back to Course
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={!!mediaAction}
        onOpenChange={(open) => (!open ? closeMediaDialog() : null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mediaAction === "attach-video" && "Attach Video"}
              {mediaAction === "detach-video" && "Detach Video"}
              {mediaAction === "attach-pdf" && "Attach PDF"}
              {mediaAction === "detach-pdf" && "Detach PDF"}
            </DialogTitle>
            <DialogDescription>
              {mediaAction?.includes("video")
                ? "Provide the video ID to update this section."
                : "Provide the PDF ID to update this section."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="media-id">Media ID</Label>
            <Input
              id="media-id"
              value={mediaValue}
              onChange={(event) => setMediaValue(event.target.value)}
              placeholder="e.g., 123"
            />
            {mediaError ? (
              <p className="text-sm text-red-600 dark:text-red-400">{mediaError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeMediaDialog} disabled={isBusy}>
              Cancel
            </Button>
            <Button onClick={handleMediaSubmit} disabled={isBusy}>
              {isBusy ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
