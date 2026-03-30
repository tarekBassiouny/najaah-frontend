"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PortalSectionHeader } from "@/features/portal/components/shared/PortalSectionHeader";
import { useStudentCourseContent } from "@/features/portal/hooks/use-student-portal-content";
import { useTranslation } from "@/features/localization";

export default function StudentCourseDetailPage() {
  const { t } = useTranslation();
  const params = useParams<{ courseId: string }>();
  const {
    title,
    description,
    progress,
    lessonsCountLabel,
    durationLabel,
    instructorName,
    instructorRole,
    lessons,
    resources,
    isLoading,
  } = useStudentCourseContent(params.courseId);

  return (
    <div className="space-y-8">
      <section className="rounded-[1.9rem] border border-[#e0efea] bg-[linear-gradient(180deg,#f4fbf8_0%,#ffffff_100%)] p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)] md:p-7">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <Link
              href="/portal/student/my-courses"
              className="inline-flex text-sm font-medium text-teal-700 transition-colors hover:text-teal-800"
            >
              {t("pages.portal.course.backToCourses")}
            </Link>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                {t("pages.portal.course.eyebrow")}
              </p>
              <h1 className="max-w-2xl text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
                {title}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-500">
                {description}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button className="h-11 rounded-full bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800">
                {t("pages.portal.course.continueCta")}
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-full border-[#dcebe7] bg-white px-5 text-sm font-semibold text-slate-600 hover:bg-teal-50 hover:text-teal-700"
              >
                <Link href="/portal/student/explore">
                  {t("pages.portal.course.exploreMoreCta")}
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                label: t("pages.portal.course.stats.progress"),
                value: `${progress}%`,
              },
              {
                label: t("pages.portal.course.stats.lessons"),
                value: lessonsCountLabel,
              },
              {
                label: t("pages.portal.course.stats.duration"),
                value: durationLabel,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[1.5rem] border border-[#e1efeb] bg-white p-4 shadow-[0_10px_24px_rgba(148,163,184,0.08)]"
              >
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-[#dcebe7] bg-white p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)]">
            <PortalSectionHeader
              eyebrow={t("pages.portal.course.curriculumEyebrow")}
              title={t("pages.portal.course.curriculumTitle")}
              description={t("pages.portal.course.curriculumDescription")}
            />

            <div className="mt-5 space-y-3">
              {isLoading ? (
                <div className="rounded-[1.25rem] border border-dashed border-[#dcebe7] bg-[#f8fcfb] px-4 py-8 text-center text-sm text-slate-500">
                  {t("pages.portal.common.loading")}
                </div>
              ) : (
                lessons.map((lesson, index) => (
                  <div
                    key={lesson}
                    className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-[#edf3f1] px-4 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-700">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {lesson}
                        </p>
                        <p className="text-sm text-slate-500">
                          {t("pages.portal.course.lessonMeta")}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {index < 2
                        ? t("pages.portal.course.lessonStatus.done")
                        : index === 2
                          ? t("pages.portal.course.lessonStatus.current")
                          : t("pages.portal.course.lessonStatus.upcoming")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-[#dcebe7] bg-white p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)]">
            <PortalSectionHeader
              eyebrow={t("pages.portal.course.resourcesEyebrow")}
              title={t("pages.portal.course.resourcesTitle")}
              description={t("pages.portal.course.resourcesDescription")}
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {resources.map((resource) => (
                <div
                  key={resource}
                  className="rounded-[1.25rem] bg-[#f7fbfa] px-4 py-4 text-center text-sm font-medium text-slate-700"
                >
                  {resource}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-[#dcebe7] bg-white p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)]">
            <PortalSectionHeader
              eyebrow={t("pages.portal.course.instructorEyebrow")}
              title={t("pages.portal.course.instructorTitle")}
              description={t("pages.portal.course.instructorDescription")}
            />

            <div className="mt-5 flex items-center gap-4 rounded-[1.5rem] bg-[#f7fbfa] p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-lg font-semibold text-teal-700">
                A
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-900">
                  {instructorName}
                </p>
                <p className="text-sm text-slate-500">{instructorRole}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-[#dcebe7] bg-white p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)]">
            <PortalSectionHeader
              eyebrow={t("pages.portal.course.nextStepsEyebrow")}
              title={t("pages.portal.course.nextStepsTitle")}
              description={t("pages.portal.course.nextStepsDescription")}
            />

            <div className="mt-5 space-y-3">
              {[
                t("pages.portal.course.nextSteps.assignment"),
                t("pages.portal.course.nextSteps.quiz"),
                t("pages.portal.course.nextSteps.review"),
              ].map((step) => (
                <div
                  key={step}
                  className="rounded-[1.25rem] border border-slate-100 px-4 py-4 text-sm text-slate-600"
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
