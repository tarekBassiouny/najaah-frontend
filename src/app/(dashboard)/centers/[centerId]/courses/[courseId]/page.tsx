"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useCenterCourse,
  useUpdateCenterCourse,
} from "@/features/courses/hooks/use-courses";
import { CoursePublishAction } from "@/features/courses/components/CoursePublishAction";
import { EnrollmentsTable } from "@/features/enrollments/components/EnrollmentsTable";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { CourseSectionsOverview } from "@/features/sections/components/CourseSectionsOverview";

type PageProps = {
  params: Promise<{ centerId: string; courseId: string }>;
};

type ActivePanel = "overview" | "students" | "settings";

function resolveCategoryId(course: Record<string, unknown>) {
  const directCategoryId = course.category_id;
  if (directCategoryId != null && directCategoryId !== "") {
    return String(directCategoryId);
  }

  const category = course.category;
  if (category && typeof category === "object" && "id" in category) {
    const categoryId = (category as { id?: string | number | null }).id;
    if (categoryId != null && categoryId !== "") {
      return String(categoryId);
    }
  }

  return "none";
}

export default function CenterCourseDetailPage({ params }: PageProps) {
  const { centerId, courseId } = use(params);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activePanel, setActivePanel] = useState<ActivePanel>("overview");

  const {
    data: course,
    isLoading,
    isError,
  } = useCenterCourse(centerId, courseId);

  const {
    mutate: updateCourse,
    isPending: isSavingSettings,
    isError: isSettingsError,
    error: settingsError,
  } = useUpdateCenterCourse();

  const { data: categoriesResponse, isLoading: isCategoriesLoading } =
    useCategories(centerId, { page: 1, per_page: 100 });

  const [settingsForm, setSettingsForm] = useState({
    title: "",
    slug: "",
    description: "",
    status: "",
    category_id: "none",
  });

  useEffect(() => {
    if (!course) return;

    const record = course as Record<string, unknown>;

    setSettingsForm({
      title: String(record.title ?? record.name ?? ""),
      slug: String(record.slug ?? ""),
      description: String(record.description ?? ""),
      status: String(record.status ?? ""),
      category_id: resolveCategoryId(record),
    });
  }, [course]);

  useEffect(() => {
    const panel = searchParams.get("panel");
    if (panel === "students" || panel === "settings") {
      setActivePanel(panel);
      return;
    }
    setActivePanel("overview");
  }, [searchParams]);

  const navItems = useMemo(
    () => [
      {
        id: "overview" as const,
        label: "Overview",
      },
      {
        id: "students" as const,
        label: "Enrolled Students",
      },
      {
        id: "settings" as const,
        label: "Settings",
      },
    ],
    [],
  );

  const setPanel = (panel: ActivePanel) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (panel === "overview") {
      nextParams.delete("panel");
    } else {
      nextParams.set("panel", panel);
    }

    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const handleSettingsSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    updateCourse({
      centerId,
      courseId,
      payload: {
        title: settingsForm.title || undefined,
        slug: settingsForm.slug || undefined,
        description: settingsForm.description || undefined,
        status: settingsForm.status || undefined,
        category_id:
          settingsForm.category_id !== "none"
            ? settingsForm.category_id
            : undefined,
      },
    });
  };

  const handleSettingsChange =
    (field: "title" | "slug" | "description" | "status") =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSettingsForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full lg:max-w-[220px]">
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
          <div className="flex-1 space-y-6">
            <Card>
              <CardContent className="space-y-3 py-6">
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-3 py-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-gray-500 dark:text-gray-400">
              This course may have been deleted or you may not have permission
              to view it.
            </p>
            <Link href={`/centers/${centerId}/courses`}>
              <Button>Back to Courses</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = String(course.status ?? "").toLowerCase();
  const statusVariant =
    status === "published" || status === "active"
      ? "success"
      : status === "draft"
        ? "secondary"
        : "default";

  const courseTitle = String(
    course.title ?? course.name ?? `Course #${course.id}`,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full lg:w-[220px] lg:flex-none">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-dark">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Course Management
            </p>
            <h2 className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
              {courseTitle}
            </h2>
            <nav className="mt-4 grid gap-1.5">
              {navItems.map((item) => {
                const isActive = activePanel === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPanel(item.id)}
                    className={cn(
                      "flex h-10 w-full min-w-0 items-center rounded-lg px-3 text-left text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
                    )}
                  >
                    <span className="truncate whitespace-nowrap">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-6">
          <Card>
            <CardContent className="space-y-4 py-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {courseTitle}
                    </h1>
                    {course.status ? (
                      <Badge
                        variant={statusVariant}
                        className="text-[11px] uppercase"
                      >
                        {String(course.status)}
                      </Badge>
                    ) : null}
                  </div>
                  {course.description ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {String(course.description)}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPanel("settings")}
                  >
                    Settings
                  </Button>
                  <CoursePublishAction course={course} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span>{course.center?.name ?? `Center ${centerId}`}</span>
                </div>
                {course.instructor ? (
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>
                      Instructor:{" "}
                      {typeof course.instructor === "object"
                        ? String(
                            (course.instructor as Record<string, unknown>)
                              .name ?? "",
                          )
                        : String(course.instructor)}
                    </span>
                  </div>
                ) : null}
                {course.created_at ? (
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>Created: {String(course.created_at)}</span>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {activePanel === "overview" ? (
            <CourseSectionsOverview
              centerId={centerId}
              courseId={courseId}
              managerHref={`/centers/${centerId}/courses/${courseId}/sections`}
            />
          ) : activePanel === "students" ? (
            <EnrollmentsTable
              centerId={centerId}
              showCenterFilter={false}
              initialCourseId={courseId}
              initialPerPage={15}
              fixedStatus="ACTIVE"
              fixedCourseId={courseId}
              showBulkActions={false}
              showDateFilters={false}
              showCourseColumn={false}
              showEnrollmentWindowColumn={false}
              showActionColumn={false}
              headerTitle="Enrolled Students"
              headerDescription="Track active enrollments for this course."
              buildStudentHref={(studentId) =>
                `/centers/${centerId}/students/${studentId}?from=course&courseId=${courseId}`
              }
            />
          ) : (
            <form onSubmit={handleSettingsSubmit} className="space-y-4">
              <Card>
                <CardContent className="space-y-4 py-5">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Course Settings
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Update course metadata without leaving this page.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="settings-title">Title</Label>
                      <Input
                        id="settings-title"
                        value={settingsForm.title}
                        onChange={handleSettingsChange("title")}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="settings-slug">Slug</Label>
                      <Input
                        id="settings-slug"
                        value={settingsForm.slug}
                        onChange={handleSettingsChange("slug")}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="settings-status">Status</Label>
                      <Input
                        id="settings-status"
                        value={settingsForm.status}
                        onChange={handleSettingsChange("status")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="settings-category">Category</Label>
                      <Select
                        value={settingsForm.category_id}
                        onValueChange={(value) =>
                          setSettingsForm((prev) => ({
                            ...prev,
                            category_id: value,
                          }))
                        }
                      >
                        <SelectTrigger
                          id="settings-category"
                          className="h-10 w-full"
                          disabled={isCategoriesLoading}
                        >
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No category</SelectItem>
                          {(categoriesResponse?.items ?? []).map((category) => (
                            <SelectItem
                              key={category.id}
                              value={String(category.id)}
                            >
                              {category.title_translations?.en ||
                                category.title ||
                                category.name ||
                                `Category #${category.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="settings-description">Description</Label>
                    <textarea
                      id="settings-description"
                      value={settingsForm.description}
                      onChange={handleSettingsChange("description")}
                      rows={4}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="submit"
                      disabled={isSavingSettings || !settingsForm.title}
                    >
                      {isSavingSettings ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        if (!course) return;

                        const record = course as Record<string, unknown>;

                        setSettingsForm({
                          title: String(record.title ?? record.name ?? ""),
                          slug: String(record.slug ?? ""),
                          description: String(record.description ?? ""),
                          status: String(record.status ?? ""),
                          category_id: resolveCategoryId(record),
                        });
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {isSettingsError ? (
                <Card className="border-red-200 dark:border-red-900">
                  <CardContent className="py-4">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {(settingsError as Error)?.message ||
                        "Failed to update course. Please try again."}
                    </p>
                  </CardContent>
                </Card>
              ) : null}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
