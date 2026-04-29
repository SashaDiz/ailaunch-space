# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DirectoryKit** is a directory/catalog SaaS boilerplate built with Next.js 16, Supabase, and Stripe. Users submit projects, admins approve them, and visitors browse a categorized directory.

**Stack:** Next.js 16.0.7 (App Router, webpack mode), React 19, Supabase (PostgreSQL + Auth + Storage), Stripe payments, Resend email, Tailwind CSS 3 + shadcn/ui, GSAP animations, TypeScript (strict: false), pnpm 10.4.

**Notable libraries:** `@dnd-kit/*` (drag-and-drop for admin categories/spheres), `recharts` (admin analytics/dashboard charts), `@aws-sdk/client-s3` (file uploads), `seobot` (blog content), `next-intl` (i18n), Vercel AI SDK with `@ai-sdk/anthropic` + `@ai-sdk/openai` providers, `date-fns`.

## Commands

```bash
pnpm dev          # Dev server (webpack, 4GB heap)
pnpm build        # Production build (webpack, 4GB heap)
pnpm start        # Start production server
pnpm lint         # ESLint on .js/.jsx/.ts/.tsx (typescript-eslint + react-hooks)
pnpm db:test      # Test Supabase connection
pnpm db:migrate   # Run Supabase migration script
pnpm migrate:csv  # Import data from CSV files
pnpm supabase:types  # Regenerate types/supabase.ts from remote schema (requires SUPABASE_PROJECT_ID env var)
pnpm webhook:simulate  # Test webhook locally
```

Dev and build use `--webpack` flag because the project requires webpack (not Turbopack) for custom config in `next.config.ts`. There is no test framework configured.

The `scripts/` directory contains utility scripts for database operations and testing. They require environment variables from `.env.local`.

**Pre-commit hook:** `husky` + `lint-staged` run `eslint --fix` on staged `.ts/.tsx/.js/.jsx` files. Configured in `package.json` (`lint-staged` section) and `.husky/pre-commit`. Don't bypass with `--no-verify` unless you know why.

**Logging discipline:** `console.log`, `console.info`, and `console.debug` are forbidden in source code (lib, app, components, hooks, config, types, i18n). Use `console.warn` or `console.error` instead. ESLint enforces this with `no-console: ['warn', { allow: ['warn', 'error'] }]`. CLI scripts under `scripts/` are exempt.

## Architecture

### Path alias

`@/*` maps to project root (`./`). All imports use this alias:
```ts
import { siteConfig } from '@/config/site.config';
import { db } from '@/lib/supabase/database';
import { Button } from '@/components/ui/button';
import { useFeatures } from '@/hooks/use-features';
import type { User } from '@/types';
```

### Directory layout

```
config/           # Centralized config (site, features, plans, themes, analytics, email, payments, directory, advertising, marketing)
lib/              # Business logic and utilities
  supabase/       # client.ts, auth.ts, auth-helpers.ts, database.ts, database-supabase.ts
  payments/       # stripe.ts
  validations/    # schemas.ts (Zod — source of truth for types)
  email.ts, notifications.ts, webhooks.ts, rate-limit.ts, seo.ts, link-type-manager.ts
  ai.ts           # AI utilities (description generation, category suggestions) — requires `ai` flag
  analytics.ts    # Enhanced analytics helpers — requires `analytics` flag
  features.ts     # Feature flag guard for API routes
  theme-utils.ts  # HSL/hex conversion, theme application
  utils.ts        # cn() — clsx + tailwind-merge
hooks/            # React hooks (use-user, use-user-stats, use-features)
components/
  ui/             # shadcn/ui primitives (Button, Card, Dialog, Select, etc.)
  admin/          # Admin-specific components (CsvImportDialog, PromotionFormDialog, SponsorFormDialog, etc.)
  directory/      # ProductCard, CategorySelector, CategoryBadge, PaidPlacementCard
  forms/          # ImageUpload, NewsletterSignup
  layout/         # Header, Footer
  marketing/      # PromoBanner, PartnersSection, SocialProof, GuidePromoCard, AdBanner
  shared/         # Pagination, Providers, SiteThemeProvider, ErrorBoundary, LanguageSwitcher, LoadingSpinner, etc.
types/            # TypeScript types (index.ts re-exports all; database.ts, config.ts, api.ts, payments.ts)
app/
  (admin)/admin/  # Route group: categories, changelog, projects, promotions, sponsors, theme, users
  auth/           # Auth routes: signin, callback (NOT a route group)
  (dashboard)/    # Route group: dashboard, submit, edit, profile, settings
  (marketing)/    # Route group: blog, pricing, faq, terms, privacy, contact, help, cookies, promote, sponsor, project/[slug], user/[id], categories
  api/            # API routes
scripts/          # Utility scripts (db:test, db:migrate, migrate:csv, webhook:simulate)
i18n/             # next-intl request configuration
messages/         # Translation files (en.json, etc.) — requires `i18n` flag
supabase/
  schema.sql      # Full database schema
```

