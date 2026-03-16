"use client";

import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { useCreateCenterCourse } from "@/features/courses/hooks/use-courses";
import { CourseEducationTargetingSection } from "@/features/courses/components/CourseEducationTargetingSection";
import { useCategoryOptions } from "@/features/categories/hooks/use-category-options";
import { useInstructorOptions } from "@/features/instructors/hooks/use-instructor-options";
import { CategoryFormDialog } from "@/features/categories/components/CategoryFormDialog";
import type { Category } from "@/features/categories/types/category";
import { InstructorFormDialog } from "@/features/instructors/components/InstructorFormDialog";
import type { Instructor } from "@/features/instructors/types/instructor";
import {
  hasAnyEducationTarget,
  toCourseEducationTargetingPayload,
  type CourseEducationTargetingValues,
} from "@/features/courses/utils/education-targeting";
import {
  getAdminApiFieldErrors,
  getAdminApiErrorMessage,
  getAdminApiFirstFieldError,
} from "@/lib/admin-response";
import { useTranslation } from "@/features/localization";
import { cn } from "@/lib/utils";
import { PlusIcon } from "@/components/icons/plus";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

const DIFFICULTY_VALUES = ["beginner", "intermediate", "advanced"] as const;
const LANGUAGE_VALUES = ["en", "ar"] as const;
const ACCESS_MODEL_VALUES = ["enrollment", "video_code"] as const;

const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

type VideoApprovalOverride = "inherit" | "enabled" | "disabled";
type CourseAccessModelValue = (typeof ACCESS_MODEL_VALUES)[number];

function mapVideoApprovalOverrideToPayload(
  value: VideoApprovalOverride,
): boolean | null {
  if (value === "enabled") return true;
  if (value === "disabled") return false;
  return null;
}

