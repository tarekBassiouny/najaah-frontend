"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppNotFoundState } from "@/components/ui/app-not-found-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { can } from "@/lib/capabilities";
import { useCenterCourse } from "@/features/courses/hooks/use-courses";
import { useCourseSettingsForm } from "@/features/courses/hooks/use-course-settings-form";
import { useCourseInstructors } from "@/features/courses/hooks/use-course-instructors";
import { CoursePublishAction } from "@/features/courses/components/CoursePublishAction";
import { CourseSettingsForm } from "@/features/courses/components/CourseSettingsForm";
import { CourseInstructorCard } from "@/features/courses/components/CourseInstructorCard";
import { RemoveInstructorDialog } from "@/features/courses/components/RemoveInstructorDialog";
import { EnrollmentsTable } from "@/features/enrollments/components/EnrollmentsTable";
import { CourseSectionsOverview } from "@/features/sections/components/CourseSectionsOverview";
import { VideoCodeBatchesTable } from "@/features/video-code-batches/components/VideoCodeBatchesTable";
import { formatDateTime } from "@/lib/format-date-time";
import { isAdminApiNotFoundError } from "@/lib/admin-response";
import { useTranslation } from "@/features/localization";
import { getInstructorLabel } from "@/features/courses/utils/course-helpers";

type PageProps = {
  params: Promise<{ centerId: string; courseId: string }>;
};

type ActivePanel = "overview" | "students" | "batches" | "settings";

