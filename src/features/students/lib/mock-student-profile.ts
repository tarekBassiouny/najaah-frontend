export type MockDeviceChangeLog = {
  id: string;
  deviceName: string;
  deviceId: string;
  changedAt: string;
  reason: string;
};

export type MockCourseVideo = {
  id: string;
  name: string;
  watchCount: number;
  watchLimit: number;
};

export type MockEnrolledCourse = {
  id: string;
  title: string;
  status: "active" | "completed" | "paused";
  progress: number;
  enrolledAt: string;
  videos: MockCourseVideo[];
};

export type MockStudentProfile = {
  id: string;
  name: string;
  phone: string;
  status: "active" | "inactive" | "banned";
  lastActivity: string;
  activeDevice: string;
  totalEnrollments: number;
  deviceChangeLog: MockDeviceChangeLog[];
  enrolledCourses: MockEnrolledCourse[];
};

const COURSE_TEMPLATES = [
  {
    id: "course-1",
    title: "React Fundamentals",
    status: "active" as const,
    progress: 62,
    enrolledAt: "2026-01-18 10:45",
    videos: [
      { id: "video-1", name: "Component Basics", watchCount: 2, watchLimit: 5 },
      { id: "video-2", name: "State and Props", watchCount: 1, watchLimit: 5 },
      { id: "video-3", name: "Forms and Events", watchCount: 0, watchLimit: 5 },
    ],
  },
  {
    id: "course-2",
    title: "TypeScript in Practice",
    status: "completed" as const,
    progress: 100,
    enrolledAt: "2025-12-03 14:20",
    videos: [
      { id: "video-4", name: "Type System Deep Dive", watchCount: 3, watchLimit: 3 },
      { id: "video-5", name: "Generics and Utility Types", watchCount: 2, watchLimit: 3 },
    ],
  },
  {
    id: "course-3",
    title: "Next.js Admin Patterns",
    status: "paused" as const,
    progress: 28,
    enrolledAt: "2026-02-01 09:10",
    videos: [
      { id: "video-6", name: "Routing Strategies", watchCount: 1, watchLimit: 4 },
      { id: "video-7", name: "Data Fetching Layers", watchCount: 0, watchLimit: 4 },
    ],
  },
  {
    id: "course-4",
    title: "Node.js API Design",
    status: "active" as const,
    progress: 44,
    enrolledAt: "2026-01-09 16:30",
    videos: [
      { id: "video-8", name: "RESTful Endpoints", watchCount: 1, watchLimit: 4 },
      { id: "video-9", name: "Validation & Error Handling", watchCount: 1, watchLimit: 4 },
      { id: "video-10", name: "Pagination Patterns", watchCount: 0, watchLimit: 4 },
    ],
  },
  {
    id: "course-5",
    title: "SQL for Product Teams",
    status: "completed" as const,
    progress: 100,
    enrolledAt: "2025-10-27 12:15",
    videos: [
      { id: "video-11", name: "SELECT Mastery", watchCount: 3, watchLimit: 3 },
      { id: "video-12", name: "JOINs in Real Scenarios", watchCount: 3, watchLimit: 3 },
      { id: "video-13", name: "CTEs and Window Functions", watchCount: 2, watchLimit: 3 },
    ],
  },
  {
    id: "course-6",
    title: "UI/UX for Admin Panels",
    status: "active" as const,
    progress: 73,
    enrolledAt: "2026-01-29 11:05",
    videos: [
      { id: "video-14", name: "Information Density", watchCount: 2, watchLimit: 5 },
      { id: "video-15", name: "Table Interactions", watchCount: 2, watchLimit: 5 },
      { id: "video-16", name: "Action Hierarchy", watchCount: 1, watchLimit: 5 },
    ],
  },
  {
    id: "course-7",
    title: "Testing React Applications",
    status: "paused" as const,
    progress: 36,
    enrolledAt: "2026-02-02 18:40",
    videos: [
      { id: "video-17", name: "Component Unit Tests", watchCount: 1, watchLimit: 4 },
      { id: "video-18", name: "Querying by Role", watchCount: 0, watchLimit: 4 },
    ],
  },
  {
    id: "course-8",
    title: "Performance Optimization",
    status: "active" as const,
    progress: 19,
    enrolledAt: "2026-02-06 09:55",
    videos: [
      { id: "video-19", name: "Bundle Analysis", watchCount: 0, watchLimit: 4 },
      { id: "video-20", name: "Memoization Tradeoffs", watchCount: 0, watchLimit: 4 },
      { id: "video-21", name: "Rendering Budgets", watchCount: 0, watchLimit: 4 },
    ],
  },
];

const DEVICE_LOG_TEMPLATE: MockDeviceChangeLog[] = [
  {
    id: "log-1",
    deviceName: "iPhone 14 Pro",
    deviceId: "IOS-7F3A-91C2",
    changedAt: "2026-01-28 19:24",
    reason: "Previous phone replaced",
  },
  {
    id: "log-2",
    deviceName: "iPad Air",
    deviceId: "IOS-B3D2-10A8",
    changedAt: "2025-11-16 08:52",
    reason: "Tablet request approved",
  },
];

export function getMockStudentProfile(
  studentId: string,
  centerId: string,
): MockStudentProfile {
  const numericId = Number(studentId);
  const suffix = Number.isNaN(numericId) ? studentId.slice(-3) : String(numericId);

  return {
    id: studentId,
    name: `Student ${suffix}`,
    phone: "+20 10 1234 5678",
    status: numericId % 7 === 0 ? "inactive" : "active",
    lastActivity: "2026-02-07 22:10",
    activeDevice: `Samsung Galaxy S24 (CTR-${centerId}-STD-${suffix})`,
    totalEnrollments: COURSE_TEMPLATES.length,
    deviceChangeLog: DEVICE_LOG_TEMPLATE,
    enrolledCourses: COURSE_TEMPLATES,
  };
}
