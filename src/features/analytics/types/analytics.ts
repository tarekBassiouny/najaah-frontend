export type AnalyticsFilters = {
  center_id?: string | number;
  from?: string;
  to?: string;
  timezone?: string;
};

export type AnalyticsMeta = {
  range: {
    from: string | null;
    to: string | null;
  };
  center_id: number | null;
  timezone: string | null;
  generated_at: string | null;
};

export type TopCourseMetric = {
  course_id: number;
  title: string | null;
  enrollments: number;
};

export type CenterLearnersMetric = {
  center_id: number | null;
  students: number;
};

export type AnalyticsOverviewMetrics = {
  total_centers: number;
  active_centers: number;
  centers_by_type: {
    unbranded: number;
    branded: number;
  };
  total_courses: number;
  published_courses: number;
  total_enrollments: number;
  active_enrollments: number;
  daily_active_learners: number;
};

export type AnalyticsOverview = {
  meta: AnalyticsMeta;
  overview: AnalyticsOverviewMetrics;
};

export type AnalyticsCoursesMedia = {
  meta: AnalyticsMeta;
  courses: {
    by_status: {
      draft: number;
      uploading: number;
      ready: number;
      published: number;
      archived: number;
    };
    ready_to_publish: number;
    blocked_by_media: number;
    top_by_enrollments: TopCourseMetric[];
  };
  media: {
    videos: {
      total: number;
      by_upload_status: {
        pending: number;
        uploading: number;
        processing: number;
        ready: number;
        failed: number;
      };
      by_lifecycle_status: {
        pending: number;
        processing: number;
        ready: number;
      };
    };
    pdfs: {
      total: number;
      by_upload_status: {
        pending: number;
        processing: number;
        ready: number;
      };
    };
  };
};

export type AnalyticsLearnersEnrollments = {
  meta: AnalyticsMeta;
  learners: {
    total_students: number;
    active_students: number;
    new_students: number;
    by_center: CenterLearnersMetric[];
  };
  enrollments: {
    by_status: {
      active: number;
      pending: number;
      deactivated: number;
      cancelled: number;
    };
    top_courses: TopCourseMetric[];
  };
};

export type AnalyticsDevicesRequests = {
  meta: AnalyticsMeta;
  devices: {
    total: number;
    active: number;
    revoked: number;
    pending: number;
    changes: {
      pending: number;
      approved: number;
      rejected: number;
      pre_approved: number;
      by_source: {
        mobile: number;
        otp: number;
        admin: number;
      };
    };
  };
  requests: {
    extra_views: {
      pending: number;
      approved: number;
      rejected: number;
      approval_rate: number;
      avg_decision_hours: number;
    };
    enrollment: {
      pending: number;
      approved: number;
      rejected: number;
    };
  };
};
