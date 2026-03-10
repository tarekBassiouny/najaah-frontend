"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppNotFoundState } from "@/components/ui/app-not-found-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useModal } from "@/components/ui/modal-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  useAssignCourseInstructor,
  useCenterCourse,
  useRemoveCourseInstructor,
  useUpdateCenterCourse,
} from "@/features/courses/hooks/use-courses";
import { CoursePublishAction } from "@/features/courses/components/CoursePublishAction";
import { EnrollmentsTable } from "@/features/enrollments/components/EnrollmentsTable";
import { useCategoryOptions } from "@/features/categories/hooks/use-category-options";
import { useInstructorOptions } from "@/features/instructors/hooks/use-instructor-options";
import { CourseSectionsOverview } from "@/features/sections/components/CourseSectionsOverview";
import { formatDateTime } from "@/lib/format-date-time";
import {
  getAdminApiErrorMessage,
  getAdminResponseMessage,
  isAdminApiNotFoundError,
} from "@/lib/admin-response";
import { useTranslation } from "@/features/localization";
import type { InstructorSummary } from "@/features/courses/types/course";

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

function normalizeEntityId(value: string): string | number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : value;
}

function getInstructorLabel(
  instructor: InstructorSummary | null | undefined,
): string {
  if (!instructor) return "Unknown instructor";

  if (typeof instructor.name === "string" && instructor.name.trim()) {
    return instructor.name.trim();
  }

  const translatedName = instructor.name_translations?.en;
  if (typeof translatedName === "string" && translatedName.trim()) {
    return translatedName.trim();
  }

  return `Instructor #${instructor.id}`;
}

