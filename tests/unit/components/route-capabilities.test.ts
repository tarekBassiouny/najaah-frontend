import { describe, expect, it } from "vitest";
import { getRouteCapabilities } from "@/components/Layouts/sidebar/data";

describe("getRouteCapabilities", () => {
  it("maps center course quizzes routes to manage_quizzes", () => {
    expect(getRouteCapabilities("/centers/3/courses/4/quizzes", false)).toEqual(
      ["manage_quizzes"],
    );

    expect(
      getRouteCapabilities("/centers/3/courses/4/quizzes/22", false),
    ).toEqual(["manage_quizzes"]);

    expect(getRouteCapabilities("/centers/3/quizzes/22", false)).toEqual([
      "manage_quizzes",
    ]);
  });

  it("maps center course assignments routes to manage_assignments", () => {
    expect(
      getRouteCapabilities("/centers/3/courses/4/assignments", false),
    ).toEqual(["manage_assignments"]);

    expect(
      getRouteCapabilities("/centers/3/courses/4/assignments/22", false),
    ).toEqual(["manage_assignments"]);
  });

  it("maps course assets and learning assets routes", () => {
    expect(getRouteCapabilities("/centers/3/courses/4/assets", false)).toEqual([
      "manage_courses",
    ]);

    expect(getRouteCapabilities("/centers/3/learning-assets/9", false)).toEqual(
      ["manage_learning_assets"],
    );
  });

  it("keeps ai-content route mapped to generate_ai_content", () => {
    expect(getRouteCapabilities("/centers/3/ai-content", false)).toEqual([
      "generate_ai_content",
    ]);
  });

  it("matches shared wildcard route rules with multiple dynamic segments", () => {
    expect(
      getRouteCapabilities(
        "/centers/3/student-requests/video-access/77",
        false,
      ),
    ).toEqual(["manage_video_access"]);
  });

  it("keeps center-admin settings mapped without treating settings as a center id", () => {
    expect(getRouteCapabilities("/centers/settings", false)).toEqual([
      "view_settings",
    ]);
  });

  it("maps center-scoped settings routes to view_settings", () => {
    expect(getRouteCapabilities("/centers/3/settings", false)).toEqual([
      "view_settings",
    ]);
  });

  it("maps managed center settings routes to view_settings", () => {
    expect(getRouteCapabilities("/manage/centers/3/settings", true)).toEqual([
      "view_settings",
    ]);
  });

  it("returns null for unknown routes", () => {
    expect(getRouteCapabilities("/unknown/path", false)).toBeNull();
  });
});
