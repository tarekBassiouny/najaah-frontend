"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useTenant } from "@/app/tenant-provider";
import { useLocale } from "@/features/localization";
import type {
  StudentPortalCategory,
  StudentPortalCourseDetail,
  StudentPortalCourseListParams,
  StudentPortalCourseListResponse,
  StudentPortalProfileDetails,
  StudentPortalWeeklyActivity,
} from "@/features/portal/types/student-portal";
import {
  getStudentCourseDetail,
  getStudentProfileDetails,
  getStudentWeeklyActivity,
  listStudentCategories,
  listStudentEnrolledCourses,
  listStudentExploreCourses,
} from "@/features/portal/services/student-portal.service";

type UsePortalCourseListOptions = Omit<
  UseQueryOptions<StudentPortalCourseListResponse>,
  "queryKey" | "queryFn"
>;

type UsePortalCourseDetailOptions = Omit<
  UseQueryOptions<StudentPortalCourseDetail | null>,
  "queryKey" | "queryFn"
>;

type UsePortalWeeklyActivityOptions = Omit<
  UseQueryOptions<StudentPortalWeeklyActivity | null>,
  "queryKey" | "queryFn"
>;

type UsePortalProfileDetailsOptions = Omit<
  UseQueryOptions<StudentPortalProfileDetails | null>,
  "queryKey" | "queryFn"
>;

type UsePortalCategoriesOptions = Omit<
  UseQueryOptions<StudentPortalCategory[]>,
  "queryKey" | "queryFn"
>;

export function useStudentExploreCourses(
  params: StudentPortalCourseListParams,
  options?: UsePortalCourseListOptions,
) {
  const { locale } = useLocale();

  return useQuery({
    queryKey: ["portal", "student", "explore-courses", params, locale],
    queryFn: () => listStudentExploreCourses(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useStudentEnrolledCourses(
  params: StudentPortalCourseListParams,
  options?: UsePortalCourseListOptions,
) {
  const { locale } = useLocale();

  return useQuery({
    queryKey: ["portal", "student", "enrolled-courses", params, locale],
    queryFn: () => listStudentEnrolledCourses(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useStudentCourseDetail(
  courseId: string | number | undefined,
  centerId?: string | number | null,
  options?: UsePortalCourseDetailOptions,
) {
  const { locale } = useLocale();
  const tenant = useTenant();
  const resolvedCenterId = centerId ?? tenant.centerId;

  return useQuery({
    queryKey: [
      "portal",
      "student",
      "course-detail",
      resolvedCenterId ?? null,
      courseId ?? null,
      locale,
    ],
    queryFn: () => getStudentCourseDetail(resolvedCenterId!, courseId!),
    enabled: Boolean(resolvedCenterId && courseId),
    ...options,
  });
}

export function useStudentWeeklyActivity(
  days = 7,
  centerId?: string | number | null,
  options?: UsePortalWeeklyActivityOptions,
) {
  const { locale } = useLocale();
  const tenant = useTenant();
  const resolvedCenterId = centerId ?? tenant.centerId;

  return useQuery({
    queryKey: [
      "portal",
      "student",
      "weekly-activity",
      resolvedCenterId ?? null,
      days,
      locale,
    ],
    queryFn: () => getStudentWeeklyActivity(resolvedCenterId!, days),
    enabled: Boolean(resolvedCenterId),
    ...options,
  });
}

export function useStudentProfileDetails(
  options?: UsePortalProfileDetailsOptions,
) {
  const { locale } = useLocale();

  return useQuery({
    queryKey: ["portal", "student", "profile-details", locale],
    queryFn: getStudentProfileDetails,
    ...options,
  });
}

export function useStudentCategories(
  centerId?: string | number | null,
  options?: UsePortalCategoriesOptions,
) {
  const { locale } = useLocale();
  const tenant = useTenant();
  const resolvedCenterId = centerId ?? tenant.centerId;

  return useQuery({
    queryKey: [
      "portal",
      "student",
      "categories",
      resolvedCenterId ?? null,
      locale,
    ],
    queryFn: () => listStudentCategories(resolvedCenterId),
    ...options,
  });
}