export default function CenterCourseDetailPage({ params }: PageProps) {
  const { t, locale } = useTranslation();
  const isRtl = locale === "ar";
  const { centerId, courseId } = use(params);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const canManageVideoAccess = can("manage_video_access");

  const {
    data: course,
    isLoading,
    isError,
    error,
  } = useCenterCourse(centerId, courseId);

  const settings = useCourseSettingsForm({ centerId, courseId, course });
  const instructors = useCourseInstructors({ centerId, courseId, course });

  const courseData = !isLoading && !isError && course ? course : null;
  const isVideoCodeCourse = courseData?.access_model === "video_code";
  const showBatchManagement = isVideoCodeCourse && canManageVideoAccess;

  const availableTabs = useMemo<ActivePanel[]>(() => {
    const tabs: ActivePanel[] = ["overview"];
    if (isVideoCodeCourse) {
      if (showBatchManagement) tabs.push("batches");
    } else {
      tabs.push("students");
    }
    tabs.push("settings");
    return tabs;
  }, [isVideoCodeCourse, showBatchManagement]);

  const rawPanel = searchParams.get("panel") as ActivePanel | null;
  const activePanel: ActivePanel =
    rawPanel && availableTabs.includes(rawPanel) ? rawPanel : "overview";

  const setPanel = (panel: string) => {
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
        scopeLabel={t("pages.centerCourseDetail.scopeLabel")}
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

  const cd = course!;
  const statusSource = cd.status_key ?? cd.status;
  const status = String(statusSource ?? "").toLowerCase();
  const statusLabel = String(
    cd.status_label ?? statusSource ?? cd.status ?? "",
  ).trim();
  const statusVariant =
    status === "published" || status === "active"
      ? "success"
      : status === "draft"
        ? "secondary"
        : "default";
  const categoryLabel = (() => {
    const category = cd.category;
    if (category && typeof category === "object") {
      const label =
        (typeof category.title === "string" && category.title.trim()) ||
        (typeof category.name === "string" && category.name.trim()) ||
        "";
      if (label) return label;
      if (category.id != null && category.id !== "") {
        return t("pages.centerCourseDetail.unknown.categoryById", {
          id: category.id,
        });
      }
    }
    if (cd.category_id != null && cd.category_id !== "") {
      return t("pages.centerCourseDetail.unknown.categoryById", {
        id: cd.category_id,
      });
    }
    return "";
  })();
  const courseTitle = String(
    cd.title ??
      cd.name ??
      t("pages.centerCourseDetail.unknown.courseById", { id: cd.id }),
  );
  const accessModelLabel = isVideoCodeCourse ? "Video Code" : "Enrollment";
  const assetsWorkspaceHref = `/centers/${centerId}/courses/${courseId}/assets`;

  return (
    <div className="space-y-6">
      <Tabs
        value={activePanel}
        onValueChange={setPanel}
        orientation="vertical"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="w-full lg:w-[220px] lg:flex-none">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-dark">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {t("pages.centerCourseDetail.management")}
              </p>
              <h2 className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                {courseTitle}
              </h2>
              <TabsList className="mt-4 grid gap-1.5">
                {availableTabs.map((tabId) => (
                  <TabsTrigger key={tabId} value={tabId}>
                    <span className="truncate whitespace-nowrap">
                      {t(`pages.centerCourseDetail.panels.${tabId}`)}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
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
                      <Badge variant="secondary" className="text-[11px]">
                        {accessModelLabel}
                      </Badge>
                    </div>
                    {cd.description ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {String(cd.description)}
                      </p>
                    ) : null}
                  </div>
                  <div
                    className={cn(
                      "flex flex-wrap items-center gap-2",
                      isRtl ? "justify-end" : "justify-start",
                    )}
                  >
                    {showBatchManagement ? (
                      <Link
                        href={`/centers/${centerId}/video-code-batches?course_id=${courseId}`}
                      >
                        <Button variant="outline">
                          {t(
                            "auto.features.video_code_batches.pages.videocodebatches.manageBatches",
                          )}
                        </Button>
                      </Link>
                    ) : null}
                    <Link href={assetsWorkspaceHref}>
                      <Button variant="outline">
                        {t(
                          "pages.centerCourseDetail.aiPanels.openAssetsWorkspace",
                        )}
                      </Button>
                    </Link>
                    <CoursePublishAction course={cd} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span>
                      {cd.center?.name ??
                        t("pages.centerCourseDetail.unknown.centerById", {
                          id: centerId,
                        })}
                    </span>
                  </div>
                  {instructors.primaryInstructorId ? (
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                      <span>
                        {t("pages.centerCourseDetail.primaryInstructor")}:{" "}
                        {getInstructorLabel(cd.primary_instructor, t)}
                        {instructors.assignedInstructors.length > 1
                          ? t("pages.centerCourseDetail.moreInstructors", {
                              count: instructors.assignedInstructors.length - 1,
                            })
                          : ""}
                      </span>
                    </div>
                  ) : null}
                  {cd.created_at ? (
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                      <span>
                        {t("pages.centerCourseDetail.createdLabel")}:{" "}
                        {formatDateTime(String(cd.created_at))}
                      </span>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <TabsContent value="overview">
              <CourseSectionsOverview
                centerId={centerId}
                courseId={courseId}
                managerHref={`/centers/${centerId}/courses/${courseId}/sections`}
                initialSections={cd.sections}
              />
            </TabsContent>

            {!isVideoCodeCourse && (
              <TabsContent value="students">
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
                  headerTitle={t("pages.centerCourseDetail.panels.students")}
                  headerDescription={t(
                    "pages.centerCourseDetail.studentsDescription",
                  )}
                  buildStudentHref={(studentId) =>
                    `/centers/${centerId}/students/${studentId}?from=course&courseId=${courseId}`
                  }
                />
              </TabsContent>
            )}

            {showBatchManagement && (
              <TabsContent value="batches">
                <VideoCodeBatchesTable
                  centerId={centerId}
                  fixedCourseId={courseId}
                  hideHeader
                />
              </TabsContent>
            )}

            <TabsContent value="settings">
              <div className="space-y-4">
                <CourseSettingsForm
                  centerId={centerId}
                  settingsForm={settings.settingsForm}
                  educationTargeting={settings.educationTargeting}
                  educationTargetingError={settings.educationTargetingError}
                  isSavingSettings={settings.isSavingSettings}
                  isSettingsError={settings.isSettingsError}
                  settingsError={settings.settingsError}
                  onSubmit={settings.handleSettingsSubmit}
                  onChange={settings.handleSettingsChange}
                  onReset={settings.handleSettingsReset}
                  onEducationTargetingChange={
                    settings.handleEducationTargetingChange
                  }
                  onCategoryChange={settings.handleCategoryChange}
                  categoryOptions={settings.categoryOptions}
                  categorySearch={settings.categorySearch}
                  setCategorySearch={settings.setCategorySearch}
                  isLoadingCategories={settings.isLoadingCategories}
                  hasMoreCategories={settings.hasMoreCategories}
                  isLoadingMoreCategories={settings.isLoadingMoreCategories}
                  loadMoreCategories={settings.loadMoreCategories}
                />
                <CourseInstructorCard
                  selectedInstructorId={instructors.selectedInstructorId}
                  onSelectedInstructorChange={
                    instructors.setSelectedInstructorId
                  }
                  instructorOptions={instructors.instructorOptions}
                  instructorSearch={instructors.instructorSearch}
                  onInstructorSearchChange={instructors.setInstructorSearch}
                  isInstructorsLoading={instructors.isInstructorsLoading}
                  hasMoreInstructors={instructors.hasMoreInstructors}
                  isLoadingMoreInstructors={
                    instructors.isLoadingMoreInstructors
                  }
                  loadMoreInstructors={instructors.loadMoreInstructors}
                  instructorActionError={instructors.instructorActionError}
                  assignedInstructors={instructors.assignedInstructors}
                  primaryInstructorId={instructors.primaryInstructorId}
                  isAssigningInstructor={instructors.isAssigningInstructor}
                  isInstructorActionPending={
                    instructors.isInstructorActionPending
                  }
                  onAssign={instructors.handleAssignInstructor}
                  onRemove={instructors.setPendingRemoveInstructor}
                />
              </div>
            </TabsContent>
          </div>
        </div>
      </Tabs>

      <RemoveInstructorDialog
        instructor={instructors.pendingRemoveInstructor}
        open={Boolean(instructors.pendingRemoveInstructor)}
        onOpenChange={(nextOpen) => {
          if (instructors.isInstructorActionPending) return;
          if (!nextOpen) instructors.setPendingRemoveInstructor(null);
        }}
        onConfirm={instructors.handleConfirmRemoveInstructor}
        isPending={instructors.isInstructorActionPending}
        isRemoving={instructors.isRemovingInstructor}
      />
    </div>
  );
}
