# LMS Admin Panel - Senior Product Manager

## Purpose
Product management knowledge base for the LMS Admin Panel. This skill provides Claude with complete context about business requirements, user stories, feature specifications, and integration requirements for the multi-tenant Learning Management System.

## When to Use This Skill
- Analyzing feature requirements
- Writing user stories with acceptance criteria
- Defining permission/capability requirements
- Mapping frontend features to backend services
- Creating feature specifications
- Understanding multi-tenant implications

---

## Domain Overview

### Business Context
**Najaah LMS** is a multi-tenant Learning Management System that connects:
- **Centers** (education providers) - Offer courses and manage students
- **Students** - Consume video-based courses on mobile apps
- **Admins** - Manage content, enrollments, and platform operations

### User Personas

#### Platform Admin (Super Admin)
- Manages ALL centers on the platform
- Full access to all features
- Can create/manage center accounts
- Views platform-wide analytics
- Access: `admin.najaah.me`

#### Center Admin
- Manages a SINGLE center
- Creates courses, videos, PDFs
- Manages student enrollments
- Views center-specific analytics
- Access: `centername.najaah.me`

#### Content Manager
- Limited center access
- Creates/edits courses and content
- No access to student data or enrollments
- Read-only analytics

---

## Feature Areas

### Content Management
| Feature | Description | Capabilities |
|---------|-------------|--------------|
| Courses | Create, edit, publish, archive courses | courses.* |
| Sections | Organize course content into sections | sections.* |
| Videos | Upload, manage, track video content | videos.* |
| PDFs | Upload, manage PDF materials | pdfs.* |
| Categories | Organize courses by category | categories.* |

### User Management
| Feature | Description | Capabilities |
|---------|-------------|--------------|
| Students | View, manage student accounts | students.* |
| Instructors | Manage instructor profiles | instructors.* |
| Admin Users | Manage admin accounts (platform only) | admin-users.* |
| Roles | Define admin roles and permissions | roles.* |

### Enrollment & Access
| Feature | Description | Capabilities |
|---------|-------------|--------------|
| Enrollments | Enroll students in courses | enrollments.* |
| Devices | Manage student device bindings | devices.* |
| Device Changes | Approve/reject device change requests | device-changes.* |
| Extra Views | Grant additional video views | extra-views.* |

### Analytics & Monitoring
| Feature | Description | Capabilities |
|---------|-------------|--------------|
| Dashboard | Overview metrics and KPIs | dashboard.view |
| Playback Sessions | Monitor active viewing sessions | playback.* |
| Audit Logs | Track admin actions | audit-logs.* |

---

## User Story Templates

### Standard User Story
```markdown
## [Feature Name]: [Action Description]

### User Story
As a [role],
I want to [action/goal],
So that [benefit/value].

### Acceptance Criteria
- [ ] Given [context], when [action], then [result]
- [ ] Given [context], when [action], then [result]
- [ ] Error case: When [error condition], then [error handling]

### Technical Notes
- Backend endpoint: `[HTTP method] /api/v1/admin/[resource]`
- Required capabilities: `[capability.action]`
- Multi-tenancy: [Platform only | Center-scoped | Both]

### UI/UX Requirements
- Location: [Page/route where feature appears]
- Component: [Primary component name]
- States: Loading, Empty, Error, Success

### Dependencies
- Backend: [Required API endpoints]
- Frontend: [Required components/modules]
```

### Example User Stories

#### Story: Student Enrollment
```markdown
## Enrollments: Enroll Student in Course

### User Story
As a Center Admin,
I want to enroll a student in a course,
So that they can access the course content on their mobile app.

### Acceptance Criteria
- [ ] Given I have a valid student and course, when I submit enrollment, then the student is enrolled
- [ ] Given the student is already enrolled, when I try to enroll again, then I see an error message
- [ ] Given I select a course from another center, when I submit, then I see a validation error
- [ ] Given successful enrollment, then the student receives a notification

### Technical Notes
- Backend endpoint: `POST /api/v1/admin/enrollments`
- Required capabilities: `enrollments.create`
- Multi-tenancy: Center-scoped (students must belong to center)

### UI/UX Requirements
- Location: /enrollments/create or /students/:id/enroll
- Component: EnrollmentForm
- States: Form, Loading, Success Toast, Error Message

### Dependencies
- Backend: EnrollmentService.enroll()
- Frontend: useCreateEnrollment hook, EnrollmentForm component
```

