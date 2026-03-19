"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getStudentRequestApiErrorMessage } from "@/features/student-requests/lib/api-error";
import { useBulkGenerateVideoAccessCodes } from "@/features/video-access/hooks/use-video-access";
import type {
  BulkGenerateVideoAccessCodesResult,
  BulkGenerateVideoAccessCodesPayload,
  VideoAccessWhatsappFormat,
} from "@/features/video-access/types/video-access";
import { useTenant } from "@/app/tenant-provider";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import { listCenterCourses } from "@/features/courses/services/courses.service";
import { listVideos } from "@/features/videos/services/videos.service";
import type { Student } from "@/features/students/types/student";
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
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/features/localization";

const FETCH_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

function normalizeCenterId(value: string | number | null | undefined) {
  if (value == null) return null;
  return String(value).trim().length > 0 ? value : null;
}

function resolveFailureText(
  value: Record<string, unknown>,
  fallbackLabel: string,
  prefixLabel: string,
) {
  const id =
    value.student_id ??
    value.user_id ??
    value.id ??
    value.userId ??
    value.studentId;
  const reason =
    (value.reason as string) ??
    (value.message as string) ??
    (value.error as string);
  const prefix = id != null ? `${prefixLabel}${id}` : "";
  if (reason) {
    return [prefix, reason].filter(Boolean).join(": ");
  }

  const fallback = JSON.stringify(value);
  if (fallback && fallback !== "{}") {
    return [prefix, fallback].filter(Boolean).join(": ");
  }

  return prefix || fallbackLabel;
}

type BulkGenerateVideoAccessCodesDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  students: Student[];
  centerId?: string | number | null;
  allowCenterChange?: boolean;
  onGenerated?: (_result: BulkGenerateVideoAccessCodesResult | null) => void;
};

