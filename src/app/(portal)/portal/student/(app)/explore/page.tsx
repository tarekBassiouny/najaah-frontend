"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PortalCourseCard } from "@/features/portal/components/shared/PortalCourseCard";
import { PortalSectionHeader } from "@/features/portal/components/shared/PortalSectionHeader";
import { useStudentExploreContent } from "@/features/portal/hooks/use-student-portal-content";
import { useTranslation } from "@/features/localization";
import { cn } from "@/lib/utils";

const accentPalette = [
  "from-teal-700 via-teal-600 to-emerald-500",
  "from-[#0f3b46] via-[#12586a] to-[#2aa39c]",
  "from-[#d78b26] via-[#eba53a] to-[#f7c66c]",
  "from-[#124559] via-[#1d6f7f] to-[#69b9c0]",
];

type FilterGroup = "level" | "duration" | "rating";

export default function StudentExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useTranslation();
  const isRtl = locale === "ar";
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<string | null>(null);
  const { categories, filterGroups, courses, isLoading, hasRemoteCourses } =
    useStudentExploreContent({
      search: query,
      categoryId: selectedCategory,
    });

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        course.title.toLowerCase().includes(normalizedQuery) ||
        course.subtitle.toLowerCase().includes(normalizedQuery);
      const matchesCategory =
        selectedCategory === "all" || course.category === selectedCategory;
      const matchesLevel =
        selectedLevel == null || course.level === selectedLevel;
      const matchesDuration =
        selectedDuration == null || course.duration === selectedDuration;
      const matchesRating =
        selectedRating == null || course.rating >= Number(selectedRating);

      return (
        matchesQuery &&
        matchesCategory &&
        matchesLevel &&
        matchesDuration &&
        matchesRating
      );
    });
  }, [
    courses,
    query,
    selectedCategory,
    selectedDuration,
    selectedLevel,
    selectedRating,
  ]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = query.trim();
    router.replace(
      nextQuery.length > 0
        ? `/portal/student/explore?q=${encodeURIComponent(nextQuery)}`
        : "/portal/student/explore",
    );
  };

  const handleFilterChange = (group: FilterGroup, value: string) => {
    if (group === "level") {
      setSelectedLevel(value);
      return;
    }

    if (group === "duration") {
      setSelectedDuration(value);
      return;
    }

    setSelectedRating(value);
  };

  const getSelectedValue = (group: FilterGroup) => {
    if (group === "level") return selectedLevel;
    if (group === "duration") return selectedDuration;
    return selectedRating;
  };

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedLevel(null);
    setSelectedDuration(null);
    setSelectedRating(null);
    setQuery("");
    router.replace("/portal/student/explore");
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[1.9rem] border border-[#e0efea] bg-[linear-gradient(180deg,#f4fbf8_0%,#ffffff_100%)] p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)] md:p-7">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              {t("pages.portal.explore.eyebrow")}
            </p>
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-slate-900">
              {t("pages.portal.explore.title")}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-500">
              {t("pages.portal.explore.description")}
            </p>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col gap-4 rounded-[1.6rem] border border-[#e4efeb] bg-white p-4 shadow-[0_10px_24px_rgba(148,163,184,0.08)] md:flex-row md:items-center"
          >
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("pages.portal.explore.searchPlaceholder")}
              className={cn(
                "h-12 rounded-full border-[#d6ece8] bg-[#f8fcfb] px-5 shadow-none placeholder:text-slate-400 focus-visible:ring-teal-700",
                isRtl ? "text-right" : "text-left",
              )}
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="submit"
                className="h-12 rounded-full bg-teal-700 px-5 font-semibold hover:bg-teal-800"
              >
                {t("pages.portal.explore.searchCta")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-full border-[#d6ece8] px-5 text-slate-600 hover:bg-teal-50 hover:text-teal-700"
                onClick={resetFilters}
              >
                {t("pages.portal.explore.resetFiltersCta")}
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium",
                selectedCategory === "all"
                  ? "bg-teal-700 text-white"
                  : "bg-white text-slate-600 ring-1 ring-[#d6ece8]",
              )}
            >
              {t("pages.portal.explore.allCategories")}
            </button>
            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium",
                  selectedCategory === category.id
                    ? "bg-teal-700 text-white"
                    : "bg-white text-slate-600 ring-1 ring-[#d6ece8]",
                )}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-5 rounded-[1.75rem] border border-[#e0efea] bg-white p-5 shadow-[0_12px_28px_rgba(148,163,184,0.08)]">
          <PortalSectionHeader
            eyebrow={t("pages.portal.explore.filtersEyebrow")}
            title={t("pages.portal.explore.filtersTitle")}
            description={t("pages.portal.explore.filtersDescription")}
          />

          <div className="space-y-5">
            {filterGroups.map((group) => (
              <div key={group.id} className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  {group.title}
                </h2>
                <div className="space-y-2">
                  {group.values.map((value) => (
                    <label
                      key={value.id}
                      className="flex items-center gap-3 rounded-2xl border border-[#edf3f1] px-3 py-3 text-sm text-slate-600"
                    >
                      <input
                        type="radio"
                        name={group.id}
                        checked={getSelectedValue(group.id) === value.id}
                        onChange={() => handleFilterChange(group.id, value.id)}
                        className="h-4 w-4 text-teal-700"
                      />
                      <span>{value.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="space-y-5">
          <PortalSectionHeader
            eyebrow={t("pages.portal.explore.resultsEyebrow")}
            title={t("pages.portal.explore.resultsTitle")}
            description={t("pages.portal.explore.resultsDescription")}
            action={
              <div className="rounded-full bg-[#f7fbfa] px-4 py-2 text-sm text-slate-500 ring-1 ring-[#dcebe7]">
                {isLoading && !hasRemoteCourses
                  ? t("pages.portal.common.loading")
                  : t("pages.portal.explore.resultsCount", {
                      count: filteredCourses.length,
                    })}
              </div>
            }
          />

          {isLoading && !hasRemoteCourses ? (
            <div className="rounded-[1.75rem] border border-[#dcebe7] bg-white p-8 text-center shadow-[0_12px_28px_rgba(148,163,184,0.08)]">
              <p className="text-lg font-semibold text-slate-900">
                {t("pages.portal.common.loading")}
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-500">
                {t("pages.portal.explore.resultsDescription")}
              </p>
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {filteredCourses.map((course, index) => (
                <PortalCourseCard
                  key={course.id}
                  accentClassName={accentPalette[index % accentPalette.length]}
                  {...course}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-[#d6ece8] bg-[#f8fcfb] p-8 text-center">
              <p className="text-lg font-semibold text-slate-900">
                {t("pages.portal.explore.emptyTitle")}
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-500">
                {t("pages.portal.explore.emptyDescription")}
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-5 rounded-full border-[#d6ece8] px-5 text-slate-600 hover:bg-teal-50 hover:text-teal-700"
                onClick={resetFilters}
              >
                {t("pages.portal.explore.resetFiltersCta")}
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
