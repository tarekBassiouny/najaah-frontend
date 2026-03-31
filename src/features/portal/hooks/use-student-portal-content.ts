"use client";

import { useMemo } from "react";
import { usePortalAuth } from "@/features/portal-auth";
import { useTranslation } from "@/features/localization";
import {
  useStudentCategories,
  useStudentCourseDetail,
  useStudentEnrolledCourses,
  useStudentExploreCourses,
  useStudentProfileDetails,
  useStudentWeeklyActivity,
} from "@/features/portal/hooks/use-student-portal";

export type PortalCourseCardContent = {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  progress: number;
  lessonsLabel: string;
  metaLabel: string;
  href: string;
  imageUrl?: string;
};

export type EnrolledCourseCardContent = {
  id: string;
  title: string;
  level: string;
  progress: number;
  instructorName: string;
  instructorAvatar?: string;
  href: string;
  ringColorClassName?: string;
};

type DashboardStatCardContent = {
  label: string;
  value: string;
  hint: string;
  accentClassName: string;
};

export function useStudentDashboardContent() {
  const { t } = useTranslation();
  const { user } = usePortalAuth();
  const enrolledCoursesQuery = useStudentEnrolledCourses(
    { page: 1, per_page: 6 },
    { retry: 0 },
  );
  const weeklyActivityQuery = useStudentWeeklyActivity(7, user?.center_id, {
    retry: 0,
  });

  const fallbackContinueCourses = [
    {
      id: "python-fundamentals",
      badge: t("pages.portal.dashboard.continueCards.0.badge"),
      title: t("pages.portal.dashboard.continueCards.0.title"),
      subtitle: t("pages.portal.dashboard.continueCards.0.subtitle"),
      progress: 65,
      lessonsLabel: t("pages.portal.dashboard.continueCards.0.lessonsLabel"),
      metaLabel: t("pages.portal.dashboard.continueCards.0.metaLabel"),
      href: "/portal/student/course/python-fundamentals",
      imageUrl:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "ux-mastery",
      badge: t("pages.portal.dashboard.continueCards.1.badge"),
      title: t("pages.portal.dashboard.continueCards.1.title"),
      subtitle: t("pages.portal.dashboard.continueCards.1.subtitle"),
      progress: 20,
      lessonsLabel: t("pages.portal.dashboard.continueCards.1.lessonsLabel"),
      metaLabel: t("pages.portal.dashboard.continueCards.1.metaLabel"),
      href: "/portal/student/course/ux-mastery",
      imageUrl:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "data-analysis",
      badge: t("pages.portal.dashboard.continueCards.2.badge"),
      title: t("pages.portal.dashboard.continueCards.2.title"),
      subtitle: t("pages.portal.dashboard.continueCards.2.subtitle"),
      progress: 90,
      lessonsLabel: t("pages.portal.dashboard.continueCards.2.lessonsLabel"),
      metaLabel: t("pages.portal.dashboard.continueCards.2.metaLabel"),
      href: "/portal/student/course/data-analysis",
      imageUrl:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    },
  ] satisfies PortalCourseCardContent[];

  const fallbackEnrolledCourses = [
    {
      id: "digital-marketing",
      title: t("pages.portal.dashboard.enrolledCards.0.title"),
      level: t("pages.portal.enrolledCourses.level.intermediate"),
      progress: 90,
      instructorName: "Lina Hassan",
      href: "/portal/student/course/digital-marketing",
      ringColorClassName: "stroke-amber-500 text-amber-600",
    },
    {
      id: "ai-machine-learning",
      title: t("pages.portal.dashboard.enrolledCards.1.title"),
      level: t("pages.portal.enrolledCourses.level.advanced"),
      progress: 20,
      instructorName: "Omar Adel",
      href: "/portal/student/course/ai-machine-learning",
      ringColorClassName: "stroke-violet-500 text-violet-600",
    },
    {
      id: "react-web-apps",
      title: t("pages.portal.dashboard.enrolledCards.2.title"),
      level: t("pages.portal.enrolledCourses.level.intermediate"),
      progress: 65,
      instructorName: "Ahmed Kamal",
      href: "/portal/student/course/react-web-apps",
      ringColorClassName: "stroke-teal-500 text-teal-600",
    },
  ] satisfies EnrolledCourseCardContent[];

  const enrolledItems = useMemo(
    () => enrolledCoursesQuery.data?.items ?? [],
    [enrolledCoursesQuery.data?.items],
  );
  const weeklyTotals = weeklyActivityQuery.data?.totals;
  const activeDays =
    weeklyActivityQuery.data?.series.filter((entry) => {
      return (
        entry.watchDurationSeconds > 0 ||
        entry.quizAttemptsCount > 0 ||
        entry.assignmentSubmissionsCount > 0
      );
    }).length ?? 0;
  const averageProgress =
    enrolledItems.length > 0
      ? Math.round(
          enrolledItems.reduce((sum, item) => sum + item.progress, 0) /
            enrolledItems.length,
        )
      : 84;
  const weeklyGoalCount =
    (weeklyTotals?.assignmentSubmissionsCount ?? 0) +
    (weeklyTotals?.quizAttemptsCount ?? 0);

  const fallbackStats = [
    {
      label: t("pages.portal.dashboard.stats.xp"),
      value: "2.4k",
      hint: t("pages.portal.dashboard.statsHints.xp"),
      accentClassName: "border-s-4 border-teal-500",
    },
    {
      label: t("pages.portal.dashboard.stats.streak"),
      value: "12",
      hint: t("pages.portal.dashboard.statsHints.streak"),
      accentClassName: "border-s-4 border-sky-500",
    },
    {
      label: t("pages.portal.dashboard.stats.completion"),
      value: "84%",
      hint: t("pages.portal.dashboard.statsHints.completion"),
      accentClassName: "border-s-4 border-amber-500",
    },
  ] satisfies DashboardStatCardContent[];

  return useMemo(
    () => ({
      userName: user?.name ?? t("pages.portal.topbar.studentRole"),
      continueCourses:
        enrolledItems.length > 0
          ? enrolledItems.slice(0, 3).map((course, index) => ({
              id: String(course.id),
              badge: course.badge,
              title: course.title,
              subtitle: course.subtitle,
              progress: course.progress,
              lessonsLabel: course.lessonsLabel,
              metaLabel: course.metaLabel,
              href: course.href ?? `/portal/student/course/${course.id}`,
              imageUrl:
                fallbackContinueCourses[index % fallbackContinueCourses.length]
                  ?.imageUrl,
            }))
          : fallbackContinueCourses,
      enrolledCourses:
        enrolledItems.length > 0
          ? enrolledItems.slice(0, 3).map((course, index) => ({
              id: String(course.id),
              title: course.title,
              level:
                [
                  t("pages.portal.enrolledCourses.level.beginner"),
                  t("pages.portal.enrolledCourses.level.intermediate"),
                  t("pages.portal.enrolledCourses.level.advanced"),
                ][index % 3] ??
                t("pages.portal.enrolledCourses.level.intermediate"),
              progress: course.progress,
              instructorName:
                ["Ahmed Kamal", "Lina Hassan", "Omar Adel"][index % 3] ??
                "Ahmed Kamal",
              href: course.href ?? `/portal/student/course/${course.id}`,
              ringColorClassName: [
                "stroke-amber-500 text-amber-600",
                "stroke-violet-500 text-violet-600",
                "stroke-teal-500 text-teal-600",
              ][index % 3],
            }))
          : fallbackEnrolledCourses,
      agenda: Array.from({ length: 3 }, (_, index) => ({
        title: t(`pages.portal.dashboard.agenda.${index}.title`),
        subtitle: t(`pages.portal.dashboard.agenda.${index}.subtitle`),
        tone: [
          "bg-amber-50 text-amber-700 ring-amber-100",
          "bg-teal-50 text-teal-700 ring-teal-100",
          "bg-slate-100 text-slate-700 ring-slate-200",
        ][index],
      })),
      stats: [
        {
          label: t("pages.portal.dashboard.stats.xp"),
          value:
            weeklyTotals != null
              ? `${Math.round(weeklyTotals.watchDurationSeconds / 60)}m`
              : fallbackStats[0].value,
          hint: t("pages.portal.dashboard.statsHints.xp"),
          accentClassName: "border-s-4 border-teal-500",
        },
        {
          label: t("pages.portal.dashboard.stats.streak"),
          value: activeDays > 0 ? String(activeDays) : fallbackStats[1].value,
          hint: t("pages.portal.dashboard.statsHints.streak"),
          accentClassName: "border-s-4 border-sky-500",
        },
        {
          label: t("pages.portal.dashboard.stats.completion"),
          value: `${averageProgress}%`,
          hint: t("pages.portal.dashboard.statsHints.completion"),
          accentClassName: "border-s-4 border-amber-500",
        },
        {
          label: t("pages.portal.dashboard.stats.goal"),
          value: weeklyGoalCount > 0 ? String(weeklyGoalCount) : "3/4",
          hint: t("pages.portal.dashboard.statsHints.goal"),
          accentClassName: "border-s-4 border-violet-500",
        },
      ] satisfies DashboardStatCardContent[],
      rhythm: weeklyActivityQuery.data?.series.length
        ? weeklyActivityQuery.data.series.map((entry) => {
            const total =
              entry.watchDurationSeconds +
              entry.quizAttemptsCount * 900 +
              entry.assignmentSubmissionsCount * 1200;
            return Math.max(18, Math.min(100, Math.round(total / 120)));
          })
        : [40, 65, 50, 80, 90, 55, 75],
      isCoursesLoading: enrolledCoursesQuery.isLoading,
      isActivityLoading: weeklyActivityQuery.isLoading,
    }),
    [
      activeDays,
      averageProgress,
      enrolledItems,
      fallbackContinueCourses,
      fallbackEnrolledCourses,
      fallbackStats,
      t,
      user?.name,
      weeklyGoalCount,
      weeklyActivityQuery.data,
      enrolledCoursesQuery.isLoading,
      weeklyActivityQuery.isLoading,
      weeklyTotals,
    ],
  );
}

