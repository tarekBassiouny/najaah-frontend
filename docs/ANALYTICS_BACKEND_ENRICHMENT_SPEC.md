# Analytics Backend Enrichment Spec

The frontend analytics dashboard has chart components already built and waiting for these backend API fields. All fields are optional — the frontend gracefully hides charts when data is absent and automatically renders them when data appears.

## Data Format Conventions

- **TimeSeriesPoint**: `{ "date": "YYYY-MM-DD", "count": number }`
- **StatusTimeSeriesPoint**: `{ "date": "YYYY-MM-DD", "active": number, "pending": number, "cancelled": number, "deactivated": number }`
- **RequestTimeSeriesPoint**: `{ "date": "YYYY-MM-DD", "pending": number, "approved": number, "rejected": number }`

All `over_time` arrays should contain one entry per day within the requested `from`/`to` date range.

---

## Phase 1 — Overview Trends (High Priority)

**Endpoint:** `GET /api/v1/admin/centers/{centerId}/analytics/overview`
(also `GET /api/v1/admin/analytics/overview` for platform admin)

Add to response `data`:

```json
{
  "overview": { "...existing fields..." },
  "trends": {
    "enrollments_over_time": [
      { "date": "2026-03-01", "count": 0 },
      { "date": "2026-03-02", "count": 1 }
    ],
    "active_learners_over_time": [
      { "date": "2026-03-01", "count": 5 },
      { "date": "2026-03-02", "count": 8 }
    ],
    "courses_created_over_time": [
      { "date": "2026-03-01", "count": 1 },
      { "date": "2026-03-02", "count": 2 }
    ]
  }
}
```

**Frontend chart:** `AnalyticsAreaChart` — single-series area chart with gradient fill for each trend.

---

## Phase 2 — Period Comparison (High Priority)

**Endpoint:** Same overview endpoint.

Add to response `data`:

```json
{
  "overview": { "...existing fields..." },
  "previous_period": {
    "total_centers": 1,
    "active_centers": 1,
    "total_courses": 2,
    "published_courses": 1,
    "total_enrollments": 0,
    "active_enrollments": 0,
    "daily_active_learners": 0
  }
}
```

The `previous_period` should contain the same metrics as `overview` but for the equivalent preceding date range. For example, if the user requests `from=2026-03-01&to=2026-03-31` (31 days), the previous period is `2026-01-29` to `2026-02-28`.

**Frontend usage:** `computeTrend(current, previous)` utility calculates percentage change and displays green/red trend arrows on StatsCards (e.g., "+50%" with up arrow or "-25%" with down arrow).

---

## Phase 3 — Learners & Enrollments Trends (Medium Priority)

**Endpoint:** `GET /api/v1/admin/centers/{centerId}/analytics/learners-enrollments`
(also `GET /api/v1/admin/analytics/learners-enrollments` for platform admin)

Add to response `data.learners`:

```json
{
  "learners": {
    "total_students": 2,
    "active_students": 2,
    "new_students": 2,
    "by_center": [],
    "trends": {
      "registrations_over_time": [
        { "date": "2026-03-01", "count": 0 },
        { "date": "2026-03-02", "count": 1 }
      ]
    }
  }
}
```

Add to response `data.enrollments`:

```json
{
  "enrollments": {
    "by_status": { "...existing fields..." },
    "top_courses": [ "...existing..." ],
    "trends": {
      "over_time": [
        { "date": "2026-03-01", "active": 0, "pending": 0, "cancelled": 0 },
        { "date": "2026-03-02", "active": 1, "pending": 0, "cancelled": 0 }
      ]
    }
  }
}
```

**Frontend charts:**
- `AnalyticsAreaChart` for registrations_over_time (single line)
- `AnalyticsStackedAreaChart` for enrollment status over_time (stacked: active/pending/cancelled)

---

## Phase 4 — Devices & Requests Trends (Lower Priority)

**Endpoint:** `GET /api/v1/admin/centers/{centerId}/analytics/devices-requests`
(also `GET /api/v1/admin/analytics/devices-requests` for platform admin)

Add to response `data.devices`:

```json
{
  "devices": {
    "total": 2,
    "active": 2,
    "...existing fields...",
    "trends": {
      "registrations_over_time": [
        { "date": "2026-03-01", "count": 1 }
      ]
    }
  }
}
```

Add to response `data.requests.extra_views`:

```json
{
  "requests": {
    "extra_views": {
      "pending": 0,
      "approved": 0,
      "rejected": 0,
      "approval_rate": 0,
      "avg_decision_hours": 0,
      "trends": {
        "over_time": [
          { "date": "2026-03-01", "pending": 0, "approved": 1, "rejected": 0 }
        ]
      }
    }
  }
}
```

**Frontend charts:**
- `AnalyticsAreaChart` for device registrations (single line)
- `AnalyticsStackedAreaChart` for extra view decisions over time (stacked: approved/pending/rejected)

---

## Frontend TypeScript Types (already defined)

Located in `src/features/analytics/types/analytics.ts`:

```typescript
type TimeSeriesPoint = { date: string; count: number };
type StatusTimeSeriesPoint = { date: string; active: number; pending: number; cancelled?: number; deactivated?: number };
type RequestTimeSeriesPoint = { date: string; pending: number; approved: number; rejected: number };

// Overview
type AnalyticsOverviewTrends = {
  enrollments_over_time?: TimeSeriesPoint[];
  active_learners_over_time?: TimeSeriesPoint[];
  courses_created_over_time?: TimeSeriesPoint[];
};
type AnalyticsOverviewPreviousPeriod = {
  total_centers?: number;
  active_centers?: number;
  total_courses?: number;
  published_courses?: number;
  total_enrollments?: number;
  active_enrollments?: number;
  daily_active_learners?: number;
};

// Learners
type LearnerTrends = { registrations_over_time?: TimeSeriesPoint[] };
type EnrollmentTrends = { over_time?: StatusTimeSeriesPoint[] };

// Devices
type DeviceTrends = { registrations_over_time?: TimeSeriesPoint[] };
type ExtraViewsTrends = { over_time?: RequestTimeSeriesPoint[] };
```

---

## Frontend Components Ready

| Component | File | Powered by |
|-----------|------|-----------|
| AnalyticsAreaChart | `src/features/analytics/components/charts/AnalyticsAreaChart.tsx` | Phase 1, 3, 4 single-series trends |
| AnalyticsStackedAreaChart | `src/features/analytics/components/charts/AnalyticsStackedAreaChart.tsx` | Phase 3, 4 multi-series status trends |
| computeTrend utility | `src/features/analytics/utils/trend.ts` | Phase 2 StatsCard arrows |
| StatsCard trend prop | `src/components/ui/stats-card.tsx` | Phase 2 arrows (already supported) |

---

## Priority

1. **Phase 1 + 2 together** (overview trends + period comparison) — highest visual impact
2. **Phase 3** (learners/enrollments trends) — medium impact
3. **Phase 4** (devices trends) — lower priority
