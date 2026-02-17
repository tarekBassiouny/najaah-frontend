import { getAuthPermissions } from "@/lib/auth-state";

export type Capability =
  | "view_dashboard"
  | "manage_analytics"
  | "view_agents"
  | "execute_agents"
  | "execute_content_publishing_agent"
  | "execute_bulk_enrollment_agent"
  | "manage_centers"
  | "manage_courses"
  | "publish_courses"
  | "manage_sections"
  | "manage_surveys"
  | "manage_videos"
  | "upload_videos"
  | "override_video_playback"
  | "manage_pdfs"
  | "manage_enrollments"
  | "manage_students"
  | "manage_device_change_requests"
  | "manage_extra_view_requests"
  | "manage_instructors"
  | "manage_admin_users"
  | "manage_roles"
  | "view_permissions"
  | "assign_role_permissions"
  | "view_audit_logs"
  | "manage_notifications"
  | "manage_settings"
  | "view_settings";

const capabilityPermissions: Record<Capability, string[]> = {
  view_dashboard: [],
  manage_analytics: ["analytics.manage"],
  view_agents: ["agent.execute"],
  execute_agents: ["agent.execute"],
  execute_content_publishing_agent: ["agent.content_publishing"],
  execute_bulk_enrollment_agent: ["agent.enrollment.bulk"],
  manage_centers: ["center.manage"],
  manage_courses: ["course.manage"],
  publish_courses: ["course.publish"],
  manage_sections: ["section.manage"],
  manage_surveys: ["survey.manage"],
  manage_videos: ["video.manage"],
  upload_videos: ["video.upload"],
  override_video_playback: ["video.playback.override"],
  manage_pdfs: ["pdf.manage"],
  manage_enrollments: ["enrollment.manage"],
  manage_students: ["student.manage"],
  manage_device_change_requests: ["device_change.manage"],
  manage_extra_view_requests: ["extra_view.manage"],
  manage_instructors: ["instructor.manage"],
  manage_admin_users: ["admin.manage"],
  manage_roles: ["role.manage"],
  view_permissions: ["permission.view"],
  assign_role_permissions: ["role.manage"],
  view_audit_logs: ["audit.view"],
  manage_notifications: ["notification.manage"],
  manage_settings: ["settings.manage"],
  view_settings: ["settings.view"],
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
