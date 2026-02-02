# LMS Admin Panel - Code Reviewer

## Purpose
Cross-stack code review knowledge base for the LMS ecosystem. This skill provides Claude with comprehensive review checklists for both frontend (Next.js/React) and backend (Laravel/PHP) code, ensuring consistency, quality, and security across the full stack.

## When to Use This Skill
- Reviewing pull requests
- Auditing existing code
- Ensuring pattern compliance
- Security review
- Performance review
- Pre-merge validation

---

## Review Scope

### Frontend (Next.js/React/TypeScript)
- Component architecture
- React Query usage
- TypeScript type safety
- Form validation
- State management
- API integration

### Backend (Laravel/PHP)
- Service layer patterns
- Model design
- API resource formatting
- Database migrations
- Authorization
- Testing coverage

### Cross-Stack
- API contract alignment
- Multi-tenancy compliance
- Security patterns
- Error handling consistency

---

## Frontend Review Checklist

### TypeScript & Types

#### Required Checks
- [ ] All types are explicitly defined (no implicit `any`)
- [ ] Entity types use proper interface/type definitions
- [ ] Generic types are correctly constrained
- [ ] Nullable types use proper union syntax (`Type | null`)
- [ ] API response types match backend contracts

#### Type Patterns
```typescript
// GOOD: Explicit entity type
export type Student = {
  id: number;
  name: string;
  email: string;
  status: "active" | "inactive";
};

// BAD: Loose typing
export type Student = {
  [key: string]: unknown;
};
```

### React Components

#### Required Checks
- [ ] Components use proper naming (PascalCase)
- [ ] Props are typed with interface/type
- [ ] "use client" directive where needed
- [ ] No direct API calls in components
- [ ] Proper loading/error states
- [ ] Keys in lists are unique and stable

#### Component Pattern
```typescript
// GOOD: Clean component with typed props
type StudentCardProps = {
  student: Student;
  onEdit?: (id: number) => void;
};

export function StudentCard({ student, onEdit }: StudentCardProps) {
  return (
    <div>
      <h3>{student.name}</h3>
      {onEdit && <Button onClick={() => onEdit(student.id)}>Edit</Button>}
    </div>
  );
}

// BAD: Untyped props, logic in component
export function StudentCard({ data }: any) {
  const [student, setStudent] = useState();
  useEffect(() => {
    fetch(`/api/students/${data.id}`).then(r => r.json()).then(setStudent);
  }, []);
  // ...
}
```

### React Query Usage

#### Required Checks
- [ ] Query keys are consistent and hierarchical
- [ ] `queryFn` calls service layer, not direct fetch
- [ ] `placeholderData` preserves previous data
- [ ] Mutations invalidate correct queries
- [ ] Error handling is present
- [ ] Loading states are handled

#### Query Pattern
```typescript
// GOOD: Proper query hook
export function useStudents(params: ListParams) {
  return useQuery({
    queryKey: ["students", params],
    queryFn: () => listStudents(params),
    placeholderData: (prev) => prev,
  });
}

// BAD: Direct fetch, no key strategy
export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: () => fetch("/api/students").then(r => r.json()),
  });
}
```

### Service Layer

#### Required Checks
- [ ] Uses `http` client from `@/lib/http`
- [ ] Response normalization handles variations
- [ ] Types defined for params and responses
- [ ] Error responses are not swallowed
- [ ] Endpoints match API documentation

#### Service Pattern
```typescript
// GOOD: Normalized service
export async function listStudents(params: ListParams): Promise<StudentResponse> {
  const { data } = await http.get<RawResponse>("/api/v1/admin/students", {
    params: { page: params.page, per_page: params.per_page },
  });
  return normalizeResponse(data, params);
}

// BAD: Raw fetch, no normalization
export async function listStudents(params) {
  const res = await fetch(`/api/students?page=${params.page}`);
  return res.json();
}
```

### Forms & Validation

#### Required Checks
- [ ] Uses react-hook-form with zodResolver
- [ ] Zod schemas match API requirements
- [ ] Error messages are user-friendly
- [ ] Loading state during submission
- [ ] Success feedback provided
- [ ] Form resets after successful submit

