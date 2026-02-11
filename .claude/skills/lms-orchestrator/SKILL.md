# LMS Admin Panel - Orchestrator

## Purpose
Master coordinator for the LMS Admin Panel development workflow. This skill orchestrates tasks across specialized sub-skills, ensures consistency, and manages the complete feature development lifecycle for the frontend application.

## When to Use This Skill
- Starting ANY new task or feature
- Coordinating multi-component changes
- Ensuring all standards are followed
- Managing complex workflows
- Breaking down large features into subtasks
- Quality assurance before completion

## Core Principle
**The Orchestrator plans the work, delegates to specialists, and verifies completion. For complex features, it coordinates across frontend and backend codebases.**

---

## Available Sub-Skills

### 1. Frontend Engineer (`/.claude/skills/lms-frontend/SKILL.md`)
**Responsibilities:**
- Feature module implementation
- React component development
- React Query hooks and services
- Form validation with Zod
- Route protection integration

**Delegate When:**
- Implementing new UI features
- Creating services and hooks
- Building forms and tables
- Adding route protection

### 2. QA Engineer (`/.claude/skills/lms-qa/SKILL.md`)
**Responsibilities:**
- Unit test creation
- Integration test creation
- MSW handler setup
- Coverage analysis
- Test debugging

**Delegate When:**
- Writing any tests
- Setting up mock handlers
- Verifying test coverage
- Debugging test failures

### 3. Product Manager (`/.claude/skills/lms-pm/SKILL.md`)
**Responsibilities:**
- Requirements analysis
- User story creation
- Feature specification
- Permission mapping
- Integration planning

**Delegate When:**
- Clarifying requirements
- Writing specifications
- Mapping capabilities
- Planning integrations

### 4. Code Reviewer (`/.claude/skills/lms-review/SKILL.md`)
**Responsibilities:**
- Code review (frontend + backend)
- Pattern compliance checking
- Security review
- API contract validation
- Multi-tenancy compliance

**Delegate When:**
- Reviewing pull requests
- Validating implementations
- Security audits
- Pre-merge checks

---

## Workflow Orchestration

### Phase 1: Discovery & Planning

**Step 1: Gather Context**
```
1. Read relevant feature documentation
2. Check existing similar implementations
3. Identify all affected components
4. Review backend API contracts (if applicable)
```

**Step 2: Create Task Breakdown**
```
For each feature, identify:
- Types needed (PM skill)
- Services/hooks needed (Frontend skill)
- Components needed (Frontend skill)
- Tests required (QA skill)
- Documentation updates
```

**Step 3: Validate Requirements**
```
Check:
- API endpoints exist in backend
- Permissions/capabilities defined
- Multi-tenancy requirements clear
- UI/UX requirements clear
```

### Phase 2: Implementation

**Step 1: Types Layer**
```
Delegate to Frontend skill:
1. Create entity types
2. Create request/response types
3. Create component prop types

Verify:
- Types match API contracts
- Proper TypeScript patterns
- Consistent with existing types
```

**Step 2: Service Layer**
```
Delegate to Frontend skill:
1. Create API service functions
2. Implement response normalization
3. Handle error cases

Verify:
- Uses http client
- Proper error handling
- Correct endpoints
```

**Step 3: Hook Layer**
```
Delegate to Frontend skill:
1. Create query hooks
2. Create mutation hooks
3. Define query key strategy

Verify:
- Proper cache invalidation
- Loading/error states
- Correct dependencies
```

**Step 4: Component Layer**
```
Delegate to Frontend skill:
1. Create UI components
2. Implement forms
3. Handle all states
4. Add route protection

Verify:
- Follows patterns
- Accessible
- Responsive
```

**Step 5: Testing**
```
Delegate to QA skill:
1. Create MSW handlers
2. Write component tests
3. Write hook tests
4. Write integration tests

Verify:
- Good coverage
- Edge cases covered
- Error cases tested
```

### Phase 3: Quality Assurance

