# Repository Guidelines

## Project Structure & Module Organization
- Next.js app directory lives in `src/app` (routes/layouts/pages). Shared UI sits in `src/components`; reusable logic in `src/hooks` and `src/utils`; data/helpers in `src/lib` and `src/services`. Styling is mostly Tailwind via `src/css` and theme assets in `src/assets`, `src/fonts`, and `public/`.
- JS helpers that aren’t React components live in `src/js`. Types are centralized in `src/types`. Keep feature-specific assets colocated when possible and export through index files for tidy imports.

## Build, Test, and Development Commands
- `npm run dev` — start the local Next.js dev server.
- `npm run build` — production build; use before PRs touching config or routing.
- `npm run start` — serve the production build locally for sanity checks.
- `npm run lint` — ESLint with Next rules and Prettier/Tailwind sorting; run before pushing.

## Coding Style & Naming Conventions
- Language: TypeScript + React Server/Client Components; prefer server components unless the code needs client-only features.
- Formatting: Prettier (with `prettier-plugin-tailwindcss`) and ESLint (`eslint-config-next`). Use 2-space indentation, single quotes only when lint allows string consistency, semicolons per formatter.
- Naming: PascalCase for components, camelCase for functions/variables, kebab-case for files and route segments. Tailwind classes should be ordered by the plugin; avoid inline styles when a utility class exists.
- UI styling: follow `docs/STYLE_GUIDE.md` as the single source of truth for NextAdmin tokens, tables, badges, and layout rules.

## Testing Guidelines
- No dedicated test runner is configured yet. For changes with logic risk, add lightweight checks using your preferred Next-friendly stack (e.g., React Testing Library + Vitest) and document commands in the PR. At minimum, exercise new behavior manually and note steps in the PR description.

## Commit & Pull Request Guidelines
- Commits: concise imperative subject (e.g., `Add dashboard cards`, `Fix sidebar layout`). Group related changes; avoid noisy churn.
- PRs: include what/why, affected areas, and any new env vars or migrations. Link issues if available. For UI changes, attach before/after screenshots or short notes describing the visual impact.
- Ensure `npm run lint` and a production build (when routing/config changes are involved) complete successfully before requesting review.

## Environment & Configuration
- Use Node 18+ (Next.js 16 baseline). Store secrets in a local `.env` and reference via `process.env.*`; never commit credentials. Update `next.config.mjs` cautiously and document any new env keys or external service requirements.
