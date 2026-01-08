import { getAuthPermissions } from "@/lib/auth-state";

export type Capability =
  | "view_dashboard"
  | "manage_centers"
  | "manage_courses"
  | "manage_videos"
  | "manage_pdfs"
  | "manage_device_change_requests"
  | "manage_extra_view_requests"
  | "view_audit_logs"
  | "manage_students"
  | "manage_instructors"
  | "manage_admin_users"
  | "manage_roles"
  | "view_permissions"
  | "assign_role_permissions";

const capabilityPermissions: Record<Capability, string[]> = {
  view_dashboard: [],
  manage_centers: ["center.manage"],
  manage_courses: ["course.manage"],
  manage_videos: ["video.manage"],
  manage_pdfs: ["pdf.manage"],
  manage_device_change_requests: ["device_change.manage"],
  manage_extra_view_requests: ["extra_view.manage"],
  view_audit_logs: ["audit.view"],
  manage_students: ["enrollment.manage"],
  manage_instructors: ["instructor.manage"],
  manage_admin_users: ["admin.manage"],
  manage_roles: ["role.manage"],
  view_permissions: ["permission.view"],
  assign_role_permissions: ["role.manage"],
};

export function hasCapability(
  capability: Capability,
  userPermissions: string[],
) {
  const required = capabilityPermissions[capability];
  if (!required) return false;
  return required.every((permission) => userPermissions.includes(permission));
}

export function getCapabilities() {
  const permissions = getAuthPermissions();

  if (!permissions) return [];

  return (Object.keys(capabilityPermissions) as Capability[]).filter(
    (capability) => hasCapability(capability, permissions),
  );
}

export function can(capability: Capability) {
  const permissions = getAuthPermissions();
  if (!permissions) return false;
  return hasCapability(capability, permissions);
}
