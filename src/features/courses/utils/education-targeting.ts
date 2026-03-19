import type { Course } from "@/features/courses/types/course";

export type CourseEducationTargetingValues = {
  showForAllStudents: boolean;
  gradeIds: string[];
  schoolIds: string[];
  collegeIds: string[];
};

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const FALSE_VALUES = new Set(["0", "false", "no", "off"]);
const EDUCATION_ID_KEYS = [
  "id",
  "value",
  "grade_id",
  "school_id",
  "college_id",
];

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return fallback;
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (TRUE_VALUES.has(normalized)) return true;
    if (FALSE_VALUES.has(normalized)) return false;
  }

  return fallback;
}

function normalizeIdValue(value: unknown): string | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return String(value);
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of EDUCATION_ID_KEYS) {
      if (!(key in record)) continue;
      const normalized = normalizeIdValue(record[key]);
      if (normalized) return normalized;
    }
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

function normalizeIdCollection(values: unknown): string[] {
  if (Array.isArray(values)) {
    return normalizeIdList(values);
  }

  if (values && typeof values === "object") {
    const record = values as Record<string, unknown>;
    if (Array.isArray(record.data)) {
      return normalizeIdList(record.data);
    }
  }

  return [];
}

function hasExplicitCollectionShape(values: unknown): boolean {
  if (Array.isArray(values)) return true;

  if (values && typeof values === "object") {
    const record = values as Record<string, unknown>;
    return Array.isArray(record.data);
  }

  return false;
}

function getValueByPath(
  source: Record<string, unknown>,
  keyPath: string,
): unknown {
  if (!keyPath.includes(".")) {
    return source[keyPath];
  }

  const keys = keyPath.split(".");
  let current: unknown = source;

  for (const key of keys) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

function resolveCourseEducationIds(
  course: Course | null | undefined,
  keys: string[],
): string[] {
  const source = (course ?? {}) as Record<string, unknown>;

  for (const key of keys) {
    const value = getValueByPath(source, key);
    const normalized = normalizeIdCollection(value);

    if (normalized.length > 0 || hasExplicitCollectionShape(value)) {
      return normalized;
    }
  }

  return [];
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
  const showForAllStudents = normalizeBoolean(
    course?.show_for_all_students,
    true,
  );

  return {
    showForAllStudents,
    gradeIds: resolveCourseEducationIds(course, [
      "grade_ids",
      "gradeIds",
      "grades",
      "education_targets.grades",
      "educationTargets.grades",
    ]),
    schoolIds: resolveCourseEducationIds(course, [
      "school_ids",
      "schoolIds",
      "schools",
      "education_targets.schools",
      "educationTargets.schools",
    ]),
    collegeIds: resolveCourseEducationIds(course, [
      "college_ids",
      "collegeIds",
      "colleges",
      "education_targets.colleges",
      "educationTargets.colleges",
    ]),
  };
}

export function isEducationTargetingFieldKey(key: string): boolean {
  return (
    key === "show_for_all_students" ||
    key === "grade_ids" ||
    key.startsWith("grade_ids.") ||
    key === "school_ids" ||
    key.startsWith("school_ids.") ||
    key === "college_ids" ||
    key.startsWith("college_ids.")
  );
}

export function getEducationTargetingError(
  errors: Record<string, string[]>,
): string | null {
  for (const [key, messages] of Object.entries(errors)) {
    if (!isEducationTargetingFieldKey(key)) continue;
    const firstMessage = messages[0];
    if (firstMessage) return firstMessage;
  }

  return null;
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
