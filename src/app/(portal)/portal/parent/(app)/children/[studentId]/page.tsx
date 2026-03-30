"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PortalSectionHeader } from "@/features/portal/components/shared/PortalSectionHeader";
import {
  useParentStudentDetail,
  useParentStudentEnrollments,
  useParentStudentWeeklyActivity,
} from "@/features/portal/hooks/use-parent-portal";
import { useTranslation } from "@/features/localization";
import { formatDateTime } from "@/lib/format-date-time";

export default function ParentStudentDetailPage() {
  const { t } = useTranslation();
  const params = useParams<{ studentId: string }>();
  const studentId = params.studentId;
  const detailQuery = useParentStudentDetail(studentId, { retry: 0 });
  const enrollmentsQuery = useParentStudentEnrollments(studentId, { retry: 0 });
  const weeklyQuery = useParentStudentWeeklyActivity(
    studentId,
    detailQuery.data?.centerId ?? undefined,
    7,
    { retry: 0 },
  );

  const isLoading =
    detailQuery.isLoading ||
    enrollmentsQuery.isLoading ||
    weeklyQuery.isLoading;
  const student = detailQuery.data;
  const enrollments = enrollmentsQuery.data ?? [];
  const weeklyMinutes = weeklyQuery.data
    ? Math.round(weeklyQuery.data.totals.watchDurationSeconds / 60)
    : 0;

  return (
    <div className="space-y-8">
      <section className="rounded-[1.9rem] border border-[#e0efea] bg-[linear-gradient(180deg,#f4fbf8_0%,#ffffff_100%)] p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)] md:p-7">
        <Link
          href="/portal/parent/children"
          className="inline-flex text-sm font-medium text-teal-700 transition-colors hover:text-teal-800"
        >
          {t("pages.portal.parent.detail.backToChildren")}
        </Link>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-3">
            <PortalSectionHeader
              eyebrow={t("pages.portal.parent.detail.eyebrow")}
              title={
                student?.name ?? t("pages.portal.parent.detail.loadingTitle")
              }
              description={t("pages.portal.parent.detail.description")}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: t("pages.portal.parent.detail.center"),
                  value:
                    student?.centerName ??
                    t("pages.portal.parent.dashboard.noCenter"),
                },
                {
                  label: t("pages.portal.parent.detail.grade"),
                  value:
                    student?.gradeName ??
                    t("pages.portal.parent.dashboard.noGrade"),
                },
                {
                  label: t("pages.portal.parent.detail.school"),
                  value:
                    student?.schoolName ??
                    t("pages.portal.parent.dashboard.noSchool"),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.4rem] border border-[#e1efeb] bg-white p-4 shadow-[0_10px_24px_rgba(148,163,184,0.08)]"
                >
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                label: t("pages.portal.parent.detail.stats.enrollments"),
                value: String(enrollments.length),
              },
              {
                label: t("pages.portal.parent.detail.stats.weeklyMinutes"),
                value: `${weeklyMinutes}m`,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[1.4rem] border border-[#e1efeb] bg-white p-5 shadow-[0_10px_24px_rgba(148,163,184,0.08)]"
              >
                <p className="text-3xl font-semibold text-slate-900">
                  {item.value}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {isLoading ? (
        <section className="rounded-[1.75rem] border border-[#dcebe7] bg-white p-8 text-center shadow-[0_12px_28px_rgba(148,163,184,0.08)]">
          <p className="text-lg font-semibold text-slate-900">
            {t("pages.portal.common.loading")}
          </p>
        </section>
      ) : !student ? (
        <section className="rounded-[1.75rem] border border-dashed border-[#d6ece8] bg-[#f8fcfb] p-8 text-center">
          <p className="text-lg font-semibold text-slate-900">
            {t("pages.portal.parent.detail.notFoundTitle")}
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-slate-500">
            {t("pages.portal.parent.detail.notFoundDescription")}
          </p>
        </section>
      ) : (
        <section className="rounded-[1.75rem] border border-[#dcebe7] bg-white p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)]">
          <PortalSectionHeader
            eyebrow={t("pages.portal.parent.detail.enrollmentsEyebrow")}
            title={t("pages.portal.parent.detail.enrollmentsTitle")}
            description={t("pages.portal.parent.detail.enrollmentsDescription")}
          />

          <div className="mt-5 space-y-3">
            {enrollments.length > 0 ? (
              enrollments.map((item) =>
                item.courseId ? (
                  <Link
                    key={item.id}
                    href={`/portal/parent/children/${student.id}/courses/${item.courseId}`}
                    className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-[#edf3f1] px-4 py-4 transition-colors hover:border-[#cde5df] hover:bg-[#f9fcfb]"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {item.courseTitle}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.expiresAt
                          ? t("pages.portal.parent.detail.expiresAt", {
                              date: formatDateTime(item.expiresAt),
                            })
                          : t("pages.portal.parent.dashboard.active")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
                        {item.status}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {t("pages.portal.parent.detail.openCourse")}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-[#edf3f1] px-4 py-4"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {item.courseTitle}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.expiresAt
                          ? t("pages.portal.parent.detail.expiresAt", {
                              date: formatDateTime(item.expiresAt),
                            })
                          : t("pages.portal.parent.dashboard.active")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {item.status}
                      </p>
                    </div>
                  </div>
                ),
              )
            ) : (
              <div className="rounded-[1.25rem] border border-dashed border-[#dcebe7] bg-[#f8fcfb] px-4 py-8 text-center text-sm text-slate-500">
                {t("pages.portal.parent.dashboard.noEnrollments")}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
