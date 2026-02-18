"use client";

import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { listCenterOptions } from "@/features/centers/services/centers.service";
import { listCenterCourses } from "@/features/courses/services/courses.service";
import { useAssignSurvey } from "@/features/surveys/hooks/use-surveys";
import {
  getScopeAssignmentTypes,
  validateSurveyAssignment,
} from "@/features/surveys/lib/assignment-rules";
import { getSurveyApiErrorMessage } from "@/features/surveys/lib/api-error";
import { listSurveyTargetStudents } from "@/features/surveys/services/surveys.service";
import type {
  Survey,
  SurveyAssignmentType,
  SurveyScopeType,
} from "@/features/surveys/types/survey";
import { listVideos } from "@/features/videos/services/videos.service";

const PICKER_PAGE_SIZE = 20;

type Option = {
  value: string;
  label: string;
};

type StudentOption = Option & {
  centerId: number | null;
};

type VideoOption = Option & {
  isFullPlay: boolean;
};

type AssignSurveyDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  survey?: Survey | null;
  centerId?: string | number | null;
  onSuccess?: (_message: string) => void;
};

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isUnbrandedCenter(center: Record<string, unknown>) {
  const centerType = center.type;
  if (centerType == null) return true;

  if (typeof centerType === "number") return centerType === 0;
  if (typeof centerType === "string") {
    const normalized = centerType.trim().toLowerCase();
    return normalized === "0" || normalized === "unbranded";
  }

  return false;
}

function isFullPlayVideo(video: Record<string, unknown>) {
  const value =
    video.is_full_play ??
    video.is_full_playback ??
    video.full_play ??
    video.full_playback;

  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true";
  }

  return false;
}

function getCenterLabel(center: Record<string, unknown>) {
  return (
    (typeof center.name === "string" ? center.name : null) ||
    (typeof center.slug === "string" ? center.slug : null) ||
    `Center #${center.id}`
  );
}

function getCourseLabel(course: Record<string, unknown>) {
  const titleTranslations = course.title_translations as
    | Record<string, string>
    | undefined;

  return (
    titleTranslations?.en ||
    titleTranslations?.ar ||
    (typeof course.title === "string" ? course.title : null) ||
    (typeof course.name === "string" ? course.name : null) ||
    `Course #${course.id}`
  );
}

function getStudentLabel(student: Record<string, unknown>) {
  const name = typeof student.name === "string" ? student.name : null;
  const email = typeof student.email === "string" ? student.email : null;
  const centerName =
    typeof (student.center as Record<string, unknown> | null)?.name === "string"
      ? String((student.center as Record<string, unknown>).name)
      : null;

  const identity = [name, email].filter(Boolean).join(" • ");
  const suffix = centerName ? ` (${centerName})` : " (No Center)";

  return `${identity || `Student #${student.id}`}${suffix}`;
}

function getVideoLabel(video: Record<string, unknown>) {
  const titleTranslations = video.title_translations as
    | Record<string, string>
    | undefined;

  return (
    titleTranslations?.en ||
    titleTranslations?.ar ||
    (typeof video.title === "string" ? video.title : null) ||
    `Video #${video.id}`
  );
}

function getAssignmentTypeLabel(type: SurveyAssignmentType) {
  switch (type) {
    case "all":
      return "All Students";
    case "course":
      return "Specific Course";
    case "user":
      return "Specific Student";
    case "video":
      return "Specific Video";
    default:
      return type;
  }
}

function getScopeType(
  survey: Survey | null | undefined,
  normalizedCenterId: number | null,
): SurveyScopeType {
  const parsed = toNumber(survey?.scope_type);
  if (parsed === 1 || parsed === 2) return parsed;
  return normalizedCenterId != null ? 2 : 1;
}

