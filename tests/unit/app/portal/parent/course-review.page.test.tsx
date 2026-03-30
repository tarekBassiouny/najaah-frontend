import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ParentCourseReviewPage from "@/app/(portal)/portal/parent/(app)/children/[studentId]/courses/[courseId]/page";
import { renderWithQueryProvider } from "../../../setupHelpers";

const mockParams = {
  studentId: "42",
  courseId: "98",
};

const mockUseParentStudentDetail = vi.fn();
const mockUseParentStudentEnrollments = vi.fn();
const mockUseParentStudentCourseProgress = vi.fn();
const mockUseParentStudentCourseQuizAttempts = vi.fn();
const mockUseParentStudentCourseAssignments = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  useParams: () => mockParams,
}));

vi.mock("@/features/portal/hooks/use-parent-portal", () => ({
  useParentStudentDetail: (...args: unknown[]) =>
    mockUseParentStudentDetail(...args),
  useParentStudentEnrollments: (...args: unknown[]) =>
    mockUseParentStudentEnrollments(...args),
  useParentStudentCourseProgress: (...args: unknown[]) =>
    mockUseParentStudentCourseProgress(...args),
  useParentStudentCourseQuizAttempts: (...args: unknown[]) =>
    mockUseParentStudentCourseQuizAttempts(...args),
  useParentStudentCourseAssignments: (...args: unknown[]) =>
    mockUseParentStudentCourseAssignments(...args),
}));

describe("ParentCourseReviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseParentStudentDetail.mockReturnValue({
      data: {
        id: 42,
        name: "Salma Nabil",
        phone: "201001234567",
        centerName: "Nasr City Center",
        centerId: 7,
        gradeName: "Grade 8",
        schoolName: "Future School",
      },
      isLoading: false,
    });
    mockUseParentStudentEnrollments.mockReturnValue({
      data: [
        {
          id: 11,
          courseId: 98,
          courseTitle: "Integrated Science",
          status: "active",
          expiresAt: null,
        },
      ],
      isLoading: false,
    });
    mockUseParentStudentCourseProgress.mockReturnValue({
      data: {
        quizzes: {
          total: 3,
          completed: 2,
          passed: 2,
          required: 2,
          requiredPassed: 2,
        },
        assignments: {
          total: 2,
          completed: 1,
          passed: 1,
          required: 1,
          requiredPassed: 1,
        },
        learningAssets: {
          total: 5,
          completed: 4,
          inProgress: 1,
        },
        overallCompletionPercentage: 82,
        overallContentCompletionPercentage: 75,
        allRequiredPassed: true,
      },
      isLoading: false,
    });
    mockUseParentStudentCourseQuizAttempts.mockReturnValue({
      data: [],
      isLoading: false,
    });
    mockUseParentStudentCourseAssignments.mockReturnValue({
      data: [],
      isLoading: false,
    });
  });

  it("renders loading state while course review queries are pending", () => {
    mockUseParentStudentCourseProgress.mockReturnValue({
      data: null,
      isLoading: true,
    });

    renderWithQueryProvider(<ParentCourseReviewPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders quiz and assignment empty states when no review data exists", () => {
    renderWithQueryProvider(<ParentCourseReviewPage />);

    expect(
      screen.getByText("No quiz attempts found for this course yet."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No assignment submissions found for this course yet."),
    ).toBeInTheDocument();
  });

  it("renders progress, quiz attempts, and assignment submissions when data is available", () => {
    mockUseParentStudentCourseQuizAttempts.mockReturnValue({
      data: [
        {
          id: 501,
          quizId: 71,
          quizTitle: "Cells and Systems Quiz",
          attemptNumber: 2,
          status: "submitted",
          startedAt: "2026-03-01T10:00:00Z",
          submittedAt: "2026-03-01T10:18:00Z",
          timeSpentSeconds: 1080,
          score: 18,
          pointsEarned: 18,
          pointsPossible: 20,
          passed: true,
        },
      ],
      isLoading: false,
    });
    mockUseParentStudentCourseAssignments.mockReturnValue({
      data: [
        {
          id: 801,
          assignmentId: 21,
          assignmentTitle: "Lab Reflection",
          status: "graded",
          submittedAt: "2026-03-02T09:30:00Z",
          score: 9,
          scoreAfterPenalty: 8,
          passed: false,
          isLate: true,
          feedback: "Needs clearer evidence",
          gradedAt: "2026-03-03T14:00:00Z",
        },
      ],
      isLoading: false,
    });

    renderWithQueryProvider(<ParentCourseReviewPage />);

    expect(screen.getByText("Integrated Science")).toBeInTheDocument();
    expect(screen.getByText("82%")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("Cells and Systems Quiz")).toBeInTheDocument();
    expect(screen.getByText("Lab Reflection")).toBeInTheDocument();
    expect(screen.getByText("Needs clearer evidence")).toBeInTheDocument();
    expect(screen.getAllByText("Passed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Needs review").length).toBeGreaterThan(0);
  });
});
