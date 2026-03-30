"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type {
  ParentPortalAssignmentSubmission,
  ParentPortalCourseProgress,
  ParentPortalEnrollment,
  ParentPortalLinkedStudent,
  ParentPortalQuizAttempt,
  ParentPortalStudentDetail,
  ParentPortalWeeklyActivity,
} from "@/features/portal/types/parent-portal";
import {
  getParentStudentCourseProgress,
  getParentStudentDetail,
  getParentStudentWeeklyActivity,
  listParentStudentCourseAssignments,
  listParentStudentCourseQuizAttempts,
  listParentLinks,
  listParentLinkedStudents,
  listParentStudentEnrollments,
} from "@/features/portal/services/parent-portal.service";

type LinkedStudentsOptions = Omit<
  UseQueryOptions<ParentPortalLinkedStudent[]>,
  "queryKey" | "queryFn"
>;

type StudentDetailOptions = Omit<
  UseQueryOptions<ParentPortalStudentDetail | null>,
  "queryKey" | "queryFn"
>;

type EnrollmentsOptions = Omit<
  UseQueryOptions<ParentPortalEnrollment[]>,
  "queryKey" | "queryFn"
>;

type ProgressOptions = Omit<
  UseQueryOptions<ParentPortalCourseProgress | null>,
  "queryKey" | "queryFn"
>;

type WeeklyOptions = Omit<
  UseQueryOptions<ParentPortalWeeklyActivity | null>,
  "queryKey" | "queryFn"
>;

type QuizAttemptsOptions = Omit<
  UseQueryOptions<ParentPortalQuizAttempt[]>,
  "queryKey" | "queryFn"
>;

type AssignmentsOptions = Omit<
  UseQueryOptions<ParentPortalAssignmentSubmission[]>,
  "queryKey" | "queryFn"
>;

export function useParentLinkedStudents(options?: LinkedStudentsOptions) {
  return useQuery({
    queryKey: ["portal", "parent", "students"],
    queryFn: listParentLinkedStudents,
    ...options,
  });
}

export function useParentLinks(options?: LinkedStudentsOptions) {
  return useQuery({
    queryKey: ["portal", "parent", "links"],
    queryFn: listParentLinks,
    ...options,
  });
}

export function useParentStudentDetail(
  studentId: number | string | undefined,
  options?: StudentDetailOptions,
) {
  return useQuery({
    queryKey: ["portal", "parent", "student-detail", studentId ?? null],
    queryFn: () => getParentStudentDetail(studentId!),
    enabled: Boolean(studentId),
    ...options,
  });
}

export function useParentStudentEnrollments(
  studentId: number | string | undefined,
  options?: EnrollmentsOptions,
) {
  return useQuery({
    queryKey: ["portal", "parent", "student-enrollments", studentId ?? null],
    queryFn: () => listParentStudentEnrollments(studentId!),
    enabled: Boolean(studentId),
    ...options,
  });
}

export function useParentStudentCourseProgress(
  studentId: number | string | undefined,
  courseId: number | string | undefined,
  options?: ProgressOptions,
) {
  return useQuery({
    queryKey: [
      "portal",
      "parent",
      "student-course-progress",
      studentId ?? null,
      courseId ?? null,
    ],
    queryFn: () => getParentStudentCourseProgress(studentId!, courseId!),
    enabled: Boolean(studentId && courseId),
    ...options,
  });
}

export function useParentStudentWeeklyActivity(
  studentId: number | string | undefined,
  centerId: number | string | undefined,
  days = 7,
  options?: WeeklyOptions,
) {
  return useQuery({
    queryKey: [
      "portal",
      "parent",
      "student-weekly-activity",
      studentId ?? null,
      centerId ?? null,
      days,
    ],
    queryFn: () => getParentStudentWeeklyActivity(studentId!, centerId!, days),
    enabled: Boolean(studentId && centerId),
    ...options,
  });
}

export function useParentStudentCourseQuizAttempts(
  studentId: number | string | undefined,
  courseId: number | string | undefined,
  options?: QuizAttemptsOptions,
) {
  return useQuery({
    queryKey: [
      "portal",
      "parent",
      "student-course-quiz-attempts",
      studentId ?? null,
      courseId ?? null,
    ],
    queryFn: () => listParentStudentCourseQuizAttempts(studentId!, courseId!),
    enabled: Boolean(studentId && courseId),
    ...options,
  });
}

export function useParentStudentCourseAssignments(
  studentId: number | string | undefined,
  courseId: number | string | undefined,
  options?: AssignmentsOptions,
) {
  return useQuery({
    queryKey: [
      "portal",
      "parent",
      "student-course-assignments",
      studentId ?? null,
      courseId ?? null,
    ],
    queryFn: () => listParentStudentCourseAssignments(studentId!, courseId!),
    enabled: Boolean(studentId && courseId),
    ...options,
  });
}
