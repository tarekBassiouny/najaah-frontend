import type {
  CreateSurveyPayload,
  SurveyAssignmentType,
  SurveyScopeType,
} from "@/features/surveys/types/survey";

const SYSTEM_ASSIGNMENT_TYPES = ["all", "center", "course", "user"] as const;
const CENTER_ASSIGNMENT_TYPES = ["all", "course", "video", "user"] as const;

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

function isAllowedAssignmentType(
  scopeType: SurveyScopeType,
  assignmentType: SurveyAssignmentType,
) {
  const allowed: readonly SurveyAssignmentType[] =
    scopeType === 1 ? SYSTEM_ASSIGNMENT_TYPES : CENTER_ASSIGNMENT_TYPES;
  return allowed.includes(assignmentType);
}

function includesNumericId(ids: number[], value: number) {
  return ids.some((id) => id === value);
}

export function getScopeAssignmentTypes(
  scopeType: SurveyScopeType,
): SurveyAssignmentType[] {
  return scopeType === 1
    ? [...SYSTEM_ASSIGNMENT_TYPES]
    : [...CENTER_ASSIGNMENT_TYPES];
}

export type AssignmentValidationInput = {
  scopeType: SurveyScopeType;
  assignmentType: SurveyAssignmentType;
  assignmentId: unknown;
  surveyCenterId: number | null;
  selectedCourseCenterId?: number | null;
  selectedStudentCenterId?: number | null;
  selectedVideoIsFullPlay?: boolean | null;
  unbrandedCenterIds?: number[];
};

export type AssignmentValidationResult =
  | {
      valid: true;
      assignment: CreateSurveyPayload["assignments"][number];
    }
  | {
      valid: false;
      error: string;
    };

export function validateSurveyAssignment(
  input: AssignmentValidationInput,
): AssignmentValidationResult {
  const {
    scopeType,
    assignmentType,
    assignmentId,
    surveyCenterId,
    selectedCourseCenterId,
    selectedStudentCenterId,
    selectedVideoIsFullPlay,
    unbrandedCenterIds = [],
  } = input;

  if (!isAllowedAssignmentType(scopeType, assignmentType)) {
    return {
      valid: false,
      error: "This assignment type is not allowed for the selected scope.",
    };
  }

  if (scopeType === 2 && surveyCenterId == null) {
    return {
      valid: false,
      error: "Center-scoped surveys require a valid center.",
    };
  }

  if (assignmentType === "all") {
    return {
      valid: true,
      assignment: { type: "all" },
    };
  }

  const numericId = toNumber(assignmentId);
  if (numericId == null) {
    return {
      valid: false,
      error: "Please select a valid assignment target.",
    };
  }

  if (assignmentType === "center") {
    if (scopeType !== 1) {
      return {
        valid: false,
        error: "Center assignment is only allowed for system surveys.",
      };
    }

    if (!includesNumericId(unbrandedCenterIds, numericId)) {
      return {
        valid: false,
        error: "Only unbranded centers can be assigned in system scope.",
      };
    }
  }

  if (assignmentType === "course") {
    if (scopeType === 1) {
      if (selectedCourseCenterId == null) {
        return {
          valid: false,
          error:
            "Select an unbranded center before choosing a course assignment.",
        };
      }

      if (!includesNumericId(unbrandedCenterIds, selectedCourseCenterId)) {
        return {
          valid: false,
          error: "System course assignment requires an unbranded center.",
        };
      }
    }

    if (
      scopeType === 2 &&
      selectedCourseCenterId != null &&
      selectedCourseCenterId !== surveyCenterId
    ) {
      return {
        valid: false,
        error: "Course must belong to the survey center.",
      };
    }
  }

  if (assignmentType === "user") {
    if (
      scopeType === 2 &&
      selectedStudentCenterId != null &&
      selectedStudentCenterId !== surveyCenterId
    ) {
      return {
        valid: false,
        error: "User must belong to the survey center.",
      };
    }
  }

  if (assignmentType === "video") {
    if (scopeType !== 2) {
      return {
        valid: false,
        error: "Video assignment is only allowed for center surveys.",
      };
    }

    if (selectedVideoIsFullPlay !== true) {
      return {
        valid: false,
        error:
          "Video assignment requires full-play eligible videos (is_full_play=true).",
      };
    }
  }

  return {
    valid: true,
    assignment: {
      type: assignmentType,
      id: numericId,
    },
  };
}
