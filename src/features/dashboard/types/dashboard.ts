export type DashboardActivityActor = {
  id: string | number | null;
  name: string | null;
};

export type DashboardActivity = {
  id: string | number;
  action: string;
  description: string;
  actor: DashboardActivityActor | null;
  days_ago: number | null;
  created_at: string | null;
};

export type DashboardStats = {
  total_courses: number;
  total_students: number;
  active_enrollments: {
    count: number;
    change_percent: number;
    trend: string | null;
  };
  pending_approvals: {
    total: number;
    enrollment_requests: number;
    device_change_requests: number;
    extra_view_requests: number;
  };
};

export type DashboardData = {
  stats: DashboardStats;
  recent_activity: DashboardActivity[];
};

export type DashboardQueryParams = {
  is_platform_admin: boolean;
  center_id?: string | number;
};
