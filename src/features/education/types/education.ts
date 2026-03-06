export type EducationTranslations = Record<string, string>;

export type EducationalStageValue = 0 | 1 | 2 | 3 | 4;
export type SchoolTypeValue = 0 | 1 | 2 | 3;

export type Grade = {
  id: string | number;
  name?: string | null;
  name_translations?: EducationTranslations | null;
  slug?: string | null;
  stage?: EducationalStageValue | number | null;
  stage_label?: string | null;
  order?: number | null;
  is_active?: boolean | null;
  students_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type School = {
  id: string | number;
  name?: string | null;
  name_translations?: EducationTranslations | null;
  slug?: string | null;
  type?: SchoolTypeValue | number | null;
  type_label?: string | null;
  address?: string | null;
  is_active?: boolean | null;
  students_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type College = {
  id: string | number;
  name?: string | null;
  name_translations?: EducationTranslations | null;
  slug?: string | null;
  type?: number | null;
  type_label?: string | null;
  address?: string | null;
  is_active?: boolean | null;
  students_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type GradeListParams = {
  page?: number;
  per_page?: number;
  search?: string;
  stage?: number | string;
  is_active?: boolean;
};

export type SchoolListParams = {
  page?: number;
  per_page?: number;
  search?: string;
  type?: number | string;
  is_active?: boolean;
};

export type CollegeListParams = {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
};

export type GradeLookupParams = Omit<GradeListParams, "page" | "per_page">;
export type SchoolLookupParams = Omit<SchoolListParams, "page" | "per_page">;
export type CollegeLookupParams = Omit<CollegeListParams, "page" | "per_page">;

export type CreateGradePayload = {
  name_translations: EducationTranslations;
  stage: EducationalStageValue | number;
  order?: number;
  slug?: string;
  is_active?: boolean;
};

export type UpdateGradePayload = Partial<CreateGradePayload>;

export type CreateSchoolPayload = {
  name_translations: EducationTranslations;
  type: SchoolTypeValue | number;
  address?: string | null;
  slug?: string;
  is_active?: boolean;
};

export type UpdateSchoolPayload = Partial<CreateSchoolPayload>;

export type CreateCollegePayload = {
  name_translations: EducationTranslations;
  type?: number | null;
  address?: string | null;
  slug?: string;
  is_active?: boolean;
};

export type UpdateCollegePayload = Partial<CreateCollegePayload>;

export const EDUCATIONAL_STAGE_OPTIONS: Array<{
  value: string;
  label: string;
}> = [
  { value: "0", label: "Elementary" },
  { value: "1", label: "Middle" },
  { value: "2", label: "High School" },
  { value: "3", label: "University" },
  { value: "4", label: "Graduate" },
];

export const SCHOOL_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "0", label: "Public" },
  { value: "1", label: "Private" },
  { value: "2", label: "International" },
  { value: "3", label: "Other" },
];

export function normalizeEducationTranslations(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value as EducationTranslations;
}

export function getEducationName(
  entity:
    | {
        id?: string | number | null;
        name?: string | null;
        name_translations?: EducationTranslations | null;
      }
    | null
    | undefined,
  fallbackPrefix: string,
) {
  if (!entity) return "—";
  if (entity.name && entity.name.trim()) return entity.name.trim();

  const englishName = entity.name_translations?.en;
  if (englishName && englishName.trim()) return englishName.trim();

  const arabicName = entity.name_translations?.ar;
  if (arabicName && arabicName.trim()) return arabicName.trim();

  if (entity.id != null) {
    return `${fallbackPrefix} #${entity.id}`;
  }

  return "—";
}

export function getStageLabel(stage: unknown, stageLabel?: string | null) {
  if (stageLabel && stageLabel.trim()) return stageLabel.trim();

  const key = String(stage ?? "").trim();
  const matched = EDUCATIONAL_STAGE_OPTIONS.find((item) => item.value === key);
  return matched?.label ?? "Unknown";
}

export function getSchoolTypeLabel(type: unknown, typeLabel?: string | null) {
  if (typeLabel && typeLabel.trim()) return typeLabel.trim();

  const key = String(type ?? "").trim();
  const matched = SCHOOL_TYPE_OPTIONS.find((item) => item.value === key);
  return matched?.label ?? "Unknown";
}
