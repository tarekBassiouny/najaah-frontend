"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getInstructorLabel } from "@/features/courses/utils/course-helpers";
import { useTranslation } from "@/features/localization";
import type { InstructorSummary } from "@/features/courses/types/course";

type CourseInstructorCardProps = {
  selectedInstructorId: string | null;
  onSelectedInstructorChange: (_value: string | null) => void;
  instructorOptions: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  instructorSearch: string;
  onInstructorSearchChange: (_value: string) => void;
  isInstructorsLoading: boolean;
  hasMoreInstructors: boolean;
  isLoadingMoreInstructors: boolean;
  loadMoreInstructors: () => void;
  instructorActionError: string | null;
  assignedInstructors: InstructorSummary[];
  primaryInstructorId: string | null;
  isAssigningInstructor: boolean;
  isInstructorActionPending: boolean;
  onAssign: () => void;
  onRemove: (_instructor: InstructorSummary) => void;
};

export function CourseInstructorCard({
  selectedInstructorId,
  onSelectedInstructorChange,
  instructorOptions,
  instructorSearch,
  onInstructorSearchChange,
  isInstructorsLoading,
  hasMoreInstructors,
  isLoadingMoreInstructors,
  loadMoreInstructors,
  instructorActionError,
  assignedInstructors,
  primaryInstructorId,
  isAssigningInstructor,
  isInstructorActionPending,
  onAssign,
  onRemove,
}: CourseInstructorCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="space-y-4 py-5">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {t("pages.centerCourseDetail.instructors.title")}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("pages.centerCourseDetail.instructors.description")}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="assign-instructor">
              {t("pages.centerCourseDetail.instructors.assignInstructor")}
            </Label>
            <SearchableSelect
              value={selectedInstructorId}
              onValueChange={onSelectedInstructorChange}
              options={instructorOptions}
              placeholder={t(
                "pages.centerCourseDetail.instructors.selectInstructor",
              )}
              searchPlaceholder={t(
                "pages.centerCourseDetail.instructors.searchInstructors",
              )}
              searchValue={instructorSearch}
              onSearchValueChange={onInstructorSearchChange}
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
            onClick={onAssign}
            disabled={
              isInstructorActionPending ||
              !selectedInstructorId ||
              isInstructorsLoading
            }
          >
            {isAssigningInstructor
              ? t("pages.centerCourseDetail.actions.assigning")
              : t("pages.centerCourseDetail.actions.assign")}
          </Button>
        </div>

        {instructorActionError ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            {instructorActionError}
          </p>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{t("pages.centerCourseDetail.instructors.assigned")}</Label>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t("pages.centerCourseDetail.instructors.total", {
                count: assignedInstructors.length,
              })}
            </span>
          </div>

          {assignedInstructors.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 px-3 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              {t("pages.centerCourseDetail.instructors.empty")}
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
                          {getInstructorLabel(instructor, t)}
                        </p>
                        {isPrimary ? (
                          <Badge variant="info">
                            {t("pages.centerCourseDetail.instructors.primary")}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("pages.centerCourseDetail.instructors.id")}:{" "}
                        {instructor.id}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-600"
                      onClick={() => onRemove(instructor)}
                      disabled={isInstructorActionPending}
                    >
                      {t("pages.centerCourseDetail.actions.remove")}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
