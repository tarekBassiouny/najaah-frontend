"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppNotFoundState } from "@/components/ui/app-not-found-state";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCenterCourse,
  useUpdateCenterCourse,
  useUploadCourseThumbnail,
} from "@/features/courses/hooks/use-courses";
import { CourseEducationTargetingSection } from "@/features/courses/components/CourseEducationTargetingSection";
import {
  getAdminApiFieldErrors,
  getAdminApiErrorMessage,
  getAdminApiFirstFieldError,
  isAdminApiNotFoundError,
} from "@/lib/admin-response";
import { useCategoryOptions } from "@/features/categories/hooks/use-category-options";
import { CategoryFormDialog } from "@/features/categories/components/CategoryFormDialog";
import type { Category } from "@/features/categories/types/category";
import { useInstructorOptions } from "@/features/instructors/hooks/use-instructor-options";
import { InstructorFormDialog } from "@/features/instructors/components/InstructorFormDialog";
import type { Instructor } from "@/features/instructors/types/instructor";
import { PlusIcon } from "@/components/icons/plus";
import { useTranslation } from "@/features/localization";
import {
  getCourseEducationTargetingValues,
  hasAnyEducationTarget,
  toCourseEducationTargetingPayload,
  type CourseEducationTargetingValues,
} from "@/features/courses/utils/education-targeting";

type PageProps = {
  params: Promise<{ centerId: string; courseId: string }>;
};

const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
];

const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

type VideoApprovalOverride = "inherit" | "enabled" | "disabled";

function extractErrorMessage(error: unknown): string {
  const firstFieldError = getAdminApiFirstFieldError(error);
  if (firstFieldError) {
    return firstFieldError;
  }

  return getAdminApiErrorMessage(
    error,
    "Failed to update course. Please try again.",
  );
}

function normalizeDifficulty(
  value: string | number | null | undefined,
): string {
  if (value == null) return "";
  const str = String(value).toLowerCase();
  if (str === "1" || str === "beginner") return "beginner";
  if (str === "2" || str === "intermediate") return "intermediate";
  if (str === "3" || str === "advanced") return "advanced";
  return str;
}

function mapVideoApprovalOverrideToPayload(
  value: VideoApprovalOverride,
): boolean | null {
  if (value === "enabled") return true;
  if (value === "disabled") return false;
  return null;
}

function mapCourseVideoApprovalToOverride(
  value: boolean | null | undefined,
): VideoApprovalOverride {
  if (value === true) return "enabled";
  if (value === false) return "disabled";
  return "inherit";
}

function isEducationTargetingFieldKey(key: string) {
  return (
    key === "show_for_all_students" ||
    key === "grade_ids" ||
    key.startsWith("grade_ids.") ||
    key === "school_ids" ||
    key.startsWith("school_ids.") ||
    key === "college_ids" ||
    key.startsWith("college_ids.")
  );
}

function getEducationTargetingError(
  errors: Record<string, string[]>,
): string | null {
  for (const [key, messages] of Object.entries(errors)) {
    if (!isEducationTargetingFieldKey(key)) continue;
    const firstMessage = messages[0];
    if (firstMessage) return firstMessage;
  }

  return null;
}