export function useStudentExploreContent(filters?: {
  search?: string;
  categoryId?: string;
}) {
  const { t } = useTranslation();
  const { user } = usePortalAuth();
  const normalizedSearch = filters?.search?.trim();
  const normalizedCategoryId =
    filters?.categoryId && filters.categoryId !== "all"
      ? filters.categoryId
      : undefined;
  const exploreCoursesQuery = useStudentExploreCourses(
    {
      page: 1,
      per_page: 12,
      ...(normalizedSearch ? { search: normalizedSearch } : {}),
      ...(normalizedCategoryId ? { category_id: normalizedCategoryId } : {}),
    },
    { retry: 0 },
  );
  const categoriesQuery = useStudentCategories(user?.center_id, { retry: 0 });

  const fallbackCourses = useMemo(
    () => [
      {
        id: "python-fundamentals",
        category: "coding",
        level: "beginner",
        duration: "1-3h",
        rating: 4.8,
        badge: t("pages.portal.explore.courses.0.badge"),
        title: t("pages.portal.explore.courses.0.title"),
        subtitle: t("pages.portal.explore.courses.0.subtitle"),
        progress: 12,
        lessonsLabel: t("pages.portal.explore.courses.0.lessonsLabel"),
        metaLabel: "4.8",
        href: "/portal/student/course/python-fundamentals",
      },
      {
        id: "ux-mastery",
        category: "design",
        level: "intermediate",
        duration: "3h-plus",
        rating: 4.7,
        badge: t("pages.portal.explore.courses.1.badge"),
        title: t("pages.portal.explore.courses.1.title"),
        subtitle: t("pages.portal.explore.courses.1.subtitle"),
        progress: 34,
        lessonsLabel: t("pages.portal.explore.courses.1.lessonsLabel"),
        metaLabel: "4.7",
        href: "/portal/student/course/ux-mastery",
      },
      {
        id: "modern-physics",
        category: "science",
        level: "intermediate",
        duration: "1-3h",
        rating: 4.9,
        badge: t("pages.portal.explore.courses.2.badge"),
        title: t("pages.portal.explore.courses.2.title"),
        subtitle: t("pages.portal.explore.courses.2.subtitle"),
        progress: 8,
        lessonsLabel: t("pages.portal.explore.courses.2.lessonsLabel"),
        metaLabel: "4.9",
        href: "/portal/student/course/modern-physics",
      },
      {
        id: "english-grammar",
        category: "languages",
        level: "beginner",
        duration: "under-1h",
        rating: 4.6,
        badge: t("pages.portal.explore.courses.3.badge"),
        title: t("pages.portal.explore.courses.3.title"),
        subtitle: t("pages.portal.explore.courses.3.subtitle"),
        progress: 20,
        lessonsLabel: t("pages.portal.explore.courses.3.lessonsLabel"),
        metaLabel: "4.6",
        href: "/portal/student/course/english-grammar",
      },
    ],
    [t],
  );

  return useMemo(
    () => ({
      categories: [
        ...(categoriesQuery.data?.length
          ? categoriesQuery.data.map((category) => ({
              id: String(category.id),
              label: category.title,
            }))
          : [
              { id: "coding", label: t("pages.portal.explore.categories.0") },
              { id: "design", label: t("pages.portal.explore.categories.1") },
              {
                id: "mathematics",
                label: t("pages.portal.explore.categories.2"),
              },
              {
                id: "languages",
                label: t("pages.portal.explore.categories.3"),
              },
              { id: "science", label: t("pages.portal.explore.categories.4") },
              {
                id: "marketing",
                label: t("pages.portal.explore.categories.5"),
              },
            ]),
      ],
      filterGroups: [
        {
          id: "level" as const,
          title: t("pages.portal.explore.filterGroups.level"),
          values: [
            {
              id: "beginner",
              label: t("pages.portal.explore.filterValues.level.0"),
            },
            {
              id: "intermediate",
              label: t("pages.portal.explore.filterValues.level.1"),
            },
            {
              id: "advanced",
              label: t("pages.portal.explore.filterValues.level.2"),
            },
          ],
        },
        {
          id: "duration" as const,
          title: t("pages.portal.explore.filterGroups.duration"),
          values: [
            {
              id: "under-1h",
              label: t("pages.portal.explore.filterValues.duration.0"),
            },
            {
              id: "1-3h",
              label: t("pages.portal.explore.filterValues.duration.1"),
            },
            {
              id: "3h-plus",
              label: t("pages.portal.explore.filterValues.duration.2"),
            },
          ],
        },
        {
          id: "rating" as const,
          title: t("pages.portal.explore.filterGroups.rating"),
          values: [
            {
              id: "4.5",
              label: t("pages.portal.explore.filterValues.rating.0"),
            },
            {
              id: "4.0",
              label: t("pages.portal.explore.filterValues.rating.1"),
            },
          ],
        },
      ],
      courses: exploreCoursesQuery.data?.items?.length
        ? exploreCoursesQuery.data.items.map((course) => ({
            id: String(course.id),
            category:
              course.categoryId != null ? String(course.categoryId) : "coding",
            level: "beginner",
            duration: "1-3h",
            rating: 4.5,
            badge: course.badge,
            title: course.title,
            subtitle: course.subtitle,
            progress: course.progress,
            lessonsLabel: course.lessonsLabel,
            metaLabel: course.metaLabel,
            href: course.href ?? `/portal/student/course/${course.id}`,
          }))
        : fallbackCourses,
      isLoading: exploreCoursesQuery.isLoading || categoriesQuery.isLoading,
      hasRemoteCourses: Boolean(exploreCoursesQuery.data?.items.length),
    }),
    [
      categoriesQuery.data,
      categoriesQuery.isLoading,
      exploreCoursesQuery.data,
      exploreCoursesQuery.isLoading,
      fallbackCourses,
      t,
    ],
  );
}

