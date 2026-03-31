# NextAdmin Style Guide (Source of Truth)

This document is the single source of truth for UI styling and layout conventions in this repo. All UI work must align to the NextAdmin template patterns and the existing design tokens.

## 1) Style Authorities (Use These Only)
- Tailwind theme tokens: `tailwind.config.ts`
- Global styles/utilities: `src/css/style.css`
- Core UI primitives: `src/components/ui/*`
- Layout components: `src/components/Layouts/*`

Do not introduce new global styles or one-off inline styles when a token/class already exists.

## 2) Layout Rules (NextAdmin)
- Dashboard routes live under `src/app/(dashboard)` and use the dashboard layout.
- Auth/public routes live under `src/app/(auth)` and must not mount sidebar providers or dashboard layout styles.
- Sidebar + Header are owned by `src/app/(dashboard)/layout.tsx`.
- Portal routes live under `src/app/(portal)` and use portal-owned shell components instead of the dashboard sidebar/header.
- Student and parent portal shells may define their own sidebar and topbar patterns, but those patterns must stay inside the portal feature layer and must not leak back into `(dashboard)` layout rules.

## 3) Tables & Lists
- Use `src/components/ui/table`.
- Loading state: skeleton rows only (no spinners).
- Empty state: icon + title + subtitle; no CTAs.
- Error state: inline neutral error message only.
- Row density: compact padding and truncation for long text.
- Dates: use `formatDateTime` from `src/lib/format-date-time.ts`.

## 4) Badges & Status
- Status badges must use existing Tailwind tokens (no custom colors).
- Map to semantic colors: green (active), yellow (pending), gray (inactive), red (failed), neutral (unknown).
- No badge tooltips or click handlers.

## 5) Typography & Spacing
- Use defined sizes in Tailwind config (`text-heading-*`, `text-body-*`).
- Prefer `px-3 py-2` for table cells and matching skeleton heights.
- Avoid multi-line wrapping in tables; use `truncate`.

## 6) Sidebar & Navigation
- Sidebar config is canonical at `src/components/Layouts/sidebar/data/index.ts`.
- Route access rules are derived from the same sidebar config (no duplicate maps).
- Active state is derived from `usePathname()` only.
- Collapse state lives in `SidebarProvider` and must not be reimplemented per page.
- Sidebar only appears in dashboard layout.
- Portal navigation is separate from dashboard navigation and may use route-local config inside `src/features/portal/components/layout/*PortalShell.tsx`.
- Portal shells may use right-side desktop sidebars and compact topbars when the portal design requires it, but search, logout, locale switching, and role switching should remain shell-owned behaviors rather than page-local implementations.

## 7) Do / Don’t
Do:
- Reuse `src/components/ui/*` and theme tokens.
- Keep dashboard-only UI inside `(dashboard)` layout tree.
- Follow capability gating for sidebar entries.

Don’t:
- Add new global styles without updating this guide.
- Add route-specific CSS overrides.
- Add new UI primitives outside `src/components/ui/*`.

## 8) Validation Checklist (UI)
- Matches NextAdmin tokens and layout conventions.
- Uses existing components and classes.
- No new colors or fonts outside Tailwind config.
- No sidebar state outside dashboard layout.
