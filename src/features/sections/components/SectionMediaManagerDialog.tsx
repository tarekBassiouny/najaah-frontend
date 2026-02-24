"use client";

import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAttachSectionPdf,
  useAttachSectionVideo,
  useDetachSectionPdf,
  useDetachSectionVideo,
  useSection,
} from "@/features/sections/hooks/use-sections";
import { getSectionApiErrorMessage } from "@/features/sections/lib/api-error";
import type {
  Section,
  SectionMediaItem,
} from "@/features/sections/types/section";
import { listPdfs } from "@/features/pdfs/services/pdfs.service";
import { listVideos } from "@/features/videos/services/videos.service";
import { getAdminResponseMessage } from "@/lib/admin-response";

const MEDIA_PICKER_PAGE_SIZE = 20;
const MEDIA_SEARCH_DEBOUNCE_MS = 300;

type SectionMediaManagerDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  mode: "video" | "pdf";
  section: Section | null;
  centerId: string | number;
  courseId: string | number;
  onSuccess?: (_message: string) => void;
};

function getMediaLabel(mode: "video" | "pdf") {
  return mode === "video" ? "Video" : "PDF";
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

function normalizeMediaId(value: string): string | number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : value;
}

export function SectionMediaManagerDialog({
  open,
  onOpenChange,
  mode,
  section,
  centerId,
  courseId,
  onSuccess,
}: SectionMediaManagerDialogProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detachTarget, setDetachTarget] = useState<SectionMediaItem | null>(
    null,
  );
  const [isBatchAttaching, setIsBatchAttaching] = useState(false);

  const sectionId = section?.id;
  const mediaLabel = getMediaLabel(mode);

  const {
    data: detailsData,
    isLoading: isDetailsLoading,
    isError: isDetailsError,
    refetch: refetchDetails,
  } = useSection(centerId, courseId, sectionId, {
    enabled: open && Boolean(sectionId),
  });

  const { mutateAsync: attachVideoAsync, isPending: isAttachingVideo } =
    useAttachSectionVideo();
  const { mutateAsync: attachPdfAsync, isPending: isAttachingPdf } =
    useAttachSectionPdf();
  const { mutateAsync: detachVideoAsync, isPending: isDetachingVideo } =
    useDetachSectionVideo();
  const { mutateAsync: detachPdfAsync, isPending: isDetachingPdf } =
    useDetachSectionPdf();

  const {
    data: optionsData,
    isLoading: isOptionsLoading,
    isFetchingNextPage: isOptionsLoadingMore,
    hasNextPage: hasMoreOptions,
    fetchNextPage: fetchMoreOptions,
  } = useInfiniteQuery({
    queryKey: [
      "section-media-options",
      mode,
      centerId,
      courseId,
      debouncedSearch,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      const page = Number(pageParam ?? 1);
      if (mode === "video") {
        return listVideos({
          centerId,
          page,
          per_page: MEDIA_PICKER_PAGE_SIZE,
          search: debouncedSearch || undefined,
        });
      }

      return listPdfs({
        centerId,
        page,
        per_page: MEDIA_PICKER_PAGE_SIZE,
        search: debouncedSearch || undefined,
      });
    },
    enabled: open,
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.meta?.page ?? 1);
      const perPage = Number(lastPage.meta?.per_page ?? MEDIA_PICKER_PAGE_SIZE);
      const total = Number(lastPage.meta?.total ?? 0);
      return page * perPage < total ? page + 1 : undefined;
    },
    staleTime: 60_000,
  });

  const sectionData = detailsData ?? section;
  const attachedItems = useMemo(() => {
    const list = mode === "video" ? sectionData?.videos : sectionData?.pdfs;
    return Array.isArray(list) ? list : [];
  }, [mode, sectionData]);
  const attachedItemIds = useMemo(
    () => new Set(attachedItems.map((item) => String(item.id))),
    [attachedItems],
  );

  const options = useMemo(() => {
    const dedupe = new Map<
      string,
      {
        value: string;
        label: string;
        disabled: boolean;
      }
    >();

    (optionsData?.pages ?? []).forEach((pageData) => {
      pageData.items.forEach((entry) => {
        const item = entry as Record<string, unknown>;
        const key = String(item.id);
        if (dedupe.has(key)) return;

        dedupe.set(key, {
          value: key,
          label: getMediaTitle(item, mediaLabel),
          disabled: attachedItemIds.has(key),
        });
      });
    });

    return Array.from(dedupe.values());
  }, [attachedItemIds, mediaLabel, optionsData?.pages]);

  const isMutating =
    isBatchAttaching ||
    isAttachingVideo ||
    isAttachingPdf ||
    isDetachingVideo ||
    isDetachingPdf;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, MEDIA_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!open) {
      setErrorMessage(null);
      setSearch("");
      setDebouncedSearch("");
      setSelectedIds([]);
      setDetachTarget(null);
      setIsBatchAttaching(false);
    }
  }, [open]);

  const handleAttachSelected = async () => {
    if (!sectionId) return;

    const idsToAttach = selectedIds.filter((id) => !attachedItemIds.has(id));
    if (idsToAttach.length === 0) {
      setErrorMessage(
        `Select at least one ${mediaLabel.toLowerCase()} to attach.`,
      );
      return;
    }

    setErrorMessage(null);
    setIsBatchAttaching(true);

    const results = await Promise.allSettled(
      idsToAttach.map((id) => {
        if (mode === "video") {
          return attachVideoAsync({
            centerId,
            courseId,
            sectionId,
            payload: { video_id: normalizeMediaId(id) },
          });
        }

        return attachPdfAsync({
          centerId,
          courseId,
          sectionId,
          payload: { pdf_id: normalizeMediaId(id) },
        });
      }),
    );

    setIsBatchAttaching(false);

    const successful = results.filter(
      (result): result is PromiseFulfilledResult<unknown> =>
        result.status === "fulfilled",
    );
    const failed = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );

    if (successful.length > 0) {
      const fallbackMessage =
        successful.length === 1
          ? `${mediaLabel} attached successfully.`
          : `${successful.length} ${mediaLabel.toLowerCase()}s attached successfully.`;
      const message = getAdminResponseMessage(
        successful[successful.length - 1].value,
        fallbackMessage,
      );

      onSuccess?.(message);
      setSelectedIds([]);
      await refetchDetails();
    }

    if (failed.length > 0) {
      const fallbackError =
        successful.length > 0
          ? `Attached ${successful.length} of ${idsToAttach.length} selected ${mediaLabel.toLowerCase()}s.`
          : `Failed to attach ${mediaLabel.toLowerCase()}.`;

      const firstError = failed[0]?.reason;
      setErrorMessage(getSectionApiErrorMessage(firstError, fallbackError));
    }
  };

  const handleDetachConfirm = async () => {
    if (!sectionId || !detachTarget?.id) return;

    setErrorMessage(null);

    try {
      const response =
        mode === "video"
          ? await detachVideoAsync({
              centerId,
              courseId,
              sectionId,
              videoId: detachTarget.id,
            })
          : await detachPdfAsync({
              centerId,
              courseId,
              sectionId,
              pdfId: detachTarget.id,
            });

      const message = getAdminResponseMessage(
        response,
        `${mediaLabel} detached successfully.`,
      );
      onSuccess?.(message);
      setDetachTarget(null);
      await refetchDetails();
    } catch (error) {
      setErrorMessage(
        getSectionApiErrorMessage(
          error,
          `Failed to detach ${mediaLabel.toLowerCase()}.`,
        ),
      );
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (isMutating) return;
          onOpenChange(nextOpen);
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-3xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle>Manage {mediaLabel}s</DialogTitle>
            <DialogDescription>
              Attach or detach {mediaLabel.toLowerCase()}s for this section.
            </DialogDescription>
          </DialogHeader>

          {errorMessage ? (
            <Alert variant="destructive">
              <AlertTitle>Action failed</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label>Add {mediaLabel}s</Label>
            <SearchableMultiSelect
              values={selectedIds}
              onValuesChange={setSelectedIds}
              options={options}
              placeholder={`Select ${mediaLabel.toLowerCase()}s to attach`}
              searchPlaceholder={`Search ${mediaLabel.toLowerCase()}s...`}
              searchValue={search}
              onSearchValueChange={setSearch}
              filterOptions={false}
              isLoading={isOptionsLoading}
              hasMore={Boolean(hasMoreOptions)}
              isLoadingMore={isOptionsLoadingMore}
              onReachEnd={() => {
                if (!hasMoreOptions || isOptionsLoadingMore) return;
                void fetchMoreOptions();
              }}
              emptyMessage={
                debouncedSearch
                  ? `No matching ${mediaLabel.toLowerCase()}s found.`
                  : `No ${mediaLabel.toLowerCase()}s available.`
              }
            />
            <div className="flex justify-end">
              <Button onClick={handleAttachSelected} disabled={isMutating}>
                {isBatchAttaching ? "Attaching..." : "Attach Selected"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Attached {mediaLabel}s</Label>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {attachedItems.length} attached
              </span>
            </div>

            {isDetailsLoading && !sectionData ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : null}

            {isDetailsError && !sectionData ? (
              <p className="text-sm text-red-600 dark:text-red-400">
                Failed to load attached {mediaLabel.toLowerCase()}s.
              </p>
            ) : null}

            {!isDetailsLoading && attachedItems.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 px-3 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                No {mediaLabel.toLowerCase()}s attached yet.
              </p>
            ) : null}

            {attachedItems.length > 0 ? (
              <div className="space-y-2">
                {attachedItems.map((item) => (
                  <div
                    key={`${mode}-${item.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-900/30"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {getMediaTitle(
                          item as Record<string, unknown>,
                          mediaLabel,
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {item.id}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-600"
                      onClick={() => setDetachTarget(item)}
                      disabled={isMutating}
                    >
                      Detach
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(detachTarget)}
        onOpenChange={(nextOpen) => {
          if (isMutating) return;
          if (!nextOpen) setDetachTarget(null);
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-md overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle>Detach {mediaLabel}</DialogTitle>
            <DialogDescription>
              {detachTarget
                ? `Are you sure you want to detach "${getMediaTitle(detachTarget as Record<string, unknown>, mediaLabel)}"?`
                : "Are you sure you want to detach this item?"}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
            <Button
              variant="outline"
              onClick={() => setDetachTarget(null)}
              disabled={isMutating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDetachConfirm}
              disabled={isMutating}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDetachingVideo || isDetachingPdf ? "Detaching..." : "Detach"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