export function useStudentCourseContent(courseId?: string | number) {
  const { t } = useTranslation();
  const { user } = usePortalAuth();
  const courseDetailQuery = useStudentCourseDetail(courseId, user?.center_id, {
    retry: 0,
  });

  const fallbackLessons = useMemo(
    () =>
      Array.from({ length: 4 }, (_, index) =>
        t(`pages.portal.course.lessons.${index}`),
      ),
    [t],
  );

  const fallbackResources = useMemo(
    () =>
      Array.from({ length: 3 }, (_, index) =>
        t(`pages.portal.course.resources.${index}`),
      ),
    [t],
  );

  return useMemo(
    () => ({
      title: courseDetailQuery.data?.title ?? t("pages.portal.course.title"),
      description:
        courseDetailQuery.data?.description ||
        t("pages.portal.course.description"),
      progress: courseDetailQuery.data?.progress ?? 65,
      lessonsCountLabel: courseDetailQuery.data?.lessonsCountLabel ?? "12 / 18",
      durationLabel:
        courseDetailQuery.data?.durationLabel ??
        t("pages.portal.course.stats.durationValue"),
      instructorName:
        courseDetailQuery.data?.instructorName ??
        t("pages.portal.course.instructorName"),
      instructorRole:
        courseDetailQuery.data?.instructorRole ??
        t("pages.portal.course.instructorRole"),
      lessons: courseDetailQuery.data?.lessons.length
        ? courseDetailQuery.data.lessons
        : fallbackLessons,
      resources: courseDetailQuery.data?.resources.length
        ? courseDetailQuery.data.resources
        : fallbackResources,
      isLoading: courseDetailQuery.isLoading,
    }),
    [
      courseDetailQuery.data,
      courseDetailQuery.isLoading,
      fallbackLessons,
      fallbackResources,
      t,
    ],
  );
}

