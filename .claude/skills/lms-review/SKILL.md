---
name: lms-review
description: Cross-stack review skill for the Najaah LMS repos. Use for frontend pattern compliance, route and tenant safety, API contract alignment, and PR-readiness checks.
---

# LMS Admin Panel - Code Reviewer

## Purpose
Frontend code review and PR-readiness knowledge base. Covers frontend pattern compliance, route and tenant safety, API contract alignment, and cross-stack checks.

## Context
Multi-tenant Next.js admin panel + Laravel 11 backend. Tenant scoping, capabilities-based auth, React Query, feature module pattern. For full context, read `.claude/skills/lms/SKILL.md`.

## When to Use This Skill
- Reviewing pull requests
- Auditing existing code
- Ensuring pattern compliance
- Security review
- Performance review
- Pre-merge validation

When repo-specific guidance in this file conflicts with a generic example, follow the repo-specific guidance.

---

## Frontend Review Checklist

### TypeScript & Types
- [ ] All types are explicitly defined (no implicit `any`)
- [ ] Entity types use proper interface/type definitions
- [ ] Generic types are correctly constrained
- [ ] Nullable types use proper union syntax (`Type | null`)
- [ ] API response types match backend contracts

### React Components
- [ ] Components use proper naming (PascalCase)
- [ ] Props are typed with interface/type
- [ ] "use client" directive where needed
- [ ] No direct API calls in components
- [ ] Proper loading/error states
- [ ] Keys in lists are unique and stable

### React Query Usage
- [ ] Query keys are consistent and hierarchical
- [ ] `queryFn` calls service layer, not direct fetch
- [ ] `placeholderData` preserves previous data
- [ ] Mutations invalidate correct queries
- [ ] Error handling is present
- [ ] Loading states are handled

### Service Layer
- [ ] Uses `http` client from `@/lib/http`
- [ ] Response normalization handles variations
- [ ] Types defined for params and responses
- [ ] Error responses are not swallowed
- [ ] Endpoints match API documentation

### Forms & Validation
- [ ] Uses react-hook-form with zodResolver
- [ ] Zod schemas match API requirements
- [ ] Error messages are user-friendly
- [ ] Loading state during submission
- [ ] Success feedback provided
- [ ] Form resets after successful submit

### Route Protection
- [ ] Protected routes use AdminRouteGuard
- [ ] Route capability rules come from `src/components/Layouts/sidebar/data/index.ts`
- [ ] Capability checks before sensitive actions
- [ ] Center-scoped routes and fallback redirects still behave correctly
- [ ] Proper redirects on unauthorized access

### Repo-Specific Frontend Checks
- [ ] Dashboard pages use `PageHeader` and follow `docs/STYLE_GUIDE.md`
- [ ] Tenant-aware UI uses `useTenant` from `@/app/tenant-provider`
- [ ] Service mutations reuse `@/lib/admin-response` helpers where appropriate
- [ ] Query keys include scope context when center-specific data can vary
- [ ] Sidebar config remains the source of truth for navigable protected routes

---

## Cross-Stack Review

### API Contract Alignment
- [ ] Frontend types match backend response
- [ ] Endpoint paths match exactly
- [ ] HTTP methods are correct
- [ ] Query params match expectations
- [ ] Error codes are handled
- [ ] Pagination format consistent

### Multi-Tenancy Compliance
- [ ] All queries scoped by center_id
- [ ] CenterScopeService used for access checks
- [ ] No cross-tenant data leakage
- [ ] Platform admin bypasses work correctly
- [ ] Student center matching enforced

### Security Review
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Proper authorization checks
- [ ] Sensitive data not logged
- [ ] Passwords/tokens not exposed
- [ ] Rate limiting on sensitive endpoints
- [ ] CSRF protection active

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

---

## Read Next Only When Needed
- GOOD/BAD code patterns and review output format: `references/review-patterns.md`
- Frontend Patterns: `.claude/skills/lms-frontend/SKILL.md`
- QA Standards: `.claude/skills/lms-qa/SKILL.md`
- Backend review: use backend repo's `najaah-quality` skill
