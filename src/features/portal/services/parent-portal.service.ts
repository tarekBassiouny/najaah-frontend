import { portalHttp } from "@/lib/portal-http";
import type {
  ParentPortalAssignmentSubmission,
  ParentPortalCourseProgress,
  ParentPortalEnrollment,
  ParentPortalLinkedStudent,
  ParentPortalQuizAttempt,
  ParentPortalStudentDetail,
  ParentPortalWeeklyActivity,
} from "@/features/portal/types/parent-portal";

type RawPortalResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

function getRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(
  source: Record<string, unknown> | null,
  keys: string[],
  fallback = "",
): string {
  if (!source) return fallback;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return fallback;
}

function pickNumber(
  source: Record<string, unknown> | null,
  keys: string[],
  fallback = 0,
): number {
  if (!source) return fallback;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function pickBoolean(
  source: Record<string, unknown> | null,
  keys: string[],
  fallback = false,
): boolean {
  if (!source) return fallback;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "boolean") return value;
  }
  return fallback;
}

function normalizeLinkedStudent(
  raw: unknown,
): ParentPortalLinkedStudent | null {
  const record = getRecord(raw);
  if (!record) return null;

  const linkId = pickNumber(record, ["link_id", "id"], 0);
  const studentId = pickNumber(record, ["student_id"], 0);

  if (!linkId || !studentId) return null;

  return {
    linkId,
    studentId,
    name: pickString(record, ["name"], "Student"),
    phone: pickString(record, ["phone"], "—"),
    status: pickString(record, ["status"], "PendingApproval"),
    linkMethod: pickString(record, ["link_method"], "ParentRequested"),
    linkedAt: pickString(record, ["linked_at"], "") || null,
  };
}

function normalizeStudentDetail(
  raw: unknown,
): ParentPortalStudentDetail | null {
  const record = getRecord(raw);
  if (!record) return null;

  const id = pickNumber(record, ["id"], 0);
  if (!id) return null;

  const center = getRecord(record.center);
  const grade = getRecord(record.grade);
  const school = getRecord(record.school);

  return {
    id,
    name: pickString(record, ["name"], "Student"),
    phone: pickString(record, ["phone"], "—"),
    centerId: pickNumber(center, ["id"], 0) || null,
    centerName: pickString(center, ["name"], "") || null,
    gradeName: pickString(grade, ["name"], "") || null,
    schoolName: pickString(school, ["name"], "") || null,
  };
}

function normalizeEnrollment(raw: unknown): ParentPortalEnrollment | null {
  const record = getRecord(raw);
  if (!record) return null;
  const id = pickNumber(record, ["id"], 0);
  if (!id) return null;
  const course = getRecord(record.course);

  return {
    id,
    courseId: pickNumber(course, ["id"], 0) || null,
    courseTitle: pickString(course, ["title"], "Course"),
    thumbnailUrl:
      pickString(course, ["thumbnail", "thumbnail_url"], "") || null,
    status: pickString(record, ["status"], "Active"),
    enrolledAt: pickString(record, ["enrolled_at"], "") || null,
    expiresAt: pickString(record, ["expires_at"], "") || null,
  };
}

function normalizeQuizAttempt(raw: unknown): ParentPortalQuizAttempt | null {
  const record = getRecord(raw);
  if (!record) return null;

  const id = pickNumber(record, ["id"], 0);
  if (!id) return null;
  const quiz = getRecord(record.quiz);

  return {
    id,
    quizId: pickNumber(quiz, ["id"], 0) || null,
    quizTitle: pickString(quiz, ["title"], "Quiz"),
    attemptNumber: pickNumber(record, ["attempt_number"], 1),
    status: pickString(record, ["status"], "Unknown"),
    startedAt: pickString(record, ["started_at"], "") || null,
    submittedAt: pickString(record, ["submitted_at"], "") || null,
    timeSpentSeconds: pickNumber(record, ["time_spent_seconds"], 0) || null,
    score: pickNumber(record, ["score"], 0),
    pointsEarned: pickNumber(record, ["points_earned"], 0),
    pointsPossible: pickNumber(record, ["points_possible"], 0),
    passed:
      getRecord(record) && typeof record.passed === "boolean"
        ? (record.passed as boolean)
        : null,
  };
}

function normalizeAssignmentSubmission(
  raw: unknown,
): ParentPortalAssignmentSubmission | null {
  const record = getRecord(raw);
  if (!record) return null;

  const id = pickNumber(record, ["id"], 0);
  if (!id) return null;
  const assignment = getRecord(record.assignment);

  return {
    id,
    assignmentId: pickNumber(assignment, ["id"], 0) || null,
    assignmentTitle: pickString(assignment, ["title"], "Assignment"),
    status: pickString(record, ["status"], "Unknown"),
    submittedAt: pickString(record, ["submitted_at"], "") || null,
    score: typeof record.score === "number" ? (record.score as number) : null,
    scoreAfterPenalty:
      typeof record.score_after_penalty === "number"
        ? (record.score_after_penalty as number)
        : null,
    passed:
      typeof record.passed === "boolean" ? (record.passed as boolean) : null,
    isLate:
      typeof record.is_late === "boolean" ? (record.is_late as boolean) : null,
    feedback: pickString(record, ["feedback"], "") || null,
    gradedAt: pickString(record, ["graded_at"], "") || null,
  };
}

export async function listParentLinkedStudents(): Promise<
  ParentPortalLinkedStudent[]
> {
  const { data } = await portalHttp.get<RawPortalResponse<unknown[]>>(
    "/api/v1/web/students",
  );

  return (data.data ?? [])
    .map((item) => normalizeLinkedStudent(item))
    .filter((item): item is ParentPortalLinkedStudent => item != null);
}