#### Form Pattern
```typescript
// GOOD: Zod + react-hook-form
const schema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email"),
});

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { name: "", email: "" },
});

// BAD: Manual validation
const [errors, setErrors] = useState({});
const validate = () => {
  if (!name) setErrors({ name: "Required" });
};
```

### Route Protection

#### Required Checks
- [ ] Protected routes use AdminRouteGuard
- [ ] ROUTE_CAPABILITIES updated for new routes
- [ ] Capability checks before sensitive actions
- [ ] Proper redirects on unauthorized access

---

## Backend Review Checklist

### PHP Standards

#### Required Checks
- [ ] `declare(strict_types=1);` on all files
- [ ] Constructor property promotion used
- [ ] Final classes for services
- [ ] Typed method parameters and returns
- [ ] PHPDoc for complex return types (arrays)

#### PHP Pattern
```php
// GOOD: Modern PHP standards
<?php

declare(strict_types=1);

namespace App\Services\Students;

final readonly class StudentService
{
    public function __construct(
        private StudentRepository $repository,
    ) {}

    /**
     * @return array{id: int, name: string}
     */
    public function findById(int $id): array
    {
        // ...
    }
}

// BAD: Legacy PHP style
class StudentService
{
    private $repository;

    public function __construct($repository)
    {
        $this->repository = $repository;
    }

    public function findById($id)
    {
        // ...
    }
}
```

### Laravel Models

#### Required Checks
- [ ] Uses HasFactory, SoftDeletes traits
- [ ] `$fillable` explicitly defined
- [ ] `$casts` for date/enum fields
- [ ] Relationships typed with generics
- [ ] Property annotations in docblock
- [ ] Query scopes properly typed

#### Model Pattern
```php
// GOOD: Well-structured model
/**
 * @property int $id
 * @property string $name
 * @property StudentStatus $status
 */
final class Student extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['name', 'email', 'status'];

    protected $casts = [
        'status' => StudentStatus::class,
    ];

    /** @return BelongsTo<Center, self> */
    public function center(): BelongsTo
    {
        return $this->belongsTo(Center::class);
    }
}
```

### Service Layer

#### Required Checks
- [ ] Single responsibility principle
- [ ] Constructor injection only
- [ ] No direct model queries in controllers
- [ ] Validation in FormRequest, not service
- [ ] Transactions for multi-step operations
- [ ] Audit logging for important actions

#### Service Pattern
```php
// GOOD: Clean service
final readonly class EnrollmentService
{
    public function __construct(
        private CenterScopeService $scopeService,
        private AuditLogService $auditService,
    ) {}

    public function enroll(User $student, Course $course, User $actor): Enrollment
    {
        $this->scopeService->assertSameCenter($actor, $course);

        return DB::transaction(function () use ($student, $course, $actor) {
            $enrollment = Enrollment::create([...]);
            $this->auditService->log($actor, $enrollment, 'created');
            return $enrollment;
        });
    }
}

// BAD: Fat service with mixed concerns
class EnrollmentService
{
    public function enroll($data)
    {
        if (!$data['student_id']) throw new Exception('Required');
        $student = Student::find($data['student_id']);
        // ... 100 more lines
    }
}
```

### API Resources

#### Required Checks
- [ ] Consistent response format
- [ ] Relationships only when requested
- [ ] No sensitive data exposed
- [ ] Proper pagination metadata
- [ ] Uses success/error wrapper

#### Resource Pattern
```php
// GOOD: Consistent resource
return [
    'success' => true,
    'data' => [
        'id' => $this->id,
        'name' => $this->name,
        'center' => new CenterResource($this->whenLoaded('center')),
    ],
];

// BAD: Inconsistent structure
return [
    'student_id' => $this->id,
    'studentName' => $this->name,
    'center' => $this->center, // Exposes full model
];
```

### Database & Migrations

#### Required Checks
- [ ] Standard columns (id, timestamps, soft deletes)
- [ ] Foreign keys with cascades
- [ ] Indexes on foreign keys
- [ ] Unique constraints where needed
- [ ] No breaking changes to existing tables
- [ ] Down migration is reversible