### Configuration-driven design

All customization lives in `config/`. To rebrand or toggle features, edit config files — no code changes needed:

| File | Controls |
|------|----------|
| `site.config.ts` | Brand name, tagline, URLs, social links, contact emails, SEO keywords |
| `features.config.ts` | Feature flags — disabling hides UI, returns 404 from API routes, skips cron |
| `plans.config.ts` | Pricing tiers, features per plan, Stripe price IDs |
| `themes.config.ts` | 14 color themes with HSL values, applied via CSS variables |
| `analytics.config.ts` | GA, PostHog integration keys |
| `payments.config.ts` | Payment provider configuration |
| `email.config.ts` | Email provider (Resend) configuration |
| `directory.config.ts` | Page size, sort options, pricing filters, seed categories |
| `advertising.config.ts` | Sponsor/promotion pricing, Stripe price IDs, placement limits, discount rules |
| `marketing.config.ts` | Ad banner content (text, button, link, icon) |
| `ai.config.ts` | AI provider, model, temperature, max tokens |
| `i18n.config.ts` | Supported locales, default locale, locale detection (disabled by default) |

Config files also export helper functions (e.g. `getPlan()`, `getFreePlan()`, `getPaidPlans()` from plans, `getFromAddress()` from email, `getSortFields()` from directory).

### Database abstraction layer

`lib/supabase/database-supabase.ts` wraps Supabase with a MongoDB-inspired API. All data access goes through `lib/supabase/database.ts` which re-exports the singleton `db`:

```ts
import { db } from '@/lib/supabase/database';

// Tables accessible via db layer: apps, users, categories, competitions, payments,
//   newsletter, sidebar_content, backlinks, analytics, external_webhooks,
//   partners, bookmarks, ratings, comments, promotions
// Tables in schema but NOT in db layer (accessed via Supabase client directly):
//   changelog, email_notifications, site_settings, link_type_changes

// Direct method calls (NOT chainable — there is no db.collection() method):
await db.findOne("apps", { slug: "example" });
await db.find("apps", { status: "live" }, { sort: { upvotes: -1 }, limit: 10 });
await db.find("apps", { status: "live" }, { sort: { upvotes: -1 }, skip: 20, limit: 10, projection: { slug: 1, name: 1 } });
await db.insertOne("apps", { name: "...", slug: "..." });
await db.updateOne("apps", { id }, { $set: { status: "approved" } });
await db.deleteOne("apps", { id });
await db.count("apps", { status: "live" });

// Additional helpers:
await db.rpc("function_name", { param: value });       // Call PostgreSQL functions
await db.incrementField("apps", id, "upvotes", 1);     // Increment a field (read-modify-write)
```

**Method signatures:**
- `db.find(table, query, options)` — options: `{ sort, limit, skip, projection }`
- `db.findOne(table, query, options)` — same options as `find`
- `db.insertOne(table, document)` — returns `{ insertedId }`
- `db.insertMany(table, documents)` — returns `{ insertedIds, insertedCount }`
- `db.updateOne(table, filter, update)` — update with `{ $set: {...} }` and/or `{ $inc: {...} }`
- `db.updateMany(table, filter, update)` — delegates to `updateOne` per match
- `db.deleteOne(table, filter)`
- `db.deleteMany(table, filter)` — delegates to `deleteOne` per match
- `db.count(table, query)`

