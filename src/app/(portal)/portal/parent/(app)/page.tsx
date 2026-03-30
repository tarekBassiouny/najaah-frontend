"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PortalSectionHeader } from "@/features/portal/components/shared/PortalSectionHeader";
import { useParentDashboardContent } from "@/features/portal/hooks/use-parent-portal-content";
import { useTranslation } from "@/features/localization";

export default function ParentDashboardPage() {
  const { t } = useTranslation();
  const {
    hero,
    stats,
    selectedStudent,
    pendingLinks,
    enrollments,
    progress,
    rhythm,
    isLoading,
    isEmpty,
  } = useParentDashboardContent();

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.9rem] border border-[#e0efea] bg-[linear-gradient(180deg,#f4fbf8_0%,#ffffff_100%)] p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)] md:p-7">
          <PortalSectionHeader
            eyebrow={t("pages.portal.parent.dashboard.eyebrow")}
            title={hero.title}
            description={hero.subtitle}
          />

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              asChild
              className="h-11 rounded-full bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800"
            >
              <Link href="/portal/parent/children">
                {t("pages.portal.parent.dashboard.childrenCta")}
              </Link>
            </Button>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-500 ring-1 ring-[#dcebe7]">
              {isLoading
                ? t("pages.portal.common.loading")
                : t("pages.portal.parent.dashboard.linkStatus", {
                    count: pendingLinks.length,
                  })}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[1.6rem] border border-[#e1efeb] bg-white p-5 shadow-[0_12px_28px_rgba(148,163,184,0.08)]"
            >
              <p className="text-3xl font-semibold text-slate-900">
                {stat.value}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {isEmpty ? (
        <section className="rounded-[1.9rem] border border-dashed border-[#d6ece8] bg-[#f8fcfb] p-8 text-center">
          <p className="text-lg font-semibold text-slate-900">
            {t("pages.portal.parent.dashboard.noChildrenTitle")}
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-slate-500">
            {t("pages.portal.parent.dashboard.noChildrenDescription")}
          </p>
        </section>
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[1.75rem] border border-[#dcebe7] bg-white p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)]">
              <PortalSectionHeader
                eyebrow={t("pages.portal.parent.dashboard.childEyebrow")}
                title={selectedStudent.name}
                description={t(
                  "pages.portal.parent.dashboard.childDescription",
                )}
              />

              <div className="mt-5 space-y-3">
                {[
                  {
                    label: t("pages.portal.parent.dashboard.childCenter"),
                    value: selectedStudent.center,
                  },
                  {
                    label: t("pages.portal.parent.dashboard.childGrade"),
                    value: selectedStudent.grade,
                  },
                  {
                    label: t("pages.portal.parent.dashboard.childSchool"),
                    value: selectedStudent.school,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl bg-[#f7fbfa] px-4 py-3"
                  >
                    <span className="text-sm text-slate-500">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-[#dcebe7] bg-white p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)]">
              <PortalSectionHeader
                eyebrow={t("pages.portal.parent.dashboard.progressEyebrow")}
                title={t("pages.portal.parent.dashboard.progressTitle")}
                description={t(
                  "pages.portal.parent.dashboard.progressDescription",
                )}
              />

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    label: t("pages.portal.parent.dashboard.progressOverall"),
                    value: `${progress.overall}%`,
                  },
                  {
                    label: t("pages.portal.parent.dashboard.progressContent"),
                    value: `${progress.content}%`,
                  },
                  {
                    label: t("pages.portal.parent.dashboard.progressQuizzes"),
                    value: String(progress.quizzesCompleted),
                  },
                  {
                    label: t(
                      "pages.portal.parent.dashboard.progressAssignments",
                    ),
                    value: String(progress.assignmentsCompleted),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.35rem] border border-[#edf3f1] px-4 py-4"
                  >
                    <p className="text-2xl font-semibold text-slate-900">
                      {item.value}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[1.35rem] bg-[#f7fbfa] px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">
                  {progress.allRequiredPassed
                    ? t("pages.portal.parent.dashboard.requiredPassed")
                    : t("pages.portal.parent.dashboard.requiredPending")}
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[1.75rem] border border-[#dcebe7] bg-white p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)]">
              <PortalSectionHeader
                eyebrow={t("pages.portal.parent.dashboard.enrollmentsEyebrow")}
                title={t("pages.portal.parent.dashboard.enrollmentsTitle")}
                description={t(
                  "pages.portal.parent.dashboard.enrollmentsDescription",
                )}
              />

              <div className="mt-5 space-y-3">
                {enrollments.length > 0 ? (
                  enrollments.map((item) =>
                    item.courseId && selectedStudent.id ? (
                      <Link
                        key={item.id}
                        href={`/portal/parent/children/${selectedStudent.id}/courses/${item.courseId}`}
                        className="flex items-center justify-between rounded-[1.25rem] border border-[#edf3f1] px-4 py-4"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">
                            {item.courseTitle}
                          </p>
                          <p className="text-xs text-slate-400">
                            {item.status}
                          </p>
                        </div>
                        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                          {item.expiresAt
                            ? t("pages.portal.parent.dashboard.expiringSoon")
                            : t("pages.portal.parent.dashboard.active")}
                        </span>
                      </Link>
                    ) : (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-[1.25rem] border border-[#edf3f1] px-4 py-4"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">
                            {item.courseTitle}
                          </p>
                          <p className="text-xs text-slate-400">
                            {item.status}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {t("pages.portal.parent.dashboard.active")}
                        </span>
                      </div>
                    ),
                  )
                ) : (
                  <p className="text-sm text-slate-500">
                    {t("pages.portal.parent.dashboard.noEnrollments")}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-[#dcebe7] bg-white p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)]">
              <PortalSectionHeader
                eyebrow={t("pages.portal.parent.dashboard.activityEyebrow")}
                title={t("pages.portal.parent.dashboard.activityTitle")}
                description={t(
                  "pages.portal.parent.dashboard.activityDescription",
                )}
              />

              <div className="mt-5 grid grid-cols-7 gap-2">
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
          </section>
        </>
      )}
    </div>
  );
}
