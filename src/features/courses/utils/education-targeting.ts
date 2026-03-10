import type { Course } from "@/features/courses/types/course";

export type CourseEducationTargetingValues = {
  showForAllStudents: boolean;
  gradeIds: string[];
  schoolIds: string[];
  collegeIds: string[];
};

function normalizeIdValue(value: unknown): string | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return String(value);
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  return null;
}

export function normalizeIdList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];

  const seen = new Set<string>();
  const normalized: string[] = [];

  values.forEach((value) => {
    const normalizedValue = normalizeIdValue(value);
    if (!normalizedValue || seen.has(normalizedValue)) return;
    seen.add(normalizedValue);
    normalized.push(normalizedValue);
  });

  return normalized;
}

function mapPayloadIds(values: string[]): Array<string | number> {
  return values.map((value) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && String(parsed) === value
      ? parsed
      : value;
  });
}

export function hasAnyEducationTarget(values: {
  gradeIds: string[];
  schoolIds: string[];
  collegeIds: string[];
}): boolean {
  return (
    values.gradeIds.length > 0 ||
    values.schoolIds.length > 0 ||
    values.collegeIds.length > 0
  );
}

export function getCourseEducationTargetingValues(
  course: Course | null | undefined,
): CourseEducationTargetingValues {
  const showForAllStudents =
    typeof course?.show_for_all_students === "boolean"
      ? course.show_for_all_students
      : true;

  return {
    showForAllStudents,
    gradeIds: normalizeIdList(course?.grade_ids),
    schoolIds: normalizeIdList(course?.school_ids),
    collegeIds: normalizeIdList(course?.college_ids),
  };
}

export function toCourseEducationTargetingPayload(
  values: CourseEducationTargetingValues,
) {
  const gradeIds = normalizeIdList(values.gradeIds);
  const schoolIds = normalizeIdList(values.schoolIds);
  const collegeIds = normalizeIdList(values.collegeIds);
  const showForAllStudents = values.showForAllStudents;

  if (showForAllStudents) {
    return {
      show_for_all_students: true,
      grade_ids: [] as Array<string | number>,
      school_ids: [] as Array<string | number>,
      college_ids: [] as Array<string | number>,
    };
  }

  return {
    show_for_all_students: false,
    grade_ids: mapPayloadIds(gradeIds),
    school_ids: mapPayloadIds(schoolIds),
    college_ids: mapPayloadIds(collegeIds),
  };
}
