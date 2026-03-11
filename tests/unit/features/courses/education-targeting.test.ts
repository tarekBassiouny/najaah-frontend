import { describe, expect, it } from "vitest";
import {
  getCourseEducationTargetingValues,
  normalizeIdList,
} from "@/features/courses/utils/education-targeting";

describe("education-targeting utils", () => {
  it("normalizes mixed id shapes into unique string IDs", () => {
    expect(
      normalizeIdList([
        1,
        "2",
        " 3 ",
        { id: 4 },
        { value: "5" },
        { grade_id: 6 },
        { school_id: "7" },
        { college_id: "8" },
        "2",
        null,
        "",
      ]),
    ).toEqual(["1", "2", "3", "4", "5", "6", "7", "8"]);
  });

  it("reads saved course targeting from relation-style arrays and coerces booleans", () => {
    const values = getCourseEducationTargetingValues({
      show_for_all_students: 0,
      grades: [{ id: 11 }],
      schools: { data: [{ id: "22" }] },
      colleges: [{ college_id: 33 }],
    } as never);

    expect(values).toEqual({
      showForAllStudents: false,
      gradeIds: ["11"],
      schoolIds: ["22"],
      collegeIds: ["33"],
    });
  });

  it("keeps explicit empty id arrays as empty", () => {
    const values = getCourseEducationTargetingValues({
      show_for_all_students: false,
      grade_ids: [],
      grades: [{ id: 11 }],
      school_ids: [],
      schools: { data: [{ id: 22 }] },
      college_ids: [],
      colleges: [{ id: 33 }],
    } as never);

    expect(values).toEqual({
      showForAllStudents: false,
      gradeIds: [],
      schoolIds: [],
      collegeIds: [],
    });
  });

  it("reads saved targeting from education_targets payload shape", () => {
    const values = getCourseEducationTargetingValues({
      show_for_all_students: false,
      education_targets: {
        grades: [{ id: 1, name: "Grade 1" }],
        schools: [{ id: "2", name: "School 2" }],
        colleges: [{ id: 3, name: "College 3" }],
      },
    } as never);

    expect(values).toEqual({
      showForAllStudents: false,
      gradeIds: ["1"],
      schoolIds: ["2"],
      collegeIds: ["3"],
    });
  });
});
