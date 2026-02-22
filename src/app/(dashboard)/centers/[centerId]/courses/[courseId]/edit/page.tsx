"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAxiosError } from "axios";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCenterCourse,
  useUpdateCenterCourse,
  useUploadCourseThumbnail,
} from "@/features/courses/hooks/use-courses";
import { useInstructors } from "@/features/instructors/hooks/use-instructors";

type PageProps = {
  params: Promise<{ centerId: string; courseId: string }>;
};

type BackendErrorData = {
  message?: string;
  errors?: Record<string, string[] | string>;
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, string[] | string>;
  };
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
  if (isAxiosError<BackendErrorData>(error)) {
    const data = error.response?.data;

    if (data?.error?.details) {
      const firstDetail = Object.values(data.error.details)[0];
      if (Array.isArray(firstDetail) && firstDetail[0]) {
        return firstDetail[0];
      }
      if (typeof firstDetail === "string") {
        return firstDetail;
      }
    }

    if (data?.error?.message) {
      return data.error.message;
    }

    if (data?.message) {
      return data.message;
    }
  }

  return "Failed to update course. Please try again.";
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

export default function CenterCourseEditPage({ params }: PageProps) {
  const { centerId, courseId } = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: course, isLoading: isLoadingCourse } = useCenterCourse(
    centerId,
    courseId,
  );
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

  const { data: instructorsData, isLoading: isLoadingInstructors } =
    useInstructors({ page: 1, per_page: 100 }, { centerId });

  const instructors = instructorsData?.items ?? [];

  const [formData, setFormData] = useState({
    title: "",
    titleAr: "",
    slug: "",
    description: "",
    descriptionAr: "",
    difficulty: "",
    language: "",
    price: "",
    instructorId: "",
    thumbnailUrl: "",
    status: "",
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);

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
      instructorId: course.primary_instructor_id
        ? String(course.primary_instructor_id)
        : course.primary_instructor?.id
          ? String(course.primary_instructor.id)
          : "",
      thumbnailUrl: course.thumbnail_url ?? course.thumbnail ?? "",
      status: course.status ?? "",
    });
  }, [course]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
          instructor_id: formData.instructorId
            ? Number(formData.instructorId)
            : undefined,
          thumbnail_url: formData.thumbnailUrl || undefined,
          status: formData.status || undefined,
        },
      },
      {
        onSuccess: () => {
          router.push(`/centers/${centerId}/courses/${courseId}`);
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
      setThumbnailError(
        "Please select a valid image file (JPG, PNG, GIF, or WebP).",
      );
      return;
    }

    if (file.size > MAX_THUMBNAIL_SIZE) {
      setThumbnailError("File size must be less than 5MB.");
      return;
    }

    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
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
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          setFormData((prev) => ({
            ...prev,
            thumbnailUrl:
              updatedCourse.thumbnail_url ?? updatedCourse.thumbnail ?? "",
          }));
        },
      },
    );
  };

  const isPending = isUpdating || isUploadingThumbnail;
  const currentThumbnail = thumbnailPreview || formData.thumbnailUrl;

  if (isLoadingCourse) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Course"
        description="Update this center course"
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          { label: "Courses", href: `/centers/${centerId}/courses` },
          {
            label: course?.title ?? `Course ${courseId}`,
            href: `/centers/${centerId}/courses/${courseId}`,
          },
          { label: "Edit" },
        ]}
        actions={
          <Link href={`/centers/${centerId}/courses/${courseId}`}>
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

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    value={formData.status}
                    onChange={handleChange("status")}
                  />
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructor">Primary Instructor</Label>
                  <Select
                    value={formData.instructorId}
                    onValueChange={handleSelectChange("instructorId")}
                    disabled={isLoadingInstructors}
                  >
                    <SelectTrigger id="instructor">
                      <SelectValue
                        placeholder={
                          isLoadingInstructors
                            ? "Loading instructors..."
                            : "Select instructor"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {instructors.map((instructor) => (
                        <SelectItem
                          key={instructor.id}
                          value={String(instructor.id)}
                        >
                          {instructor.name ?? `Instructor #${instructor.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thumbnail</CardTitle>
                <CardDescription>
                  Upload an image or provide a URL for the course thumbnail
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentThumbnail && (
                  <div className="mb-4">
                    <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Current Thumbnail:
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentThumbnail}
                      alt="Course thumbnail"
                      className="h-40 w-auto rounded-lg border object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
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

                <div className="space-y-2">
                  <Label htmlFor="thumbnailUrl">Or Enter URL</Label>
                  <Input
                    id="thumbnailUrl"
                    type="url"
                    value={formData.thumbnailUrl}
                    onChange={handleChange("thumbnailUrl")}
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-gray-500">
                    Direct URL to an image (max 2048 characters).
                  </p>
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
    </div>
  );
}
