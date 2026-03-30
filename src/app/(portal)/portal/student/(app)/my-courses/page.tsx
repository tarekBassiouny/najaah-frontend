"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/localization";
import { PortalCourseCard } from "@/features/portal/components/shared/PortalCourseCard";
import { PortalSectionHeader } from "@/features/portal/components/shared/PortalSectionHeader";

const palette = [
  "from-teal-700 via-teal-600 to-emerald-500",
  "from-[#0f3b46] via-[#12586a] to-[#2aa39c]",
  "from-[#d78b26] via-[#eba53a] to-[#f7c66c]",
];

export default function StudentMyCoursesPage() {
  const { t } = useTranslation();

  const courses = [
    {
      badge: t("pages.portal.myCourses.cards.0.badge"),
      title: t("pages.portal.myCourses.cards.0.title"),
      subtitle: t("pages.portal.myCourses.cards.0.subtitle"),
      progress: 65,
      lessonsLabel: t("pages.portal.myCourses.cards.0.lessonsLabel"),
      metaLabel: t("pages.portal.myCourses.cards.0.metaLabel"),
      href: "/portal/student/course/react-web-apps",
    },
    {
      badge: t("pages.portal.myCourses.cards.1.badge"),
      title: t("pages.portal.myCourses.cards.1.title"),
      subtitle: t("pages.portal.myCourses.cards.1.subtitle"),
      progress: 100,
      lessonsLabel: t("pages.portal.myCourses.cards.1.lessonsLabel"),
      metaLabel: t("pages.portal.myCourses.cards.1.metaLabel"),
      href: "/portal/student/course/digital-marketing",
    },
    {
      badge: t("pages.portal.myCourses.cards.2.badge"),
      title: t("pages.portal.myCourses.cards.2.title"),
      subtitle: t("pages.portal.myCourses.cards.2.subtitle"),
      progress: 20,
      lessonsLabel: t("pages.portal.myCourses.cards.2.lessonsLabel"),
      metaLabel: t("pages.portal.myCourses.cards.2.metaLabel"),
      href: "/portal/student/course/ai-machine-learning",
    },
  ];

  return (
    <div className="space-y-6">
      <PortalSectionHeader
        eyebrow={t("pages.portal.myCourses.eyebrow")}
        title={t("pages.portal.myCourses.title")}
        description={t("pages.portal.myCourses.description")}
      />

      <div className="flex flex-wrap gap-3">
        {[
          t("pages.portal.myCourses.tabs.inProgress"),
          t("pages.portal.myCourses.tabs.completed"),
          t("pages.portal.myCourses.tabs.saved"),
        ].map((tab, index) => (
          <Button
            key={tab}
            variant={index === 0 ? "default" : "secondary"}
            className={
              index === 0
                ? "h-11 rounded-full bg-teal-700 px-5 hover:bg-teal-800"
                : "h-11 rounded-full bg-teal-50 px-5 text-teal-700 hover:bg-teal-100"
            }
          >
            {tab}
          </Button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {courses.map((course, index) => (
          <PortalCourseCard
            key={course.title}
            accentClassName={palette[index % palette.length]}
            {...course}
          />
        ))}
      </div>
    </div>
  );
}
