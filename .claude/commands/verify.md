---
description: Run lint + typecheck + build to verify the codebase is clean
---

Verify the current state of the codebase by running four checks in order and reporting the result of each.

1. `pnpm lint` — ESLint on `.js/.jsx/.ts/.tsx`. Expect 0 errors (warnings are OK).
2. `pnpm typecheck` — `next typegen && tsc --noEmit`. Expect 0 errors. (Plain `tsc --noEmit` skips the generated route types, which is why this goes through the script.)
3. `pnpm test` — `node --test` over `tests/*.test.mjs`. Expect 0 failures.
4. `pnpm build` — Next.js production build. Expect successful compilation.

Report the outcome of each step (pass / fail + brief reason). Do NOT try to fix issues automatically — just report. If any step fails, quote the relevant error lines so the user can decide how to proceed.

If all four pass, report: `✅ lint: OK · typecheck: OK · tests: OK · build: OK`.