#### Story: Bulk Enrollment
```markdown
## Enrollments: Bulk Enroll Students

### User Story
As a Center Admin,
I want to enroll multiple students in a course at once,
So that I can efficiently manage large class enrollments.

### Acceptance Criteria
- [ ] Given I upload a CSV with student IDs, when I submit, then all valid students are enrolled
- [ ] Given some students are already enrolled, when I submit, then I see a partial success report
- [ ] Given the CSV has invalid format, when I upload, then I see validation errors
- [ ] Given successful bulk enrollment, then I see a summary of enrolled count

### Technical Notes
- Backend endpoint: `POST /api/v1/admin/enrollments/bulk`
- Required capabilities: `enrollments.create`
- Multi-tenancy: Center-scoped

### UI/UX Requirements
- Location: /enrollments/bulk
- Component: BulkEnrollmentForm
- States: Upload, Processing, Success Summary, Partial Errors

### Dependencies
- Backend: EnrollmentService.bulkEnroll()
- Frontend: useBulkEnrollment hook, CSVUploader component
```

---

## Feature Specification Template

```markdown
# Feature Specification: [Feature Name]

## Overview
[1-2 paragraph description of the feature and its value]

## Business Goals
1. [Goal 1]
2. [Goal 2]
3. [Goal 3]

## User Personas Affected
- [ ] Platform Admin
- [ ] Center Admin
- [ ] Content Manager

## Feature Requirements

### Must Have (P0)
- Requirement 1
- Requirement 2

### Should Have (P1)
- Requirement 3
- Requirement 4

### Nice to Have (P2)
- Requirement 5

## User Flows

### Primary Flow: [Flow Name]
1. User navigates to [location]
2. User performs [action]
3. System responds with [result]
4. User confirms [confirmation]

### Error Flow: [Error Scenario]
1. User attempts [invalid action]
2. System displays [error message]
3. User can [recovery action]

## Data Requirements

### Input Data
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| field1 | string | Yes | max:255 |
| field2 | number | No | min:0 |

### Output Data
| Field | Type | Description |
|-------|------|-------------|
| id | number | Unique identifier |
| status | string | Current status |

## API Requirements

### Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/admin/resource | List resources |
| POST | /api/v1/admin/resource | Create resource |
| PUT | /api/v1/admin/resource/:id | Update resource |
| DELETE | /api/v1/admin/resource/:id | Delete resource |

### Permissions
| Capability | Description |
|------------|-------------|
| resource.list | View resource list |
| resource.create | Create new resource |
| resource.update | Update existing resource |
| resource.delete | Delete resource |

## UI/UX Requirements

### Screens
1. **List View** - Table with pagination, search, filters
2. **Create Form** - Form with validation
3. **Detail View** - Read-only display with actions
4. **Edit Form** - Pre-populated form for updates

### States
- Loading: Skeleton or spinner
- Empty: Empty state message with CTA
- Error: Error message with retry option
- Success: Toast notification

## Multi-Tenancy Considerations
- Platform Admin: [Access scope]
- Center Admin: [Access scope]
- Data isolation: [How data is scoped]

## Analytics & Tracking
- Events to track: [list of events]
- Metrics to measure: [list of metrics]

## Testing Requirements
- Unit tests: [specific areas]
- Integration tests: [user flows to test]
- Edge cases: [scenarios to cover]

## Dependencies
- Backend services: [list]
- Frontend modules: [list]
- External APIs: [list]

## Timeline Estimate
- Backend: [complexity level]
- Frontend: [complexity level]
- Testing: [complexity level]
```

