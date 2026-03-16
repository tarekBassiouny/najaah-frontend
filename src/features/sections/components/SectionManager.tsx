"use client";

import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { AppNotFoundState } from "@/components/ui/app-not-found-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListingCard } from "@/components/ui/listing-card";
import { ListingFilters } from "@/components/ui/listing-filters";
import { PageHeader } from "@/components/ui/page-header";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  useCreateSection,
  useCreateSectionWithStructure,
  useDeleteSection,
  usePublishSection,
  useSection,
  useSections,
  useUnpublishSection,
  useUpdateSection,
} from "@/features/sections/hooks/use-sections";
import { BulkSectionPublishDialog } from "@/features/sections/components/BulkSectionPublishDialog";
import { SectionMediaManagerDialog } from "@/features/sections/components/SectionMediaManagerDialog";
import { getSectionApiErrorMessage } from "@/features/sections/lib/api-error";
import { listPdfs } from "@/features/pdfs/services/pdfs.service";
import type { Section } from "@/features/sections/types/section";
import { listVideos } from "@/features/videos/services/videos.service";
import { formatDateTime } from "@/lib/format-date-time";
import { isAdminApiNotFoundError } from "@/lib/admin-response";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/features/localization";

const DEFAULT_PER_PAGE = 10;
const MEDIA_PICKER_PAGE_SIZE = 20;
const MEDIA_SEARCH_DEBOUNCE_MS = 300;
const ALL_PUBLISHED_VALUE = "all";

type BulkAction = "publish" | "unpublish" | "delete";
type PublishedFilterValue = typeof ALL_PUBLISHED_VALUE | "1" | "0";
type MediaManagerMode = "video" | "pdf";
type TranslateFn = (
  _key: string,
  _params?: Record<string, string | number>,
) => string;

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

type MediaManagerState = {
  mode: MediaManagerMode;
  section: Section;
};

type BadgeVariant = "success" | "warning" | "secondary" | "error" | "default";

const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
  published: { variant: "success", label: "published" },
  active: { variant: "success", label: "active" },
  draft: { variant: "secondary", label: "draft" },
  pending: { variant: "warning", label: "pending" },
  inactive: { variant: "default", label: "inactive" },
  hidden: { variant: "default", label: "hidden" },
  failed: { variant: "error", label: "failed" },
};

function getSectionTitle(section: Section, t: TranslateFn) {
  return (
    section.title ??
    section.name ??
    t("pages.sectionManager.unknown.sectionById", { id: section.id })
  );
}

function getStatusBadge(status: unknown, t: TranslateFn) {
  const normalized = String(status ?? "draft")
    .trim()
    .toLowerCase();

  if (statusConfig[normalized]) {
    return {
      variant: statusConfig[normalized].variant,
      label: t(`pages.sectionManager.status.${statusConfig[normalized].label}`),
    };
  }

  return {
    variant: "default" as const,
    label: normalized
      ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
      : t("pages.sectionManager.status.unknown"),
  };
}

function resolvePublishedValue(section: Section): boolean | null {
  if (typeof section.is_published === "boolean") {
    return section.is_published;
  }

  if (typeof section.visible === "boolean") {
    return section.visible;
  }

  const normalizedStatus = String(section.status ?? "")
    .trim()
    .toLowerCase();
  if (normalizedStatus === "published") {
    return true;
  }
  if (normalizedStatus === "draft") {
    return false;
  }

  return null;
}

function resolveVisibilityValue(section: Section): boolean | null {
  if (typeof section.visible === "boolean") {
    return section.visible;
  }

  if (typeof section.is_visible === "boolean") {
    return section.is_visible;
  }

  return null;
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

function getMediaTitle(item: Record<string, unknown>, fallbackPrefix: string) {
  const title = item.title;
  if (typeof title === "string" && title.trim()) {
    return title.trim();
  }

  const name = item.name;
  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }

  const translations = item.title_translations;
  if (
    translations &&
    typeof translations === "object" &&
    !Array.isArray(translations)
  ) {
    const transRecord = translations as Record<string, unknown>;
    const en = transRecord.en;
    if (typeof en === "string" && en.trim()) {
      return en.trim();
    }
    const ar = transRecord.ar;
    if (typeof ar === "string" && ar.trim()) {
      return ar.trim();
    }
  }

  const id = item.id;
  return `${fallbackPrefix} #${id ?? "—"}`;
}

function getTranslationValue(translations: unknown, locale: string) {
  if (
    !translations ||
    typeof translations !== "object" ||
    Array.isArray(translations)
  ) {
    return "";
  }

  const value = (translations as Record<string, unknown>)[locale];
  return typeof value === "string" ? value : "";
}

function normalizeMediaIds(values: string[]): Array<string | number> {
  return values.map((value) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : value;
  });
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

