# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Launch Space — a weekly competition platform for AI projects. Builders submit tools, compete for weekly recognition via community voting, and earn dofollow backlinks. Built with Next.js 15 (App Router), React 19, Supabase (PostgreSQL), Tailwind CSS + daisyUI 5.

## Commands

```bash
pnpm dev          # Dev server (port 3000, 4GB heap)
pnpm build        # Production build (4GB heap)
pnpm start        # Start production server
pnpm lint         # ESLint
```

Package manager: **pnpm 10.4.1+**, Node.js 18+.

## Architecture

### Data Flow Pattern
- **Server Components** query Supabase directly via service role key
- **Client Components** call Next.js API routes or use Supabase client via `SupabaseProvider` context
- **Auth state** managed by `useUser()` hook (`app/hooks/useUser.js`)

### Database Abstraction (`app/libs/database-supabase.js`)
MongoDB-like interface over Supabase. Methods: `findOne()`, `find()`, `updateOne()`, `insertOne()`, `deleteOne()`. Supports `$and`, `$or`, `$regex`, `$in`, `$gt`, `$lt`, `$ne`, `$exists` filters. All API routes use this — do not call Supabase directly in routes.

### Authentication (`app/libs/auth-supabase.js`)
Three layers: client-side redirect → API session validation (401 on failure) → Supabase Row Level Security. Auth methods: Email magic link, Google OAuth, GitHub OAuth. PKCE flow configured in middleware.

### Key Libs
| File | Purpose |
|------|---------|
| `app/libs/supabase.js` | Client/server Supabase initialization |
| `app/libs/database-supabase.js` | DB abstraction layer |
| `app/libs/auth-supabase.js` | Server-side auth helpers |
| `app/libs/email.js` | Email templates (Resend + React Email) |
| `app/libs/notification-service.js` | Email delivery & preference management |
| `app/libs/lemonsqueezy.js` | LemonSqueezy payment integration |
| `app/libs/stripe.js` | Stripe integration (streaks/subscriptions) |
| `app/libs/streaks.js` | Voting streak rewards system |
| `app/libs/rateLimit.js` | API rate limiting |

### API Route Patterns
- Protected routes validate Supabase session, return 401 if invalid
- Cron jobs (`app/api/cron/`) require `Authorization: Bearer CRON_SECRET` header
- Webhooks (`app/api/webhooks/`) are excluded from middleware auth
- Admin endpoints check `is_admin` flag on user record

### Core Domain Concepts
- **Competitions**: Weekly (Mon–Sun). 15 shared + 10 premium-only slots. Winners auto-awarded via cron. Top 3 get dofollow backlinks.
- **Voting**: One vote per user per project per competition. Streaks track consecutive voting days with reward tiers (5, 25, 50, 100+ votes).
- **Projects (apps table)**: Submissions go through draft → pending → approved/declined flow. Premium ($15 via LemonSqueezy) get priority slots.
- **Backlinks**: Dofollow for winners (time-limited), nofollow for others. Admin can toggle link type.

### Payment Flow
LemonSqueezy (primary): submit → save draft → redirect to checkout → webhook confirms payment → publish. Stripe used for streak subscriptions and coupon generation.

## Configuration

### Path Aliases (jsconfig.json)
`@/*`, `@/components/*`, `@/libs/*`, `@/hooks/*`, `@/models/*`

### Styling
Tailwind CSS with daisyUI 5. Three themes: light, dark, abyss. Primary color: `#ED0D79`. Icon library: `iconoir-react`.

### Middleware (`middleware.js`)
Refreshes Supabase session, sets security headers (CSP, X-Frame-Options), handles PKCE auth flow. Excludes: webhooks, static files, images.

### Cron Jobs (Vercel)
- `/api/cron/competitions` — daily at midnight UTC (competition lifecycle)
- `/api/cron/winner-reminders` — daily at 9 AM UTC (badge/backlink reminders)

### Environment Variables
Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`, `RESEND_API_KEY`, `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_WEBHOOK_SECRET`.

## Rules

- Do not create `*.md` files without explicit request.
- Forms use `react-hook-form` with `zod` validation via `@hookform/resolvers`.
- Toast notifications via `react-hot-toast`.
- Animations use GSAP (split into separate webpack chunk).
- Build uses 4GB heap (`--max-old-space-size=4096`) — this is intentional for webpack.