#### Migration Pattern
```php
// GOOD: Complete migration
Schema::create('enrollments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
    $table->foreignId('course_id')->constrained()->cascadeOnDelete();
    $table->foreignId('center_id')->constrained()->cascadeOnDelete();
    $table->integer('status')->default(0);
    $table->timestamps();
    $table->softDeletes();

    $table->index('student_id');
    $table->index('course_id');
    $table->unique(['student_id', 'course_id']);
});
```

---

## Cross-Stack Review

### API Contract Alignment

#### Required Checks
- [ ] Frontend types match backend response
- [ ] Endpoint paths match exactly
- [ ] HTTP methods are correct
- [ ] Query params match expectations
- [ ] Error codes are handled
- [ ] Pagination format consistent

#### Contract Check
```typescript
// Frontend expectation
type StudentResponse = {
  data: {
    id: number;
    name: string;
    email: string;
  };
};

// Must match backend Resource
return [
    'data' => [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
    ],
];
```

### Multi-Tenancy Compliance

#### Required Checks
- [ ] All queries scoped by center_id
- [ ] CenterScopeService used for access checks
- [ ] No cross-tenant data leakage
- [ ] Platform admin bypasses work correctly
- [ ] Student center matching enforced

#### Multi-Tenancy Pattern
```php
// GOOD: Scoped query
public function list(User $admin): Collection
{
    $centerIds = $this->scopeService->getAccessibleCenterIds($admin);
    return Course::whereIn('center_id', $centerIds)->get();
}

// BAD: Unscoped query
public function list(): Collection
{
    return Course::all(); // Leaks all data
}
```

### Security Review

#### Required Checks
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Proper authorization checks
- [ ] Sensitive data not logged
- [ ] Passwords/tokens not exposed
- [ ] Rate limiting on sensitive endpoints
- [ ] CSRF protection active

#### Security Patterns
```php
// GOOD: Parameterized query
Course::where('center_id', $centerId)->get();

// BAD: SQL injection risk
DB::select("SELECT * FROM courses WHERE center_id = {$centerId}");
```

```typescript
// GOOD: Sanitized output
<div>{escapeHtml(user.name)}</div>

// BAD: XSS risk
<div dangerouslySetInnerHTML={{ __html: user.bio }} />
```

---

## Review Output Format

### Approval
```markdown
## Review: Approved ✅

### Summary
Brief description of what was reviewed.

### Strengths
- Good pattern usage in X
- Clean type definitions
- Proper error handling

### Minor Suggestions (Optional)
- Consider extracting X to utility
- Could add loading state for Y
```

### Changes Requested
```markdown
## Review: Changes Requested ❌

### Summary
Brief description of what was reviewed.

### Required Changes

#### 1. [Category]: Issue Title
**Location:** `file.ts:line`
**Issue:** Description of the problem
**Fix:** How to resolve it

```typescript
// Current
problematic code

// Suggested
improved code
```

#### 2. [Category]: Issue Title
...

### Optional Improvements
- Suggestion 1
- Suggestion 2
```

---

## Review Categories

- **Types**: TypeScript/PHP type issues
- **Pattern**: Architecture/pattern violations
- **Security**: Security vulnerabilities
- **Performance**: Performance concerns
- **Testing**: Missing or inadequate tests
- **Style**: Code style issues
- **API**: API contract issues
- **Tenancy**: Multi-tenancy violations

---

## Common Issues

### Frontend
| Issue | Severity | Fix |
|-------|----------|-----|
| Missing loading state | Medium | Add isLoading check |
| Direct API call | High | Use service layer |
| Untyped props | Medium | Add prop types |
| Missing error handling | High | Add isError check |
| Hard-coded string | Low | Use constants |

### Backend
| Issue | Severity | Fix |
|-------|----------|-----|
| Missing center scope | Critical | Add CenterScopeService |
| No audit log | Medium | Add AuditLogService |
| Untyped return | Medium | Add return type |
| Missing validation | High | Add FormRequest |
| No transaction | Medium | Wrap in DB::transaction |

---

## Related Documentation
- Frontend Patterns: `/.claude/skills/lms-frontend/SKILL.md`
- QA Standards: `/.claude/skills/lms-qa/SKILL.md`
- Backend Patterns: `/Users/tarekbassiouny/projects/xyz-lms/backend/.claude/skills/xyz-lms/SKILL.md`
