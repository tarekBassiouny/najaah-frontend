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
  useBulkAttachSectionPdfs,
  useBulkAttachSectionVideos,
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
import {
  getAdminResponseMessage,
  isAdminRequestSuccessful,
} from "@/lib/admin-response";
import { useTranslation } from "@/features/localization";

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

type MediaOptionsPage = {
  items: Array<Record<string, unknown>>;
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
};

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
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detachTarget, setDetachTarget] = useState<SectionMediaItem | null>(
    null,
  );
  const [isBatchAttaching, setIsBatchAttaching] = useState(false);

  const sectionId = section?.id;
  const mediaLabel =
    mode === "video"
      ? t("pages.sectionManager.media.videoSingular")
      : t("pages.sectionManager.media.pdfSingular");
  const mediaLabelPlural =
    mode === "video"
      ? t("pages.sectionManager.media.videoPlural")
      : t("pages.sectionManager.media.pdfPlural");

  const {
    data: detailsData,
    isLoading: isDetailsLoading,
    isError: isDetailsError,
    refetch: refetchDetails,
  } = useSection(centerId, courseId, sectionId, {
    enabled: open && Boolean(sectionId),
  });

  const { mutateAsync: bulkAttachVideosAsync, isPending: isAttachingVideos } =
    useBulkAttachSectionVideos();
  const { mutateAsync: bulkAttachPdfsAsync, isPending: isAttachingPdfs } =
    useBulkAttachSectionPdfs();
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
  } = useInfiniteQuery<MediaOptionsPage>({
    queryKey: [
      "section-media-options",
      mode,
      centerId,
      courseId,
      debouncedSearch,
    ],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const page = Number(pageParam ?? 1);
      if (mode === "video") {
        const response = await listVideos({
          centerId,
          page,
          per_page: MEDIA_PICKER_PAGE_SIZE,
          search: debouncedSearch || undefined,
        });
        return {
          items: response.items as Array<Record<string, unknown>>,
          meta: response.meta,
        };
      }

      const response = await listPdfs({
        centerId,
        page,
        per_page: MEDIA_PICKER_PAGE_SIZE,
        search: debouncedSearch || undefined,
      });
      return {
        items: response.items as Array<Record<string, unknown>>,
        meta: response.meta,
      };
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
      pageData.items.forEach((item) => {
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
    isAttachingVideos ||
    isAttachingPdfs ||
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

    const idsToAttach = selectedIds
      .filter((id) => !attachedItemIds.has(id))
      .map(normalizeMediaId);
    if (idsToAttach.length === 0) {
      setErrorMessage(
        t("pages.sectionManager.mediaManager.errors.selectOneToAttach", {
          media: mediaLabel,
        }),
      );
      return;
    }

    setErrorMessage(null);
    setIsBatchAttaching(true);

    try {
      const result =
        mode === "video"
          ? await bulkAttachVideosAsync({
              centerId,
              courseId,
              sectionId,
              videoIds: idsToAttach,
            })
          : await bulkAttachPdfsAsync({
              centerId,
              courseId,
              sectionId,
              pdfIds: idsToAttach,
            });

      setIsBatchAttaching(false);

      if (!isAdminRequestSuccessful(result)) {
        setErrorMessage(
          getAdminResponseMessage(
            result,
            t("pages.sectionManager.mediaManager.errors.attachFailed", {
              media: mediaLabelPlural,
            }),
          ),
        );
        return;
      }

      const attached = result.data?.attached ?? 0;
      const failed = result.data?.failed ?? 0;
      const skipped = result.data?.skipped ?? 0;
      const attachedIds = result.data?.details?.attached_ids ?? [];

      if (attached > 0 || skipped > 0) {
        const fallbackMessage =
          attached === 1
            ? t("pages.sectionManager.mediaManager.messages.attachedSingle", {
                media: mediaLabel,
              })
            : attached > 1
              ? t("pages.sectionManager.mediaManager.messages.attachedMany", {
                  count: attached,
                  media: mediaLabelPlural,
                })
              : skipped > 0
                ? t(
                    "pages.sectionManager.mediaManager.messages.alreadyAttached",
                    {
                      count: skipped,
                      media: mediaLabelPlural,
                    },
                  )
                : t("pages.sectionManager.mediaManager.messages.noChanges", {
                    media: mediaLabelPlural,
                  });
        const message = getAdminResponseMessage(result, fallbackMessage);

        if (failed === 0) {
          onSuccess?.(message);
        }

        if (attachedIds.length > 0) {
          const attachedIdSet = new Set(attachedIds.map((id) => String(id)));
          setSelectedIds((prev) =>
            prev.filter((id) => !attachedIdSet.has(String(id))),
          );
        } else if (failed === 0) {
          setSelectedIds([]);
        }

        await refetchDetails();
      }

      if (failed > 0) {
        const firstFailedReason = result.data?.details?.failed?.[0]?.reason;
        const errorMsg =
          attached > 0
            ? t("pages.sectionManager.mediaManager.errors.attachedPartial", {
                attached,
                total: idsToAttach.length,
                media: mediaLabelPlural,
              })
            : t("pages.sectionManager.mediaManager.errors.attachFailed", {
                media: mediaLabelPlural,
              });
        setErrorMessage(
          firstFailedReason ? `${errorMsg} ${firstFailedReason}` : errorMsg,
        );
      }
    } catch (error) {
      setIsBatchAttaching(false);
      setErrorMessage(
        getSectionApiErrorMessage(
          error,
          t("pages.sectionManager.mediaManager.errors.attachFailed", {
            media: mediaLabelPlural,
          }),
        ),
      );
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
        t("pages.sectionManager.mediaManager.messages.detached", {
          media: mediaLabel,
        }),
      );
      onSuccess?.(message);
      setDetachTarget(null);
      await refetchDetails();
    } catch (error) {
      setErrorMessage(
        getSectionApiErrorMessage(
          error,
          t("pages.sectionManager.mediaManager.errors.detachFailed", {
            media: mediaLabel,
          }),
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
            <DialogTitle>
              {t("pages.sectionManager.mediaManager.title", {
                media: mediaLabelPlural,
              })}
            </DialogTitle>
            <DialogDescription>
              {t("pages.sectionManager.mediaManager.description", {
                media: mediaLabelPlural,
              })}
            </DialogDescription>
          </DialogHeader>

          {errorMessage ? (
            <Alert variant="destructive">
              <AlertTitle>
                {t("pages.sectionManager.mediaManager.errorTitle")}
              </AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label>
              {t("pages.sectionManager.mediaManager.addLabel", {
                media: mediaLabelPlural,
              })}
            </Label>
            <SearchableMultiSelect
              values={selectedIds}
              onValuesChange={setSelectedIds}
              options={options}
              placeholder={t(
                "pages.sectionManager.mediaManager.placeholders.selectToAttach",
                { media: mediaLabelPlural },
              )}
              searchPlaceholder={t(
                "pages.sectionManager.mediaManager.placeholders.search",
                { media: mediaLabelPlural },
              )}
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
                  ? t("pages.sectionManager.mediaManager.empty.noMatching", {
                      media: mediaLabelPlural,
                    })
                  : t("pages.sectionManager.mediaManager.empty.noneAvailable", {
                      media: mediaLabelPlural,
                    })
              }
            />
            <div className="flex justify-end">
              <Button onClick={handleAttachSelected} disabled={isMutating}>
                {isBatchAttaching
                  ? t("pages.sectionManager.mediaManager.buttons.attaching")
                  : t(
                      "pages.sectionManager.mediaManager.buttons.attachSelected",
                    )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                {t("pages.sectionManager.mediaManager.attachedLabel", {
                  media: mediaLabelPlural,
                })}
              </Label>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t("pages.sectionManager.mediaManager.attachedCount", {
                  count: attachedItems.length,
                })}
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
                {t(
                  "pages.sectionManager.mediaManager.errors.loadAttachedFailed",
                  {
                    media: mediaLabelPlural,
                  },
                )}
              </p>
            ) : null}

            {!isDetailsLoading && attachedItems.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 px-3 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                {t("pages.sectionManager.mediaManager.empty.noneAttachedYet", {
                  media: mediaLabelPlural,
                })}
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
                        {t("pages.sectionManager.details.labels.id")}: {item.id}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-600"
                      onClick={() => setDetachTarget(item)}
                      disabled={isMutating}
                    >
                      {t("pages.sectionManager.mediaManager.buttons.detach")}
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.actions.close")}
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
            <DialogTitle>
              {t("pages.sectionManager.mediaManager.detachDialog.title", {
                media: mediaLabel,
              })}
            </DialogTitle>
            <DialogDescription>
              {detachTarget
                ? t(
                    "pages.sectionManager.mediaManager.detachDialog.descriptionWithName",
                    {
                      name: getMediaTitle(
                        detachTarget as Record<string, unknown>,
                        mediaLabel,
                      ),
                    },
                  )
                : t(
                    "pages.sectionManager.mediaManager.detachDialog.description",
                  )}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
            <Button
              variant="outline"
              onClick={() => setDetachTarget(null)}
              disabled={isMutating}
            >
              {t("common.actions.cancel")}
            </Button>
            <Button
              onClick={handleDetachConfirm}
              disabled={isMutating}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDetachingVideo || isDetachingPdf
                ? t("pages.sectionManager.mediaManager.buttons.detaching")
                : t("pages.sectionManager.mediaManager.buttons.detach")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