export function SectionManager({
  centerId,
  courseId,
  backHref,
  breadcrumbs,
}: SectionManagerProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [publishedFilter, setPublishedFilter] =
    useState<PublishedFilterValue>(ALL_PUBLISHED_VALUE);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [mediaManagerState, setMediaManagerState] =
    useState<MediaManagerState | null>(null);
  const [detailsSection, setDetailsSection] = useState<Section | null>(null);
  const [editSection, setEditSection] = useState<Section | null>(null);
  const [editTitleEn, setEditTitleEn] = useState("");
  const [editTitleAr, setEditTitleAr] = useState("");
  const [editDescriptionEn, setEditDescriptionEn] = useState("");
  const [editDescriptionAr, setEditDescriptionAr] = useState("");
  const [editOrderIndex, setEditOrderIndex] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [selectedSections, setSelectedSections] = useState<
    Record<string, Section>
  >({});
  const [isBulkActing, setIsBulkActing] = useState(false);
  const [bulkPublishDialogMode, setBulkPublishDialogMode] = useState<
    "publish" | "unpublish" | null
  >(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createSortOrder, setCreateSortOrder] = useState("");
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [selectedPdfIds, setSelectedPdfIds] = useState<string[]>([]);
  const [videoSearch, setVideoSearch] = useState("");
  const [pdfSearch, setPdfSearch] = useState("");
  const [debouncedVideoSearch, setDebouncedVideoSearch] = useState("");
  const [debouncedPdfSearch, setDebouncedPdfSearch] = useState("");

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: query || undefined,
      is_published:
        publishedFilter === ALL_PUBLISHED_VALUE ? undefined : publishedFilter,
    }),
    [page, perPage, query, publishedFilter],
  );

  const { data, isLoading, isError, isFetching, error } = useSections(
    centerId,
    courseId,
    params,
  );

  const { mutate: createSection, isPending: isCreating } = useCreateSection();
  const {
    mutate: createSectionWithStructure,
    isPending: isCreatingWithStructure,
  } = useCreateSectionWithStructure();
  const {
    mutate: deleteSection,
    mutateAsync: deleteSectionAsync,
    isPending: isDeleting,
  } = useDeleteSection();
  const { mutate: publishSection, isPending: isPublishing } =
    usePublishSection();
  const { mutate: unpublishSection, isPending: isUnpublishing } =
    useUnpublishSection();
  const { mutate: updateSection, isPending: isUpdating } = useUpdateSection();

  const {
    data: videosData,
    isLoading: isVideosLoading,
    isFetchingNextPage: isVideosLoadingMore,
    hasNextPage: hasMoreVideos,
    fetchNextPage: fetchMoreVideos,
  } = useInfiniteQuery({
    queryKey: ["section-create-videos", centerId, debouncedVideoSearch],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      const page = Number(pageParam ?? 1);
      return listVideos({
        centerId,
        page,
        per_page: MEDIA_PICKER_PAGE_SIZE,
        search: debouncedVideoSearch || undefined,
      });
    },
    enabled: isCreateDialogOpen,
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.meta?.page ?? 1);
      const perPage = Number(lastPage.meta?.per_page ?? MEDIA_PICKER_PAGE_SIZE);
      const total = Number(lastPage.meta?.total ?? 0);
      return page * perPage < total ? page + 1 : undefined;
    },
    staleTime: 60_000,
  });

  const {
    data: pdfsData,
    isLoading: isPdfsLoading,
    isFetchingNextPage: isPdfsLoadingMore,
    hasNextPage: hasMorePdfs,
    fetchNextPage: fetchMorePdfs,
  } = useInfiniteQuery({
    queryKey: ["section-create-pdfs", centerId, debouncedPdfSearch],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      const page = Number(pageParam ?? 1);
      return listPdfs({
        centerId,
        page,
        per_page: MEDIA_PICKER_PAGE_SIZE,
        search: debouncedPdfSearch || undefined,
      });
    },
    enabled: isCreateDialogOpen,
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.meta?.page ?? 1);
      const perPage = Number(lastPage.meta?.per_page ?? MEDIA_PICKER_PAGE_SIZE);
      const total = Number(lastPage.meta?.total ?? 0);
      return page * perPage < total ? page + 1 : undefined;
    },
    staleTime: 60_000,
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? 0;
  const lastPage = data?.lastPage ?? 1;
  const isLoadingState = isLoading;
  const isMissingCourse = !isLoadingState && !isError && !data;
  const showCourseNotFound = isMissingCourse || isAdminApiNotFoundError(error);
  const showEmptyState = !isLoadingState && !isError && items.length === 0;
  const hasActiveFilters =
    search.trim().length > 0 || publishedFilter !== ALL_PUBLISHED_VALUE;
  const activeFilterCount =
    (search.trim().length > 0 ? 1 : 0) +
    (publishedFilter !== ALL_PUBLISHED_VALUE ? 1 : 0);
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
  const selectedPublishableSections = useMemo(
    () =>
      selectedSectionsList.filter(
        (section) => resolvePublishedValue(section) !== true,
      ),
    [selectedSectionsList],
  );
  const selectedUnpublishableSections = useMemo(
    () =>
      selectedSectionsList.filter(
        (section) => resolvePublishedValue(section) !== false,
      ),
    [selectedSectionsList],
  );
  const pageSectionIds = useMemo(
    () => items.map((section) => String(section.id)),
    [items],
  );
  const isAllPageSelected =
    pageSectionIds.length > 0 &&
    pageSectionIds.every((id) => Boolean(selectedSections[id]));
  const videoFallbackLabel = t("pages.sectionManager.media.videoSingular");
  const pdfFallbackLabel = t("pages.sectionManager.media.pdfSingular");
  const videoOptions = useMemo(() => {
    const dedupe = new Map<string, { value: string; label: string }>();

    (videosData?.pages ?? []).forEach((pageData) => {
      pageData.items.forEach((video) => {
        const item = video as Record<string, unknown>;
        const key = String(item.id);
        if (!dedupe.has(key)) {
          dedupe.set(key, {
            value: key,
            label: getMediaTitle(item, videoFallbackLabel),
          });
        }
      });
    });

    return Array.from(dedupe.values());
  }, [videoFallbackLabel, videosData?.pages]);
  const pdfOptions = useMemo(() => {
    const dedupe = new Map<string, { value: string; label: string }>();

    (pdfsData?.pages ?? []).forEach((pageData) => {
      pageData.items.forEach((pdf) => {
        const item = pdf as Record<string, unknown>;
        const key = String(item.id);
        if (!dedupe.has(key)) {
          dedupe.set(key, {
            value: key,
            label: getMediaTitle(item, pdfFallbackLabel),
          });
        }
      });
    });

    return Array.from(dedupe.values());
  }, [pdfFallbackLabel, pdfsData?.pages]);
  const isCreateSubmitting = isCreating || isCreatingWithStructure;
  const detailsSectionId = detailsSection?.id;
  const {
    data: detailsQueryData,
    isLoading: isDetailsLoading,
    isError: isDetailsError,
  } = useSection(centerId, courseId, detailsSectionId);

  const isBusy =
    isCreating ||
    isCreatingWithStructure ||
    isUpdating ||
    isDeleting ||
    isPublishing ||
    isUnpublishing ||
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
    const timeout = setTimeout(() => {
      setDebouncedVideoSearch(videoSearch.trim());
    }, MEDIA_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [videoSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedPdfSearch(pdfSearch.trim());
    }, MEDIA_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [pdfSearch]);

  useEffect(() => {
    setPage(1);
    setSearch("");
    setQuery("");
    setPublishedFilter(ALL_PUBLISHED_VALUE);
    setOpenMenuId(null);
    setMediaManagerState(null);
    setDetailsSection(null);
    setEditSection(null);
    setEditTitleEn("");
    setEditTitleAr("");
    setEditDescriptionEn("");
    setEditDescriptionAr("");
    setEditOrderIndex("");
    setSelectedSections({});
    setBulkPublishDialogMode(null);
    setIsCreateDialogOpen(false);
    setCreateTitle("");
    setCreateDescription("");
    setCreateSortOrder("");
    setSelectedVideoIds([]);
    setSelectedPdfIds([]);
    setVideoSearch("");
    setPdfSearch("");
    setDebouncedVideoSearch("");
    setDebouncedPdfSearch("");
  }, [centerId, courseId]);

  useEffect(() => {
    setSelectedSections({});
    setOpenMenuId(null);
    setMediaManagerState(null);
    setBulkPublishDialogMode(null);
    setDetailsSection(null);
    setEditSection(null);
  }, [page, perPage, query, publishedFilter]);

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

  const resetCreateForm = () => {
    setCreateTitle("");
    setCreateDescription("");
    setCreateSortOrder("");
    setSelectedVideoIds([]);
    setSelectedPdfIds([]);
    setVideoSearch("");
    setPdfSearch("");
    setDebouncedVideoSearch("");
    setDebouncedPdfSearch("");
  };

  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false);
    resetCreateForm();
  };

  const closeEditDialog = () => {
    setEditSection(null);
    setEditTitleEn("");
    setEditTitleAr("");
    setEditDescriptionEn("");
    setEditDescriptionAr("");
    setEditOrderIndex("");
  };

  const openEditDialog = (section: Section) => {
    const titleEn =
      getTranslationValue(section.title_translations, "en") ||
      (typeof section.title === "string" ? section.title : "");
    const titleAr = getTranslationValue(section.title_translations, "ar");
    const descriptionEn =
      getTranslationValue(section.description_translations, "en") ||
      (typeof section.description === "string" ? section.description : "");
    const descriptionAr = getTranslationValue(
      section.description_translations,
      "ar",
    );
    const orderIndex =
      typeof section.order_index === "number"
        ? section.order_index
        : typeof section.sort_order === "number"
          ? section.sort_order
          : null;

    setEditSection(section);
    setEditTitleEn(titleEn);
    setEditTitleAr(titleAr);
    setEditDescriptionEn(descriptionEn);
    setEditDescriptionAr(descriptionAr);
    setEditOrderIndex(orderIndex == null ? "" : String(orderIndex));
  };

  const handleUpdateSection = () => {
    if (!editSection) return;

    const nextTitleEn = editTitleEn.trim();
    const nextTitleAr = editTitleAr.trim();
    const nextDescriptionEn = editDescriptionEn.trim();
    const nextDescriptionAr = editDescriptionAr.trim();
    const orderInput = editOrderIndex.trim();

    const currentTitleEn =
      getTranslationValue(editSection.title_translations, "en").trim() ||
      (typeof editSection.title === "string" ? editSection.title.trim() : "");
    const currentTitleAr = getTranslationValue(
      editSection.title_translations,
      "ar",
    ).trim();
    const currentDescriptionEn =
      getTranslationValue(editSection.description_translations, "en").trim() ||
      (typeof editSection.description === "string"
        ? editSection.description.trim()
        : "");
    const currentDescriptionAr = getTranslationValue(
      editSection.description_translations,
      "ar",
    ).trim();
    const currentOrderIndex =
      typeof editSection.order_index === "number"
        ? editSection.order_index
        : typeof editSection.sort_order === "number"
          ? editSection.sort_order
          : undefined;

    const payload: {
      title_translations?: { en: string; ar?: string };
      description_translations?: { en?: string; ar?: string };
      order_index?: number;
    } = {};

    const titleChanged =
      nextTitleEn !== currentTitleEn || nextTitleAr !== currentTitleAr;
    if (titleChanged) {
      if (!nextTitleEn) {
        setFeedback({
          type: "error",
          message: t("pages.sectionManager.errors.titleEnRequired"),
        });
        return;
      }

      payload.title_translations = {
        en: nextTitleEn,
        ...(nextTitleAr || currentTitleAr ? { ar: nextTitleAr } : {}),
      };
    }

    const descriptionChanged =
      nextDescriptionEn !== currentDescriptionEn ||
      nextDescriptionAr !== currentDescriptionAr;
    if (descriptionChanged) {
      payload.description_translations = {
        ...(nextDescriptionEn || currentDescriptionEn
          ? { en: nextDescriptionEn }
          : {}),
        ...(nextDescriptionAr || currentDescriptionAr
          ? { ar: nextDescriptionAr }
          : {}),
      };
    }

    if (orderInput) {
      const parsedOrder = Number(orderInput);
      if (!Number.isInteger(parsedOrder) || parsedOrder < 0) {
        setFeedback({
          type: "error",
          message: t("pages.sectionManager.errors.orderIndexInvalid"),
        });
        return;
      }

      if (parsedOrder !== currentOrderIndex) {
        payload.order_index = parsedOrder;
      }
    }

    if (Object.keys(payload).length === 0) {
      closeEditDialog();
      setFeedback({
        type: "success",
        message: t("pages.sectionManager.messages.noChanges"),
      });
      return;
    }

    updateSection(
      {
        centerId,
        courseId,
        sectionId: editSection.id,
        payload,
      },
      {
        onSuccess: (updatedSection) => {
          closeEditDialog();
          setFeedback({
            type: "success",
            message:
              getResponseMessage(updatedSection) ??
              t("pages.sectionManager.messages.sectionUpdated"),
          });
        },
        onError: (error) => {
          setFeedback({
            type: "error",
            message: getSectionApiErrorMessage(
              error,
              t("pages.sectionManager.errors.updateFailed"),
            ),
          });
        },
      },
    );
  };

  const handleCreateSection = () => {
    const title = createTitle.trim();
    const description = createDescription.trim();
    const sortOrderRaw = createSortOrder.trim();

    if (!title) {
      setFeedback({
        type: "error",
        message: t("pages.sectionManager.errors.sectionTitleRequired"),
      });
      return;
    }

    let sortOrder: number | undefined;
    if (sortOrderRaw) {
      const parsedSort = Number(sortOrderRaw);
      const isValidSort = Number.isInteger(parsedSort) && parsedSort >= 0;
      if (!isValidSort) {
        setFeedback({
          type: "error",
          message: t("pages.sectionManager.errors.sortOrderInvalid"),
        });
        return;
      }
      sortOrder = parsedSort;
    }

    const videoIds = normalizeMediaIds(selectedVideoIds);
    const pdfIds = normalizeMediaIds(selectedPdfIds);
    const hasStructureMedia = videoIds.length > 0 || pdfIds.length > 0;

    const basePayload = {
      title_translations: { en: title },
      ...(description ? { description_translations: { en: description } } : {}),
      ...(typeof sortOrder === "number" ? { sort_order: sortOrder } : {}),
    };

    if (hasStructureMedia) {
      createSectionWithStructure(
        {
          centerId,
          courseId,
          payload: {
            ...basePayload,
            ...(videoIds.length > 0 ? { videos: videoIds } : {}),
            ...(pdfIds.length > 0 ? { pdfs: pdfIds } : {}),
          },
        },
        {
          onSuccess: (createdSection) => {
            closeCreateDialog();
            const backendMessage =
              getResponseMessage(createdSection) ??
              t("pages.sectionManager.messages.sectionWithStructureCreated");
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
                t("pages.sectionManager.errors.createWithStructureFailed"),
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
          closeCreateDialog();
          const backendMessage =
            getResponseMessage(createdSection) ??
            t("pages.sectionManager.messages.sectionCreated");
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
              t("pages.sectionManager.errors.createFailed"),
            ),
          });
        },
      },
    );
  };

  const handleTogglePublished = (section: Section) => {
    const isPublished = resolvePublishedValue(section) === true;

    const action = isPublished ? unpublishSection : publishSection;
    const successMessage = isPublished
      ? t("pages.sectionManager.messages.sectionUnpublished")
      : t("pages.sectionManager.messages.sectionPublished");
    const fallbackError = isPublished
      ? t("pages.sectionManager.errors.unpublishFailed")
      : t("pages.sectionManager.errors.publishFailed");

    action(
      {
        centerId,
        courseId,
        sectionId: section.id,
      },
      {
        onSuccess: (updatedSection) => {
          setFeedback({
            type: "success",
            message: getResponseMessage(updatedSection) ?? successMessage,
          });
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
    const confirmed = window.confirm(
      t("pages.sectionManager.confirm.deleteOne"),
    );
    if (!confirmed) return;

    deleteSection(
      {
        centerId,
        courseId,
        sectionId: section.id,
      },
      {
        onSuccess: () => {
          setFeedback({
            type: "success",
            message: t("pages.sectionManager.messages.sectionDeleted"),
          });
        },
        onError: (error) => {
          setFeedback({
            type: "error",
            message: getSectionApiErrorMessage(
              error,
              t("pages.sectionManager.errors.deleteFailed"),
            ),
          });
        },
      },
    );
  };

  const handleBulkAction = async (action: BulkAction) => {
    if (selectedSectionsList.length === 0 || isBulkActing) return;

    if (action === "publish" || action === "unpublish") {
      setBulkPublishDialogMode(action);
      return;
    }

    const confirmed = window.confirm(
      t("pages.sectionManager.confirm.deleteSelected", {
        count: selectedSectionsList.length,
      }),
    );
    if (!confirmed) return;

    setIsBulkActing(true);

    const actionPromises = selectedSectionsList.map((section) =>
      deleteSectionAsync({
        centerId,
        courseId,
        sectionId: section.id,
      }),
    );

    const results = await Promise.allSettled(actionPromises);
    const successCount = results.filter(
      (result) => result.status === "fulfilled",
    ).length;

    setIsBulkActing(false);
    setSelectedSections({});

    if (successCount === selectedSectionsList.length) {
      setFeedback({
        type: "success",
        message: t("pages.sectionManager.messages.deletedSelected", {
          count: successCount,
        }),
      });
      return;
    }

    setFeedback({
      type: "error",
      message: t("pages.sectionManager.errors.deletedPartial", {
        success: successCount,
        total: selectedSectionsList.length,
      }),
    });
  };

  const openMediaManager = (mode: MediaManagerMode, section: Section) => {
    setMediaManagerState({ mode, section });
  };

  const detailsSectionData = detailsQueryData ?? detailsSection;
  const detailsPublishState = detailsSectionData
    ? resolvePublishedValue(detailsSectionData)
    : null;
  const detailsVisibilityState = detailsSectionData
    ? resolveVisibilityValue(detailsSectionData)
    : null;
  const detailTitleTranslations =
    detailsSectionData?.title_translations ?? null;
  const detailDescriptionTranslations =
    detailsSectionData?.description_translations ?? null;
  const detailVideos = Array.isArray(detailsSectionData?.videos)
    ? detailsSectionData.videos
    : [];
  const detailPdfs = Array.isArray(detailsSectionData?.pdfs)
    ? detailsSectionData.pdfs
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.sectionManager.title")}
        description={t("pages.sectionManager.description")}
        breadcrumbs={breadcrumbs}
        actions={
          showCourseNotFound ? null : (
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                {t("pages.sectionManager.actions.addSection")}
              </Button>
              <Link href={backHref}>
                <Button variant="outline">
                  {t("pages.sectionManager.actions.backToCourse")}
                </Button>
              </Link>
            </div>
          )
        }
      />

      <div className="space-y-6">
        {feedback && !showCourseNotFound ? (
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

        {showCourseNotFound ? (
          <AppNotFoundState
            scopeLabel={t("pages.sectionManager.notFound.scopeLabel")}
            title={t("pages.sectionManager.notFound.title")}
            description={t("pages.sectionManager.notFound.description")}
            primaryAction={{
              href: backHref,
              label: t("pages.sectionManager.actions.backToCourse"),
            }}
            secondaryAction={{
              href: `/centers/${centerId}/courses`,
              label: t("pages.sectionManager.notFound.goToCourses"),
              variant: "outline",
            }}
          />
        ) : (
          <ListingCard>
            <ListingFilters
              activeCount={activeFilterCount}
              isFetching={isFetching}
              isLoading={isLoading}
              hasActiveFilters={hasActiveFilters}
              onClear={() => {
                setSearch("");
                setQuery("");
                setPublishedFilter(ALL_PUBLISHED_VALUE);
                setPage(1);
              }}
              summary={
                <>
                  {total}{" "}
                  {t(
                    total === 1
                      ? "pages.sectionManager.summary.sectionSingle"
                      : "pages.sectionManager.summary.sectionPlural",
                  )}
                </>
              }
              gridClassName="grid-cols-1 md:grid-cols-2"
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
                  placeholder={t(
                    "pages.sectionManager.filters.searchPlaceholder",
                  )}
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
                  aria-label={t("pages.sectionManager.filters.clearSearch")}
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

              <Select
                value={publishedFilter}
                onValueChange={(value) => {
                  setPage(1);
                  if (
                    value === ALL_PUBLISHED_VALUE ||
                    value === "1" ||
                    value === "0"
                  ) {
                    setPublishedFilter(value);
                    return;
                  }
                  setPublishedFilter(ALL_PUBLISHED_VALUE);
                }}
              >
                <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
                  <SelectValue
                    placeholder={t("pages.sectionManager.filters.published")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_PUBLISHED_VALUE}>
                    {t("pages.sectionManager.filters.allPublishStates")}
                  </SelectItem>
                  <SelectItem value="1">
                    {t("pages.sectionManager.status.published")}
                  </SelectItem>
                  <SelectItem value="0">
                    {t("pages.sectionManager.status.draft")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </ListingFilters>

            {isError ? (
              <div className="p-6">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {t("pages.sectionManager.errors.loadFailed")}
                </p>
              </div>
            ) : (
              <div
                className={cn(
                  "overflow-x-auto transition-opacity",
                  isFetching && !isLoading ? "opacity-60" : "opacity-100",
                )}
              >
                <Table className="min-w-[1080px]">
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 dark:bg-gray-800/60">
                      <TableHead className="w-8">
                        <input
                          type="checkbox"
                          className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                          checked={isAllPageSelected}
                          onChange={toggleAllSelections}
                          disabled={
                            isLoadingState || items.length === 0 || isBusy
                          }
                          aria-label={t("pages.sectionManager.table.selectAll")}
                        />
                      </TableHead>
                      <TableHead className="font-medium">
                        {t("pages.sectionManager.table.headers.title")}
                      </TableHead>
                      <TableHead className="font-medium">
                        {t("pages.sectionManager.table.headers.order")}
                      </TableHead>
                      <TableHead className="font-medium">
                        {t("pages.sectionManager.table.headers.media")}
                      </TableHead>
                      <TableHead className="font-medium">
                        {t("pages.sectionManager.table.headers.updated")}
                      </TableHead>
                      <TableHead className="font-medium">
                        {t("pages.sectionManager.table.headers.status")}
                      </TableHead>
                      <TableHead className="w-10 text-right font-medium">
                        {t("pages.sectionManager.table.headers.actions")}
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
                              <Skeleton className="h-4 w-20" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-4 w-28" />
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
                        <TableCell colSpan={7} className="h-48">
                          <EmptyState
                            title={
                              query
                                ? t("pages.sectionManager.empty.noResultsTitle")
                                : t("pages.sectionManager.empty.noDataTitle")
                            }
                            description={
                              query
                                ? t(
                                    "pages.sectionManager.empty.noResultsDescription",
                                  )
                                : t(
                                    "pages.sectionManager.empty.noDataDescription",
                                  )
                            }
                            className="border-0 bg-transparent"
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((section, _index) => {
                        const publishState = resolvePublishedValue(section);
                        const status =
                          publishState == null
                            ? getStatusBadge(section.status, t)
                            : publishState
                              ? {
                                  variant: "success" as const,
                                  label: t(
                                    "pages.sectionManager.status.published",
                                  ),
                                }
                              : {
                                  variant: "secondary" as const,
                                  label: t("pages.sectionManager.status.draft"),
                                };
                        const isPublished = publishState === true;
                        const videoCount = getSectionMediaCount(
                          section,
                          "videos",
                        );
                        const pdfCount = getSectionMediaCount(section, "pdfs");
                        return (
                          <TableRow
                            key={section.id}
                            className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                          >
                            <TableCell>
                              <input
                                type="checkbox"
                                className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                                checked={Boolean(
                                  selectedSections[String(section.id)],
                                )}
                                onChange={() => toggleSectionSelection(section)}
                                aria-label={t(
                                  "pages.sectionManager.table.selectOne",
                                  {
                                    name: getSectionTitle(section, t),
                                  },
                                )}
                              />
                            </TableCell>
                            <TableCell className="font-medium text-gray-900 dark:text-white">
                              {getSectionTitle(section, t)}
                            </TableCell>
                            <TableCell className="text-gray-500 dark:text-gray-400">
                              {section.order_index ?? section.sort_order ?? "—"}
                            </TableCell>
                            <TableCell className="text-gray-500 dark:text-gray-400">
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
                            </TableCell>
                            <TableCell className="text-gray-500 dark:text-gray-400">
                              {formatDateTime(section.updated_at)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant}>
                                {status.label}
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
                                    )}
                                  >
                                    <button
                                      className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        openEditDialog(section);
                                      }}
                                      disabled={isBusy}
                                    >
                                      {t("pages.sectionManager.menu.edit")}
                                    </button>
                                    <button
                                      className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        setDetailsSection(section);
                                      }}
                                    >
                                      {t(
                                        "pages.sectionManager.menu.viewDetails",
                                      )}
                                    </button>
                                    <button
                                      className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        handleTogglePublished(section);
                                      }}
                                      disabled={isBusy}
                                    >
                                      {isPublished
                                        ? t(
                                            "pages.sectionManager.menu.unpublish",
                                          )
                                        : t(
                                            "pages.sectionManager.menu.publish",
                                          )}
                                    </button>
                                    <button
                                      className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        openMediaManager("video", section);
                                      }}
                                      disabled={isBusy}
                                    >
                                      {t(
                                        "pages.sectionManager.menu.manageVideos",
                                      )}
                                    </button>
                                    <button
                                      className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        openMediaManager("pdf", section);
                                      }}
                                      disabled={isBusy}
                                    >
                                      {t(
                                        "pages.sectionManager.menu.managePdfs",
                                      )}
                                    </button>
                                    <button
                                      className="w-full rounded px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        handleDelete(section);
                                      }}
                                      disabled={isBusy}
                                    >
                                      {t("pages.sectionManager.menu.delete")}
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
                  {t("pages.sectionManager.bulk.selected", {
                    count: selectedCount,
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction("publish")}
                    disabled={
                      isBusy || selectedPublishableSections.length === 0
                    }
                  >
                    {t("pages.sectionManager.bulk.publish")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction("unpublish")}
                    disabled={
                      isBusy || selectedUnpublishableSections.length === 0
                    }
                  >
                    {t("pages.sectionManager.bulk.unpublish")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-600"
                    onClick={() => handleBulkAction("delete")}
                    disabled={isBusy}
                  >
                    {t("pages.sectionManager.bulk.delete")}
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
        )}
      </div>

      <Dialog
        open={Boolean(detailsSection)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsSection(null);
          }
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-3xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle>
              {detailsSectionData
                ? getSectionTitle(detailsSectionData, t)
                : t("pages.sectionManager.details.defaultTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("pages.sectionManager.details.description")}
            </DialogDescription>
          </DialogHeader>

          {isDetailsLoading && !detailsSectionData ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : null}

          {isDetailsError && !detailsSectionData ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              {t("pages.sectionManager.errors.loadDetailsFailed")}
            </p>
          ) : null}

          {detailsSectionData ? (
            <div className="space-y-4">
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t("pages.sectionManager.details.labels.sectionId")}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {detailsSectionData.id}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t("pages.sectionManager.details.labels.sortOrder")}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {detailsSectionData.order_index ??
                      detailsSectionData.sort_order ??
                      "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t("pages.sectionManager.details.labels.published")}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {detailsPublishState == null
                      ? "—"
                      : detailsPublishState
                        ? t("pages.sectionManager.status.published")
                        : t("pages.sectionManager.status.draft")}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t("pages.sectionManager.details.labels.visible")}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {detailsVisibilityState == null
                      ? "—"
                      : detailsVisibilityState
                        ? t("pages.sectionManager.details.values.visible")
                        : t("pages.sectionManager.details.values.hidden")}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t("pages.sectionManager.details.labels.created")}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatDateTime(detailsSectionData.created_at)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t("pages.sectionManager.details.labels.updated")}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatDateTime(detailsSectionData.updated_at)}
                  </p>
                </div>
              </section>

              <section className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t("pages.sectionManager.details.sections.description")}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {detailsSectionData.description || "—"}
                </p>
              </section>

              <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t("pages.sectionManager.details.sections.titleTranslations")}
                </p>
                {detailTitleTranslations &&
                Object.keys(detailTitleTranslations).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(detailTitleTranslations).map(
                      ([locale, value]) => (
                        <div
                          key={`title-${locale}`}
                          className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800/60"
                        >
                          <span className="font-medium text-gray-600 dark:text-gray-300">
                            {locale.toUpperCase()}:
                          </span>{" "}
                          <span className="text-gray-900 dark:text-white">
                            {value || "—"}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">—</p>
                )}
              </section>

              <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t(
                    "pages.sectionManager.details.sections.descriptionTranslations",
                  )}
                </p>
                {detailDescriptionTranslations &&
                Object.keys(detailDescriptionTranslations).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(detailDescriptionTranslations).map(
                      ([locale, value]) => (
                        <div
                          key={`description-${locale}`}
                          className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800/60"
                        >
                          <span className="font-medium text-gray-600 dark:text-gray-300">
                            {locale.toUpperCase()}:
                          </span>{" "}
                          <span className="text-gray-900 dark:text-white">
                            {value || "—"}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">—</p>
                )}
              </section>

              <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t("pages.sectionManager.details.sections.videos", {
                      count: detailVideos.length,
                    })}
                  </p>
                  {detailVideos.length > 0 ? (
                    <div className="space-y-2">
                      {detailVideos.map((video) => (
                        <div
                          key={`detail-video-${video.id}`}
                          className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800/60"
                        >
                          <p className="font-medium text-gray-900 dark:text-white">
                            {video.title ??
                              video.name ??
                              t("pages.sectionManager.unknown.untitledVideo")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t("pages.sectionManager.details.labels.id")}:{" "}
                            {video.id}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("pages.sectionManager.details.sections.noVideos")}
                    </p>
                  )}
                </div>

                <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t("pages.sectionManager.details.sections.pdfs", {
                      count: detailPdfs.length,
                    })}
                  </p>
                  {detailPdfs.length > 0 ? (
                    <div className="space-y-2">
                      {detailPdfs.map((pdf) => (
                        <div
                          key={`detail-pdf-${pdf.id}`}
                          className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800/60"
                        >
                          <p className="font-medium text-gray-900 dark:text-white">
                            {pdf.title ??
                              pdf.name ??
                              t("pages.sectionManager.unknown.untitledPdf")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t("pages.sectionManager.details.labels.id")}:{" "}
                            {pdf.id}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("pages.sectionManager.details.sections.noPdfs")}
                    </p>
                  )}
                </div>
              </section>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editSection)}
        onOpenChange={(open) => {
          if (open) return;
          if (isUpdating) return;
          closeEditDialog();
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {t("pages.sectionManager.editDialog.title")}
            </DialogTitle>
            <DialogDescription>
              {t("pages.sectionManager.editDialog.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-section-title-en">
                {t("pages.sectionManager.editDialog.fields.titleEn")}
              </Label>
              <Input
                id="edit-section-title-en"
                value={editTitleEn}
                onChange={(event) => setEditTitleEn(event.target.value)}
                placeholder={t(
                  "pages.sectionManager.editDialog.placeholders.titleEn",
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-section-title-ar">
                {t("pages.sectionManager.editDialog.fields.titleAr")}
              </Label>
              <Input
                id="edit-section-title-ar"
                value={editTitleAr}
                onChange={(event) => setEditTitleAr(event.target.value)}
                dir="rtl"
                placeholder={t(
                  "pages.sectionManager.editDialog.placeholders.titleAr",
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-section-description-en">
                {t("pages.sectionManager.editDialog.fields.descriptionEn")}
              </Label>
              <Textarea
                id="edit-section-description-en"
                value={editDescriptionEn}
                onChange={(event) => setEditDescriptionEn(event.target.value)}
                rows={3}
                placeholder={t(
                  "pages.sectionManager.editDialog.placeholders.descriptionEn",
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-section-description-ar">
                {t("pages.sectionManager.editDialog.fields.descriptionAr")}
              </Label>
              <Textarea
                id="edit-section-description-ar"
                value={editDescriptionAr}
                onChange={(event) => setEditDescriptionAr(event.target.value)}
                rows={3}
                dir="rtl"
                placeholder={t(
                  "pages.sectionManager.editDialog.placeholders.descriptionAr",
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-section-order-index">
                {t("pages.sectionManager.editDialog.fields.orderIndex")}
              </Label>
              <Input
                id="edit-section-order-index"
                value={editOrderIndex}
                onChange={(event) => setEditOrderIndex(event.target.value)}
                type="number"
                min={0}
                placeholder={t(
                  "pages.sectionManager.editDialog.placeholders.orderIndex",
                )}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeEditDialog}
              disabled={isUpdating}
            >
              {t("common.actions.cancel")}
            </Button>
            <Button onClick={handleUpdateSection} disabled={isUpdating}>
              {isUpdating
                ? t("common.actions.saving")
                : t("pages.sectionManager.actions.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (isCreateSubmitting) return;
            closeCreateDialog();
            return;
          }

          setIsCreateDialogOpen(true);
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {t("pages.sectionManager.createDialog.title")}
            </DialogTitle>
            <DialogDescription>
              {t("pages.sectionManager.createDialog.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-section-title">
                {t("pages.sectionManager.createDialog.fields.title")}
              </Label>
              <Input
                id="create-section-title"
                value={createTitle}
                onChange={(event) => setCreateTitle(event.target.value)}
                placeholder={t(
                  "pages.sectionManager.createDialog.placeholders.title",
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-section-description">
                {t("pages.sectionManager.createDialog.fields.description")}
              </Label>
              <Textarea
                id="create-section-description"
                value={createDescription}
                onChange={(event) => setCreateDescription(event.target.value)}
                rows={3}
                placeholder={t(
                  "pages.sectionManager.createDialog.placeholders.description",
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-section-sort-order">
                {t("pages.sectionManager.createDialog.fields.sortOrder")}
              </Label>
              <Input
                id="create-section-sort-order"
                value={createSortOrder}
                onChange={(event) => setCreateSortOrder(event.target.value)}
                type="number"
                min={0}
                placeholder={t(
                  "pages.sectionManager.createDialog.placeholders.sortOrder",
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>
                {t("pages.sectionManager.createDialog.fields.videos")}
              </Label>
              <SearchableMultiSelect
                values={selectedVideoIds}
                onValuesChange={setSelectedVideoIds}
                options={videoOptions}
                placeholder={t(
                  "pages.sectionManager.createDialog.placeholders.selectVideos",
                )}
                searchPlaceholder={t(
                  "pages.sectionManager.createDialog.placeholders.searchVideos",
                )}
                searchValue={videoSearch}
                onSearchValueChange={setVideoSearch}
                filterOptions={false}
                isLoading={isVideosLoading}
                hasMore={Boolean(hasMoreVideos)}
                isLoadingMore={isVideosLoadingMore}
                onReachEnd={() => {
                  if (!hasMoreVideos || isVideosLoadingMore) return;
                  void fetchMoreVideos();
                }}
                emptyMessage={
                  debouncedVideoSearch
                    ? t(
                        "pages.sectionManager.createDialog.empty.noMatchingVideos",
                      )
                    : t("pages.sectionManager.createDialog.empty.noVideos")
                }
              />
            </div>

            <div className="space-y-2">
              <Label>
                {t("pages.sectionManager.createDialog.fields.pdfs")}
              </Label>
              <SearchableMultiSelect
                values={selectedPdfIds}
                onValuesChange={setSelectedPdfIds}
                options={pdfOptions}
                placeholder={t(
                  "pages.sectionManager.createDialog.placeholders.selectPdfs",
                )}
                searchPlaceholder={t(
                  "pages.sectionManager.createDialog.placeholders.searchPdfs",
                )}
                searchValue={pdfSearch}
                onSearchValueChange={setPdfSearch}
                filterOptions={false}
                isLoading={isPdfsLoading}
                hasMore={Boolean(hasMorePdfs)}
                isLoadingMore={isPdfsLoadingMore}
                onReachEnd={() => {
                  if (!hasMorePdfs || isPdfsLoadingMore) return;
                  void fetchMorePdfs();
                }}
                emptyMessage={
                  debouncedPdfSearch
                    ? t(
                        "pages.sectionManager.createDialog.empty.noMatchingPdfs",
                      )
                    : t("pages.sectionManager.createDialog.empty.noPdfs")
                }
              />
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("pages.sectionManager.createDialog.structureHint")}
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeCreateDialog}
              disabled={isCreateSubmitting}
            >
              {t("common.actions.cancel")}
            </Button>
            <Button onClick={handleCreateSection} disabled={isCreateSubmitting}>
              {isCreateSubmitting
                ? t("pages.sectionManager.actions.creating")
                : t("pages.sectionManager.actions.createSection")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkSectionPublishDialog
        open={bulkPublishDialogMode === "publish"}
        onOpenChange={(open) => {
          if (!open) {
            setBulkPublishDialogMode(null);
          }
        }}
        mode="publish"
        sections={selectedPublishableSections}
        centerId={centerId}
        courseId={courseId}
        onProcessed={({ success, message, shouldClearSelection }) => {
          setFeedback({
            type: success ? "success" : "error",
            message,
          });

          if (success && shouldClearSelection) {
            setSelectedSections({});
          }
        }}
      />

      <BulkSectionPublishDialog
        open={bulkPublishDialogMode === "unpublish"}
        onOpenChange={(open) => {
          if (!open) {
            setBulkPublishDialogMode(null);
          }
        }}
        mode="unpublish"
        sections={selectedUnpublishableSections}
        centerId={centerId}
        courseId={courseId}
        onProcessed={({ success, message, shouldClearSelection }) => {
          setFeedback({
            type: success ? "success" : "error",
            message,
          });

          if (success && shouldClearSelection) {
            setSelectedSections({});
          }
        }}
      />

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
          setFeedback({
            type: "success",
            message,
          });
        }}
      />
    </div>
  );
}
