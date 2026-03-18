export type AnalyticsFilters = {
  center_id?: string | number;
  from?: string;
  to?: string;
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

/* ── Trend data points (Phase 1 & 3 & 4) ─────────────────────────── */

export type TimeSeriesPoint = {
  date: string;
  count: number;
};

export type StatusTimeSeriesPoint = {
  date: string;
  active: number;
  pending: number;
  cancelled?: number;
  deactivated?: number;
};

export type RequestTimeSeriesPoint = {
  date: string;
  pending: number;
  approved: number;
  rejected: number;
};

/* ── Overview ─────────────────────────────────────────────────────── */

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

/** Phase 2 — period comparison for trend arrows on stats cards */
export type AnalyticsOverviewPreviousPeriod = {
  total_centers?: number;
  active_centers?: number;
  total_courses?: number;
  published_courses?: number;
  total_enrollments?: number;
  active_enrollments?: number;
  daily_active_learners?: number;
};

/** Phase 1 — daily trend lines */
export type AnalyticsOverviewTrends = {
  enrollments_over_time?: TimeSeriesPoint[];
  active_learners_over_time?: TimeSeriesPoint[];
  courses_created_over_time?: TimeSeriesPoint[];
};

export type AnalyticsOverview = {
  meta: AnalyticsMeta;
  overview: AnalyticsOverviewMetrics;
  trends?: AnalyticsOverviewTrends;
  previous_period?: AnalyticsOverviewPreviousPeriod;
};

/* ── Courses & Media ──────────────────────────────────────────────── */

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

/* ── Learners & Enrollments ───────────────────────────────────────── */

/** Phase 3 — enrollment trend data */
export type EnrollmentTrends = {
  over_time?: StatusTimeSeriesPoint[];
};

/** Phase 3 — learner registration trend */
export type LearnerTrends = {
  registrations_over_time?: TimeSeriesPoint[];
};

export type AnalyticsLearnersEnrollments = {
  meta: AnalyticsMeta;
  learners: {
    total_students: number;
    active_students: number;
    new_students: number;
    by_center: CenterLearnersMetric[];
    trends?: LearnerTrends;
  };
  enrollments: {
    by_status: {
      active: number;
      pending: number;
      deactivated: number;
      cancelled: number;
    };
    top_courses: TopCourseMetric[];
    trends?: EnrollmentTrends;
  };
};

/* ── Devices & Requests ───────────────────────────────────────────── */

/** Phase 4 — device & request trend data */
export type DeviceTrends = {
  registrations_over_time?: TimeSeriesPoint[];
};

export type ExtraViewsTrends = {
  over_time?: RequestTimeSeriesPoint[];
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
    trends?: DeviceTrends;
  };
  requests: {
    extra_views: {
      pending: number;
      approved: number;
      rejected: number;
      approval_rate: number;
      avg_decision_hours: number;
      trends?: ExtraViewsTrends;
    };
    enrollment: {
      pending: number;
      approved: number;
      rejected: number;
    };
  };
};