Supported query operators: `$and`, `$or`, `$in`, `$gt`, `$gte`, `$lt`, `$lte`, `$regex`, `$exists`, `$ne`, `$not`, `$overlaps`, `$contains`. Update operators: `$set`, `$inc`.

**Note:** JSONB array columns (`categories`, `tags`) use Supabase `.overlaps()` internally — the `$in` operator works for these but behaves differently from scalar columns.

The database layer uses the **service role** client (`getSupabaseAdmin()`), which bypasses RLS. All tables have RLS enabled in the schema. Timestamps (`created_at`, `updated_at`) are handled by database triggers — don't pass them in `insertOne` or `$set`.

The `$inc` operator uses a read-modify-write pattern (not atomic) and clamps values to `>= 0`. For critical counters, use PostgreSQL functions via `db.rpc()` directly.

### Type system

Zod schemas in `lib/validations/schemas.ts` are the **source of truth**. Entity types in `types/database.ts` are derived via `z.infer<typeof Schema>`. All types are re-exported from `types/index.ts`:

```ts
import type { User, App, Category, SiteConfig, ApiResponse } from '@/types';
```

Multi-step form validation uses per-step schemas picked from the main `ProjectSubmissionSchema`: `PlanSelectionSchema`, `BasicInfoSchema`, `DetailsSchema`, `MediaSchema`, `LaunchWeekSchema`.

### Feature flags

Features are toggled in `config/features.config.ts`. Current flags: `partners`, `badges`, `backlinks`, `socialProof`, `newsletter`, `blog`, `webhooksExternal`, `adBanner`, `bookmarks`, `ratings`, `comments`, `promotions`, `ai`, `analytics`, `i18n`.

The `ai` and `i18n` flags are disabled by default. All other flags (including `analytics`) are enabled by default. When enabled:
- **ai** (`lib/ai.ts`, `config/ai.config.ts`, `app/api/ai/generate/`) — AI-powered description generation and category suggestions via Vercel AI SDK
- **i18n** (`config/i18n.config.ts`, `i18n/request.ts`, `messages/`) — Multi-language support via `next-intl`. Translations live in `messages/{locale}.json`
- **analytics** (`lib/analytics.ts`) — Enhanced analytics tracking (device, browser, country, per-project events)

API routes guard with:
```ts
import { featureGuard } from '@/lib/features';
const guard = featureGuard('partners');
if (guard) return guard; // Returns 404 if disabled
```

Client components check with `useFeatures()` hook or `isEnabled('featureName')`.

### Authentication

Supabase Auth with email/password + Google OAuth.

**Middleware** (`middleware.ts`) runs on all requests (except static files, image files, and `/api/webhooks`). It refreshes the session token and handles i18n locale detection when enabled — it does NOT protect routes or redirect. Route protection is handled by individual pages/API routes.

**Server-side auth helpers** (`lib/supabase/auth-helpers.ts`):
```ts
import { getServerSession, getCurrentUser, isAdmin, isAuthenticated, requireAuth } from '@/lib/supabase/auth-helpers';

await getServerSession();  // Returns { user: { id, email, name, image } } or null
await getCurrentUser();    // Returns user object or null
await isAuthenticated();   // Returns boolean
await isAdmin();           // Checks users table for is_admin boolean flag
await requireAuth();       // Returns redirect object if not authenticated
```

**Important:** In API routes and server components, always verify auth with `supabase.auth.getUser()`, never `getSession()`. `getSession` reads from cookies without server validation and can be spoofed.

**Admin access note:** The schema has two admin mechanisms: `is_admin BOOLEAN` column (checked by `isAdmin()` helper) and `role TEXT` column (`'user' | 'admin' | 'moderator'`). RLS policies use `role = 'admin'` while the `isAdmin()` helper checks `is_admin = true`. Keep both in sync when granting admin access.