function extractErrorMessage(error: unknown, fallbackMessage: string): string {
  const firstFieldError = getAdminApiFirstFieldError(error);
  if (firstFieldError) {
    return firstFieldError;
  }

  return getAdminApiErrorMessage(error, fallbackMessage);
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

export default function CenterCoursesCreatePage({ params }: PageProps) {
  const { t } = useTranslation();
  const { centerId } = use(params);
  const router = useRouter();
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isInstructorDialogOpen, setIsInstructorDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    mutate: createCourse,
    isPending,
    isError,
    error,
  } = useCreateCenterCourse();

  const [formData, setFormData] = useState({
    title: "",
    titleAr: "",
    slug: "",
    description: "",
    descriptionAr: "",
    accessModel: "enrollment" as CourseAccessModelValue,
    difficulty: "",
    language: "en",
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

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
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

  const categoryError = fieldErrors.category_id?.[0] ?? null;
  const difficultyError = fieldErrors.difficulty?.[0] ?? null;
  const isVideoCodeCourse = formData.accessModel === "video_code";
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
        t("pages.courseForm.errors.targetingRequired"),
      );
      return;
    }

    const titleTranslations: Record<string, string> = {
      en: formData.title,
    };
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

    createCourse(
      {
        centerId,
        payload: {
          title_translations: titleTranslations,
          description_translations:
            Object.keys(descriptionTranslations).length > 0
              ? descriptionTranslations
              : undefined,
          slug: formData.slug || undefined,
          access_model: formData.accessModel,
          difficulty: formData.difficulty || undefined,
          language: formData.language || undefined,
          price: formData.price ? Number(formData.price) : undefined,
          requires_video_approval: isVideoCodeCourse
            ? undefined
            : mapVideoApprovalOverrideToPayload(formData.requiresVideoApproval),
          instructor_id: formData.instructorId
            ? Number(formData.instructorId)
            : undefined,
          category_id: formData.categoryId
            ? Number(formData.categoryId)
            : undefined,
          thumbnail: thumbnailFile ?? undefined,
          ...toCourseEducationTargetingPayload(educationTargeting),
        },
      },
      {
        onSuccess: (course) => {
          router.push(`/centers/${centerId}/courses/${course.id}`);
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
      setFieldErrors((prev) => {
        const next = { ...prev };
        if (field === "categoryId") delete next.category_id;
        if (field === "difficulty") delete next.difficulty;
        return next;
      });
    };

  const handleSelectChange = (field: string) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (field === "difficulty") delete next.difficulty;
      return next;
    });
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
      setThumbnailError(t("pages.courseForm.errors.invalidImageType"));
      e.target.value = "";
      return;
    }

    if (file.size > MAX_THUMBNAIL_SIZE) {
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setThumbnailError(t("pages.courseForm.errors.fileTooLarge"));
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

  const generateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setFormData((prev) => ({ ...prev, slug }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.coursesPage.createCourse")}
        description={t("pages.centerCourseCreate.description")}
        breadcrumbs={[
          { label: t("common.labels.centers"), href: "/centers" },
          {
            label: t("pages.centerCourseCreate.centerById", { id: centerId }),
            href: `/centers/${centerId}`,
          },
          {
            label: t("pages.coursesPage.title"),
            href: `/centers/${centerId}/courses`,
          },
          { label: t("common.actions.create") },
        ]}
        actions={
          <Link href={`/centers/${centerId}/courses`}>
            <Button variant="outline">{t("common.actions.cancel")}</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("pages.courseForm.sections.infoTitle")}
                </CardTitle>
                <CardDescription>
                  {t("pages.courseForm.sections.infoDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      {t("pages.courseForm.fields.titleEn")}
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={handleChange("title")}
                      placeholder={t("pages.courseForm.placeholders.titleEn")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="titleAr">
                      {t("pages.courseForm.fields.titleAr")}
                    </Label>
                    <Input
                      id="titleAr"
                      value={formData.titleAr}
                      onChange={handleChange("titleAr")}
                      placeholder={t("pages.courseForm.placeholders.titleAr")}
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">
                    {t("pages.courseForm.fields.slug")}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={handleChange("slug")}
                      placeholder={t("pages.courseForm.placeholders.slug")}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateSlug}
                      disabled={!formData.title}
                    >
                      {t("pages.courseForm.actions.generateSlug")}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      {t("pages.courseForm.fields.descriptionEn")}
                    </Label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={handleChange("description")}
                      rows={3}
                      placeholder={t(
                        "pages.courseForm.placeholders.descriptionEn",
                      )}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descriptionAr">
                      {t("pages.courseForm.fields.descriptionAr")}
                    </Label>
                    <textarea
                      id="descriptionAr"
                      value={formData.descriptionAr}
                      onChange={handleChange("descriptionAr")}
                      rows={3}
                      placeholder={t(
                        "pages.courseForm.placeholders.descriptionAr",
                      )}
                      dir="rtl"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t("pages.courseForm.sections.settingsTitle")}
                </CardTitle>
                <CardDescription>
                  {t("pages.courseForm.sections.settingsDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="space-y-2">
                    <Label htmlFor="access-model">
                      {t("pages.courseForm.accessModel.label")}
                    </Label>
                    <Select
                      value={formData.accessModel}
                      onValueChange={handleSelectChange("accessModel")}
                    >
                      <SelectTrigger id="access-model">
                        <SelectValue
                          placeholder={t(
                            "pages.courseForm.accessModel.placeholder",
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCESS_MODEL_VALUES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {t(`pages.courseForm.accessModel.options.${value}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">
                      {t("pages.courseForm.fields.difficulty")}
                    </Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={handleSelectChange("difficulty")}
                    >
                      <SelectTrigger
                        id="difficulty"
                        className={cn(
                          difficultyError &&
                            "border-red-500 focus:ring-red-500",
                        )}
                      >
                        <SelectValue
                          placeholder={t(
                            "pages.courseForm.placeholders.difficulty",
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTY_VALUES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {t(`pages.courseForm.difficulty.${value}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {difficultyError ? (
                      <p className="text-xs text-red-600">{difficultyError}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">
                      {t("pages.courseForm.fields.language")}
                    </Label>
                    <Select
                      value={formData.language}
                      onValueChange={handleSelectChange("language")}
                    >
                      <SelectTrigger id="language">
                        <SelectValue
                          placeholder={t(
                            "pages.courseForm.placeholders.language",
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_VALUES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {t(`pages.courseForm.language.${value}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">
                      {t("pages.courseForm.fields.price")}
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleChange("price")}
                      placeholder={t("pages.courseForm.placeholders.price")}
                    />
                  </div>

                  {!isVideoCodeCourse ? (
                    <div className="space-y-2">
                      <Label htmlFor="requires-video-approval">
                        {t("pages.courseForm.videoApproval.label")}
                      </Label>
                      <Select
                        value={formData.requiresVideoApproval}
                        onValueChange={handleSelectChange(
                          "requiresVideoApproval",
                        )}
                      >
                        <SelectTrigger id="requires-video-approval">
                          <SelectValue
                            placeholder={t(
                              "pages.courseForm.videoApproval.options.inherit",
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inherit">
                            {t(
                              "pages.courseForm.videoApproval.options.inherit",
                            )}
                          </SelectItem>
                          <SelectItem value="enabled">
                            {t(
                              "pages.courseForm.videoApproval.options.enabled",
                            )}
                          </SelectItem>
                          <SelectItem value="disabled">
                            {t(
                              "pages.courseForm.videoApproval.options.disabled",
                            )}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                </div>

                <Alert>
                  <AlertTitle>
                    {t(
                      isVideoCodeCourse
                        ? "pages.courseForm.accessModel.info.videoCodeTitle"
                        : "pages.courseForm.accessModel.info.enrollmentTitle",
                    )}
                  </AlertTitle>
                  <AlertDescription>
                    {t(
                      isVideoCodeCourse
                        ? "pages.courseForm.accessModel.info.videoCodeDescription"
                        : "pages.courseForm.accessModel.info.enrollmentDescription",
                    )}
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">
                      {t("pages.courseForm.fields.category")}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <SearchableSelect
                      value={formData.categoryId || null}
                      onValueChange={(value) => {
                        setFormData((prev) => ({
                          ...prev,
                          categoryId: value ?? "",
                        }));
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.category_id;
                          return next;
                        });
                      }}
                      options={categoryOptions}
                      placeholder={t("pages.courseForm.placeholders.category")}
                      searchPlaceholder={t(
                        "pages.courseForm.placeholders.searchCategories",
                      )}
                      searchValue={categorySearch}
                      onSearchValueChange={setCategorySearch}
                      filterOptions={false}
                      isLoading={isLoadingCategories}
                      hasMore={hasMoreCategories}
                      isLoadingMore={isLoadingMoreCategories}
                      onReachEnd={loadMoreCategories}
                      allowClear
                      triggerClassName={cn(
                        categoryError && "border-red-500 focus:ring-red-500",
                      )}
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
                    {categoryError ? (
                      <p className="text-xs text-red-600">{categoryError}</p>
                    ) : (
                      <p className="text-xs text-gray-500">
                        {t("pages.courseForm.hints.categoryRequired")}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instructor">
                      {t("pages.courseForm.fields.primaryInstructor")}
                    </Label>
                    <SearchableSelect
                      value={formData.instructorId || null}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          instructorId: value ?? "",
                        }))
                      }
                      options={instructorOptions}
                      placeholder={t(
                        "pages.courseForm.placeholders.instructor",
                      )}
                      searchPlaceholder={t(
                        "pages.courseForm.placeholders.searchInstructors",
                      )}
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
                    <p className="text-xs text-gray-500">
                      {t("pages.courseForm.hints.instructorOptional")}
                    </p>
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
                <CardTitle>
                  {t("pages.courseForm.sections.thumbnailTitle")}
                </CardTitle>
                <CardDescription>
                  {t("pages.courseForm.sections.thumbnailDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {t("pages.courseForm.thumbnail.uploadTitle")}
                    </p>
                    {thumbnailFile ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearSelectedThumbnail}
                      >
                        {t("pages.courseForm.actions.clear")}
                      </Button>
                    ) : null}
                  </div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileChange}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-gray-500">
                    {t("pages.courseForm.thumbnail.restrictions")}
                  </p>
                  {thumbnailError ? (
                    <p className="text-sm text-red-600">{thumbnailError}</p>
                  ) : null}
                </div>

                {thumbnailPreview && (
                  <div className="mt-2">
                    <p className="mb-2 text-sm text-gray-600">
                      {t("pages.courseForm.thumbnail.previewLabel")}
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnailPreview}
                      alt={t("pages.courseForm.thumbnail.previewAlt")}
                      className="h-32 w-auto rounded-lg border object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("pages.courseForm.sections.actionsTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isPending || !formData.title}
                >
                  {isPending
                    ? t("pages.courseForm.actions.creating")
                    : t("pages.courseForm.actions.createCourse")}
                </Button>
              </CardContent>
            </Card>

            {isError && Object.keys(fieldErrors).length === 0 && (
              <Alert variant="destructive">
                <AlertTitle>
                  {t("pages.courseForm.errors.couldNotCreate")}
                </AlertTitle>
                <AlertDescription>
                  {extractErrorMessage(
                    error,
                    t("pages.courseForm.errors.createFailed"),
                  )}
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
        open={isInstructorDialogOpen}
        onOpenChange={setIsInstructorDialogOpen}
        scopeCenterId={centerId}
        onSaved={handleInstructorSaved}
      />
    </div>
  );
}
