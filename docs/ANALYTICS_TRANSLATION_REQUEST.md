# Analytics API — Translation Request

The frontend analytics dashboard has chart labels that need translation. The frontend already sends the locale header (`x-locale: ar` or `x-locale: en`) via the HTTP client. The backend should return translated label strings in all analytics API responses.

## Option A — Backend returns translated labels (Recommended)

Add a `labels` object to each analytics endpoint response. The labels are translated based on the request's `x-locale` header.

### 1. Overview Endpoint (`GET /api/v1/admin/analytics/overview`)

Add to response:

```json
{
  "labels": {
    "published": "Published | منشور",
    "unpublished": "Unpublished | غير منشور",
    "branded": "Branded | ذو علامة تجارية",
    "unbranded": "Unbranded | بدون علامة تجارية",
    "no_centers": "No centers | لا يوجد مراكز"
  }
}
```

### 2. Courses & Media Endpoint (`GET /api/v1/admin/analytics/courses-media`)

Add to response:

```json
{
  "labels": {
    "course_status": {
      "draft": "Draft | مسودة",
      "uploading": "Uploading | جاري الرفع",
      "ready": "Ready | جاهز",
      "published": "Published | منشور",
      "archived": "Archived | مؤرشف"
    },
    "media_status": {
      "pending": "Pending | قيد الانتظار",
      "processing": "Processing | قيد المعالجة",
      "ready": "Ready | جاهز"
    },
    "media_types": {
      "videos": "Videos | فيديوهات",
      "pdfs": "PDFs | ملفات PDF"
    }
  }
}
```

### 3. Learners & Enrollments Endpoint (`GET /api/v1/admin/analytics/learners-enrollments`)

Add to response:

```json
{
  "labels": {
    "enrollment_status": {
      "active": "Active | نشط",
      "pending": "Pending | قيد الانتظار",
      "deactivated": "Deactivated | معطل",
      "cancelled": "Cancelled | ملغى"
    },
    "default_app_name": "Najaah App | تطبيق نجاح"
  }
}
```

### 4. Devices & Requests Endpoint (`GET /api/v1/admin/analytics/devices-requests`)

Add to response:

```json
{
  "labels": {
    "device_change_status": {
      "pending": "Pending | قيد الانتظار",
      "approved": "Approved | موافق عليه",
      "rejected": "Rejected | مرفوض",
      "pre_approved": "Pre-approved | موافق عليه مسبقاً"
    },
    "device_source": {
      "mobile": "Mobile | الجوال",
      "otp": "OTP | رمز التحقق",
      "admin": "Admin | المشرف"
    },
    "request_status": {
      "pending": "Pending | قيد الانتظار",
      "approved": "Approved | موافق عليه",
      "rejected": "Rejected | مرفوض"
    }
  }
}
```

## Complete List of Hardcoded Labels (Frontend)

These are the strings currently hardcoded in the frontend analytics charts:

| Component | Labels | Context |
|-----------|--------|---------|
| OverviewPanel | `Published`, `Unpublished` | Course distribution donut chart |
| OverviewPanel | `Branded`, `Unbranded` | Center type breakdown cards |
| OverviewPanel | `No centers` | Empty state text |
| OverviewPanel | `% branded` | Progress bar label |
| CoursesMediaPanel | `Draft`, `Uploading`, `Ready`, `Published`, `Archived` | Course status donut chart |
| CoursesMediaPanel | `Pending`, `Processing`, `Ready` | Video & PDF upload status donut charts |
| CoursesMediaPanel | `Videos`, `PDFs` | Media type sub-headers |
| LearnersPanel | `Active`, `Pending`, `Deactivated`, `Cancelled` | Enrollment status donut chart |
| LearnersPanel | `Active`, `Pending`, `Cancelled` | Stacked area chart series labels |
| LearnersPanel | `Najaah App` | Default center name fallback |
| DevicesPanel | `Pending`, `Approved`, `Rejected`, `Pre-approved` | Device change donut chart |
| DevicesPanel | `Mobile`, `OTP`, `Admin` | Device source donut chart |
| DevicesPanel | `Pending`, `Approved`, `Rejected` | Extra views & enrollment requests donuts |
| DevicesPanel | `Approved`, `Pending`, `Rejected` | Stacked area chart series labels |

## Frontend Integration Plan

Once the backend returns `labels`, the frontend will:

1. Add `labels` to the TypeScript response types (already optional)
2. Replace hardcoded strings with `data.labels.xxx ?? "fallback"`
3. Charts will show translated labels automatically

**No frontend changes needed until backend implements this.**