**Step 1: Code Quality Checks**
```
Run:
1. npm run lint
2. npm run type-check
3. npm run test
4. npm run build

All must pass before completion.
```

**Step 2: Integration Verification**
```
Verify:
- API calls work correctly
- Multi-tenancy properly scoped
- Authorization checks in place
- Error handling works
- Loading states visible
```

**Step 3: Code Review**
```
Delegate to Review skill:
1. Review component structure
2. Check hook patterns
3. Validate types
4. Security review
5. API contract validation
```

---

## Task Delegation Patterns

### Pattern 1: New Feature Module

**Input:** "Add agent executions feature"

**Orchestrator Process:**
```
1. DISCOVERY PHASE
   - Read agent execution API docs
   - Check existing feature patterns (students, courses)
   - Identify components:
     * Types: AgentExecution, AgentType
     * Service: agents.service.ts
     * Hooks: use-agent-executions.ts
     * Components: AgentExecutionCard, ExecutionHistory

2. PLANNING PHASE
   Create breakdown:

   [Frontend Skill]
   - Create types/agent-execution.ts
   - Create services/agents.service.ts
   - Create hooks/use-agent-executions.ts
   - Create components/AgentExecutionCard.tsx
   - Create components/ExecutionHistory.tsx

   [QA Skill]
   - Create MSW handlers for agent endpoints
   - Write component tests
   - Write hook tests
   - Write integration test

3. DELEGATION PHASE
   Execute in order:
   a) Types layer
   b) Service layer
   c) Hook layer
   d) Component layer
   e) Testing

4. VERIFICATION PHASE
   - Run all quality checks
   - Verify API integration
   - Code review
```

### Pattern 2: Bug Fix

**Input:** "Students table not showing loading state"

**Orchestrator Process:**
```
1. DISCOVERY PHASE
   - Locate StudentsTable component
   - Check useStudents hook
   - Identify issue

2. PLANNING PHASE
   [Frontend Skill]
   - Add isLoading check in component

   [QA Skill]
   - Add test for loading state

3. EXECUTION & VERIFICATION
   - Fix component
   - Add test
   - Run test suite
   - Verify fix
```

### Pattern 3: Full-Stack Feature

**Input:** "Add bulk enrollment feature"

**Orchestrator Process:**
```
1. DISCOVERY PHASE
   - Check if backend endpoint exists
   - Review EnrollmentService patterns
   - Identify frontend needs

2. PLANNING PHASE

   [Backend Work] (coordinate with backend orchestrator)
   - POST /api/v1/admin/enrollments/bulk endpoint
   - BulkEnrollmentService

   [Frontend Work]
   - types/bulk-enrollment.ts
   - services/bulk-enrollment.service.ts
   - hooks/use-bulk-enrollment.ts
   - components/BulkEnrollmentForm.tsx

   [Testing]
   - MSW handlers for bulk endpoint
   - Component and integration tests

3. COORDINATION
   - Ensure API contract alignment
   - Test end-to-end flow
   - Verify error handling
```

---

## Quality Gates

### Gate 1: Code Complete
```
✓ All components implemented
✓ All hooks implemented
✓ All services implemented
✓ Types correctly defined
✓ No TypeScript errors
```

### Gate 2: Tests Complete
```
✓ Unit tests for components
✓ Unit tests for hooks
✓ MSW handlers created
✓ Integration tests pass
✓ Good coverage
```

### Gate 3: Quality Checks Pass
```
✓ npm run lint - no errors
✓ npm run type-check - no errors
✓ npm run test - all passing
✓ npm run build - successful
```

### Gate 4: Code Review Complete
```
✓ Pattern compliance verified
✓ Security reviewed
✓ API contracts validated
✓ Multi-tenancy correct
```

---

## Communication Protocol

### Status Updates
```
[STARTED] Feature: Agent Executions
├── [IN PROGRESS] Frontend: Creating types
├── [PENDING] Frontend: Service layer
├── [PENDING] Frontend: Hook layer
├── [PENDING] Frontend: Components
└── [PENDING] QA: Testing
```

