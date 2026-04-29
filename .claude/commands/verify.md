---
description: Run lint + typecheck + build to verify the codebase is clean
---

Verify the current state of the codebase by running three checks in order and reporting the result of each.

1. `pnpm lint` — ESLint on `.js/.jsx/.ts/.tsx`. Expect 0 errors (warnings are OK).
2. `npx tsc --noEmit` — TypeScript type check. Expect 0 errors.
3. `pnpm build` — Next.js production build. Expect successful compilation.

Report the outcome of each step (pass / fail + brief reason). Do NOT try to fix issues automatically — just report. If any step fails, quote the relevant error lines so the user can decide how to proceed.

If all three pass, report: `✅ lint: OK · typecheck: OK · build: OK`.