export default function CenterCourseDetailPage({ params }: PageProps) {
  const { t, locale } = useTranslation();
  const isRtl = locale === "ar";
  const { centerId, courseId } = use(params);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useModal();

  const [activePanel, setActivePanel] = useState<ActivePanel>("overview");
  const [selectedInstructorId, setSelectedInstructorId] = useState<
    string | null
  >(null);
  const [instructorActionError, setInstructorActionError] = useState<
    string | null
  >(null);
  const [pendingRemoveInstructor, setPendingRemoveInstructor] =
    useState<InstructorSummary | null>(null);

  const {
    data: course,
    isLoading,
    isError,
    error,
  } = useCenterCourse(centerId, courseId);

  const {
    mutate: updateCourse,
    isPending: isSavingSettings,
    isError: isSettingsError,
    error: settingsError,
  } = useUpdateCenterCourse();
  const { mutate: assignInstructor, isPending: isAssigningInstructor } =
    useAssignCourseInstructor();
  const { mutate: removeInstructor, isPending: isRemovingInstructor } =
    useRemoveCourseInstructor();

  const [settingsForm, setSettingsForm] = useState({
    title: "",
    slug: "",
    description: "",
    category_id: "none",
  });
  const {
    options: categoryOptions,
    search: categorySearch,
    setSearch: setCategorySearch,
    isLoading: isLoadingCategories,
    hasMore: hasMoreCategories,
    isLoadingMore: isLoadingMoreCategories,
    onReachEnd: loadMoreCategories,
  } = useCategoryOptions({
    centerId,
    selectedValue: settingsForm.category_id,
    includeNoneOption: true,
    noneOptionValue: "none",
    noneOptionLabel: "No category",
  });
  const {
    options: instructorOptionItems,
    search: instructorSearch,
    setSearch: setInstructorSearch,
    isLoading: isInstructorsLoading,
    hasMore: hasMoreInstructors,
    isLoadingMore: isLoadingMoreInstructors,
    onReachEnd: loadMoreInstructors,
  } = useInstructorOptions({
    centerId,
    selectedValue: selectedInstructorId,
    enabled: Boolean(centerId),
  });

  useEffect(() => {
    if (!course) return;

    const record = course as Record<string, unknown>;

    setSettingsForm({
      title: String(record.title ?? record.name ?? ""),
      slug: String(record.slug ?? ""),
      description: String(record.description ?? ""),
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

  useEffect(() => {
    setInstructorActionError(null);
    setSelectedInstructorId(null);
    setPendingRemoveInstructor(null);
    setInstructorSearch("");
  }, [courseId, setInstructorSearch]);

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
        category_id:
          settingsForm.category_id !== "none"
            ? settingsForm.category_id
            : undefined,
      },
    });
  };

  const handleSettingsChange =
    (field: "title" | "slug" | "description") =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSettingsForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const primaryInstructorId = useMemo(() => {
    const primaryId =
      course?.primary_instructor?.id ?? course?.primary_instructor_id;
    if (primaryId == null || primaryId === "") return null;
    return String(primaryId);
  }, [course?.primary_instructor?.id, course?.primary_instructor_id]);

  const assignedInstructors = useMemo(() => {
    const dedupe = new Map<string, InstructorSummary>();
    const addInstructor = (
      instructor: InstructorSummary | null | undefined,
    ) => {
      if (!instructor?.id) return;
      dedupe.set(String(instructor.id), instructor);
    };

    if (Array.isArray(course?.instructors)) {
      course.instructors.forEach((instructor) => addInstructor(instructor));
    }

    addInstructor(course?.primary_instructor ?? null);
    const list = Array.from(dedupe.values());

    if (!primaryInstructorId) {
      return list;
    }

    return list.sort((a, b) => {
      const aPrimary = String(a.id) === primaryInstructorId;
      const bPrimary = String(b.id) === primaryInstructorId;
      if (aPrimary && !bPrimary) return -1;
      if (!aPrimary && bPrimary) return 1;
      return getInstructorLabel(a).localeCompare(getInstructorLabel(b));
    });
  }, [course?.instructors, course?.primary_instructor, primaryInstructorId]);

  const instructorOptions = useMemo(() => {
    const assignedIds = new Set(
      assignedInstructors.map((item) => String(item.id)),
    );
    return instructorOptionItems.map((option) => ({
      ...option,
      disabled: assignedIds.has(String(option.value)),
    }));
  }, [assignedInstructors, instructorOptionItems]);

  const isInstructorActionPending =
    isAssigningInstructor || isRemovingInstructor;

  const handleAssignInstructor = () => {
    if (!selectedInstructorId) {
      setInstructorActionError("Select an instructor to assign.");
      return;
    }

    setInstructorActionError(null);

    assignInstructor(
      {
        centerId,
        courseId,
        payload: { instructor_id: normalizeEntityId(selectedInstructorId) },
      },
      {
        onSuccess: (updatedCourse) => {
          showToast(
            getAdminResponseMessage(
              updatedCourse,
              "Instructor assigned successfully.",
            ),
            "success",
          );
          setSelectedInstructorId(null);
        },
        onError: (error) => {
          const message = getAdminApiErrorMessage(
            error,
            "Failed to assign instructor.",
          );
          setInstructorActionError(message);
          showToast(message, "error");
        },
      },
    );
  };

  const handleConfirmRemoveInstructor = () => {
    if (!pendingRemoveInstructor?.id) return;
    setInstructorActionError(null);

    removeInstructor(
      {
        centerId,
        courseId,
        instructorId: pendingRemoveInstructor.id,
      },
      {
        onSuccess: (updatedCourse) => {
          showToast(
            getAdminResponseMessage(
              updatedCourse,
              "Instructor removed successfully.",
            ),
            "success",
          );
          setPendingRemoveInstructor(null);
        },
        onError: (error) => {
          const message = getAdminApiErrorMessage(
            error,
            "Failed to remove instructor.",
          );
          setInstructorActionError(message);
          showToast(message, "error");
        },
      },
    );
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

  const isMissingCourse = !isLoading && !isError && !course;

  if (isMissingCourse || isAdminApiNotFoundError(error)) {
    return (
      <AppNotFoundState
        scopeLabel="Course"
        title={t("pages.centerCourseEdit.notFoundTitle")}
        description={t("pages.centerCourseEdit.notFoundDescription")}
        primaryAction={{
          href: `/centers/${centerId}/courses`,
          label: t("pages.centerCourseEdit.goToCourses"),
        }}
      />
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-gray-500 dark:text-gray-400">
              {t("pages.centerCourseDetail.loadFailedDescription")}
            </p>
            <Link href={`/centers/${centerId}/courses`}>
              <Button>{t("pages.centerCourseEdit.backToCourses")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const courseData = course!;
  const statusSource = courseData.status_key ?? courseData.status;
  const status = String(statusSource ?? "").toLowerCase();
  const statusLabel = String(
    courseData.status_label ?? statusSource ?? courseData.status ?? "",
  ).trim();
  const statusVariant =
    status === "published" || status === "active"
      ? "success"
      : status === "draft"
        ? "secondary"
        : "default";
  const categoryLabel = (() => {
    const category = courseData.category;
    if (category && typeof category === "object") {
      const label =
        (typeof category.title === "string" && category.title.trim()) ||
        (typeof category.name === "string" && category.name.trim()) ||
        "";
      if (label) return label;
      if (category.id != null && category.id !== "") {
        return `Category #${category.id}`;
      }
    }

    if (courseData.category_id != null && courseData.category_id !== "") {
      return `Category #${courseData.category_id}`;
    }

    return "";
  })();

  const courseTitle = String(
    courseData.title ?? courseData.name ?? `Course #${courseData.id}`,
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
              <div
                className={cn(
                  "flex gap-4 sm:items-start sm:justify-between",
                  isRtl
                    ? "flex-col-reverse sm:flex-row"
                    : "flex-col sm:flex-row",
                )}
              >
                <div
                  className={cn(
                    "space-y-2",
                    isRtl ? "text-right" : "text-left",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {courseTitle}
                    </h1>
                    {statusLabel ? (
                      <Badge variant={statusVariant} className="text-[11px]">
                        {statusLabel}
                      </Badge>
                    ) : null}
                    {categoryLabel ? (
                      <Badge variant="secondary" className="text-[11px]">
                        {categoryLabel}
                      </Badge>
                    ) : null}
                  </div>
                  {courseData.description ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {String(courseData.description)}
                    </p>
                  ) : null}
                </div>
                <div
                  className={cn(
                    "flex flex-wrap items-center gap-2",
                    isRtl ? "justify-end" : "justify-start",
                  )}
                >
                  <CoursePublishAction course={courseData} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span>{courseData.center?.name ?? `Center ${centerId}`}</span>
                </div>
                {primaryInstructorId ? (
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>
                      Primary Instructor:{" "}
                      {getInstructorLabel(courseData.primary_instructor)}
                      {assignedInstructors.length > 1
                        ? ` (+${assignedInstructors.length - 1} more)`
                        : ""}
                    </span>
                  </div>
                ) : null}
                {courseData.created_at ? (
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>
                      Created: {formatDateTime(String(courseData.created_at))}
                    </span>
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
              initialSections={courseData.sections}
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
            <div className="space-y-4">
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
                        <Label htmlFor="settings-category">Category</Label>
                        <SearchableSelect
                          value={settingsForm.category_id}
                          onValueChange={(value) =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              category_id: value ?? "none",
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
                        />
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

              <Card>
                <CardContent className="space-y-4 py-5">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Manage Instructors
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Assign additional instructors and remove existing ones.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <div className="space-y-2">
                      <Label htmlFor="assign-instructor">
                        Assign Instructor
                      </Label>
                      <SearchableSelect
                        value={selectedInstructorId}
                        onValueChange={setSelectedInstructorId}
                        options={instructorOptions}
                        placeholder="Select instructor"
                        searchPlaceholder="Search instructors..."
                        searchValue={instructorSearch}
                        onSearchValueChange={setInstructorSearch}
                        filterOptions={false}
                        disabled={isInstructorActionPending}
                        isLoading={isInstructorsLoading}
                        hasMore={hasMoreInstructors}
                        isLoadingMore={isLoadingMoreInstructors}
                        onReachEnd={loadMoreInstructors}
                        allowClear
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleAssignInstructor}
                      disabled={
                        isInstructorActionPending ||
                        !selectedInstructorId ||
                        isInstructorsLoading
                      }
                    >
                      {isAssigningInstructor ? "Assigning..." : "Assign"}
                    </Button>
                  </div>

                  {instructorActionError ? (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {instructorActionError}
                    </p>
                  ) : null}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Assigned Instructors</Label>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {assignedInstructors.length} total
                      </span>
                    </div>

                    {assignedInstructors.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-gray-300 px-3 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                        No instructors assigned yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {assignedInstructors.map((instructor) => {
                          const isPrimary =
                            primaryInstructorId != null &&
                            String(instructor.id) === primaryInstructorId;

                          return (
                            <div
                              key={instructor.id}
                              className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-900/30"
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                    {getInstructorLabel(instructor)}
                                  </p>
                                  {isPrimary ? (
                                    <Badge variant="info">Primary</Badge>
                                  ) : null}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  ID: {instructor.id}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-600"
                                onClick={() =>
                                  setPendingRemoveInstructor(instructor)
                                }
                                disabled={isInstructorActionPending}
                              >
                                Remove
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={Boolean(pendingRemoveInstructor)}
        onOpenChange={(nextOpen) => {
          if (isInstructorActionPending) return;
          if (!nextOpen) setPendingRemoveInstructor(null);
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-md overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle>Remove Instructor</DialogTitle>
            <DialogDescription>
              {pendingRemoveInstructor
                ? `Are you sure you want to remove "${getInstructorLabel(pendingRemoveInstructor)}" from this course?`
                : "Are you sure you want to remove this instructor?"}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
            <Button
              variant="outline"
              onClick={() => setPendingRemoveInstructor(null)}
              disabled={isInstructorActionPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRemoveInstructor}
              disabled={isInstructorActionPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRemovingInstructor ? "Removing..." : "Remove"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