export function useStudentAssignmentsContent() {
  const { t } = useTranslation();

  return useMemo(
    () =>
      Array.from({ length: 3 }, (_, index) => ({
        title: t(`pages.portal.assignments.cards.${index}.title`),
        subtitle: t(`pages.portal.assignments.cards.${index}.subtitle`),
        due: t(`pages.portal.assignments.cards.${index}.due`),
        status: t(`pages.portal.assignments.cards.${index}.status`),
      })),
    [t],
  );
}

export function useStudentExamsContent() {
  const { t } = useTranslation();

  return useMemo(
    () =>
      Array.from({ length: 3 }, (_, index) => ({
        title: t(`pages.portal.exams.cards.${index}.title`),
        subtitle: t(`pages.portal.exams.cards.${index}.subtitle`),
        status: t(`pages.portal.exams.cards.${index}.status`),
        score: t(`pages.portal.exams.cards.${index}.score`),
      })),
    [t],
  );
}

export function useStudentNotificationsContent() {
  const { t } = useTranslation();

  return useMemo(
    () =>
      Array.from({ length: 4 }, (_, index) => ({
        title: t(`pages.portal.notifications.items.${index}.title`),
        body: t(`pages.portal.notifications.items.${index}.body`),
        time: t(`pages.portal.notifications.items.${index}.time`),
      })),
    [t],
  );
}

