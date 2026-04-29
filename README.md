# DirectoryKit

Ship your directory in hours, not weeks. A production-ready Next.js boilerplate for building directory websites, marketplaces, and catalogs.

## Quick Start

```bash
cp .env.example .env.local   # Fill in your credentials
pnpm install
pnpm db:migrate               # Run database schema
pnpm dev                      # Open http://localhost:3000
```

## Documentation

Full documentation is available at [directorykit.online/docs](https://directorykit.online/docs) — covering installation, configuration, features, database, API reference, deployment, and customization.

For AI-assisted development, see [CLAUDE.md](./CLAUDE.md).

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Payments:** Stripe
- **Email:** Resend
- **Styling:** Tailwind CSS + shadcn/ui
- **Language:** TypeScript

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm lint` | Run ESLint |
| `pnpm db:test` | Test database connection |
| `pnpm db:migrate` | Run database migrations |
| `pnpm migrate:csv` | Import data from CSV |
| `pnpm supabase:types` | Regenerate TypeScript types |

## License

Private — all rights reserved.
