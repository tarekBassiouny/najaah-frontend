import { describe, expect, it } from "vitest";
import { buildManualEntryHref } from "@/features/course-assets/lib/build-manual-entry-href";

describe("buildManualEntryHref", () => {
  it("builds a quiz create route with source metadata", () => {
    expect(
      buildManualEntryHref({
        centerId: "7",
        courseId: "11",
        targetType: "quiz",
        sourceType: "video",
        sourceId: 15,
        sourceTitle: "Lesson 3",
        returnTo: "/centers/7/courses/11/assets",
      }),
    ).toBe(
      "/centers/7/courses/11/quizzes?attachable_type=video&attachable_id=15&open_create=1&return_to=%2Fcenters%2F7%2Fcourses%2F11%2Fassets&source_label=Lesson+3",
    );
  });

  it("omits optional params when title and return target are blank", () => {
    expect(
      buildManualEntryHref({
        centerId: "7",
        courseId: "11",
        targetType: "assignment",
        sourceType: "pdf",
        sourceId: 21,
        sourceTitle: "   ",
        returnTo: " ",
      }),
    ).toBe(
      "/centers/7/courses/11/assignments?attachable_type=pdf&attachable_id=21&open_create=1",
    );
  });
});
