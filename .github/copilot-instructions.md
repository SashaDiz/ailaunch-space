# GitHub Copilot instructions

**Read [`AGENTS.md`](../AGENTS.md)** (symlinked to `CLAUDE.md`) for the full project architecture, conventions, and hard rules.

## Quick reference

- **Stack:** Next.js 16 (App Router, webpack) + React 19 + Supabase + Stripe + Tailwind + shadcn/ui. Package manager: `pnpm`.
- **Path alias:** `@/*` → project root. Always use it, never deep relative paths.
- **Data access:** Use `db` from `@/lib/supabase/database` (MongoDB-style). Do not pass `created_at`/`updated_at` — triggers handle them.
- **Admin check:** Use `checkIsAdmin` from `@/lib/supabase/auth` (checks `is_admin` boolean AND `role === 'admin'`).
- **Auth in API routes:** `supabase.auth.getUser()` — never raw `getSession()`.
- **Validation:** Zod schemas in `@/lib/validations/schemas` are the source of truth.
- **No `console.log` / `console.info` / `console.debug`** in source files. `console.warn` / `console.error` OK.
- **Before finishing:** run `pnpm lint` and `pnpm build`.

## File-scoped guidance

Cursor rules under `.cursor/rules/` are human-readable and apply equally when using Copilot:

- `.cursor/rules/always.mdc` — global guardrails
- `.cursor/rules/api-routes.mdc` — `app/api/**/*.ts` handler template
- `.cursor/rules/supabase.mdc` — DB layer + auth helpers
- `.cursor/rules/components.mdc` — React component conventions
