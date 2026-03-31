"use client";

import Link from "next/link";
import { useTranslation } from "@/features/localization";
import { EnrolledCourseCard } from "@/features/portal/components/shared/EnrolledCourseCard";
import { PortalSectionHeader } from "@/features/portal/components/shared/PortalSectionHeader";
import { PortalCourseCard } from "@/features/portal/components/shared/PortalCourseCard";
import { useStudentDashboardContent } from "@/features/portal/hooks/use-student-portal-content";

const dashboardPalette = [
  "from-teal-700 via-teal-600 to-emerald-500",
  "from-[#0f3b46] via-[#12586a] to-[#2aa39c]",
  "from-[#d78b26] via-[#eba53a] to-[#f7c66c]",
];

export default function StudentDashboardPage() {
  const { t } = useTranslation();
  const {
    userName,
    continueCourses,
    enrolledCourses,
    agenda,
    stats,
    rhythm,
    isCoursesLoading,
    isActivityLoading,
  } = useStudentDashboardContent();
  const currentDate = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-8">
      <section className="space-y-6">
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              {t("pages.portal.dashboard.eyebrow")}
            </p>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              {t("pages.portal.dashboard.title", {
                name: userName,
              })}
            </h2>
            <p className="text-sm leading-7 text-slate-500">{currentDate}</p>
          </div>

          <p className="max-w-2xl text-sm leading-7 text-slate-500">
            {t("pages.portal.dashboard.subtitle")}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {stats.slice(0, 3).map((stat) => (
            <div
              key={stat.label}
              className={`rounded-[1.6rem] border border-[#e1efeb] bg-white p-5 shadow-[0_12px_28px_rgba(148,163,184,0.08)] ${stat.accentClassName}`}
            >
              <p className="text-3xl font-semibold text-slate-900">
                {stat.value}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {stat.label}
              </p>
              <p className="mt-1 text-xs text-slate-400">{stat.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <PortalSectionHeader
          eyebrow={t("pages.portal.dashboard.sections.continueEyebrow")}
          title={t("pages.portal.dashboard.sections.continueTitle")}
          description={t("pages.portal.dashboard.sections.continueDescription")}
          action={
            isCoursesLoading ? (
              <div className="rounded-full bg-[#f7fbfa] px-4 py-2 text-sm text-slate-500 ring-1 ring-[#dcebe7]">
                {t("pages.portal.common.loading")}
              </div>
            ) : (
              <Link
                href="/portal/student/my-courses"
                className="text-sm font-semibold text-teal-700 transition-colors hover:text-teal-800"
              >
                {t("pages.portal.common.viewAll")}
              </Link>
            )
          }
        />

        <div className="grid gap-5 xl:grid-cols-3">
          {continueCourses.map((course, index) => (
            <PortalCourseCard
              key={course.title}
              accentClassName={
                dashboardPalette[index % dashboardPalette.length]
              }
              {...course}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-5">
          <PortalSectionHeader
            eyebrow={t("pages.portal.dashboard.sections.enrolledEyebrow")}
            title={t("pages.portal.dashboard.sections.enrolledTitle")}
            description={t(
              "pages.portal.dashboard.sections.enrolledDescription",
            )}
          />

          <div className="flex flex-wrap gap-3">
            {[
              t("pages.portal.myCourses.tabs.inProgress"),
              t("pages.portal.myCourses.tabs.completed"),
            ].map((tab, index) => (
              <span
                key={tab}
                className={
                  index === 0
                    ? "rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white"
                    : "rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-500 ring-1 ring-[#dcebe7]"
                }
              >
                {tab}
              </span>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {enrolledCourses.map((course) => (
              <EnrolledCourseCard key={course.id} {...course} />
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <PortalSectionHeader
            eyebrow={t("pages.portal.dashboard.sections.agendaEyebrow")}
            title={t("pages.portal.dashboard.sections.agendaTitle")}
            description={t("pages.portal.dashboard.sections.agendaDescription")}
          />

          <div className="rounded-[1.75rem] border border-[#dcebe7] bg-white p-5 shadow-[0_14px_35px_rgba(148,163,184,0.08)]">
            <div className="space-y-4">
              {agenda.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-[1.25rem] border border-[#edf3f1] p-4"
                >
                  <div
                    className={`mt-1 h-3 w-3 rounded-full ring-4 ${item.tone}`}
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </p>
                    <p className="text-sm text-slate-500">{item.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[1.5rem] bg-[#f7fbfa] p-4">
              <p className="text-sm font-semibold text-slate-900">
                {t("pages.portal.dashboard.studyRhythmTitle")}
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                {isActivityLoading
                  ? t("pages.portal.common.loading")
                  : t("pages.portal.dashboard.studyRhythmDescription")}
              </p>
              <div className="mt-4 grid grid-cols-7 gap-2">
                {rhythm.map((value, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex h-24 items-end rounded-full bg-slate-100 px-1 py-1">
                      <div
                        className="w-full rounded-full bg-teal-600"
                        style={{ height: `${value}%` }}
                      />
                    </div>
                    <p className="text-center text-xs text-slate-400">
                      {t(`pages.portal.dashboard.rhythmDays.${index}`)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
