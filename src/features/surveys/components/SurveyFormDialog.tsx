"use client";

import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { useAdminMe } from "@/features/auth/hooks/use-admin-me";
import { listCenterOptions } from "@/features/centers/services/centers.service";
import { listCenterCourses } from "@/features/courses/services/courses.service";
import { useCreateSurvey } from "@/features/surveys/hooks/use-surveys";
import {
  getScopeAssignmentTypes,
  validateSurveyAssignment,
} from "@/features/surveys/lib/assignment-rules";
import { listSurveyTargetStudents } from "@/features/surveys/services/surveys.service";
import type {
  CreateSurveyPayload,
  SurveyAssignmentType,
  SurveyQuestionType,
  SurveyType,
} from "@/features/surveys/types/survey";
import { listVideos } from "@/features/videos/services/videos.service";
import type { AdminUser } from "@/types/auth";

const QUESTION_TYPES: Array<{ value: SurveyQuestionType; label: string }> = [
  { value: 1, label: "Single Choice" },
  { value: 2, label: "Multiple Choice" },
  { value: 3, label: "Rating" },
  { value: 4, label: "Text" },
  { value: 5, label: "Yes / No" },
];

const SURVEY_TYPES: Array<{ value: SurveyType; label: string }> = [
  { value: 1, label: "Feedback" },
  { value: 2, label: "Mandatory" },
  { value: 3, label: "Poll" },
];

const PICKER_PAGE_SIZE = 20;

type QuestionDraft = {
  question: string;
  type: SurveyQuestionType;
  isRequired: boolean;
  options: string[];
};

type SurveyFormDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  centerId?: string | number | null;
  onSuccess?: (_message: string) => void;
};

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

const defaultQuestion = (): QuestionDraft => ({
  question: "",
  type: 3,
  isRequired: true,
  options: [],
});

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
  // /centers?type=0 may not always include the type field in each item.
  // If type is missing, trust the server-side query filter.
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
    case "center":
      return "Specific Unbranded Center";
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

function normalizeRoleLabel(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

  return normalized || null;
}

function isRoleObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isSuperAdminUser(user: AdminUser | null | undefined) {
  if (!user) return false;

  const roleCandidates: unknown[] = [user.role];

  if (Array.isArray(user.roles)) {
    roleCandidates.push(
      ...user.roles.map((role) =>
        typeof role === "string"
          ? role
          : isRoleObject(role)
            ? (role.slug ?? role.name ?? role.role ?? null)
            : null,
      ),
    );
  }

  if (Array.isArray(user.roles_with_permissions)) {
    roleCandidates.push(
      ...user.roles_with_permissions.map((role) =>
        isRoleObject(role)
          ? (role.slug ?? role.name ?? role.role ?? null)
          : null,
      ),
    );
  }

  return roleCandidates.some((role) => {
    const normalized = normalizeRoleLabel(role);
    return (
      normalized === "super_admin" ||
      normalized === "superadmin" ||
      normalized === "platform_admin" ||
      normalized === "platformadmin"
    );
  });
}

function extractFirstMessage(node: unknown): string | null {
  if (typeof node === "string" && node.trim()) {
    return node.trim();
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      const message = extractFirstMessage(item);
      if (message) return message;
    }
    return null;
  }

  if (!node || typeof node !== "object") return null;

  for (const value of Object.values(node as Record<string, unknown>)) {
    const message = extractFirstMessage(value);
    if (message) return message;
  }

  return null;
}

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    if ((error.response?.status ?? 0) >= 500) {
      return "Invalid survey assignment for the selected scope. Please review assignment rules and try again.";
    }

    const data = error.response?.data as
      | {
          message?: string;
          errors?: Record<string, string[]>;
          details?: unknown;
        }
      | undefined;

    const detailsMessage = extractFirstMessage(data?.details);
    if (detailsMessage) {
      return detailsMessage;
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (data?.errors && typeof data.errors === "object") {
      const firstEntry = Object.values(data.errors)[0];
      if (Array.isArray(firstEntry) && firstEntry.length > 0) {
        return firstEntry[0];
      }
    }
  }

  return "Unable to create survey. Please try again.";
}

