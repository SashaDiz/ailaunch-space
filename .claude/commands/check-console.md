---
description: Check source files for stray console.log/info/debug (excluding scripts/)
---

Grep the source tree for `console.log`, `console.info`, and `console.debug` in `.ts`/`.tsx` files, and report every match with its file:line.

Use the Grep tool with:
- pattern: `console\.(log|info|debug)`
- glob: `**/*.{ts,tsx}`
- output_mode: `content`
- `-n`: true

Exclude matches in `scripts/` (CLI tools — allowed to log freely). The rest of the codebase (`app/`, `components/`, `lib/`, `hooks/`, `config/`, `types/`, `i18n/`, `middleware.ts`) must be clean — baseline is **0 matches**.

If there are matches, list them and ask the user whether to delete them. Do not auto-delete.

If there are 0 matches, reply: `✅ No stray console.log in source files.`
