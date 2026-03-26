"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { CourseEducationTargetingSection } from "@/features/courses/components/CourseEducationTargetingSection";
import { useTranslation } from "@/features/localization";
import type { CourseEducationTargetingValues } from "@/features/courses/utils/education-targeting";

type CategoryOptionProps = {
  categoryOptions: Array<{ value: string; label: string; disabled?: boolean }>;
  categorySearch: string;
  setCategorySearch: (_value: string) => void;
  isLoadingCategories: boolean;
  hasMoreCategories: boolean;
  isLoadingMoreCategories: boolean;
  loadMoreCategories: () => void;
};

type CourseSettingsFormProps = {
  centerId: string;
  settingsForm: {
    title: string;
    titleAr: string;
    slug: string;
    description: string;
    descriptionAr: string;
    category_id: string;
  };
  educationTargeting: CourseEducationTargetingValues;
  educationTargetingError: string | null;
  isSavingSettings: boolean;
  isSettingsError: boolean;
  settingsError: Error | null;
  onSubmit: (_event: React.FormEvent<HTMLFormElement>) => void;
  onChange: (
    _field: "title" | "titleAr" | "slug" | "description" | "descriptionAr",
  ) => (
    _event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onReset: () => void;
  onEducationTargetingChange: (_values: CourseEducationTargetingValues) => void;
  onCategoryChange: (_value: string | null) => void;
} & CategoryOptionProps;

export function CourseSettingsForm({
  centerId,
  settingsForm,
  educationTargeting,
  educationTargetingError,
  isSavingSettings,
  isSettingsError,
  settingsError,
  onSubmit,
  onChange,
  onReset,
  onEducationTargetingChange,
  onCategoryChange,
  categoryOptions,
  categorySearch,
  setCategorySearch,
  isLoadingCategories,
  hasMoreCategories,
  isLoadingMoreCategories,
  loadMoreCategories,
}: CourseSettingsFormProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardContent className="space-y-4 py-5">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {t("pages.centerCourseDetail.settings.title")}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("pages.centerCourseDetail.settings.description")}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="settings-title">
                  {t("pages.centerCourseDetail.settings.fields.titleEn")}
                </Label>
                <Input
                  id="settings-title"
                  value={settingsForm.title}
                  onChange={onChange("title")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-title-ar">
                  {t("pages.centerCourseDetail.settings.fields.titleAr")}
                </Label>
                <Input
                  id="settings-title-ar"
                  value={settingsForm.titleAr}
                  onChange={onChange("titleAr")}
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="settings-slug">
                  {t("pages.centerCourseDetail.settings.fields.slug")}
                </Label>
                <Input
                  id="settings-slug"
                  value={settingsForm.slug}
                  onChange={onChange("slug")}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="settings-category">
                  {t("pages.centerCourseDetail.settings.fields.category")}
                </Label>
                <SearchableSelect
                  value={settingsForm.category_id}
                  onValueChange={onCategoryChange}
                  options={categoryOptions}
                  placeholder={t(
                    "pages.centerCourseDetail.settings.fields.selectCategory",
                  )}
                  searchPlaceholder={t(
                    "pages.centerCourseDetail.settings.fields.searchCategories",
                  )}
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

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="settings-description">
                  {t("pages.centerCourseDetail.settings.fields.descriptionEn")}
                </Label>
                <textarea
                  id="settings-description"
                  value={settingsForm.description}
                  onChange={onChange("description")}
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-description-ar">
                  {t("pages.centerCourseDetail.settings.fields.descriptionAr")}
                </Label>
                <textarea
                  id="settings-description-ar"
                  value={settingsForm.descriptionAr}
                  onChange={onChange("descriptionAr")}
                  rows={4}
                  dir="rtl"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <CourseEducationTargetingSection
              centerId={centerId}
              values={educationTargeting}
              onChange={onEducationTargetingChange}
              disabled={isSavingSettings}
              error={educationTargetingError}
            />

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="submit"
                disabled={isSavingSettings || !settingsForm.title}
              >
                {isSavingSettings
                  ? t("pages.centerCourseDetail.actions.saving")
                  : t("pages.centerCourseDetail.actions.saveChanges")}
              </Button>
              <Button type="button" variant="ghost" onClick={onReset}>
                {t("pages.centerCourseDetail.actions.reset")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {isSettingsError ? (
          <Card className="border-red-200 dark:border-red-900">
            <CardContent className="py-4">
              <p className="text-sm text-red-600 dark:text-red-400">
                {(settingsError as Error)?.message ||
                  t("pages.centerCourseDetail.errors.updateCourseFailed")}
              </p>
            </CardContent>
          </Card>
        ) : null}
      </form>
    </div>
  );
}
