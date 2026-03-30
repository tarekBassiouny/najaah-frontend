import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ParentStudentDetailPage from "@/app/(portal)/portal/parent/(app)/children/[studentId]/page";
import { renderWithQueryProvider } from "../../../setupHelpers";

const mockParams = {
  studentId: "42",
};

const mockUseParentStudentDetail = vi.fn();
const mockUseParentStudentEnrollments = vi.fn();
const mockUseParentStudentWeeklyActivity = vi.fn();

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
  useParentStudentWeeklyActivity: (...args: unknown[]) =>
    mockUseParentStudentWeeklyActivity(...args),
}));

describe("ParentStudentDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseParentStudentDetail.mockReturnValue({
      data: null,
      isLoading: false,
    });
    mockUseParentStudentEnrollments.mockReturnValue({
      data: [],
      isLoading: false,
    });
    mockUseParentStudentWeeklyActivity.mockReturnValue({
      data: null,
      isLoading: false,
    });
  });

  it("renders loading state while queries are pending", () => {
    mockUseParentStudentDetail.mockReturnValue({
      data: null,
      isLoading: true,
    });

    renderWithQueryProvider(<ParentStudentDetailPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders the not-found state when the student detail is missing", () => {
    renderWithQueryProvider(<ParentStudentDetailPage />);

    expect(screen.getByText("Student detail unavailable")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This linked student could not be loaded for the current parent session.",
      ),
    ).toBeInTheDocument();
  });

  it("renders student stats and course links when data is available", () => {
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
    mockUseParentStudentWeeklyActivity.mockReturnValue({
      data: {
        centerId: 7,
        totalDays: 7,
        totals: {
          watchDurationSeconds: 5400,
          attendanceCount: 2,
          solvedAssessmentsCount: 4,
        },
        daily: [],
      },
      isLoading: false,
    });

    renderWithQueryProvider(<ParentStudentDetailPage />);

    expect(screen.getByText("Salma Nabil")).toBeInTheDocument();
    expect(screen.getByText("Nasr City Center")).toBeInTheDocument();
    expect(screen.getByText("Grade 8")).toBeInTheDocument();
    expect(screen.getByText("Future School")).toBeInTheDocument();
    expect(screen.getByText("90m")).toBeInTheDocument();
    expect(screen.getByText("Integrated Science")).toBeInTheDocument();
    expect(screen.getByText("Open course")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Integrated Science/i }),
    ).toHaveAttribute("href", "/portal/parent/children/42/courses/98");
  });
});
