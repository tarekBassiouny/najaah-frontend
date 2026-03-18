import type { InstructorSummary } from "@/features/courses/types/course";

export type TranslateFn = (
  _key: string,
  _params?: Record<string, string | number>,
) => string;

export function resolveCategoryId(course: Record<string, unknown>): string {
  const directCategoryId = course.category_id;
  if (directCategoryId != null && directCategoryId !== "") {
    return String(directCategoryId);
  }

  const category = course.category;
  if (category && typeof category === "object" && "id" in category) {
    const categoryId = (category as { id?: string | number | null }).id;
    if (categoryId != null && categoryId !== "") {
      return String(categoryId);
    }
  }

  return "none";
}

export function normalizeEntityId(value: string): string | number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : value;
}

export function getInstructorLabel(
  instructor: InstructorSummary | null | undefined,
  t: TranslateFn,
): string {
  if (!instructor) return t("pages.centerCourseDetail.unknown.instructor");

  if (typeof instructor.name === "string" && instructor.name.trim()) {
    return instructor.name.trim();
  }

  const translatedName = instructor.name_translations?.en;
  if (typeof translatedName === "string" && translatedName.trim()) {
    return translatedName.trim();
  }

  return t("pages.centerCourseDetail.unknown.instructorById", {
    id: instructor.id,
  });
}