export function useStudentProfileContent() {
  const { t } = useTranslation();
  const { user } = usePortalAuth();
  const profileDetailsQuery = useStudentProfileDetails({ retry: 0 });
  const enrolledCoursesQuery = useStudentEnrolledCourses(
    { page: 1, per_page: 12 },
    { retry: 0 },
  );
  const weeklyActivityQuery = useStudentWeeklyActivity(7, user?.center_id, {
    retry: 0,
  });

  const enrolledItems = useMemo(
    () => enrolledCoursesQuery.data?.items ?? [],
    [enrolledCoursesQuery.data?.items],
  );
  const averageProgress =
    enrolledItems.length > 0
      ? Math.round(
          enrolledItems.reduce((sum, item) => sum + item.progress, 0) /
            enrolledItems.length,
        )
      : 84;
  const completedCoursesCount = enrolledItems.filter(
    (item) => item.progress >= 100,
  ).length;
  const activeCoursesCount =
    enrolledCoursesQuery.data?.meta.total ?? enrolledItems.length;
  const weeklyTotals = weeklyActivityQuery.data?.totals;
  const missingStepsCount =
    profileDetailsQuery.data?.missingSteps.length ??
    profileDetailsQuery.data?.missingFields.length ??
    0;

  return useMemo(
    () => ({
      userName: user?.name ?? t("pages.portal.topbar.studentRole"),
      phone: user?.phone ?? t("pages.portal.profile.noPhone"),
      insights:
        profileDetailsQuery.data != null
          ? [
              profileDetailsQuery.data.isCompleteProfile
                ? t("pages.portal.profile.insights.0")
                : t("pages.portal.profile.insights.3", {
                    count: missingStepsCount,
                  }),
              weeklyTotals != null
                ? t("pages.portal.profile.insights.4", {
                    count:
                      weeklyTotals.quizAttemptsCount +
                      weeklyTotals.assignmentSubmissionsCount,
                  })
                : t("pages.portal.profile.insights.1"),
              activeCoursesCount > 0
                ? t("pages.portal.profile.insights.5", {
                    count: activeCoursesCount,
                  })
                : t("pages.portal.profile.insights.2"),
            ]
          : Array.from({ length: 3 }, (_, index) =>
              t(`pages.portal.profile.insights.${index}`),
            ),
      stats: [
        {
          label: t("pages.portal.profile.cards.learningPulse"),
          value: `${averageProgress}%`,
        },
        {
          label: t("pages.portal.profile.cards.activeCourses"),
          value: String(activeCoursesCount || 4),
        },
        {
          label: t("pages.portal.profile.cards.completedCourses"),
          value: String(
            completedCoursesCount ||
              (profileDetailsQuery.data?.isCompleteProfile ? 9 : 8),
          ),
        },
      ],
      summaryCards: [
        {
          value: profileDetailsQuery.data?.isCompleteProfile
            ? t("pages.portal.profile.summary.complete")
            : t("pages.portal.profile.summary.incomplete"),
          label: t("pages.portal.profile.insights.0"),
        },
        {
          value:
            weeklyTotals != null ? String(weeklyTotals.quizAttemptsCount) : "0",
          label: t("pages.portal.profile.summary.weeklyChecks"),
        },
        {
          value:
            missingStepsCount > 0
              ? String(missingStepsCount)
              : t("pages.portal.profile.summary.ready"),
          label: t("pages.portal.profile.summary.missingSteps"),
        },
      ],
      isLoading:
        profileDetailsQuery.isLoading ||
        enrolledCoursesQuery.isLoading ||
        weeklyActivityQuery.isLoading,
    }),
    [
      activeCoursesCount,
      averageProgress,
      completedCoursesCount,
      enrolledCoursesQuery.isLoading,
      missingStepsCount,
      profileDetailsQuery.data,
      profileDetailsQuery.isLoading,
      t,
      user?.name,
      user?.phone,
      weeklyActivityQuery.isLoading,
      weeklyTotals,
    ],
  );
}
