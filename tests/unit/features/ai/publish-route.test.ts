import { describe, expect, it } from "vitest";
import { resolveAIPublishRoute } from "@/features/ai/lib/publish-route";

describe("resolveAIPublishRoute", () => {
  it("resolves quiz target route", () => {
    expect(
      resolveAIPublishRoute({
        centerId: 3,
        courseId: 8,
        targetType: "quiz",
        targetId: 12,
      }),
    ).toBe("/centers/3/courses/8/quizzes?highlight_id=12");
  });

  it("resolves assignment target route", () => {
    expect(
      resolveAIPublishRoute({
        centerId: 3,
        courseId: 8,
        targetType: "assignment",
        targetId: 9,
      }),
    ).toBe("/centers/3/courses/8/assignments?highlight_id=9");
  });

  it("uses ai-content fallback route for non-CRUD targets", () => {
    expect(
      resolveAIPublishRoute({
        centerId: 3,
        courseId: 8,
        targetType: "summary",
        targetId: 99,
      }),
    ).toBe("/centers/3/ai-content?published_target=summary&target_id=99");
  });
});
