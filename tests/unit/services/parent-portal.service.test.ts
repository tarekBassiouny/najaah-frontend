import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  listParentStudentCourseAssignments,
  listParentStudentCourseQuizAttempts,
} from "@/features/portal/services/parent-portal.service";
import { portalHttp } from "@/lib/portal-http";

vi.mock("@/lib/portal-http", () => ({
  portalHttp: {
    get: vi.fn(),
  },
}));

const mockedPortalHttp = portalHttp as unknown as {
  get: ReturnType<typeof vi.fn>;
};

describe("parent-portal.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes quiz attempts for a parent course review", async () => {
    mockedPortalHttp.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            id: 101,
            quiz: {
              id: 7,
              title: "Chapter 1 Quiz",
            },
            attempt_number: 2,
            status: "Graded",
            started_at: "2026-03-20T14:00:00.000000Z",
            submitted_at: "2026-03-20T14:30:00.000000Z",
            time_spent_seconds: 1800,
            score: 85,
            points_earned: 17,
            points_possible: 20,
            passed: true,
          },
        ],
      },
    });

    const result = await listParentStudentCourseQuizAttempts(42, 3);

    expect(mockedPortalHttp.get).toHaveBeenCalledWith(
      "/api/v1/web/students/42/courses/3/quiz-attempts",
    );
    expect(result).toEqual([
      {
        id: 101,
        quizId: 7,
        quizTitle: "Chapter 1 Quiz",
        attemptNumber: 2,
        status: "Graded",
        startedAt: "2026-03-20T14:00:00.000000Z",
        submittedAt: "2026-03-20T14:30:00.000000Z",
        timeSpentSeconds: 1800,
        score: 85,
        pointsEarned: 17,
        pointsPossible: 20,
        passed: true,
      },
    ]);
  });

  it("normalizes assignment submissions for a parent course review", async () => {
    mockedPortalHttp.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            id: 55,
            assignment: {
              id: 12,
              title: "Essay Assignment",
            },
            status: "Graded",
            submitted_at: "2026-03-18T09:00:00.000000Z",
            score: 90,
            score_after_penalty: 85,
            passed: true,
            is_late: false,
            feedback: "Good work!",
            graded_at: "2026-03-19T14:00:00.000000Z",
          },
        ],
      },
    });

    const result = await listParentStudentCourseAssignments(42, 3);

    expect(mockedPortalHttp.get).toHaveBeenCalledWith(
      "/api/v1/web/students/42/courses/3/assignments",
    );
    expect(result).toEqual([
      {
        id: 55,
        assignmentId: 12,
        assignmentTitle: "Essay Assignment",
        status: "Graded",
        submittedAt: "2026-03-18T09:00:00.000000Z",
        score: 90,
        scoreAfterPenalty: 85,
        passed: true,
        isLate: false,
        feedback: "Good work!",
        gradedAt: "2026-03-19T14:00:00.000000Z",
      },
    ]);
  });
});