export async function listParentLinks(): Promise<ParentPortalLinkedStudent[]> {
  const { data } =
    await portalHttp.get<RawPortalResponse<unknown[]>>("/api/v1/web/links");

  return (data.data ?? [])
    .map((item) => normalizeLinkedStudent(item))
    .filter((item): item is ParentPortalLinkedStudent => item != null);
}

export async function getParentStudentDetail(
  studentId: number | string,
): Promise<ParentPortalStudentDetail | null> {
  const { data } = await portalHttp.get<RawPortalResponse<unknown>>(
    `/api/v1/web/students/${studentId}`,
  );

  return normalizeStudentDetail(data.data);
}

export async function listParentStudentEnrollments(
  studentId: number | string,
): Promise<ParentPortalEnrollment[]> {
  const { data } = await portalHttp.get<RawPortalResponse<unknown[]>>(
    `/api/v1/web/students/${studentId}/enrollments`,
  );

  return (data.data ?? [])
    .map((item) => normalizeEnrollment(item))
    .filter((item): item is ParentPortalEnrollment => item != null);
}

export async function getParentStudentCourseProgress(
  studentId: number | string,
  courseId: number | string,
): Promise<ParentPortalCourseProgress | null> {
  const { data } = await portalHttp.get<RawPortalResponse<unknown>>(
    `/api/v1/web/students/${studentId}/courses/${courseId}/progress`,
  );
  const record = getRecord(data.data);
  if (!record) return null;

  const quizzes = getRecord(record.quizzes);
  const assignments = getRecord(record.assignments);
  const learningAssets = getRecord(record.learning_assets);

  return {
    quizzes: {
      total: pickNumber(quizzes, ["total"]),
      completed: pickNumber(quizzes, ["completed"]),
      passed: pickNumber(quizzes, ["passed"]),
      required: pickNumber(quizzes, ["required"]),
      requiredPassed: pickNumber(quizzes, ["required_passed"]),
    },
    assignments: {
      total: pickNumber(assignments, ["total"]),
      completed: pickNumber(assignments, ["completed"]),
      passed: pickNumber(assignments, ["passed"]),
      required: pickNumber(assignments, ["required"]),
      requiredPassed: pickNumber(assignments, ["required_passed"]),
    },
    learningAssets: {
      total: pickNumber(learningAssets, ["total"]),
      completed: pickNumber(learningAssets, ["completed"]),
      inProgress: pickNumber(learningAssets, ["in_progress"]),
    },
    overallCompletionPercentage: pickNumber(record, [
      "overall_completion_percentage",
    ]),
    overallContentCompletionPercentage: pickNumber(record, [
      "overall_content_completion_percentage",
    ]),
    allRequiredPassed: pickBoolean(record, ["all_required_passed"]),
  };
}

export async function listParentStudentCourseQuizAttempts(
  studentId: number | string,
  courseId: number | string,
): Promise<ParentPortalQuizAttempt[]> {
  const { data } = await portalHttp.get<RawPortalResponse<unknown[]>>(
    `/api/v1/web/students/${studentId}/courses/${courseId}/quiz-attempts`,
  );

  return (data.data ?? [])
    .map((item) => normalizeQuizAttempt(item))
    .filter((item): item is ParentPortalQuizAttempt => item != null);
}

export async function listParentStudentCourseAssignments(
  studentId: number | string,
  courseId: number | string,
): Promise<ParentPortalAssignmentSubmission[]> {
  const { data } = await portalHttp.get<RawPortalResponse<unknown[]>>(
    `/api/v1/web/students/${studentId}/courses/${courseId}/assignments`,
  );

  return (data.data ?? [])
    .map((item) => normalizeAssignmentSubmission(item))
    .filter((item): item is ParentPortalAssignmentSubmission => item != null);
}

export async function getParentStudentWeeklyActivity(
  studentId: number | string,
  centerId: number | string,
  days = 7,
): Promise<ParentPortalWeeklyActivity | null> {
  const { data } = await portalHttp.get<
    RawPortalResponse<{
      range?: {
        days?: number;
        timezone?: string;
        start_date?: string;
        end_date?: string;
      };
      series?: Array<{
        date?: string;
        watch_duration_seconds?: number;
        quiz_attempts_count?: number;
        assignment_submissions_count?: number;
      }>;
      totals?: {
        watch_duration_seconds?: number;
        quiz_attempts_count?: number;
        assignment_submissions_count?: number;
      };
    }>
  >(`/api/v1/web/students/${studentId}/centers/${centerId}/activity/weekly`, {
    params: { days },
  });

  if (!data.data) return null;

  return {
    range: {
      days: data.data.range?.days ?? days,
      timezone: data.data.range?.timezone ?? null,
      startDate: data.data.range?.start_date ?? null,
      endDate: data.data.range?.end_date ?? null,
    },
    series: (data.data.series ?? []).map((entry) => ({
      date: entry.date ?? "",
      watchDurationSeconds: entry.watch_duration_seconds ?? 0,
      quizAttemptsCount: entry.quiz_attempts_count ?? 0,
      assignmentSubmissionsCount: entry.assignment_submissions_count ?? 0,
    })),
    totals: {
      watchDurationSeconds: data.data.totals?.watch_duration_seconds ?? 0,
      quizAttemptsCount: data.data.totals?.quiz_attempts_count ?? 0,
      assignmentSubmissionsCount:
        data.data.totals?.assignment_submissions_count ?? 0,
    },
  };
}