export function AssignSurveyDialog({
  open,
  onOpenChange,
  survey,
  centerId,
  onSuccess,
}: AssignSurveyDialogProps) {
  const normalizedCenterId = useMemo(() => toNumber(centerId), [centerId]);
  const scopeContext = useMemo(
    () => ({ centerId: normalizedCenterId }),
    [normalizedCenterId],
  );
  const scopeType = getScopeType(survey, normalizedCenterId);
  const assignMutation = useAssignSurvey(scopeContext);

  const [formError, setFormError] = useState<string | null>(null);
  const [assignmentType, setAssignmentType] =
    useState<SurveyAssignmentType>("all");
  const [assignmentCourseCenterId, setAssignmentCourseCenterId] =
    useState("none");
  const [assignmentCourseId, setAssignmentCourseId] = useState("none");
  const [assignmentUserId, setAssignmentUserId] = useState("none");
  const [assignmentVideoId, setAssignmentVideoId] = useState("none");

  const assignmentTypeOptions = useMemo(
    () => getScopeAssignmentTypes(scopeType),
    [scopeType],
  );

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    setAssignmentType("all");
    setAssignmentCourseCenterId("none");
    setAssignmentCourseId("none");
    setAssignmentUserId("none");
    setAssignmentVideoId("none");
  }, [open]);

  const {
    data: unbrandedCentersData,
    isLoading: isUnbrandedCentersLoading,
    isFetchingNextPage: isUnbrandedCentersLoadingMore,
    hasNextPage: hasMoreUnbrandedCenters,
    fetchNextPage: fetchMoreUnbrandedCenters,
  } = useInfiniteQuery({
    queryKey: ["survey-assign-unbranded-centers"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listCenterOptions({
        page: pageParam,
        per_page: PICKER_PAGE_SIZE,
        type: "0",
      }),
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.meta?.page ?? 1);
      const perPage = Number(lastPage.meta?.per_page ?? PICKER_PAGE_SIZE);
      const total = Number(lastPage.meta?.total ?? 0);
      return page * perPage < total ? page + 1 : undefined;
    },
    enabled: open && scopeType === 1 && assignmentType === "course",
    staleTime: 60_000,
  });

  const unbrandedCenterOptions = useMemo<Option[]>(
    () =>
      (unbrandedCentersData?.pages ?? [])
        .flatMap((page) => page.items)
        .filter((center) => center && typeof center === "object")
        .map((center) => center as Record<string, unknown>)
        .filter(isUnbrandedCenter)
        .map((center) => ({
          value: String(center.id),
          label: getCenterLabel(center),
        }))
        .filter(
          (option, index, array) =>
            array.findIndex((item) => item.value === option.value) === index,
        ),
    [unbrandedCentersData?.pages],
  );

  const unbrandedCenterIds = useMemo(
    () =>
      unbrandedCenterOptions
        .map((option) => toNumber(option.value))
        .filter((value): value is number => value != null),
    [unbrandedCenterOptions],
  );

  const selectedCourseCenterId =
    scopeType === 2 ? normalizedCenterId : toNumber(assignmentCourseCenterId);

  const {
    data: coursesData,
    isLoading: isCoursesLoading,
    isFetchingNextPage: isCoursesLoadingMore,
    hasNextPage: hasMoreCourses,
    fetchNextPage: fetchMoreCourses,
  } = useInfiniteQuery({
    queryKey: [
      "survey-assign-courses",
      scopeType,
      selectedCourseCenterId ?? "none",
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listCenterCourses({
        center_id: selectedCourseCenterId!,
        page: pageParam,
        per_page: PICKER_PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.lastPage ? lastPage.page + 1 : undefined,
    enabled:
      open &&
      assignmentType === "course" &&
      selectedCourseCenterId != null &&
      (scopeType === 2 || unbrandedCenterIds.includes(selectedCourseCenterId)),
    staleTime: 60_000,
  });

  const courseOptions = useMemo<Option[]>(
    () =>
      (coursesData?.pages ?? [])
        .flatMap((page) => page.items)
        .filter((course) => course && typeof course === "object")
        .map((course) => {
          const typedCourse = course as Record<string, unknown>;
          return {
            value: String(typedCourse.id),
            label: getCourseLabel(typedCourse),
          };
        })
        .filter(
          (option, index, array) =>
            array.findIndex((item) => item.value === option.value) === index,
        ),
    [coursesData?.pages],
  );

  const {
    data: studentsData,
    isLoading: isStudentsLoading,
    isFetchingNextPage: isStudentsLoadingMore,
    hasNextPage: hasMoreStudents,
    fetchNextPage: fetchMoreStudents,
    refetch: refetchStudents,
  } = useInfiniteQuery({
    queryKey: ["survey-assign-students", scopeType, normalizedCenterId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listSurveyTargetStudents(
        {
          scope_type: scopeType,
          page: pageParam,
          per_page: PICKER_PAGE_SIZE,
        },
        scopeContext,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.lastPage ? lastPage.page + 1 : undefined,
    enabled: open && assignmentType === "user",
    staleTime: 30_000,
  });

  const studentOptions = useMemo<StudentOption[]>(() => {
    return (studentsData?.pages ?? [])
      .flatMap((page) => page.items)
      .filter((student) => student && typeof student === "object")
      .map((student) => student as Record<string, unknown>)
      .map((student) => {
        const studentCenterId = toNumber(student.center_id);
        return {
          value: String(student.id),
          label: getStudentLabel(student),
          centerId: studentCenterId,
        };
      })
      .filter((student) => {
        if (scopeType === 2) {
          return student.centerId === normalizedCenterId;
        }
        return true;
      })
      .filter(
        (option, index, array) =>
          array.findIndex((item) => item.value === option.value) === index,
      );
  }, [studentsData?.pages, scopeType, normalizedCenterId]);

  useEffect(() => {
    if (!open) return;
    if (assignmentType !== "user") return;
    if (scopeType === 2 && normalizedCenterId == null) return;
    void refetchStudents();
  }, [open, assignmentType, scopeType, normalizedCenterId, refetchStudents]);

  const {
    data: videosData,
    isLoading: isVideosLoading,
    isFetchingNextPage: isVideosLoadingMore,
    hasNextPage: hasMoreVideos,
    fetchNextPage: fetchMoreVideos,
  } = useInfiniteQuery({
    queryKey: ["survey-assign-videos", normalizedCenterId ?? "none"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listVideos({
        centerId: normalizedCenterId!,
        page: pageParam,
        per_page: PICKER_PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.meta?.page ?? 1);
      const perPage = Number(lastPage.meta?.per_page ?? PICKER_PAGE_SIZE);
      const total = Number(lastPage.meta?.total ?? 0);
      return page * perPage < total ? page + 1 : undefined;
    },
    enabled:
      open &&
      scopeType === 2 &&
      assignmentType === "video" &&
      normalizedCenterId != null,
    staleTime: 60_000,
  });

  const videoOptions = useMemo<VideoOption[]>(() => {
    return (videosData?.pages ?? [])
      .flatMap((page) => page.items)
      .filter((video) => video && typeof video === "object")
      .map((video) => {
        const typedVideo = video as Record<string, unknown>;
        return {
          value: String(typedVideo.id),
          label: getVideoLabel(typedVideo),
          isFullPlay: isFullPlayVideo(typedVideo),
        };
      })
      .filter((video) => video.isFullPlay)
      .filter(
        (option, index, array) =>
          array.findIndex((item) => item.value === option.value) === index,
      );
  }, [videosData?.pages]);

  const selectedStudent = useMemo(
    () => studentOptions.find((student) => student.value === assignmentUserId),
    [studentOptions, assignmentUserId],
  );

  const selectedVideo = useMemo(
    () => videoOptions.find((video) => video.value === assignmentVideoId),
    [videoOptions, assignmentVideoId],
  );

  const submit = () => {
    setFormError(null);

    if (!survey?.id) {
      setFormError("Missing survey identifier.");
      return;
    }

    const assignmentId =
      assignmentType === "course"
        ? assignmentCourseId
        : assignmentType === "user"
          ? assignmentUserId
          : assignmentType === "video"
            ? assignmentVideoId
            : null;

    const validation = validateSurveyAssignment({
      scopeType,
      assignmentType,
      assignmentId,
      surveyCenterId: normalizedCenterId,
      selectedCourseCenterId,
      selectedStudentCenterId: selectedStudent?.centerId ?? null,
      selectedVideoIsFullPlay: selectedVideo?.isFullPlay ?? null,
      unbrandedCenterIds,
    });

    if (!validation.valid) {
      setFormError(validation.error);
      return;
    }

    assignMutation.mutate(
      {
        surveyId: survey.id,
        payload: { assignments: [validation.assignment] },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.("Survey assignment updated successfully.");
        },
        onError: (error) => {
          setFormError(
            getSurveyApiErrorMessage(
              error,
              "Unable to assign survey. Please try again.",
            ),
          );
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Survey</DialogTitle>
          <DialogDescription>
            Update who should receive this survey.
          </DialogDescription>
        </DialogHeader>

        {formError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not assign survey</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Assignment Mode
            </label>
            <Select
              value={assignmentType}
              onValueChange={(value) => {
                if (
                  !assignmentTypeOptions.includes(value as SurveyAssignmentType)
                ) {
                  return;
                }

                setAssignmentType(value as SurveyAssignmentType);
                setAssignmentCourseCenterId("none");
                setAssignmentCourseId("none");
                setAssignmentUserId("none");
                setAssignmentVideoId("none");
              }}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assignmentTypeOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {getAssignmentTypeLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden md:block" />

          {assignmentType === "course" ? (
            <>
              {scopeType === 1 ? (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Unbranded Center
                  </label>
                  <SearchableSelect
                    value={
                      assignmentCourseCenterId === "none"
                        ? null
                        : assignmentCourseCenterId
                    }
                    onValueChange={(value) => {
                      setAssignmentCourseCenterId(value ?? "none");
                      setAssignmentCourseId("none");
                    }}
                    options={unbrandedCenterOptions}
                    placeholder="Select a center first"
                    searchPlaceholder="Search centers..."
                    emptyMessage="No unbranded centers found"
                    isLoading={isUnbrandedCentersLoading}
                    disabled={isUnbrandedCentersLoading}
                    showSearch={unbrandedCenterOptions.length > 6}
                    hasMore={Boolean(hasMoreUnbrandedCenters)}
                    isLoadingMore={isUnbrandedCentersLoadingMore}
                    onReachEnd={() => {
                      if (hasMoreUnbrandedCenters) {
                        void fetchMoreUnbrandedCenters();
                      }
                    }}
                  />
                </div>
              ) : null}

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Course
                </label>
                <SearchableSelect
                  value={
                    assignmentCourseId === "none" ? null : assignmentCourseId
                  }
                  onValueChange={(value) =>
                    setAssignmentCourseId(value ?? "none")
                  }
                  options={courseOptions}
                  placeholder={
                    selectedCourseCenterId == null
                      ? "Select a center first"
                      : "Select a course"
                  }
                  searchPlaceholder="Search courses..."
                  emptyMessage="No courses found"
                  isLoading={isCoursesLoading}
                  disabled={
                    isCoursesLoading ||
                    selectedCourseCenterId == null ||
                    (scopeType === 1 && assignmentCourseCenterId === "none")
                  }
                  showSearch={courseOptions.length > 6}
                  hasMore={Boolean(hasMoreCourses)}
                  isLoadingMore={isCoursesLoadingMore}
                  onReachEnd={() => {
                    if (hasMoreCourses) {
                      void fetchMoreCourses();
                    }
                  }}
                />
              </div>
            </>
          ) : null}

          {assignmentType === "user" ? (
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Student
              </label>
              <SearchableSelect
                value={assignmentUserId === "none" ? null : assignmentUserId}
                onValueChange={(value) => setAssignmentUserId(value ?? "none")}
                options={studentOptions}
                placeholder="Select a student"
                searchPlaceholder="Search students..."
                emptyMessage="No students found"
                isLoading={isStudentsLoading}
                disabled={isStudentsLoading}
                showSearch={studentOptions.length > 6}
                hasMore={Boolean(hasMoreStudents)}
                isLoadingMore={isStudentsLoadingMore}
                onReachEnd={() => {
                  if (hasMoreStudents) {
                    void fetchMoreStudents();
                  }
                }}
              />
            </div>
          ) : null}

          {assignmentType === "video" ? (
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Video (Full Play)
              </label>
              <SearchableSelect
                value={assignmentVideoId === "none" ? null : assignmentVideoId}
                onValueChange={(value) => setAssignmentVideoId(value ?? "none")}
                options={videoOptions}
                placeholder="Select a full-play video"
                searchPlaceholder="Search videos..."
                emptyMessage="No eligible full-play videos found"
                isLoading={isVideosLoading}
                disabled={isVideosLoading}
                showSearch={videoOptions.length > 6}
                hasMore={Boolean(hasMoreVideos)}
                isLoadingMore={isVideosLoadingMore}
                onReachEnd={() => {
                  if (hasMoreVideos) {
                    void fetchMoreVideos();
                  }
                }}
              />
              {videoOptions.length === 0 && !isVideosLoading ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  No eligible full-play videos were found for this center.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={assignMutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={assignMutation.isPending}
            onClick={submit}
          >
            {assignMutation.isPending ? "Assigning..." : "Update Assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