export function BulkGenerateVideoAccessCodesDialog({
  open,
  onOpenChange,
  students,
  centerId,
  allowCenterChange = false,
  onGenerated,
}: BulkGenerateVideoAccessCodesDialogProps) {
  const { t } = useTranslation();

  const tenant = useTenant();
  const isPlatformAdmin = !tenant.centerSlug;
  const showCenterPicker = allowCenterChange && isPlatformAdmin;
  const defaultCenterId = centerId ?? tenant.centerId ?? null;
  const [selectedCenterId, setSelectedCenterId] = useState<
    string | number | null
  >(null);
  const [courseSearch, setCourseSearch] = useState("");
  const [videoSearch, setVideoSearch] = useState("");
  const [debouncedCourseSearch, setDebouncedCourseSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [whatsappFormat, setWhatsappFormat] =
    useState<VideoAccessWhatsappFormat>("text_code");
  const [result, setResult] =
    useState<BulkGenerateVideoAccessCodesResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cachedCoursesRef = useRef<
    Map<string, { id: string | number; title?: string | null }>
  >(new Map());
  const cachedVideosRef = useRef<Map<string, { title: string }>>(new Map());
  const bulkGenerateMutation = useBulkGenerateVideoAccessCodes();

  const initialCenterId = useMemo(() => {
    const normalizedDefault = normalizeCenterId(defaultCenterId);
    if (normalizedDefault != null) return normalizedDefault;

    const uniqueCenterIds = new Map<string, string | number>();
    students.forEach((student) => {
      const studentCenterId = normalizeCenterId(
        student.center_id ?? student.center?.id ?? null,
      );
      if (studentCenterId != null) {
        uniqueCenterIds.set(String(studentCenterId), studentCenterId);
      }
    });

    if (uniqueCenterIds.size === 1) {
      return Array.from(uniqueCenterIds.values())[0];
    }

    return null;
  }, [defaultCenterId, students]);

  useEffect(() => {
    if (!open) {
      setSelectedCenterId(initialCenterId);
      setSelectedCourse(null);
      setSelectedVideo(null);
      setCourseSearch("");
      setVideoSearch("");
      setSendWhatsapp(false);
      setWhatsappFormat("text_code");
      setResult(null);
      setErrorMessage(null);
      return;
    }

    setSelectedCenterId(initialCenterId);
    setSelectedCourse(null);
    setSelectedVideo(null);
    setCourseSearch("");
    setVideoSearch("");
    setSendWhatsapp(false);
    setWhatsappFormat("text_code");
    setResult(null);
    setErrorMessage(null);
  }, [initialCenterId, open]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedCourseSearch(courseSearch.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [courseSearch]);

  useEffect(() => {
    if (!open) return;
    setSelectedCourse(null);
    setSelectedVideo(null);
    setVideoSearch("");
    setResult(null);
  }, [open, selectedCenterId]);

  const centerIdForQuery = normalizeCenterId(selectedCenterId);
  const hasSelectedCenter = Boolean(centerIdForQuery);

  const coursesQuery = useInfiniteQuery({
    queryKey: [
      "bulk-generate-courses",
      centerIdForQuery ?? "none",
      debouncedCourseSearch,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listCenterCourses({
        center_id: centerIdForQuery!,
        page: pageParam,
        per_page: FETCH_PAGE_SIZE,
        search: debouncedCourseSearch || undefined,
        access_model: "enrollment",
      }),
    enabled: open && hasSelectedCenter,
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.page ?? 1);
      const perPage = Number(lastPage.perPage ?? FETCH_PAGE_SIZE);
      const total = Number(lastPage.total ?? 0);
      return page * perPage < total ? page + 1 : undefined;
    },
    staleTime: 60_000,
  });

  const resolvedCourseId = selectedCourse ?? "";

  const videosQuery = useInfiniteQuery({
    queryKey: [
      "bulk-generate-videos",
      centerIdForQuery ?? "none",
      resolvedCourseId || "none",
      videoSearch,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listVideos({
        centerId: centerIdForQuery!,
        page: pageParam,
        per_page: FETCH_PAGE_SIZE,
        course_id: resolvedCourseId || undefined,
        search: videoSearch.trim() || undefined,
      }),
    enabled: open && hasSelectedCenter && Boolean(resolvedCourseId),
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.meta?.page ?? 1);
      const perPage = Number(lastPage.meta?.per_page ?? FETCH_PAGE_SIZE);
      const total = Number(lastPage.meta?.total ?? 0);
      return page * perPage < total ? page + 1 : undefined;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    const courses = (coursesQuery.data?.pages ?? []).flatMap(
      (page) => page.items,
    );
    courses.forEach((course) => {
      cachedCoursesRef.current.set(String(course.id), course);
    });
  }, [coursesQuery.data?.pages]);

  useEffect(() => {
    const videos = (videosQuery.data?.pages ?? []).flatMap(
      (page) => page.items,
    );
    videos.forEach((video) => {
      cachedVideosRef.current.set(String(video.id), {
        title:
          video.title ??
          video.title_translations?.en ??
          video.title_translations?.ar ??
          `Video ${video.id}`,
      });
    });
  }, [videosQuery.data?.pages]);

  const courseOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    const mapped = (coursesQuery.data?.pages ?? [])
      .flatMap((page) => page.items)
      .filter(
        (course, index, array) =>
          array.findIndex((item) => String(item.id) === String(course.id)) ===
          index,
      )
      .map((course) => ({
        value: String(course.id),
        label: course.title ?? `Course ${course.id}`,
      }));

    if (
      selectedCourse &&
      !mapped.some((option) => option.value === selectedCourse)
    ) {
      const cached = cachedCoursesRef.current.get(selectedCourse);
      if (cached) {
        mapped.unshift({
          value: selectedCourse,
          label: cached.title ?? `Course ${selectedCourse}`,
        });
      }
    }

    return mapped;
  }, [coursesQuery.data?.pages, selectedCourse]);

  const videoOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    const mapped = (videosQuery.data?.pages ?? [])
      .flatMap((page) => page.items)
      .filter(
        (video, index, array) =>
          array.findIndex((item) => String(item.id) === String(video.id)) ===
          index,
      )
      .map((video) => ({
        value: String(video.id),
        label:
          video.title ??
          video.title_translations?.en ??
          video.title_translations?.ar ??
          `Video ${video.id}`,
      }));

    if (
      selectedVideo &&
      !mapped.some((option) => option.value === selectedVideo)
    ) {
      const cached = cachedVideosRef.current.get(selectedVideo);
      mapped.unshift({
        value: selectedVideo,
        label: cached?.title ?? `Video ${selectedVideo}`,
      });
    }

    return mapped;
  }, [videosQuery.data?.pages, selectedVideo]);

  const studentIds = useMemo(
    () => students.map((student) => student.id),
    [students],
  );

  const handleGenerate = async () => {
    if (!hasSelectedCenter) {
      setErrorMessage(
        t("pages.students.dialogs.bulkGenerateAccess.errors.selectCenter"),
      );
      return;
    }

    if (!selectedCourse) {
      setErrorMessage(
        t("pages.students.dialogs.bulkGenerateAccess.errors.selectCourse"),
      );
      return;
    }

    if (!selectedVideo) {
      setErrorMessage(
        t("pages.students.dialogs.bulkGenerateAccess.errors.selectVideo"),
      );
      return;
    }

    if (studentIds.length === 0) {
      setErrorMessage(
        t("pages.students.dialogs.bulkGenerateAccess.errors.noStudents"),
      );
      return;
    }

    setErrorMessage(null);
    setResult(null);
    setIsSubmitting(true);

    try {
      const payload: BulkGenerateVideoAccessCodesPayload = {
        student_ids: studentIds,
        course_id: selectedCourse,
        video_id: selectedVideo,
        ...(sendWhatsapp
          ? { send_whatsapp: true, whatsapp_format: whatsappFormat }
          : {}),
      };

      const response = await bulkGenerateMutation.mutateAsync({
        payload,
        centerId: centerIdForQuery,
      });

      setResult(response ?? null);
      onGenerated?.(response ?? null);

      const failures = Array.isArray(response?.failed) ? response.failed : [];
      const hasFailures = failures.length > 0;

      if (!hasFailures) {
        onOpenChange(false);
      }
    } catch (error) {
      setErrorMessage(
        getStudentRequestApiErrorMessage(
          error,
          t("pages.students.dialogs.bulkGenerateAccess.errors.generateFailed"),
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const counts = result?.counts;
  const totalCount = counts?.total ?? studentIds.length;
  const generatedCount = counts?.generated ?? 0;
  const failedCount = counts?.failed ?? 0;
  const whatsappSent = counts?.whatsapp_sent ?? 0;
  const whatsappFailed = counts?.whatsapp_failed ?? 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting || bulkGenerateMutation.isPending) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {t("pages.students.dialogs.bulkGenerateAccess.title")}
          </DialogTitle>
          <DialogDescription>
            {t("pages.students.dialogs.bulkGenerateAccess.description", {
              count: studentIds.length,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {errorMessage ? (
            <Alert variant="destructive">
              <AlertTitle>
                {t(
                  "pages.students.dialogs.bulkGenerateAccess.errors.errorTitle",
                )}
              </AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          {showCenterPicker ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("pages.students.dialogs.bulkGenerateAccess.fields.center")}
              </p>
              <CenterPicker
                className="w-full min-w-0"
                hideWhenCenterScoped={false}
                selectClassName="bg-none bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
                value={selectedCenterId}
                onValueChange={(nextCenterId) =>
                  setSelectedCenterId(nextCenterId)
                }
                disabled={isSubmitting}
              />
            </div>
          ) : null}

          <div className="space-y-3">
            <SearchableSelect
              value={selectedCourse ?? undefined}
              onValueChange={(value) => {
                setSelectedCourse(value ?? null);
                setVideoSearch("");
                setSelectedVideo(null);
              }}
              options={courseOptions}
              searchValue={courseSearch}
              onSearchValueChange={setCourseSearch}
              placeholder={
                hasSelectedCenter
                  ? t(
                      "pages.students.dialogs.bulkGenerateAccess.placeholders.course",
                    )
                  : t(
                      "pages.students.dialogs.bulkGenerateAccess.placeholders.selectCenterFirst",
                    )
              }
              searchPlaceholder={t(
                "pages.students.dialogs.bulkGenerateAccess.placeholders.searchCourses",
              )}
              emptyMessage={
                hasSelectedCenter
                  ? t(
                      "pages.students.dialogs.bulkGenerateAccess.empty.noCourses",
                    )
                  : t(
                      "pages.students.dialogs.bulkGenerateAccess.empty.loadCenterFirst",
                    )
              }
              filterOptions={false}
              showSearch
              isLoading={coursesQuery.isLoading}
              disabled={
                !hasSelectedCenter || Boolean(courseOptions.length === 0)
              }
              hasMore={Boolean(coursesQuery.hasNextPage)}
              isLoadingMore={coursesQuery.isFetchingNextPage}
              onReachEnd={() => {
                if (coursesQuery.hasNextPage) {
                  void coursesQuery.fetchNextPage();
                }
              }}
              triggerClassName="bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
            />

            <SearchableSelect
              value={selectedVideo ?? undefined}
              onValueChange={(value) => setSelectedVideo(value ?? null)}
              options={videoOptions}
              searchValue={videoSearch}
              onSearchValueChange={setVideoSearch}
              placeholder={
                resolvedCourseId
                  ? t(
                      "pages.students.dialogs.bulkGenerateAccess.placeholders.video",
                    )
                  : t(
                      "pages.students.dialogs.bulkGenerateAccess.placeholders.selectCourseFirst",
                    )
              }
              searchPlaceholder={t(
                "pages.students.dialogs.bulkGenerateAccess.placeholders.searchVideos",
              )}
              emptyMessage={
                resolvedCourseId
                  ? t(
                      "pages.students.dialogs.bulkGenerateAccess.empty.noVideos",
                    )
                  : t(
                      "pages.students.dialogs.bulkGenerateAccess.empty.loadCourseFirst",
                    )
              }
              filterOptions={false}
              showSearch
              isLoading={videosQuery.isLoading}
              disabled={!hasSelectedCenter || !resolvedCourseId}
              hasMore={Boolean(videosQuery.hasNextPage)}
              isLoadingMore={videosQuery.isFetchingNextPage}
              onReachEnd={() => {
                if (videosQuery.hasNextPage) {
                  void videosQuery.fetchNextPage();
                }
              }}
              triggerClassName="bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
            />

            <div className="flex items-center">
              <label
                htmlFor="bulk-generate-whatsapp"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                <input
                  id="bulk-generate-whatsapp"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600"
                  checked={sendWhatsapp}
                  onChange={(event) => setSendWhatsapp(event.target.checked)}
                  disabled={isSubmitting}
                />
                {t(
                  "pages.students.dialogs.bulkGenerateAccess.fields.sendWhatsapp",
                )}
              </label>
            </div>

            {sendWhatsapp ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t(
                    "pages.students.dialogs.bulkGenerateAccess.fields.whatsappFormat",
                  )}
                </p>
                <Select
                  value={whatsappFormat}
                  onValueChange={(value) =>
                    setWhatsappFormat(value as VideoAccessWhatsappFormat)
                  }
                >
                  <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
                    <SelectValue
                      placeholder={t(
                        "pages.students.dialogs.bulkGenerateAccess.placeholders.format",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text_code">
                      {t(
                        "pages.students.dialogs.bulkGenerateAccess.formats.textCode",
                      )}
                    </SelectItem>
                    <SelectItem value="qr_code">
                      {t(
                        "pages.students.dialogs.bulkGenerateAccess.formats.qrCode",
                      )}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          {result?.counts ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300">
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
                <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-center dark:border-gray-700 dark:bg-gray-900">
                  <p className="text-gray-500 dark:text-gray-400">
                    {t(
                      "pages.students.dialogs.bulkGenerateAccess.summary.totalLabel",
                    )}
                  </p>
                  <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                    {totalCount}
                  </p>
                </div>
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20">
                  <p>
                    {t(
                      "pages.students.dialogs.bulkGenerateAccess.summary.generatedLabel",
                    )}
                  </p>
                  <p className="mt-1 text-base font-semibold text-emerald-800 dark:text-emerald-200">
                    {generatedCount}
                  </p>
                </div>
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-center text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20">
                  <p>
                    {t(
                      "pages.students.dialogs.bulkGenerateAccess.summary.failedLabel",
                    )}
                  </p>
                  <p className="mt-1 text-base font-semibold text-amber-800 dark:text-amber-200">
                    {failedCount}
                  </p>
                </div>
                <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-center text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20">
                  <p>
                    {t(
                      "pages.students.dialogs.bulkGenerateAccess.summary.whatsappSentLabel",
                    )}
                  </p>
                  <p className="mt-1 text-base font-semibold text-blue-800 dark:text-blue-200">
                    {whatsappSent}
                  </p>
                </div>
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-center text-red-700 dark:border-red-900/40 dark:bg-red-900/20">
                  <p>
                    {t(
                      "pages.students.dialogs.bulkGenerateAccess.summary.whatsappFailedLabel",
                    )}
                  </p>
                  <p className="mt-1 text-base font-semibold text-red-800 dark:text-red-200">
                    {whatsappFailed}
                  </p>
                </div>
              </div>
              {result.failed && result.failed.length > 0 ? (
                <div className="mt-3 space-y-1 text-xs text-gray-700 dark:text-gray-200">
                  {result.failed.map((entry, index) => (
                    <p key={index}>
                      {resolveFailureText(
                        entry,
                        t(
                          "pages.students.dialogs.bulkGenerateAccess.summary.failedFallback",
                        ),
                        t(
                          "pages.students.dialogs.bulkGenerateAccess.summary.studentPrefix",
                        ),
                      )}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting || bulkGenerateMutation.isPending}
          >
            {t("common.actions.cancel")}
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={
              isSubmitting ||
              bulkGenerateMutation.isPending ||
              !hasSelectedCenter ||
              !selectedCourse ||
              !selectedVideo ||
              studentIds.length === 0
            }
          >
            {isSubmitting || bulkGenerateMutation.isPending
              ? t(
                  "pages.students.dialogs.bulkGenerateAccess.actions.generating",
                )
              : t(
                  "pages.students.dialogs.bulkGenerateAccess.actions.generateCodes",
                )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
