import type { Capability } from "@/lib/capabilities";

export type StudentRequestType =
  | "enrollments"
  | "extra-view"
  | "device-change"
  | "video-access";

export type StudentRequestDefinition = {
  type: StudentRequestType;
  label: string;
  href: string;
  capability: Capability;
};

export const DEFAULT_STUDENT_REQUEST_TYPE: StudentRequestType = "enrollments";

export const STUDENT_REQUEST_DEFINITIONS: readonly StudentRequestDefinition[] =
  [
    {
      type: "enrollments",
      label: "Enrollment Requests",
      href: "/student-requests/enrollments",
      capability: "manage_enrollments",
    },
    {
      type: "extra-view",
      label: "Extra View Requests",
      href: "/student-requests/extra-view",
      capability: "manage_extra_view_requests",
    },
    {
      type: "device-change",
      label: "Device Change Requests",
      href: "/student-requests/device-change",
      capability: "manage_device_change_requests",
    },
    {
      type: "video-access",
      label: "Video Access",
      href: "/student-requests/video-access",
      capability: "manage_video_access",
    },
  ];

export function isStudentRequestType(
  value: string,
): value is StudentRequestType {
  return STUDENT_REQUEST_DEFINITIONS.some((item) => item.type === value);
}
