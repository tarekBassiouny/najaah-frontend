# Frontend Skills — Reference Extraction Plan

## Status: Planned
## Priority: Low (do when skills grow or context becomes a bottleneck)

---

## Problem

Three frontend skills are 468–618 lines each, all inline. Unlike backend skills which use `references/` subdirectories, frontend skills pack everything into SKILL.md. This wastes context when only a subset of guidance is needed.

## Item 3: Extract `lms-frontend` references

**Current:** `lms-frontend/SKILL.md` — 618 lines covering architecture, types, services, React Query, components, routes, multi-tenancy, file paths, best practices.

**Proposed structure:**
```
lms-frontend/
  SKILL.md                              (~80 lines — when to use, load order, fast path)
  references/
    architecture-overview.md            (routes, feature modules, core libraries)
    component-patterns.md               (data tables, forms, Zod schemas)
    service-and-query-patterns.md       (API service layer, React Query hooks)
    route-protection-and-tenancy.md     (AdminRouteGuard, capabilities, tenant scope)
    file-paths.md                       (quick reference of key paths)
```

**Migration rule:** SKILL.md keeps the "when to use" + "default workflow" + summary. Each reference is loaded only when the orchestrator's current phase needs it.

---

## Item 4: Audit `lms-pm` usage

**Current:** `lms-pm/SKILL.md` — 468 lines of product context (personas, feature areas, scope framing, user story templates, priority framework).

**Question to answer:** How often does the orchestrator actually load this skill?

**Decision tree:**
- If loaded frequently → extract references like item 3
- If loaded rarely (only during planning) → keep as-is, it's fine
- If never loaded → consider removing or merging key content into `lms` master skill

**How to audit:**
1. Check orchestrator specialist selection — `lms-pm` is only referenced for "backend contract or capability mapping needs clarification"
2. Check if any other skill references `lms-pm`
3. If only the orchestrator loads it, and only for contract clarification, consider trimming to just the capability mapping table (~50 lines) and dropping the rest

---

## When to execute

- Execute item 3 when `lms-frontend/SKILL.md` grows past 700 lines or context limits become noticeable
- Execute item 4 after 2-3 cross-repo feature cycles — by then usage patterns will be clear
