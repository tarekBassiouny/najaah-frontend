# Review Patterns

## Type Patterns
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

## Component Pattern
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

## React Query Pattern
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

## Service Pattern
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

## Form Pattern
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

## API Contract Check
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

## Multi-Tenancy Pattern
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

## Security Patterns
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

## Review Output Format

### Approval
```markdown
## Review: Approved

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
## Review: Changes Requested

### Summary
Brief description of what was reviewed.

### Required Changes

#### 1. [Category]: Issue Title
**Location:** `file.ts:line`
**Issue:** Description of the problem
**Fix:** How to resolve it

#### 2. [Category]: Issue Title
...

### Optional Improvements
- Suggestion 1
- Suggestion 2
```