export function SurveyFormDialog({
  open,
  onOpenChange,
  centerId,
  onSuccess,
}: SurveyFormDialogProps) {
  const createMutation = useCreateSurvey();
  const { data: currentAdmin, isLoading: isAdminLoading } = useAdminMe();
  const [formError, setFormError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [surveyType, setSurveyType] = useState<SurveyType>(1);
  const [isActive, setIsActive] = useState(false);
  const [isMandatory, setIsMandatory] = useState(true);
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] =
    useState(true);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [assignmentType, setAssignmentType] =
    useState<SurveyAssignmentType>("all");
  const [assignmentCenterId, setAssignmentCenterId] = useState("none");
  const [assignmentCourseCenterId, setAssignmentCourseCenterId] =
    useState("none");
  const [assignmentCourseId, setAssignmentCourseId] = useState("none");
  const [assignmentUserId, setAssignmentUserId] = useState("none");
  const [assignmentVideoId, setAssignmentVideoId] = useState("none");
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    defaultQuestion(),
  ]);

  const normalizedCenterId = useMemo(() => {
    if (centerId == null) return null;
    return toNumber(centerId);
  }, [centerId]);

  const scopeType = normalizedCenterId != null ? 2 : 1;
  const isSystemScope = scopeType === 1;
  const isSystemScopeAllowed = !isSystemScope || isSuperAdminUser(currentAdmin);
  const assignmentTypeOptions = useMemo(
    () => getScopeAssignmentTypes(scopeType),
    [scopeType],
  );

  useEffect(() => {
    if (assignmentTypeOptions.includes(assignmentType)) return;
    setAssignmentType("all");
  }, [assignmentType, assignmentTypeOptions]);

  const {
    data: unbrandedCentersData,
    isLoading: isUnbrandedCentersLoading,
    isFetchingNextPage: isUnbrandedCentersLoadingMore,
    hasNextPage: hasMoreUnbrandedCenters,
    fetchNextPage: fetchMoreUnbrandedCenters,
  } = useInfiniteQuery({
    queryKey: ["survey-unbranded-centers"],
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
    enabled:
      open &&
      scopeType === 1 &&
      (assignmentType === "center" || assignmentType === "course"),
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
      "survey-assignment-courses",
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
    queryKey: ["survey-assignment-students", scopeType, normalizedCenterId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listSurveyTargetStudents({
        scope_type: scopeType,
        center_id: scopeType === 2 ? normalizedCenterId ?? undefined : undefined,
        page: pageParam,
        per_page: PICKER_PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.lastPage ? lastPage.page + 1 : undefined,
    enabled:
      open &&
      assignmentType === "user" &&
      (scopeType === 1 || normalizedCenterId != null),
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

        // For system scope, trust /surveys/target-students server filtering.
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
  }, [
    open,
    assignmentType,
    scopeType,
    normalizedCenterId,
    refetchStudents,
  ]);

  const {
    data: videosData,
    isLoading: isVideosLoading,
    isFetchingNextPage: isVideosLoadingMore,
    hasNextPage: hasMoreVideos,
    fetchNextPage: fetchMoreVideos,
  } = useInfiniteQuery({
    queryKey: ["survey-assignment-videos", normalizedCenterId ?? "none"],
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

  useEffect(() => {
    if (!open) return;

    setFormError(null);
    setTitle("");
    setDescription("");
    setSurveyType(1);
    setIsActive(false);
    setIsMandatory(true);
    setAllowMultipleSubmissions(true);
    setStartAt("");
    setEndAt("");
    setAssignmentType("all");
    setAssignmentCenterId("none");
    setAssignmentCourseCenterId("none");
    setAssignmentCourseId("none");
    setAssignmentUserId("none");
    setAssignmentVideoId("none");
    setQuestions([defaultQuestion()]);
  }, [open]);

  const updateQuestion = (
    index: number,
    updater: (_question: QuestionDraft) => QuestionDraft,
  ) => {
    setQuestions((prev) =>
      prev.map((item, i) => (i === index ? updater(item) : item)),
    );
  };

  const submit = () => {
    setFormError(null);

    if (!title.trim()) {
      setFormError("Survey title is required.");
      return;
    }

    if (scopeType === 1 && isAdminLoading) {
      setFormError("Checking your permissions. Please try again in a moment.");
      return;
    }

    if (scopeType === 1 && !isSystemScopeAllowed) {
      setFormError("System surveys can only be created by super admins.");
      return;
    }

    if (scopeType === 2 && normalizedCenterId == null) {
      setFormError("Center survey requires a valid center.");
      return;
    }

    if (startAt && endAt && endAt < startAt) {
      setFormError("End date cannot be before start date.");
      return;
    }

    if (questions.length === 0) {
      setFormError("At least one question is required.");
      return;
    }

    if (questions.length > 10) {
      setFormError("A survey can contain up to 10 questions.");
      return;
    }

    const mappedQuestions = questions.map((question, index) => {
      if (!question.question.trim()) {
        throw new Error(`Question ${index + 1} is required.`);
      }

      const requiresOptions = question.type === 1 || question.type === 2;
      const cleanedOptions = question.options
        .map((option) => option.trim())
        .filter(Boolean);

      if (requiresOptions && cleanedOptions.length === 0) {
        throw new Error(
          `Question ${index + 1} requires at least one answer option.`,
        );
      }

      return {
        question_translations: {
          en: question.question.trim(),
          ar: question.question.trim(),
        },
        type: question.type,
        is_required: question.isRequired,
        options: requiresOptions
          ? cleanedOptions.map((option, optionIndex) => ({
              option_translations: {
                en: option,
                ar: option,
              },
              order_index: optionIndex + 1,
            }))
          : undefined,
      };
    });

    const assignmentId =
      assignmentType === "center"
        ? assignmentCenterId
        : assignmentType === "course"
          ? assignmentCourseId
          : assignmentType === "user"
            ? assignmentUserId
            : assignmentType === "video"
              ? assignmentVideoId
              : null;

    const assignmentValidation = validateSurveyAssignment({
      scopeType,
      assignmentType,
      assignmentId,
      surveyCenterId: normalizedCenterId,
      selectedCourseCenterId,
      selectedStudentCenterId: selectedStudent?.centerId ?? null,
      selectedVideoIsFullPlay: selectedVideo?.isFullPlay ?? null,
      unbrandedCenterIds,
    });

    if (!assignmentValidation.valid) {
      setFormError(assignmentValidation.error);
      return;
    }

    const payload: CreateSurveyPayload = {
      scope_type: scopeType,
      center_id: normalizedCenterId,
      assignments: [assignmentValidation.assignment],
      title_translations: {
        en: title.trim(),
        ar: title.trim(),
      },
      description_translations: description.trim()
        ? {
            en: description.trim(),
            ar: description.trim(),
          }
        : undefined,
      type: surveyType,
      is_active: isActive,
      is_mandatory: isMandatory,
      allow_multiple_submissions: allowMultipleSubmissions,
      start_at: startAt || undefined,
      end_at: endAt || undefined,
      questions: mappedQuestions,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.("Survey created successfully.");
      },
      onError: (error) => {
        setFormError(getErrorMessage(error));
      },
    });
  };

  const isPending = createMutation.isPending;
  const isSubmitBlockedByRole =
    scopeType === 1 && (isAdminLoading || !isSystemScopeAllowed);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Create {scopeType === 2 ? "Center" : "System"} Survey
          </DialogTitle>
          <DialogDescription>
            Build a survey with scoped assignment rules and configurable
            questions.
          </DialogDescription>
        </DialogHeader>

        {formError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not create survey</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        {scopeType === 1 && !isAdminLoading && !isSystemScopeAllowed ? (
          <Alert>
            <AlertTitle>Permission required</AlertTitle>
            <AlertDescription>
              Only super admins can create system surveys.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Title
            </label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Customer Satisfaction"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Add short context for this survey"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Survey Type
            </label>
            <Select
              value={String(surveyType)}
              onValueChange={(value) => {
                const parsed = toNumber(value);
                if (parsed === 1 || parsed === 2 || parsed === 3) {
                  setSurveyType(parsed as SurveyType);
                }
              }}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SURVEY_TYPES.map((typeOption) => (
                  <SelectItem
                    key={typeOption.value}
                    value={String(typeOption.value)}
                  >
                    {typeOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Assignment Mode
            </label>
            <Select
              value={assignmentType}
              onValueChange={(value) => {
                if (!assignmentTypeOptions.includes(value as SurveyAssignmentType)) {
                  return;
                }

                setAssignmentType(value as SurveyAssignmentType);
                setAssignmentCenterId("none");
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Start Date
            </label>
            <Input
              type="date"
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              End Date
            </label>
            <Input
              type="date"
              min={startAt || undefined}
              value={endAt}
              onChange={(event) => setEndAt(event.target.value)}
            />
          </div>

          {assignmentType === "center" ? (
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Unbranded Center
              </label>
              <SearchableSelect
                value={assignmentCenterId === "none" ? null : assignmentCenterId}
                onValueChange={(value) => setAssignmentCenterId(value ?? "none")}
                options={unbrandedCenterOptions}
                placeholder="Select an unbranded center"
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
                  value={assignmentCourseId === "none" ? null : assignmentCourseId}
                  onValueChange={(value) => setAssignmentCourseId(value ?? "none")}
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

        <div className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Settings
          </h3>

          <div className="grid gap-2 md:grid-cols-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              Active
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={isMandatory}
                onChange={(event) => setIsMandatory(event.target.checked)}
              />
              Mandatory
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={allowMultipleSubmissions}
                onChange={(event) =>
                  setAllowMultipleSubmissions(event.target.checked)
                }
              />
              Multiple Submissions
            </label>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Questions
            </h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={questions.length >= 10}
              onClick={() =>
                setQuestions((prev) =>
                  prev.length >= 10 ? prev : [...prev, defaultQuestion()],
                )
              }
            >
              Add Question
            </Button>
          </div>

          {questions.map((question, questionIndex) => {
            const needsOptions = question.type === 1 || question.type === 2;

            return (
              <div
                key={questionIndex}
                className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-900/40"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Question {questionIndex + 1}
                  </p>
                  {questions.length > 1 ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-600"
                      onClick={() =>
                        setQuestions((prev) =>
                          prev.filter((_, index) => index !== questionIndex),
                        )
                      }
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Question Text
                  </label>
                  <Input
                    value={question.question}
                    onChange={(event) =>
                      updateQuestion(questionIndex, (prev) => ({
                        ...prev,
                        question: event.target.value,
                      }))
                    }
                    placeholder="How satisfied are you?"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Type
                    </label>
                    <Select
                      value={String(question.type)}
                      onValueChange={(value) => {
                        const nextType = Number(value) as SurveyQuestionType;
                        updateQuestion(questionIndex, (prev) => ({
                          ...prev,
                          type: nextType,
                          options:
                            nextType === 1 || nextType === 2
                              ? prev.options.length > 0
                                ? prev.options
                                : [""]
                              : [],
                        }));
                      }}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {QUESTION_TYPES.map((typeOption) => (
                          <SelectItem
                            key={typeOption.value}
                            value={String(typeOption.value)}
                          >
                            {typeOption.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={question.isRequired}
                        onChange={(event) =>
                          updateQuestion(questionIndex, (prev) => ({
                            ...prev,
                            isRequired: event.target.checked,
                          }))
                        }
                      />
                      Required question
                    </label>
                  </div>
                </div>

                {needsOptions ? (
                  <div className="space-y-2 rounded-md border border-dashed border-gray-300 p-3 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Options
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateQuestion(questionIndex, (prev) => ({
                            ...prev,
                            options: [...prev.options, ""],
                          }))
                        }
                      >
                        Add Option
                      </Button>
                    </div>

                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(event) =>
                            updateQuestion(questionIndex, (prev) => ({
                              ...prev,
                              options: prev.options.map((item, index) =>
                                index === optionIndex
                                  ? event.target.value
                                  : item,
                              ),
                            }))
                          }
                          placeholder={`Option ${optionIndex + 1}`}
                        />
                        {question.options.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-600"
                            onClick={() =>
                              updateQuestion(questionIndex, (prev) => ({
                                ...prev,
                                options: prev.options.filter(
                                  (_, index) => index !== optionIndex,
                                ),
                              }))
                            }
                          >
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isPending || isSubmitBlockedByRole}
            onClick={() => {
              try {
                submit();
              } catch (error) {
                setFormError((error as Error).message);
              }
            }}
          >
            {isPending
              ? "Creating..."
              : isAdminLoading && scopeType === 1
                ? "Checking permissions..."
                : "Create Survey"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
