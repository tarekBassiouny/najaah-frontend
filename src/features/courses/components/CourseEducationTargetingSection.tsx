"use client";

import { Label } from "@/components/ui/label";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { useCollegeOptions } from "@/features/education/hooks/use-college-options";
import { useGradeOptions } from "@/features/education/hooks/use-grade-options";
import { useSchoolOptions } from "@/features/education/hooks/use-school-options";
import { useTranslation } from "@/features/localization";
import { cn } from "@/lib/utils";
import type { CourseEducationTargetingValues } from "@/features/courses/utils/education-targeting";
import { normalizeIdList } from "@/features/courses/utils/education-targeting";

type CourseEducationTargetingSectionProps = {
  centerId: string | number;
  values: CourseEducationTargetingValues;
  onChange: (_nextValues: CourseEducationTargetingValues) => void;
  disabled?: boolean;
  error?: string | null;
  className?: string;
};

export function CourseEducationTargetingSection({
  centerId,
  values,
  onChange,
  disabled = false,
  error = null,
  className,
}: CourseEducationTargetingSectionProps) {
  const { t } = useTranslation();
  const isTargeted = !values.showForAllStudents;

  const {
    options: gradeOptions,
    search: gradeSearch,
    setSearch: setGradeSearch,
    isLoading: isGradesLoading,
  } = useGradeOptions({
    centerId,
    selectedValues: values.gradeIds,
    isActive: true,
    enabled: true,
  });
  const {
    options: schoolOptions,
    search: schoolSearch,
    setSearch: setSchoolSearch,
    isLoading: isSchoolsLoading,
  } = useSchoolOptions({
    centerId,
    selectedValues: values.schoolIds,
    isActive: true,
    enabled: true,
  });
  const {
    options: collegeOptions,
    search: collegeSearch,
    setSearch: setCollegeSearch,
    isLoading: isCollegesLoading,
  } = useCollegeOptions({
    centerId,
    selectedValues: values.collegeIds,
    isActive: true,
    enabled: true,
  });

  const updateValues = (patch: Partial<CourseEducationTargetingValues>) => {
    onChange({
      ...values,
      ...patch,
    });
  };

  const handleAudienceChange = (showForAllStudents: boolean) => {
    updateValues({ showForAllStudents });
  };

  return (
    <div
      className={cn(
        "space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700",
        className,
      )}
    >
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {t("pages.courseAudience.title")}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("pages.courseAudience.description")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label
          className={cn(
            "flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 p-3 text-sm transition-colors dark:border-gray-700",
            values.showForAllStudents
              ? "border-primary/50 bg-primary/5"
              : "hover:border-gray-300 hover:bg-gray-50 dark:hover:border-gray-600 dark:hover:bg-gray-800/60",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <input
            type="radio"
            name="course-audience"
            checked={values.showForAllStudents}
            onChange={() => handleAudienceChange(true)}
            disabled={disabled}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            <span className="block font-medium text-gray-900 dark:text-white">
              {t("pages.courseAudience.allStudents.title")}
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              {t("pages.courseAudience.allStudents.description")}
            </span>
          </span>
        </label>

        <label
          className={cn(
            "flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 p-3 text-sm transition-colors dark:border-gray-700",
            isTargeted
              ? "border-primary/50 bg-primary/5"
              : "hover:border-gray-300 hover:bg-gray-50 dark:hover:border-gray-600 dark:hover:bg-gray-800/60",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <input
            type="radio"
            name="course-audience"
            checked={isTargeted}
            onChange={() => handleAudienceChange(false)}
            disabled={disabled}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            <span className="block font-medium text-gray-900 dark:text-white">
              {t("pages.courseAudience.targeted.title")}
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              {t("pages.courseAudience.targeted.description")}
            </span>
          </span>
        </label>
      </div>

      <div
        className={cn("grid gap-4 md:grid-cols-3", !isTargeted && "opacity-60")}
      >
        <div className="space-y-2">
          <Label>{t("pages.courseAudience.fields.grades")}</Label>
          <SearchableMultiSelect
            values={values.gradeIds}
            onValuesChange={(nextValues) =>
              updateValues({ gradeIds: normalizeIdList(nextValues) })
            }
            options={gradeOptions}
            placeholder={t("pages.courseAudience.placeholders.selectGrades")}
            searchPlaceholder={t(
              "pages.courseAudience.placeholders.searchGrades",
            )}
            searchValue={gradeSearch}
            onSearchValueChange={setGradeSearch}
            filterOptions={false}
            isLoading={isGradesLoading}
            disabled={disabled || !isTargeted}
            emptyMessage={t("pages.courseAudience.empty.noGrades")}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("pages.courseAudience.fields.schools")}</Label>
          <SearchableMultiSelect
            values={values.schoolIds}
            onValuesChange={(nextValues) =>
              updateValues({ schoolIds: normalizeIdList(nextValues) })
            }
            options={schoolOptions}
            placeholder={t("pages.courseAudience.placeholders.selectSchools")}
            searchPlaceholder={t(
              "pages.courseAudience.placeholders.searchSchools",
            )}
            searchValue={schoolSearch}
            onSearchValueChange={setSchoolSearch}
            filterOptions={false}
            isLoading={isSchoolsLoading}
            disabled={disabled || !isTargeted}
            emptyMessage={t("pages.courseAudience.empty.noSchools")}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("pages.courseAudience.fields.colleges")}</Label>
          <SearchableMultiSelect
            values={values.collegeIds}
            onValuesChange={(nextValues) =>
              updateValues({ collegeIds: normalizeIdList(nextValues) })
            }
            options={collegeOptions}
            placeholder={t("pages.courseAudience.placeholders.selectColleges")}
            searchPlaceholder={t(
              "pages.courseAudience.placeholders.searchColleges",
            )}
            searchValue={collegeSearch}
            onSearchValueChange={setCollegeSearch}
            filterOptions={false}
            isLoading={isCollegesLoading}
            disabled={disabled || !isTargeted}
            emptyMessage={t("pages.courseAudience.empty.noColleges")}
          />
        </div>
      </div>

      {isTargeted ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("pages.courseAudience.targeted.hint")}
        </p>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
