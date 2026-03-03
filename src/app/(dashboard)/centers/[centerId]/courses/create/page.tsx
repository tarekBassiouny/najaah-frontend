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
import { useCategoryOptions } from "@/features/categories/hooks/use-category-options";
import { useInstructorOptions } from "@/features/instructors/hooks/use-instructor-options";
import { CategoryFormDialog } from "@/features/categories/components/CategoryFormDialog";
import type { Category } from "@/features/categories/types/category";
import { InstructorFormDialog } from "@/features/instructors/components/InstructorFormDialog";
import type { Instructor } from "@/features/instructors/types/instructor";
import {
  getAdminApiFieldErrors,
  getAdminApiErrorMessage,
  getAdminApiFirstFieldError,
} from "@/lib/admin-response";
import { cn } from "@/lib/utils";
import { PlusIcon } from "@/components/icons/plus";

type PageProps = {
  params: Promise<{ centerId: string }>;
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

function extractErrorMessage(error: unknown): string {
  const firstFieldError = getAdminApiFirstFieldError(error);
  if (firstFieldError) {
    return firstFieldError;
  }

  return getAdminApiErrorMessage(
    error,
    "Failed to create course. Please try again.",
  );
}

export default function CenterCoursesCreatePage({ params }: PageProps) {
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
    difficulty: "",
    language: "en",
    price: "",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

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
          difficulty: formData.difficulty || undefined,
          language: formData.language || undefined,
          price: formData.price ? Number(formData.price) : undefined,
          instructor_id: formData.instructorId
            ? Number(formData.instructorId)
            : undefined,
          category_id: formData.categoryId
            ? Number(formData.categoryId)
            : undefined,
          thumbnail: thumbnailFile ?? undefined,
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
        title="Create Course"
        description="Create a course inside this center"
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          { label: "Courses", href: `/centers/${centerId}/courses` },
          { label: "Create" },
        ]}
        actions={
          <Link href={`/centers/${centerId}/courses`}>
            <Button variant="outline">Cancel</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
                <CardDescription>
                  Basic details about your course
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title (English) *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={handleChange("title")}
                      placeholder="e.g., Introduction to React"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="titleAr">Title (Arabic)</Label>
                    <Input
                      id="titleAr"
                      value={formData.titleAr}
                      onChange={handleChange("titleAr")}
                      placeholder="e.g., مقدمة في React"
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <div className="flex gap-2">
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={handleChange("slug")}
                      placeholder="e.g., intro-to-react"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateSlug}
                      disabled={!formData.title}
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (English)</Label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={handleChange("description")}
                      rows={3}
                      placeholder="Course description in English"
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
                      placeholder="وصف الدورة بالعربية"
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
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
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
                    {difficultyError ? (
                      <p className="text-xs text-red-600">{difficultyError}</p>
                    ) : null}
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
                      placeholder="e.g., 99.99"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">
                      Category <span className="text-red-500">*</span>
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
                          aria-label="Create a category"
                          title="Create a category"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      }
                    />
                    {categoryError ? (
                      <p className="text-xs text-red-600">{categoryError}</p>
                    ) : (
                      <p className="text-xs text-gray-500">
                        Required. Choose the category this course belongs to.
                      </p>
                    )}
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
                          aria-label="Create an instructor"
                          title="Create an instructor"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <p className="text-xs text-gray-500">
                      Optional. You can assign an instructor later.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thumbnail</CardTitle>
                <CardDescription>
                  Upload a thumbnail image for this course.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Upload Thumbnail</p>
                    {thumbnailFile ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearSelectedThumbnail}
                      >
                        Clear
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
                    Max 5MB. Supported formats: JPG, PNG, GIF, WebP.
                  </p>
                  {thumbnailError ? (
                    <p className="text-sm text-red-600">{thumbnailError}</p>
                  ) : null}
                </div>

                {thumbnailPreview && (
                  <div className="mt-2">
                    <p className="mb-2 text-sm text-gray-600">Preview:</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
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
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isPending || !formData.title}
                >
                  {isPending ? "Creating..." : "Create Course"}
                </Button>
              </CardContent>
            </Card>

            {isError && Object.keys(fieldErrors).length === 0 && (
              <Alert variant="destructive">
                <AlertTitle>Could not create course</AlertTitle>
                <AlertDescription>
                  {extractErrorMessage(error)}
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