### Completion Reports
```
[COMPLETED] Feature: Agent Executions

Components Created:
- types/agent-execution.ts
- services/agents.service.ts
- hooks/use-agent-executions.ts
- components/AgentExecutionCard.tsx
- components/ExecutionHistory.tsx

Tests:
- 12 unit tests
- 3 integration tests
- MSW handlers for all endpoints

Quality:
✓ Lint: Pass
✓ Types: Pass
✓ Tests: 15/15 passing
✓ Build: Pass
```

### Issue Reports
```
[BLOCKED] Feature: Agent Executions

Issue: Backend endpoint not available
- Expected: POST /api/v1/admin/agents/execute
- Status: 404 Not Found

Action: Waiting for backend implementation
```

---

## Prioritization Framework

### P0 - Blocking Issues
- Security vulnerabilities
- Build failures
- Critical bugs
- Data integrity issues

### P1 - Feature Work
- New feature implementation
- Performance improvements
- API integrations

### P2 - Quality Improvements
- Test coverage
- Code cleanup
- Documentation

### P3 - Nice to Have
- UX polish
- Refactoring
- Minor enhancements

---

## Decision Framework

### When to Start Feature
```
Pre-Flight Checklist:
- [ ] Requirements clear
- [ ] Backend API available (or in parallel)
- [ ] No blockers identified
- [ ] Patterns understood
```

### When to Escalate
```
Escalate to Human When:
- Breaking changes required
- Unclear requirements
- Security concerns
- Multiple valid approaches
- Backend coordination needed
```

### When to Defer
```
Defer When:
- Dependency not ready
- Scope creep detected
- Higher priority work exists
- Clarification needed
```

---

## Feature Implementation Workflow

### Small Feature (< 1 hour)
```
1. Analyze requirement
2. Implement directly
3. Add tests
4. Verify quality
5. Complete
```

### Medium Feature (1-4 hours)
```
1. Create task breakdown
2. Implement types first
3. Implement services
4. Implement hooks
5. Implement components
6. Add tests
7. Review and verify
8. Complete
```

### Large Feature (> 4 hours)
```
1. Create detailed plan
2. Break into phases
3. Coordinate with backend if needed
4. Implement in phases
5. Review after each phase
6. Integration testing
7. Final review
8. Complete
```

---

## Related Skills

### Frontend Skills (this repo)
- Frontend Engineer: `/.claude/skills/lms-frontend/SKILL.md`
- QA Engineer: `/.claude/skills/lms-qa/SKILL.md`
- Product Manager: `/.claude/skills/lms-pm/SKILL.md`
- Code Reviewer: `/.claude/skills/lms-review/SKILL.md`

### Backend Skills (najaah/backend repo)
- Master Skill: `/Users/tarekbassiouny/projects/najaah/backend/.claude/skills/najaah/SKILL.md`
- Architecture: `/Users/tarekbassiouny/projects/najaah/backend/.claude/skills/najaah-architecture/SKILL.md`
- Features: `/Users/tarekbassiouny/projects/najaah/backend/.claude/skills/najaah-features/SKILL.md`
- API: `/Users/tarekbassiouny/projects/najaah/backend/.claude/skills/najaah-api/SKILL.md`
- Quality: `/Users/tarekbassiouny/projects/najaah/backend/.claude/skills/najaah-quality/SKILL.md`
- Orchestrator: `/Users/tarekbassiouny/projects/najaah/backend/.claude/skills/najaah-orchestrator/SKILL.md`

---

## Commands Reference

```bash
# Development
npm run dev          # Start dev server

# Quality Checks
npm run lint         # ESLint
npm run type-check   # TypeScript
npm run format:check # Prettier

# Testing
npm run test         # All tests
npm run test:unit    # Unit only
npm run test:integration # Integration only

# Build
npm run build        # Production build
```
