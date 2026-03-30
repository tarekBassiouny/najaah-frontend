"use client";

import { useMemo } from "react";
import { usePortalAuth } from "@/features/portal-auth";
import { useTranslation } from "@/features/localization";
import {
  useParentLinks,
  useParentLinkedStudents,
  useParentStudentCourseProgress,
  useParentStudentDetail,
  useParentStudentEnrollments,
  useParentStudentWeeklyActivity,
} from "@/features/portal/hooks/use-parent-portal";

export function useParentDashboardContent() {
  const { t } = useTranslation();
  const { user } = usePortalAuth();
  const studentsQuery = useParentLinkedStudents({ retry: 0 });
  const linksQuery = useParentLinks({ retry: 0 });

  const activeStudents = useMemo(
    () => studentsQuery.data ?? [],
    [studentsQuery.data],
  );
  const allLinks = useMemo(() => linksQuery.data ?? [], [linksQuery.data]);
  const selectedStudentId = activeStudents[0]?.studentId;

  const studentDetailQuery = useParentStudentDetail(selectedStudentId, {
    retry: 0,
  });
  const enrollmentsQuery = useParentStudentEnrollments(selectedStudentId, {
    retry: 0,
  });
  const firstEnrollment = enrollmentsQuery.data?.[0];
  const progressQuery = useParentStudentCourseProgress(
    selectedStudentId,
    firstEnrollment?.courseId ?? undefined,
    { retry: 0 },
  );
  const weeklyActivityQuery = useParentStudentWeeklyActivity(
    selectedStudentId,
    studentDetailQuery.data?.centerId ?? undefined,
    7,
    { retry: 0 },
  );

  return useMemo(() => {
    const pendingLinks = allLinks.filter((item) => item.status !== "Active");
    const childName = studentDetailQuery.data?.name ?? activeStudents[0]?.name;
    const childCenter =
      studentDetailQuery.data?.centerName ??
      t("pages.portal.parent.dashboard.noCenter");
    const totalMinutes = weeklyActivityQuery.data
      ? Math.round(weeklyActivityQuery.data.totals.watchDurationSeconds / 60)
      : 0;

    return {
      parentName: user?.name ?? t("pages.portal.topbar.parentRole"),
      children: activeStudents.map((item) => ({
        id: String(item.studentId),
        name: item.name,
        phone: item.phone,
        status: item.status,
        linkedAt: item.linkedAt,
      })),
      pendingLinks: pendingLinks.map((item) => ({
        id: String(item.linkId),
        name: item.name,
        status: item.status,
        linkedAt: item.linkedAt,
      })),
      hero: {
        title: t("pages.portal.parent.dashboard.title", {
          name: user?.name ?? t("pages.portal.topbar.parentRole"),
        }),
        subtitle: t("pages.portal.parent.dashboard.subtitle"),
      },
      selectedStudent: {
        id: selectedStudentId ? String(selectedStudentId) : null,
        name: childName ?? t("pages.portal.parent.dashboard.noChildrenTitle"),
        center: childCenter,
        grade:
          studentDetailQuery.data?.gradeName ??
          t("pages.portal.parent.dashboard.noGrade"),
        school:
          studentDetailQuery.data?.schoolName ??
          t("pages.portal.parent.dashboard.noSchool"),
      },
      stats: [
        {
          label: t("pages.portal.parent.dashboard.stats.children"),
          value: String(activeStudents.length),
        },
        {
          label: t("pages.portal.parent.dashboard.stats.pendingLinks"),
          value: String(pendingLinks.length),
        },
        {
          label: t("pages.portal.parent.dashboard.stats.activeCourses"),
          value: String(enrollmentsQuery.data?.length ?? 0),
        },
        {
          label: t("pages.portal.parent.dashboard.stats.weeklyMinutes"),
          value: totalMinutes > 0 ? `${totalMinutes}m` : "0m",
        },
      ],
      enrollments:
        enrollmentsQuery.data?.map((item) => ({
          id: String(item.id),
          courseId: item.courseId ? String(item.courseId) : null,
          courseTitle: item.courseTitle,
          status: item.status,
          enrolledAt: item.enrolledAt,
          expiresAt: item.expiresAt,
        })) ?? [],
      progress: {
        overall:
          progressQuery.data?.overallCompletionPercentage != null
            ? Math.round(progressQuery.data.overallCompletionPercentage)
            : 0,
        content:
          progressQuery.data?.overallContentCompletionPercentage != null
            ? Math.round(progressQuery.data.overallContentCompletionPercentage)
            : 0,
        quizzesCompleted: progressQuery.data?.quizzes.completed ?? 0,
        assignmentsCompleted: progressQuery.data?.assignments.completed ?? 0,
        allRequiredPassed: progressQuery.data?.allRequiredPassed ?? false,
      },
      rhythm: weeklyActivityQuery.data?.series.map((entry) => {
        const total =
          entry.watchDurationSeconds +
          entry.quizAttemptsCount * 900 +
          entry.assignmentSubmissionsCount * 1200;
        return Math.max(10, Math.min(100, Math.round(total / 120)));
      }) ?? [18, 22, 10, 36, 44, 28, 34],
      isLoading:
        studentsQuery.isLoading ||
        studentDetailQuery.isLoading ||
        enrollmentsQuery.isLoading ||
        progressQuery.isLoading ||
        weeklyActivityQuery.isLoading,
      isEmpty: activeStudents.length === 0,
    };
  }, [
    activeStudents,
    allLinks,
    enrollmentsQuery.data,
    enrollmentsQuery.isLoading,
    progressQuery.data,
    progressQuery.isLoading,
    selectedStudentId,
    studentDetailQuery.data,
    studentDetailQuery.isLoading,
    studentsQuery.isLoading,
    t,
    user?.name,
    weeklyActivityQuery.data,
    weeklyActivityQuery.isLoading,
  ]);
}

export function useParentChildrenContent() {
  const { t } = useTranslation();
  const studentsQuery = useParentLinkedStudents({ retry: 0 });
  const linksQuery = useParentLinks({ retry: 0 });

  return useMemo(() => {
    const activeStudents = studentsQuery.data ?? [];
    const allLinks = linksQuery.data ?? [];
    const pendingLinks = allLinks.filter((item) => item.status !== "Active");

    return {
      children: activeStudents.map((item) => ({
        id: String(item.studentId),
        name: item.name,
        phone: item.phone,
        status: item.status,
        method: item.linkMethod,
        linkedAt: item.linkedAt,
      })),
      pendingLinks: pendingLinks.map((item) => ({
        id: String(item.linkId),
        name: item.name,
        phone: item.phone,
        status: item.status,
        method: item.linkMethod,
        linkedAt: item.linkedAt,
      })),
      stats: [
        {
          label: t("pages.portal.parent.children.stats.active"),
          value: String(activeStudents.length),
        },
        {
          label: t("pages.portal.parent.children.stats.pending"),
          value: String(pendingLinks.length),
        },
      ],
      isLoading: studentsQuery.isLoading || linksQuery.isLoading,
      isEmpty: activeStudents.length === 0 && pendingLinks.length === 0,
    };
  }, [
    linksQuery.data,
    linksQuery.isLoading,
    studentsQuery.data,
    studentsQuery.isLoading,
    t,
  ]);
}