---

## Permission Mapping

### Capability to Backend Permission
```typescript
// Frontend capability → Backend permission
const CAPABILITY_PERMISSION_MAP = {
  // Courses
  "courses.list": "admin.courses.list",
  "courses.view": "admin.courses.view",
  "courses.create": "admin.courses.create",
  "courses.update": "admin.courses.update",
  "courses.delete": "admin.courses.delete",
  "courses.publish": "admin.courses.publish",

  // Students
  "students.list": "admin.students.list",
  "students.view": "admin.students.view",
  "students.create": "admin.students.create",
  "students.update": "admin.students.update",

  // Enrollments
  "enrollments.list": "admin.enrollments.list",
  "enrollments.create": "admin.enrollments.create",
  "enrollments.update": "admin.enrollments.update",
  "enrollments.delete": "admin.enrollments.delete",

  // Devices
  "devices.list": "admin.devices.list",
  "device-changes.approve": "admin.device-change-requests.approve",
  "device-changes.reject": "admin.device-change-requests.reject",

  // Content
  "videos.list": "admin.videos.list",
  "videos.upload": "admin.videos.upload",
  "pdfs.list": "admin.pdfs.list",
  "pdfs.upload": "admin.pdfs.upload",
};
```

### Route Protection
```typescript
// Route → Required capabilities
const ROUTE_CAPABILITIES = {
  "/dashboard": [],
  "/courses": ["courses.list"],
  "/courses/create": ["courses.create"],
  "/courses/:id/edit": ["courses.update"],
  "/students": ["students.list"],
  "/students/:id": ["students.view"],
  "/enrollments": ["enrollments.list"],
  "/enrollments/create": ["enrollments.create"],
};
```

---

## Integration Checklist

### Backend to Frontend Feature Integration

When integrating a new backend feature:

1. **API Contract**
   - [ ] API endpoint documented (Scribe)
   - [ ] Request/response types defined
   - [ ] Error codes documented
   - [ ] Permissions defined

2. **Frontend Types**
   - [ ] Entity type defined in `types/`
   - [ ] Request params type defined
   - [ ] Response type defined

3. **Frontend Service**
   - [ ] Service function created
   - [ ] Response normalization implemented
   - [ ] Error handling in place

4. **Frontend Hook**
   - [ ] Query hook for fetching
   - [ ] Mutation hook for actions
   - [ ] Query key strategy defined

5. **Frontend UI**
   - [ ] Component implemented
   - [ ] Loading state handled
   - [ ] Error state handled
   - [ ] Empty state handled

6. **Route Protection**
   - [ ] Route added to app router
   - [ ] Capability check added
   - [ ] Sidebar navigation updated

7. **Testing**
   - [ ] MSW handlers added
   - [ ] Component tests written
   - [ ] Integration test written

---

## Multi-Tenant Feature Guidelines

### Platform-Only Features
Features available only to Platform Admins:
- Center management
- Admin user management
- Platform-wide analytics
- System settings

### Center-Scoped Features
Features scoped to single center:
- Course management
- Student management
- Enrollment management
- Content management

### Data Isolation Rules
1. Center Admins ONLY see their center's data
2. Students are scoped to center (branded) or shared (unbranded)
3. Courses belong to exactly one center
4. Enrollments are scoped by course's center

---

## Priority Framework

### P0 - Critical Path
- Features blocking core user journeys
- Security-related features
- Data integrity features

### P1 - High Value
- Features with significant user impact
- Frequently requested features
- Efficiency improvements

### P2 - Nice to Have
- UX polish
- Advanced analytics
- Automation features

### P3 - Future Consideration
- Edge case handling
- Advanced integrations
- Experimental features

---

## Related Documentation
- Backend Domain Rules: `/Users/tarekbassiouny/projects/najaah/backend/docs/codex/CODEX_DOMAIN_RULES.md`
- Backend Features: `/Users/tarekbassiouny/projects/najaah/backend/docs/features/`
- API Documentation: Backend Scribe docs