export default function CenterCourseEditPage({ params }: PageProps) {
  const { t } = useTranslation();
  const { centerId, courseId } = use(params);
  const router = useRouter();
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isInstructorDialogOpen, setIsInstructorDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: course,
    isLoading: isLoadingCourse,
    isError: isCourseError,
    error: courseError,
  } = useCenterCourse(centerId, courseId);
  const {
    mutate: updateCourse,
    isPending: isUpdating,
    isError: isUpdateError,
    error: updateError,
  } = useUpdateCenterCourse();
  const {
    mutate: uploadThumbnail,
    isPending: isUploadingThumbnail,
    isError: isUploadError,
    error: uploadError,
  } = useUploadCourseThumbnail();

  const [formData, setFormData] = useState({
    title: "",
    titleAr: "",
    slug: "",
    description: "",
    descriptionAr: "",
    difficulty: "",
    language: "",
    price: "",
    requiresVideoApproval: "inherit" as VideoApprovalOverride,
    instructorId: "",
    categoryId: "",
  });
  const {
    options: categoryOptions,
    search: categorySearch,
    setSearch: setCategorySearch,
    isLoading: isLoadingCategories,
    hasMore: hasMoreCategories,
    isLoadingMore: isLoadingMoreCategories,
    onReachEnd: loadMoreCategories,
    refetch: refetchCategoryOptions,
  } = useCategoryOptions({
    centerId,
    selectedValue: formData.categoryId || null,
    isActive: true,
  });
  const {
    options: instructorOptions,
    search: instructorSearch,
    setSearch: setInstructorSearch,
    isLoading: isLoadingInstructors,
    hasMore: hasMoreInstructors,
    isLoadingMore: isLoadingMoreInstructors,
    onReachEnd: loadMoreInstructors,
    refetch: refetchInstructorOptions,
  } = useInstructorOptions({
    centerId,
    selectedValue: formData.instructorId || null,
  });

  const handleCategorySaved = (category: Category) => {
    void refetchCategoryOptions?.();
    setFormData((prev) => ({
      ...prev,
      categoryId: String(category.id),
    }));
  };

  const handleInstructorSaved = (instructor: Instructor) => {
    void refetchInstructorOptions?.();
    setFormData((prev) => ({
      ...prev,
      instructorId: String(instructor.id),
    }));
  };

  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [currentThumbnailFailed, setCurrentThumbnailFailed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [educationTargeting, setEducationTargeting] =
    useState<CourseEducationTargetingValues>({
      showForAllStudents: true,
      gradeIds: [],
      schoolIds: [],
      collegeIds: [],
    });
  const [
    educationTargetingValidationError,
    setEducationTargetingValidationError,
  ] = useState<string | null>(null);

  useEffect(() => {
    if (!course) return;
    setFormData({
      title: course.title_translations?.en ?? course.title ?? course.name ?? "",
      titleAr: course.title_translations?.ar ?? "",
      slug: course.slug ?? "",
      description:
        course.description_translations?.en ?? course.description ?? "",
      descriptionAr: course.description_translations?.ar ?? "",
      difficulty: normalizeDifficulty(
        course.difficulty ?? course.difficulty_level,
      ),
      language: course.language ?? "en",
      price: course.price != null ? String(course.price) : "",
      requiresVideoApproval: mapCourseVideoApprovalToOverride(
        course.requires_video_approval,
      ),
      instructorId: course.primary_instructor_id
        ? String(course.primary_instructor_id)
        : course.primary_instructor?.id
          ? String(course.primary_instructor.id)
          : "",
      categoryId: course.category_id
        ? String(course.category_id)
        : course.category?.id
          ? String(course.category.id)
          : "",
    });
    setCurrentThumbnailUrl(course.thumbnail_url ?? course.thumbnail ?? "");
    setCurrentThumbnailFailed(false);
    setEducationTargeting(getCourseEducationTargetingValues(course));
    setFieldErrors({});
    setEducationTargetingValidationError(null);
  }, [course]);

  useEffect(() => {
    setCurrentThumbnailFailed(false);
  }, [currentThumbnailUrl]);

  const educationTargetingFieldError = getEducationTargetingError(fieldErrors);
  const educationTargetingError =
    educationTargetingValidationError ?? educationTargetingFieldError;

  const handleEducationTargetingChange = (
    nextValues: CourseEducationTargetingValues,
  ) => {
    setEducationTargeting(nextValues);
    setEducationTargetingValidationError(null);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.show_for_all_students;
      delete next.grade_ids;
      delete next.school_ids;
      delete next.college_ids;
      Object.keys(next).forEach((key) => {
        if (isEducationTargetingFieldKey(key)) {
          delete next[key];
        }
      });
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setEducationTargetingValidationError(null);

    if (
      !educationTargeting.showForAllStudents &&
      !hasAnyEducationTarget(educationTargeting)
    ) {
      setEducationTargetingValidationError(
        "Select at least one grade, school, or college for targeted visibility.",
      );
      return;
    }

    const titleTranslations: Record<string, string> = {};
    if (formData.title.trim()) {
      titleTranslations.en = formData.title;
    }
    if (formData.titleAr.trim()) {
      titleTranslations.ar = formData.titleAr;
    }

    const descriptionTranslations: Record<string, string> = {};
    if (formData.description.trim()) {
      descriptionTranslations.en = formData.description;
    }
    if (formData.descriptionAr.trim()) {
      descriptionTranslations.ar = formData.descriptionAr;
    }

    updateCourse(
      {
        centerId,
        courseId,
        payload: {
          title_translations:
            Object.keys(titleTranslations).length > 0
              ? titleTranslations
              : undefined,
          description_translations:
            Object.keys(descriptionTranslations).length > 0
              ? descriptionTranslations
              : undefined,
          slug: formData.slug || undefined,
          difficulty: formData.difficulty || undefined,
          language: formData.language || undefined,
          price: formData.price ? Number(formData.price) : undefined,
          requires_video_approval: mapVideoApprovalOverrideToPayload(
            formData.requiresVideoApproval,
          ),
          instructor_id: formData.instructorId
            ? Number(formData.instructorId)
            : undefined,
          category_id: formData.categoryId
            ? Number(formData.categoryId)
            : undefined,
          ...toCourseEducationTargetingPayload(educationTargeting),
        },
      },
      {
        onSuccess: () => {
          router.push(`/centers/${centerId}/courses/${courseId}`);
        },
        onError: (mutationError) => {
          const errors = getAdminApiFieldErrors(mutationError) as
            | Record<string, string[] | string>
            | undefined;

          if (!errors) {
            setFieldErrors({});
            return;
          }

          const normalizedErrors = Object.fromEntries(
            Object.entries(errors).map(([key, value]) => [
              key,
              Array.isArray(value) ? value.map(String) : [String(value)],
            ]),
          );

          setFieldErrors(normalizedErrors);
        },
      },
    );
  };

  const handleChange =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSelectChange = (field: string) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setThumbnailError(null);

    if (!file) {
      setThumbnailFile(null);
      setThumbnailPreview(null);
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setThumbnailError(
        "Please select a valid image file (JPG, PNG, GIF, or WebP).",
      );
      e.target.value = "";
      return;
    }

    if (file.size > MAX_THUMBNAIL_SIZE) {
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setThumbnailError("File size must be less than 5MB.");
      e.target.value = "";
      return;
    }

    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearSelectedThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setThumbnailError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadThumbnail = () => {
    if (!thumbnailFile) return;

    uploadThumbnail(
      {
        centerId,
        courseId,
        thumbnailFile,
      },
      {
        onSuccess: (updatedCourse) => {
          setThumbnailFile(null);
          setThumbnailPreview(null);
          setCurrentThumbnailFailed(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          setCurrentThumbnailUrl(
            updatedCourse.thumbnail_url ?? updatedCourse.thumbnail ?? "",
          );
        },
      },
    );
  };

  const isPending = isUpdating || isUploadingThumbnail;
  const currentThumbnail = currentThumbnailUrl;

  if (isLoadingCourse) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const isMissingCourse = !isLoadingCourse && !isCourseError && !course;
  if (isMissingCourse || isAdminApiNotFoundError(courseError)) {
    return (
      <AppNotFoundState
        scopeLabel={t("pages.centerCourseEdit.scopeLabel")}
        title={t("pages.centerCourseEdit.notFoundTitle")}
        description={t("pages.centerCourseEdit.notFoundDescription")}
        primaryAction={{
          href: `/centers/${centerId}/courses`,
          label: t("pages.centerCourseEdit.goToCourses"),
        }}
      />
    );
  }

  if (isCourseError) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">
            {t("pages.centerCourseEdit.loadFailed")}
          </p>
          <Link href={`/centers/${centerId}/courses`}>
            <Button variant="outline">
              {t("pages.centerCourseEdit.backToCourses")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.centerCourseEdit.title")}
        description={t("pages.centerCourseEdit.description")}
        breadcrumbs={[
          { label: t("common.labels.centers"), href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          {
            label: t("pages.coursesPage.title"),
            href: `/centers/${centerId}/courses`,
          },
          {
            label: course?.title ?? `Course ${courseId}`,
            href: `/centers/${centerId}/courses/${courseId}`,
          },
          { label: t("common.actions.edit") },
        ]}
        actions={
          <Link href={`/centers/${centerId}/courses/${courseId}`}>
            <Button variant="outline">{t("common.actions.cancel")}</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
                <CardDescription>Update course details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title (English) *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={handleChange("title")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="titleAr">Title (Arabic)</Label>
                    <Input
                      id="titleAr"
                      value={formData.titleAr}
                      onChange={handleChange("titleAr")}
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={handleChange("slug")}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (English)</Label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={handleChange("description")}
                      rows={3}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descriptionAr">Description (Arabic)</Label>
                    <textarea
                      id="descriptionAr"
                      value={formData.descriptionAr}
                      onChange={handleChange("descriptionAr")}
                      rows={3}
                      dir="rtl"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Settings</CardTitle>
                <CardDescription>
                  Configure course difficulty, language, and pricing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={handleSelectChange("difficulty")}
                    >
                      <SelectTrigger id="difficulty">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={formData.language}
                      onValueChange={handleSelectChange("language")}
                    >
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleChange("price")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requires-video-approval">
                      Video Approval
                    </Label>
                    <Select
                      value={formData.requiresVideoApproval}
                      onValueChange={handleSelectChange(
                        "requiresVideoApproval",
                      )}
                    >
                      <SelectTrigger id="requires-video-approval">
                        <SelectValue placeholder="Use center policy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inherit">
                          Use center policy
                        </SelectItem>
                        <SelectItem value="enabled">Force enabled</SelectItem>
                        <SelectItem value="disabled">Force disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <SearchableSelect
                      value={formData.categoryId || null}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          categoryId: value ?? "",
                        }))
                      }
                      options={categoryOptions}
                      placeholder="Select category"
                      searchPlaceholder="Search categories..."
                      searchValue={categorySearch}
                      onSearchValueChange={setCategorySearch}
                      filterOptions={false}
                      isLoading={isLoadingCategories}
                      hasMore={hasMoreCategories}
                      isLoadingMore={isLoadingMoreCategories}
                      onReachEnd={loadMoreCategories}
                      allowClear
                      dropdownActionClassName="flex justify-end"
                      dropdownAction={
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 rounded-md border border-dashed border-primary/50 text-primary hover:bg-primary/5"
                          onClick={() => setIsCategoryDialogOpen(true)}
                          disabled={!centerId}
                          aria-label={t("pages.categories.createCategory")}
                          title={t("pages.categories.createCategory")}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instructor">Primary Instructor</Label>
                    <SearchableSelect
                      value={formData.instructorId || null}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          instructorId: value ?? "",
                        }))
                      }
                      options={instructorOptions}
                      placeholder="Select instructor"
                      searchPlaceholder="Search instructors..."
                      searchValue={instructorSearch}
                      onSearchValueChange={setInstructorSearch}
                      filterOptions={false}
                      isLoading={isLoadingInstructors}
                      hasMore={hasMoreInstructors}
                      isLoadingMore={isLoadingMoreInstructors}
                      onReachEnd={loadMoreInstructors}
                      allowClear
                      dropdownActionClassName="flex justify-end"
                      dropdownAction={
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 rounded-md border border-dashed border-primary/50 text-primary hover:bg-primary/5"
                          onClick={() => setIsInstructorDialogOpen(true)}
                          disabled={!centerId}
                          aria-label={t("pages.instructors.createInstructor")}
                          title={t("pages.instructors.createInstructor")}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </div>
                </div>

                <CourseEducationTargetingSection
                  centerId={centerId}
                  values={educationTargeting}
                  onChange={handleEducationTargetingChange}
                  disabled={isPending}
                  error={educationTargetingError}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thumbnail</CardTitle>
                <CardDescription>
                  Upload a new thumbnail image for this course.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="mb-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Uploaded Thumbnail:
                  </p>
                  {currentThumbnail && !currentThumbnailFailed ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentThumbnail}
                        alt="Course thumbnail"
                        className="h-40 w-auto rounded-lg border object-cover"
                        onError={() => setCurrentThumbnailFailed(true)}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        This image reflects the currently uploaded thumbnail.
                      </p>
                    </>
                  ) : currentThumbnailFailed ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
                      Unable to load the uploaded thumbnail.
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
                      No thumbnail uploaded yet.
                    </div>
                  )}
                </div>

                {thumbnailPreview && (
                  <div className="space-y-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-primary">
                        New thumbnail (to be uploaded)
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearSelectedThumbnail}
                      >
                        Clear
                      </Button>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnailPreview}
                      alt="New course thumbnail preview"
                      className="h-40 w-auto rounded-lg border object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <p className="truncate text-xs text-gray-500">
                      {thumbnailFile?.name}
                    </p>
                  </div>
                )}

                <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <p className="text-sm font-medium">Upload New Thumbnail</p>
                  <div className="flex items-center gap-3">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleFileChange}
                      className="max-w-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleUploadThumbnail}
                      disabled={!thumbnailFile || isUploadingThumbnail}
                    >
                      {isUploadingThumbnail ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Max 5MB. Supported formats: JPG, PNG, GIF, WebP.
                  </p>
                  {thumbnailError && (
                    <p className="text-sm text-red-600">{thumbnailError}</p>
                  )}
                  {isUploadError && (
                    <p className="text-sm text-red-600">
                      {extractErrorMessage(uploadError)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isPending || !formData.title}
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>

            {isUpdateError && (
              <Alert variant="destructive">
                <AlertTitle>Could not update course</AlertTitle>
                <AlertDescription>
                  {extractErrorMessage(updateError)}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </form>
      <CategoryFormDialog
        centerId={centerId}
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        onSaved={handleCategorySaved}
      />
      <InstructorFormDialog
        scopeCenterId={centerId}
        open={isInstructorDialogOpen}
        onOpenChange={setIsInstructorDialogOpen}
        onSaved={handleInstructorSaved}
      />
    </div>
  );
}
