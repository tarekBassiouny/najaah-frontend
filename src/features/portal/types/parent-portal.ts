import type { StudentPortalWeeklyActivity } from "@/features/portal/types/student-portal";

export type ParentPortalLinkedStudent = {
  linkId: number;
  studentId: number;
  name: string;
  phone: string;
  status: "Active" | "PendingApproval" | "Revoked" | string;
  linkMethod: "AdminManaged" | "AutoMatched" | "ParentRequested" | string;
  linkedAt: string | null;
};

export type ParentPortalStudentDetail = {
  id: number;
  name: string;
  phone: string;
  centerName?: string | null;
  centerId?: number | null;
  gradeName?: string | null;
  schoolName?: string | null;
};

export type ParentPortalEnrollment = {
  id: number;
  courseId: number | null;
  courseTitle: string;
  thumbnailUrl?: string | null;
  status: string;
  enrolledAt?: string | null;
  expiresAt?: string | null;
};

export type ParentPortalCourseProgress = {
  quizzes: {
    total: number;
    completed: number;
    passed: number;
    required: number;
    requiredPassed: number;
  };
  assignments: {
    total: number;
    completed: number;
    passed: number;
    required: number;
    requiredPassed: number;
  };
  learningAssets: {
    total: number;
    completed: number;
    inProgress: number;
  };
  overallCompletionPercentage: number;
  overallContentCompletionPercentage: number;
  allRequiredPassed: boolean;
};

export type ParentPortalWeeklyActivity = StudentPortalWeeklyActivity;

export type ParentPortalQuizAttempt = {
  id: number;
  quizId: number | null;
  quizTitle: string;
  attemptNumber: number;
  status: string;
  startedAt: string | null;
  submittedAt: string | null;
  timeSpentSeconds: number | null;
  score: number | null;
  pointsEarned: number | null;
  pointsPossible: number | null;
  passed: boolean | null;
};

export type ParentPortalAssignmentSubmission = {
  id: number;
  assignmentId: number | null;
  assignmentTitle: string;
  status: string;
  submittedAt: string | null;
  score: number | null;
  scoreAfterPenalty: number | null;
  passed: boolean | null;
  isLate: boolean | null;
  feedback: string | null;
  gradedAt: string | null;
};
