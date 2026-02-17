import { describe, expect, it } from "vitest";
import {
  getScopeAssignmentTypes,
  validateSurveyAssignment,
} from "@/features/surveys/lib/assignment-rules";

describe("survey assignment rules", () => {
  it("returns scope-specific assignment types", () => {
    expect(getScopeAssignmentTypes(1)).toEqual([
      "all",
      "center",
      "course",
      "user",
    ]);
    expect(getScopeAssignmentTypes(2)).toEqual([
      "all",
      "course",
      "video",
      "user",
    ]);
  });

  it("accepts all without id", () => {
    const result = validateSurveyAssignment({
      scopeType: 1,
      assignmentType: "all",
      assignmentId: null,
      surveyCenterId: null,
      unbrandedCenterIds: [10],
    });

    expect(result).toEqual({
      valid: true,
      assignment: { type: "all" },
    });
  });

  it("rejects system center assignment when center is not unbranded", () => {
    const result = validateSurveyAssignment({
      scopeType: 1,
      assignmentType: "center",
      assignmentId: "20",
      surveyCenterId: null,
      unbrandedCenterIds: [10],
    });

    expect(result.valid).toBe(false);
    expect(result).toMatchObject({
      error: "Only unbranded centers can be assigned in system scope.",
    });
  });

  it("rejects system course assignment without unbranded course center", () => {
    const result = validateSurveyAssignment({
      scopeType: 1,
      assignmentType: "course",
      assignmentId: "33",
      surveyCenterId: null,
      selectedCourseCenterId: null,
      unbrandedCenterIds: [10],
    });

    expect(result.valid).toBe(false);
    expect(result).toMatchObject({
      error: "Select an unbranded center before choosing a course assignment.",
    });
  });

  it("accepts system user assignment and delegates eligibility to target-students endpoint", () => {
    const result = validateSurveyAssignment({
      scopeType: 1,
      assignmentType: "user",
      assignmentId: "12",
      surveyCenterId: null,
      selectedStudentCenterId: 90,
      unbrandedCenterIds: [10],
    });

    expect(result).toEqual({
      valid: true,
      assignment: { type: "user", id: 12 },
    });
  });

  it("allows system user assignment when unbranded centers are not preloaded", () => {
    const result = validateSurveyAssignment({
      scopeType: 1,
      assignmentType: "user",
      assignmentId: "12",
      surveyCenterId: null,
      selectedStudentCenterId: 90,
      unbrandedCenterIds: [],
    });

    expect(result).toEqual({
      valid: true,
      assignment: { type: "user", id: 12 },
    });
  });

  it("rejects center user assignment for a different center", () => {
    const result = validateSurveyAssignment({
      scopeType: 2,
      assignmentType: "user",
      assignmentId: "12",
      surveyCenterId: 5,
      selectedStudentCenterId: 9,
    });

    expect(result.valid).toBe(false);
    expect(result).toMatchObject({
      error: "User must belong to the survey center.",
    });
  });

  it("rejects center video assignment when full-play flag is false", () => {
    const result = validateSurveyAssignment({
      scopeType: 2,
      assignmentType: "video",
      assignmentId: "77",
      surveyCenterId: 3,
      selectedVideoIsFullPlay: false,
    });

    expect(result.valid).toBe(false);
    expect(result).toMatchObject({
      error:
        "Video assignment requires full-play eligible videos (is_full_play=true).",
    });
  });

  it("coerces assignment id to number", () => {
    const result = validateSurveyAssignment({
      scopeType: 2,
      assignmentType: "course",
      assignmentId: "45",
      surveyCenterId: 5,
      selectedCourseCenterId: 5,
    });

    expect(result).toEqual({
      valid: true,
      assignment: { type: "course", id: 45 },
    });
  });

  it("rejects center-scoped assignment when center is missing", () => {
    const result = validateSurveyAssignment({
      scopeType: 2,
      assignmentType: "course",
      assignmentId: "45",
      surveyCenterId: null,
      selectedCourseCenterId: 5,
    });

    expect(result.valid).toBe(false);
    expect(result).toMatchObject({
      error: "Center-scoped surveys require a valid center.",
    });
  });
});