**Supabase clients** (`lib/supabase/client.ts`):
```ts
import { getSupabaseClient } from '@/lib/supabase/client';  // Browser (publishable key, respects RLS)
import { getSupabaseAdmin } from '@/lib/supabase/client';   // Server (secret key, bypasses RLS)
```

Env vars are read via `lib/supabase/env.ts` — the helpers
(`getSupabasePublishableKey`, `getSupabaseSecretKey`) prefer the new names
(`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`) and fall back to
the legacy names (`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
so existing deployments keep working. Import from there instead of reading
`process.env` directly.

### Provider hierarchy

The app wraps all pages in this nesting order (defined in `components/shared/Providers.tsx`):
```
ThemeProvider (next-themes, class-based light/dark)
  → SupabaseProvider (auth session context)
    → SiteThemeProvider (color theme from DB/config)
      → SiteTracker (analytics, rendered as sibling)
      → children
      → Toaster (react-hot-toast)
```

### Styling

- **shadcn/ui** (new-york style) for primitives in `components/ui/`; configured in `components.json` with RSC enabled
- **Tailwind CSS** with HSL CSS variables for theming — colors stored as raw HSL values without `hsl()` wrapper (e.g. `"0 100% 60%"`), used as `hsl(var(--primary))`
- Tailwind config is `tailwind.config.js` (not `.ts`); plugins: `@tailwindcss/typography`, `tailwindcss-animate`
- Use `cn()` from `lib/utils.ts` (clsx + tailwind-merge) for conditional class merging
- Colors defined as CSS variables in `app/globals.css`, overridden per theme via `data-color-theme` attribute
- **Three-layer theming:** (1) light/dark mode via `next-themes` class, (2) 14 preset color themes via `data-color-theme`, (3) admin custom themes stored in DB and applied via `SiteThemeProvider`
- Theme CSS variables include colors (HSL), typography (font-family strings), border-radius, spacing, shadows

### Key patterns in API routes

```ts
// Rate limiting (in-memory)
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
const rateLimitResult = await checkRateLimit(request, 'general'); // 'general' | 'voting' | 'auth' | 'submission' | 'admin' | 'analytics'

// Feature guard — returns 404 Response if feature disabled, null if enabled
import { featureGuard } from '@/lib/features';
const guard = featureGuard('partners');
if (guard) return guard;

// Webhook notifications (Discord/external)
import { webhookEvents } from '@/lib/webhooks';
await webhookEvents.projectSubmitted(project);

// Notifications
import { notificationManager } from '@/lib/notifications';
```

### Payments

Stripe integration in `lib/payments/stripe.ts`. One paid submission plan ("Premium", one-time $15) configured in `config/plans.config.ts`. Promotion/sponsor pricing is a separate system configured in `config/advertising.config.ts` with its own Stripe price IDs (`STRIPE_PRICE_ID_PROMO_BANNER`, `STRIPE_PRICE_ID_PROMO_CATALOG`, `STRIPE_PRICE_ID_PROMO_DETAIL`). Webhook handler at `app/api/webhooks/stripe/route.ts`. The `payments.config.ts` also supports Lemon Squeezy, Paddle, and a free-only ("none") mode.

### Cron jobs

Endpoints under `app/api/cron/` are secured with `Authorization: Bearer ${CRON_SECRET}` header. Currently only `account-notifications` exists in the filesystem. Cron schedules for `competitions` and `winner-reminders` are defined in `vercel.json` but the route handlers are not yet implemented.

### Security patterns

Input sanitization is handled by `sanitizeString()` in `lib/validations/schemas.ts` — it strips `<>`, `javascript:`, `on*=`, and `data:` URIs. URL validation blocks `javascript:` and `data:` protocols. Always sanitize user-provided strings before storing.

`next.config.ts` applies security headers globally: `X-Frame-Options`, `X-Content-Type-Options`, `Content-Security-Policy`, `Strict-Transport-Security`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`.

### Next.js config notes

- Images are `unoptimized: true` with remote patterns for Google, SEObot, AWS, Unsplash, Logo.dev, localhost
- `/projects` and `/projects/:path*` permanently redirect to `/`
- `serverExternalPackages` includes `mongodb` (legacy artifact), `@supabase/supabase-js`, `@supabase/ssr`, `@react-email/render`, `resend`
- Config is wrapped in `withNextIntl()` and `withBundleAnalyzer()` (enable with `ANALYZE=true`)

## Quickstart

1. `cp .env.example .env.local` — fill in Supabase, Stripe, and Resend credentials
2. `pnpm install`
3. Run `supabase/schema.sql` in the Supabase SQL Editor (or `pnpm db:migrate`)
4. Add your Supabase project hostname to `next.config.ts` `remotePatterns`
5. Edit `config/site.config.ts` — set brand name, tagline, contact emails, social links
6. `pnpm dev` — open http://localhost:3000

## Environment Variables

Copy `.env.example` to `.env.local`. See `.env.example` for full list with descriptions.

**Required:** `NEXT_PUBLIC_APP_URL`, Supabase credentials (URL, publishable key, secret key — legacy anon / service-role keys are still accepted), S3 storage config, Stripe keys, Resend API key, `CRON_SECRET`.

**Optional:** Google Analytics (`NEXT_PUBLIC_GA_MEASUREMENT_ID`), PostHog (`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`), SEObot (`SEOBOT_API_KEY`), Discord webhook (`DISCORD_WEBHOOK_URL`), `SUPABASE_PROJECT_ID` (for `pnpm supabase:types`), promotion Stripe price IDs (`STRIPE_PRICE_ID_PROMO_BANNER`, `STRIPE_PRICE_ID_PROMO_CATALOG`, `STRIPE_PRICE_ID_PROMO_DETAIL`), ListingBott link (`NEXT_PUBLIC_LISTINGBOTT_URL`), Logo.dev (`NEXT_PUBLIC_LOGO_DEV_TOKEN`), AI config (`AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY`), bundle analysis (`ANALYZE=true`).

## Known Limitations

Known gaps AI sessions should be aware of — not active bugs, but technical debt that hasn't been scoped into its own session yet. Flag them when relevant; don't try to fix inline unless the user asks.

- **`tsconfig.json` has `strict: false`.** Enabling strict mode cascades into hundreds of implicit-any / null errors across the codebase. Needs a dedicated per-error-triage session. `@typescript-eslint/no-explicit-any` is currently off for the same reason.
- **`app/api/admin/route.ts` is a ~1600-line monolith.** Every admin action (projects, users, link types, Stripe recovery, promotions, sponsors, analytics) lives in one file. Splitting into `app/api/admin/{projects,users,payments,...}/route.ts` is a multi-hour refactor with real regression risk — ask before attempting.
- **No test framework.** There is no `vitest`/`jest` config and no `*.test.*`/`*.spec.*` files. When making risky changes (payments, auth, webhooks), verify via `pnpm build` + manual end-to-end and flag to the user that test coverage is absent.
- **Two admin mechanisms in the schema.** Both `is_admin BOOLEAN` and `role TEXT` exist in the `users` table. The canonical check is `checkIsAdmin` in `@/lib/supabase/auth` (matches either). When granting admin, keep both in sync so RLS policies (which use `role = 'admin'`) and the helper agree.

## AI tooling

Config files for AI coding assistants:

- `CLAUDE.md` (this file) — primary spec for Claude Code.
- `AGENTS.md` — symlink to `CLAUDE.md`, picked up by Cursor 0.50+, Codex, Aider, Zed.
- `.cursor/rules/*.mdc` — file-scoped rules for Cursor (always-on + globbed for `app/api/`, `lib/supabase/`, `components/`).
- `.claude/settings.json` — Claude Code permissions (allow safe commands, deny destructive ones + `.env*`).
- `.claude/commands/` — slash commands: `/verify` (lint+typecheck+build), `/check-console` (grep for stray console.log).
- `.github/copilot-instructions.md` — thin stub pointing Copilot at `AGENTS.md`.

When editing project-wide conventions, update **`CLAUDE.md`** — every other file either symlinks to it or points back to it.
