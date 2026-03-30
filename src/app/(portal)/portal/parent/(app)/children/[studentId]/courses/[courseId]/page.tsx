"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PortalSectionHeader } from "@/features/portal/components/shared/PortalSectionHeader";
import {
  useParentStudentCourseAssignments,
  useParentStudentCourseProgress,
  useParentStudentCourseQuizAttempts,
  useParentStudentDetail,
  useParentStudentEnrollments,
} from "@/features/portal/hooks/use-parent-portal";
import { useTranslation } from "@/features/localization";
import { formatDateTime } from "@/lib/format-date-time";

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "—";
  const minutes = Math.round(seconds / 60);
  return `${minutes}m`;
}

export default function ParentCourseReviewPage() {
  const { t } = useTranslation();
  const params = useParams<{ studentId: string; courseId: string }>();
  const { studentId, courseId } = params;

  const studentQuery = useParentStudentDetail(studentId, { retry: 0 });
  const enrollmentsQuery = useParentStudentEnrollments(studentId, { retry: 0 });
  const progressQuery = useParentStudentCourseProgress(studentId, courseId, {
    retry: 0,
  });
  const quizAttemptsQuery = useParentStudentCourseQuizAttempts(
    studentId,
    courseId,
    { retry: 0 },
  );
  const assignmentsQuery = useParentStudentCourseAssignments(
    studentId,
    courseId,
    {
      retry: 0,
    },
  );

  const student = studentQuery.data;
  const enrollments = enrollmentsQuery.data ?? [];
  const course =
    enrollments.find((item) => String(item.courseId) === courseId) ?? null;
  const progress = progressQuery.data;
  const quizAttempts = quizAttemptsQuery.data ?? [];
  const assignments = assignmentsQuery.data ?? [];
  const isLoading =
    studentQuery.isLoading ||
    enrollmentsQuery.isLoading ||
    progressQuery.isLoading ||
    quizAttemptsQuery.isLoading ||
    assignmentsQuery.isLoading;

  return (
    <div className="space-y-8">
      <section className="rounded-[1.9rem] border border-[#e0efea] bg-[linear-gradient(180deg,#f4fbf8_0%,#ffffff_100%)] p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)] md:p-7">
        <Link
          href={`/portal/parent/children/${studentId}`}
          className="inline-flex text-sm font-medium text-teal-700 transition-colors hover:text-teal-800"
        >
          {t("pages.portal.parent.courseReview.backToStudent")}
        </Link>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-3">
            <PortalSectionHeader
              eyebrow={t("pages.portal.parent.courseReview.eyebrow")}
              title={
                course?.courseTitle ??
                t("pages.portal.parent.courseReview.loadingTitle")
              }
              description={t("pages.portal.parent.courseReview.description", {
                name:
                  student?.name ?? t("pages.portal.parent.detail.loadingTitle"),
              })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                label: t("pages.portal.parent.courseReview.stats.required"),
                value: progress
                  ? `${Math.round(progress.overallCompletionPercentage)}%`
                  : "0%",
              },
              {
                label: t("pages.portal.parent.courseReview.stats.content"),
                value: progress
                  ? `${Math.round(progress.overallContentCompletionPercentage)}%`
                  : "0%",
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
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[1.75rem] border border-[#dcebe7] bg-white p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)]">
              <PortalSectionHeader
                eyebrow={t("pages.portal.parent.courseReview.progressEyebrow")}
                title={t("pages.portal.parent.courseReview.progressTitle")}
                description={t(
                  "pages.portal.parent.courseReview.progressDescription",
                )}
              />

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    label: t("pages.portal.parent.courseReview.quizCompleted"),
                    value: String(progress?.quizzes.completed ?? 0),
                  },
                  {
                    label: t(
                      "pages.portal.parent.courseReview.assignmentCompleted",
                    ),
                    value: String(progress?.assignments.completed ?? 0),
                  },
                  {
                    label: t("pages.portal.parent.courseReview.quizRequired"),
                    value: String(progress?.quizzes.required ?? 0),
                  },
                  {
                    label: t(
                      "pages.portal.parent.courseReview.assignmentRequired",
                    ),
                    value: String(progress?.assignments.required ?? 0),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.25rem] border border-[#edf3f1] px-4 py-4"
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
                  {progress?.allRequiredPassed
                    ? t("pages.portal.parent.dashboard.requiredPassed")
                    : t("pages.portal.parent.dashboard.requiredPending")}
                </p>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-[#dcebe7] bg-white p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)]">
              <PortalSectionHeader
                eyebrow={t("pages.portal.parent.courseReview.courseEyebrow")}
                title={t("pages.portal.parent.courseReview.courseTitle")}
                description={t(
                  "pages.portal.parent.courseReview.courseDescription",
                )}
              />

              <div className="mt-5 space-y-3">
                {[
                  {
                    label: t("pages.portal.parent.detail.center"),
                    value:
                      student?.centerName ??
                      t("pages.portal.parent.dashboard.noCenter"),
                  },
                  {
                    label: t("pages.portal.parent.courseReview.studentLabel"),
                    value:
                      student?.name ??
                      t("pages.portal.parent.detail.loadingTitle"),
                  },
                  {
                    label: t(
                      "pages.portal.parent.courseReview.enrollmentStatus",
                    ),
                    value: course?.status ?? "—",
                  },
                  {
                    label: t("pages.portal.parent.courseReview.expiresLabel"),
                    value: course?.expiresAt
                      ? formatDateTime(course.expiresAt)
                      : t("pages.portal.parent.dashboard.active"),
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
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[1.75rem] border border-[#dcebe7] bg-white p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)]">
              <PortalSectionHeader
                eyebrow={t("pages.portal.parent.courseReview.quizEyebrow")}
                title={t("pages.portal.parent.courseReview.quizTitle")}
                description={t(
                  "pages.portal.parent.courseReview.quizDescription",
                )}
              />

              <div className="mt-5 space-y-3">
                {quizAttempts.length > 0 ? (
                  quizAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="rounded-[1.25rem] border border-[#edf3f1] px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">
                            {attempt.quizTitle}
                          </p>
                          <p className="text-xs text-slate-400">
                            {t(
                              "pages.portal.parent.courseReview.attemptLabel",
                              {
                                number: attempt.attemptNumber,
                              },
                            )}
                          </p>
                        </div>
                        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                          {attempt.status}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
                        <p>
                          {t("pages.portal.parent.courseReview.scoreLabel", {
                            score:
                              attempt.score != null
                                ? String(attempt.score)
                                : "—",
                          })}
                        </p>
                        <p>
                          {t("pages.portal.parent.courseReview.durationLabel", {
                            duration: formatDuration(attempt.timeSpentSeconds),
                          })}
                        </p>
                        <p>
                          {t(
                            "pages.portal.parent.courseReview.submittedLabel",
                            {
                              date: formatDateTime(attempt.submittedAt),
                            },
                          )}
                        </p>
                        <p>
                          {attempt.passed == null
                            ? "—"
                            : attempt.passed
                              ? t("pages.portal.parent.courseReview.passed")
                              : t(
                                  "pages.portal.parent.courseReview.needsReview",
                                )}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.25rem] border border-dashed border-[#dcebe7] bg-[#f8fcfb] px-4 py-8 text-center text-sm text-slate-500">
                    {t("pages.portal.parent.courseReview.noQuizAttempts")}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-[#dcebe7] bg-white p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)]">
              <PortalSectionHeader
                eyebrow={t(
                  "pages.portal.parent.courseReview.assignmentEyebrow",
                )}
                title={t("pages.portal.parent.courseReview.assignmentTitle")}
                description={t(
                  "pages.portal.parent.courseReview.assignmentDescription",
                )}
              />

              <div className="mt-5 space-y-3">
                {assignments.length > 0 ? (
                  assignments.map((submission) => (
                    <div
                      key={submission.id}
                      className="rounded-[1.25rem] border border-[#edf3f1] px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">
                            {submission.assignmentTitle}
                          </p>
                          <p className="text-xs text-slate-400">
                            {submission.feedback ??
                              t("pages.portal.parent.courseReview.noFeedback")}
                          </p>
                        </div>
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          {submission.status}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
                        <p>
                          {t("pages.portal.parent.courseReview.scoreLabel", {
                            score:
                              submission.scoreAfterPenalty != null
                                ? String(submission.scoreAfterPenalty)
                                : submission.score != null
                                  ? String(submission.score)
                                  : "—",
                          })}
                        </p>
                        <p>
                          {t(
                            "pages.portal.parent.courseReview.submittedLabel",
                            {
                              date: formatDateTime(submission.submittedAt),
                            },
                          )}
                        </p>
                        <p>
                          {submission.isLate
                            ? t("pages.portal.parent.courseReview.late")
                            : t("pages.portal.parent.courseReview.onTime")}
                        </p>
                        <p>
                          {submission.passed == null
                            ? "—"
                            : submission.passed
                              ? t("pages.portal.parent.courseReview.passed")
                              : t(
                                  "pages.portal.parent.courseReview.needsReview",
                                )}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.25rem] border border-dashed border-[#dcebe7] bg-[#f8fcfb] px-4 py-8 text-center text-sm text-slate-500">
                    {t("pages.portal.parent.courseReview.noAssignments")}
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
