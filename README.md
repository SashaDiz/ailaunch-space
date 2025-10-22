# AI Launch Space 🚀

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-blue)](https://supabase.com/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)

A weekly competition platform for AI projects where AI builders can submit their tools, get valuable backlinks, and compete for weekly recognition. Think Product Hunt but specifically for AI projects and tools.

## 🌟 Live Demo

Visit the live application at [https://ailaunch.space](https://ailaunch.space)

## 🎯 What is AI Launch Space?

AI Launch Space is a community-driven platform that helps AI builders:
- **Launch their projects** with weekly competitions
- **Get valuable backlinks** from high-authority domains
- **Build audience** through community voting
- **Compete for recognition** with weekly winner badges

Perfect for AI startups, indie developers, and anyone building AI tools who wants to get their project in front of the right audience.

## 🚀 Features

### Core Features
- **Supabase Authentication** - Email (Magic Link), Google OAuth, GitHub OAuth
- **AI Project Submissions** - Multi-step form with FREE and Premium plans
- **Real-time Voting** - Community-driven upvoting system
- **Weekly Competitions** - Top 3 FREE submissions win dofollow backlinks
- **User Dashboard** - Track submissions, views, and votes
- **Admin Dashboard** - Manage submissions, competitions, and link types
- **Email Notification System** - Automated notifications for user actions and events
- **Responsive Design** - Mobile-friendly with TailwindCSS + daisyUI
- **SEO Optimization** - Sitemap, meta tags, and backlink management

### Future Features (TODO)
- **Advanced Ranking System** - Sophisticated scoring algorithms for weekly and overall rankings
- **Leaderboards** - All-time and category-specific project rankings
- **Dynamic Scoring** - Weighted scoring based on engagement, time, and user behavior

### Launch Plans

#### Standard Launch (FREE)
- **Cost**: Free
- **Features**: 
  - Live on homepage for 7 days
  - Badge for top 3 ranking products
  - High authority backlink for top 3 winners
  - 15 shared weekly slots
  - Community voting access

#### Premium Launch ($15)
- **Cost**: $15 per submission
- **Features**:
  - Live on homepage for 7 days
  - Badge for top 3 ranking products
  - Guaranteed high authority backlink
  - 25 total weekly slots (15 shared + 10 premium-only)
  - Premium badge & featured placement
  - Priority listing placement

**Note**: Both plans can earn badges for top 3 ranking products regardless of the chosen plan.

### Slot System

The platform uses a shared slot system:
- **Slots 1-15**: Shared between Standard and Premium submissions
- **Slots 16-25**: Premium-only (available when shared slots fill up)
- Standard submissions are blocked when `total_submissions >= 15`
- Premium submissions are blocked when `total_submissions >= 25`

### Draft System

Premium submissions are automatically saved as drafts until payment is confirmed:

- **Draft Creation**: When a user selects Premium but doesn't complete payment, their submission is saved as a draft
- **Resume Drafts**: Users can resume drafts from their dashboard, modify details, or even switch to Standard plan
- **Auto-Cleanup**: If a user resubmits with the same name/URL, unpaid drafts are automatically replaced
- **No Slot Blocking**: Drafts don't count toward weekly slot limits until payment is confirmed

**Draft States:**
- `status: "draft"` - Unpaid premium submission
- `is_draft: true` - Flag for easy filtering
- `payment_status: false` - Not yet paid
- `scheduled_launch: false` - Not scheduled until payment

After successful payment, drafts are automatically converted to active submissions.

## 🔐 Authentication & Security

### Multi-Layer Security Architecture

This application implements **defense-in-depth security** with three layers of protection:

1. **Client-Side Protection**
   - Submit page redirects unauthenticated users to sign-in
   - Preserves redirect URL for seamless return after login
   - Improves UX by preventing unnecessary API calls

2. **API-Level Authentication**
   - All protected endpoints validate Supabase session
   - Returns 401 Unauthorized for invalid requests
   - Comprehensive logging for debugging

3. **Database Row Level Security (RLS)**
   - PostgreSQL RLS policies enforce data access rules
   - Users can only submit/update their own projects
   - Users can only vote once per project
   - Cannot be bypassed from application code

### Authenticated Actions

✅ **Authenticated users can:**
- Submit AI projects to launches (FREE or Premium)
- Vote for projects
- Update their own submissions
- View their dashboard

❌ **Unauthenticated users:**
- Are redirected to sign-in when accessing protected pages
- Receive 401 errors when accessing protected APIs
- Cannot bypass security via database RLS policies

### Testing Authentication

Test authentication by:
1. Visit `http://localhost:3000`
2. Click "Sign in"
3. Try any authentication method (Email, Google, or GitHub)
4. Verify you're signed in (avatar appears in header)

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI library
- **Next.js 15** - Full-stack framework with App Router
- **Tailwind CSS 4** - Utility-first CSS
- **daisyUI 5** - Component library
- **Iconoir React** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Supabase (PostgreSQL)** - Database & Authentication with RLS
- **Next.js API Routes** - Serverless endpoints
- **LemonSqueezy** - Payment processing

### Key Libraries
- **@supabase/supabase-js** - Supabase client
- **@supabase/auth-helpers-nextjs** - Auth helpers
- **Zod** - Schema validation
- **React Hook Form** - Form management
- **React Hot Toast** - Notifications
- **Resend** - Email delivery service
- **pnpm** - Package manager

### File Upload & Storage
- **Supabase S3 Storage** - Image upload with drag & drop
- **Image optimization** - Automatic compression and validation
- **Multiple formats** - JPEG, PNG, WebP support

## 📋 Prerequisites

- Node.js 18+
- Supabase account (free tier available)
- pnpm (recommended) or npm
- LemonSqueezy account (for payments)

## 🚀 Quick Start

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/SashaDiz/ailaunch-space.git
cd ailaunch-space

# Install dependencies
pnpm install
```

### 2. Development Setup

For a complete development setup, follow the [Development Setup](#-development-setup) section below.

**Quick start for contributors:**
```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/ailaunch-space.git
cd ailaunch-space

# 3. Install dependencies
pnpm install

# 4. Copy environment template
cp .env.example .env.local

# 5. Set up your environment variables (see Development Setup)
# 6. Start development server
pnpm dev
```

### 2. Supabase Setup

1. **Create a Supabase project** at https://supabase.com
2. **Run the database schema**:
   - Go to Supabase Dashboard → SQL Editor
   - Copy and run the contents of `supabase/schema.sql`
3. **Get your API keys**:
   - Go to Project Settings → API
   - Copy the Project URL and keys

### 3. Environment Setup

Create `.env.local` file:

```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Supabase (Get from: https://app.supabase.com/project/_/settings/api)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_PROJECT_ID=your-project-id

# LemonSqueezy (Payment)
LEMONSQUEEZY_API_KEY=your_lemonsqueezy_api_key
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
LEMONSQUEEZY_PRODUCT_ID_PREMIUM=your_premium_product_id

# Email Notifications (Resend)
RESEND_API_KEY=your_resend_api_key

# Cron Job Security (Generate a random secret string)
CRON_SECRET=your_random_secret_string_here

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=your_google_analytics_id

# Supabase S3 Storage (for image uploads)
SUPABASE_S3_ENDPOINT=https://your-project.supabase.co/storage/v1/s3
SUPABASE_S3_REGION=us-east-1
SUPABASE_S3_ACCESS_KEY_ID=your_s3_access_key_id
SUPABASE_S3_SECRET_ACCESS_KEY=your_s3_secret_access_key
SUPABASE_S3_BUCKET=logos
```

### 4. Configure Supabase Authentication

#### Step 1: Configure URL Settings

Go to **Authentication → URL Configuration** in Supabase Dashboard:

**For Local Development:**
- **Site URL**: `http://localhost:3000`
- **Redirect URLs** (add all of these):
  ```
  http://localhost:3000/auth/callback
  http://localhost:3000/auth/callback/**
  http://localhost:3000/**
  ```

**For Production:**
- **Site URL**: `https://yourdomain.com`
- **Redirect URLs** (add all of these):
  ```
  https://yourdomain.com/auth/callback
  https://yourdomain.com/auth/callback/**
  https://yourdomain.com/**
  ```

⚠️ **IMPORTANT**: Click **Save** after adding each redirect URL!

#### Step 2: Enable Auth Providers

Go to **Authentication → Providers**:

**Email (Magic Link)** ✅
- Enabled by default
- No additional configuration needed
- Customize email templates if desired

**Google OAuth** (Optional)

1. **Create OAuth Credentials**:
   - Go to https://console.cloud.google.com/
   - Create a new project or select existing
   - Navigate to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: Web application
   
2. **Configure OAuth App**:
   - **Authorized JavaScript origins**: `http://localhost:3000` (dev) or `https://yourdomain.com` (prod)
   - **Authorized redirect URIs**: `https://your-project.supabase.co/auth/v1/callback`
   
3. **Enable in Supabase**:
   - Go to Authentication → Providers
   - Enable "Google" provider
   - Add Client ID and Client Secret from Google
   - Click **Save**

**GitHub OAuth** (Optional)

1. **Create OAuth App**:
   - Go to https://github.com/settings/developers
   - Click "New OAuth App"
   
2. **Configure OAuth App**:
   
   **For Local Development:**
   - **Application name**: Your App Name (Local)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/auth/callback`
   
   **For Production:**
   - **Application name**: Your App Name
   - **Homepage URL**: `https://yourdomain.com`
   - **Authorization callback URL**: `https://yourdomain.com/auth/callback`
   
3. **Copy Credentials**:
   - Copy the **Client ID** and **Client Secret**
   
4. **Enable in Supabase**:
   - Go to Authentication → Providers
   - Find and enable "GitHub"
   - Enter Client ID and Client Secret
   - Click **Save**

💡 **Tip**: For production, create **separate** OAuth Apps for each provider to avoid conflicts between development and production environments.

### 5. Setup Supabase S3 Storage (for image uploads)

1. **Create S3 Access Keys**:
   - Go to Supabase Dashboard → Settings → Storage
   - Create new Access Key in S3 Access Keys section
   - Save the Access Key ID and Secret Access Key

2. **Create Storage Bucket**:
   - Go to Storage in Supabase Dashboard
   - Create a new bucket named `logos`
   - Set up storage policies for public read and authenticated upload

3. **Add S3 variables to `.env.local`**:
   ```env
   SUPABASE_S3_ENDPOINT=https://your-project.supabase.co/storage/v1/s3
   SUPABASE_S3_REGION=us-east-1
   SUPABASE_S3_ACCESS_KEY_ID=your_s3_access_key_id
   SUPABASE_S3_SECRET_ACCESS_KEY=your_s3_secret_access_key
   SUPABASE_S3_BUCKET=logos
   ```

### 6. Test Database Connection

```bash
pnpm db:test
```

You should see:
```
✓ Database connection successful
✓ All 11 tables exist and are accessible!
```

### 7. Start Development

```bash
pnpm dev
```

Visit `http://localhost:3000` to see your app! 🎉

## 🔐 Authentication

### Sign-In Methods

The platform supports three authentication methods:

1. **Email (Magic Link)** - Users receive a sign-in link via email
2. **Google OAuth** - Sign in with Google account
3. **GitHub OAuth** - Sign in with GitHub account

### Usage in Code

**Client-Side (React Components)**:
```javascript
'use client';
import { useUser } from '@/app/hooks/useUser';
import { useSupabase } from '@/app/components/SupabaseProvider';

export default function MyComponent() {
  const { user, loading } = useUser();
  const { supabase } = useSupabase();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return <div>Hello, {user.email}!</div>;
}
```

**Server-Side (API Routes)**:
```javascript
import { getSupabaseAdmin } from '@/app/libs/supabase';

const supabase = getSupabaseAdmin();
const { data: { user } } = await supabase.auth.getUser(token);
```

## 📡 API Documentation

### Core Endpoints

#### AI Projects
- `GET /api/projects` - List all approved AI projects
- `POST /api/projects` - Submit new AI project
- `GET /api/projects/[slug]` - Get specific AI project
- `PUT /api/projects/update` - Update AI project

#### File Upload
- `POST /api/upload` - Upload images to Supabase S3 storage
  - Supports JPEG, PNG, WebP formats
  - Maximum file size: 1MB
  - Drag & drop interface
  - Automatic image optimization

#### Voting
- `POST /api/vote` - Vote on an AI project

#### User
- `GET /api/user/route` - Get current user
- `GET /api/user?type=projects` - Get user's AI projects

#### Admin
- `GET /api/admin` - List all submissions (admin only)
- `POST /api/admin/link-type` - Manage link types (admin only)
- `POST /api/admin/complete-competition` - Complete weekly competition (admin only)

#### Changelog
- `GET /api/changelog` - Get published changelog entries (public)
- `POST /api/changelog` - Create changelog entry (admin only)
- `GET /api/changelog/[id]` - Get specific changelog entry (public)
- `PUT /api/changelog/[id]` - Update changelog entry (admin only)
- `DELETE /api/changelog/[id]` - Delete changelog entry (admin only)

#### Notifications
- `POST /api/notifications` - Send notification (admin use)
- `GET /api/notifications` - Get user notification history

#### Authentication
- `GET /auth/signin` - Sign in page
- `GET /auth/callback` - OAuth callback handler

#### Categories & Competitions
- `GET /api/categories` - Get all categories
- `GET /api/competitions` - Get current competition

#### Cron Jobs (Automated)
- `GET /api/cron/competitions` - Manage weekly competitions automatically
  - Creates upcoming competitions
  - Activates started competitions
  - Completes expired competitions
  - Awards winners
  - **Authentication**: Requires `Authorization: Bearer CRON_SECRET` header
  - **Schedule**: Runs every hour (configured in `vercel.json`)
  - **Manual trigger**: `curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/competitions`

- `GET /api/cron/competition-week-start` - Send competition week start notifications
  - Sends promo emails to newsletter subscribers when new competition week starts
  - Features premium launches and competition details
  - **Authentication**: Requires `Authorization: Bearer CRON_SECRET` header
  - **Schedule**: Runs when new competition week starts
  - **Manual trigger**: `curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/competition-week-start`

- `GET /api/cron/competition-week-end` - Send competition week end notifications
  - Sends winner shoutout emails to newsletter subscribers when competition week ends
  - Features competition results and winners
  - **Authentication**: Requires `Authorization: Bearer CRON_SECRET` header
  - **Schedule**: Runs when competition week ends
  - **Manual trigger**: `curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/competition-week-end`

- `GET /api/cron/winner-reminders` - Send daily reminders to competition winners
  - Reminds winners to add badges to their websites
  - **Authentication**: Requires `Authorization: Bearer CRON_SECRET` header
  - **Schedule**: Runs daily at 9 AM UTC
  - **Manual trigger**: `curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/winner-reminders`

- `GET /api/cron/winner-backlink-reminders` - Send final reminders for expiring dofollow links
  - Sends urgent reminders to winners with expiring backlinks
  - Calculates days remaining before link expiration
  - **Authentication**: Requires `Authorization: Bearer CRON_SECRET` header
  - **Schedule**: Runs daily
  - **Manual trigger**: `curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/winner-backlink-reminders`

- `GET /api/cron/account-notifications` - Send welcome emails for new accounts
  - Catches up on missed welcome emails
  - **Authentication**: Requires `Authorization: Bearer CRON_SECRET` header
  - **Schedule**: Runs every hour
  - **Manual trigger**: `curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/account-notifications`

## 🗃️ Database Schema

### Supabase Tables

The platform uses 12 PostgreSQL tables with Row Level Security (RLS) enabled:

#### Core Tables

**users**
- User profiles and authentication
- Stores: id, email, name, avatar_url, is_admin, total_submissions, total_votes
- Notification preferences for email notifications
- Auto-created on first sign-in

**apps** (AI projects)
- Directory submissions
- Fields: name, slug, website_url, short_description, full_description
- Status: draft, pending, scheduled, live, rejected, archived
- Payment tracking: checkout_session_id, payment_status, payment_date, order_id
- Draft management: is_draft flag for unpaid premium submissions
- Link type: dofollow/nofollow tracking
- Competition & voting data
- Scheduled launch: scheduled_launch flag controls slot counting

**categories**
- AI project categories
- Each with name, slug, and description

**competitions**
- Weekly competition tracking
- Start/end dates, status, winners
- Separate slots for FREE (15) and Premium (10) plans

**votes**
- User voting records
- Links: user_id, app_id, competition_id
- Timestamp tracking

#### Supporting Tables

**payments** - LemonSqueezy payment records  
**newsletter** - Newsletter subscriptions  
**sidebar_content** - Dynamic sidebar widgets  
**backlinks** - Backlink management  
**analytics** - Usage statistics  
**external_webhooks** - Webhook configurations  
**changelog** - Platform update announcements and changelog entries  
**email_notifications** - Email notification tracking and delivery status

### Link Type Management

```javascript
{
  link_type: "nofollow" | "dofollow",
  dofollow_status: boolean,
  dofollow_reason: "weekly_winner" | "manual_upgrade" | "premium_plan",
  dofollow_awarded_at: Date,
  weekly_position: 1 | 2 | 3
}
```

## 📧 Email Notification System

### Overview
The platform includes a comprehensive email notification system that provides automated notifications for various user actions and events, with user preference management and comprehensive tracking. Built with Resend for email delivery.

### Notification Types

#### 1. Submission Notifications

**Submission Received**
- **Trigger**: When a user submits a project
- **Template**: `submissionReceived`
- **Purpose**: Confirms submission and sets expectations
- **Mandatory**: Yes (cannot be disabled)

**Submission Approved**
- **Trigger**: When an admin approves a project
- **Template**: `submissionApproval`
- **Purpose**: Notifies user their project is now live
- **Mandatory**: Yes (cannot be disabled)

**Submission Declined**
- **Trigger**: When an admin rejects a project
- **Template**: `submissionDecline`
- **Purpose**: Notifies user with rejection reason
- **Mandatory**: Yes (cannot be disabled)
- **Includes**: Rejection reason (e.g., "It's only AI projects allowed to launch")

#### 2. Competition Notifications

**Launch Week Reminder**
- **Trigger**: When a project enters the launching week
- **Template**: `launchWeekReminder`
- **Purpose**: Reminds users to promote their launches
- **Data**: Competition details, promotion tips

**Competition Week Start**
- **Trigger**: When a new competition week starts
- **Template**: `competitionWeekStart`
- **Purpose**: Promo email featuring premium launches
- **Recipients**: Newsletter subscribers
- **Data**: Featured projects, premium count, total count

**Competition Week End**
- **Trigger**: When a competition week ends
- **Template**: `competitionWeekEnd`
- **Purpose**: Promo email shouting out winners
- **Recipients**: Newsletter subscribers
- **Data**: Winners, total votes, total projects

**Competition Winners**
- **Trigger**: When a user's project wins
- **Template**: `competitionWinners`
- **Purpose**: Notifies winners of their achievement
- **Data**: Position, votes, views

#### 3. Winner Backlink Notifications

**Winner Reminder**
- **Trigger**: Daily cron job for winners who haven't added badges
- **Template**: `winnerReminder`
- **Purpose**: Reminds winners to add winner badge
- **Data**: Project details, position

**Winner Backlink Reminder (Final)**
- **Trigger**: Daily cron job for winners with expiring backlinks
- **Template**: `winnerBacklinkReminder`
- **Purpose**: Final reminder before dofollow link expires
- **Data**: Days left, urgency messaging

### User Preferences
Users can manage their notification preferences in the Settings page (`/settings`). Each notification type can be individually enabled/disabled except for mandatory notifications:

**Mandatory Notifications (Cannot be disabled):**
- Account creation
- Account deletion
- Submission received
- Submission approval
- Submission decline

**Optional Notifications:**
- Weekly competition entry
- Launch week reminder
- Competition week start
- Competition week end
- Competition winners
- Winner reminder
- Winner backlink reminder
- Weekly digest
- Marketing emails

### Architecture
- **Email Templates** (`app/libs/email.js`) - Beautiful, responsive HTML email templates with consistent branding
- **Notification Service** (`app/libs/notification-service.js`) - Comprehensive notification management with user preference checking
- **Database Tracking** - All emails tracked in `email_notifications` table with delivery status
- **Resend Integration** - Professional email delivery with tracking and error handling

### Cron Jobs

**Competition Management** (`/api/cron/competitions`)
- Runs daily at midnight UTC
- Creates upcoming competitions
- Activates started competitions
- Completes ended competitions
- Awards winners
- Sends launch week reminders

**Competition Week Start** (`/api/cron/competition-week-start`)
- Runs when new competition week starts
- Sends promo emails to newsletter subscribers
- Features premium launches

**Competition Week End** (`/api/cron/competition-week-end`)
- Runs when competition week ends
- Sends winner shoutout emails to newsletter subscribers
- Features competition results

**Winner Reminders** (`/api/cron/winner-reminders`)
- Runs daily
- Sends reminders to winners who haven't added badges
- Prevents duplicate reminders

**Winner Backlink Reminders** (`/api/cron/winner-backlink-reminders`)
- Runs daily
- Sends final reminders for expiring dofollow links
- Calculates days remaining

### Resend Integration

**Setup Requirements:**
1. **API Key**: Set `RESEND_API_KEY` in environment variables
2. **From Address**: Configured as `AI Launch Space <noreply@ailaunch.space>`
3. **Development Mode**: Uses `onboarding@resend.dev` for testing

**Do You Need Resend Webhooks?**
- **Short Answer: No, webhooks are not required for basic functionality.**
- The current system works without webhooks because:
  - Email delivery is handled automatically
  - Built-in error handling in the notification service
  - All notifications are tracked in the database
  - Failed notifications can be retried manually

### Integration Points
The notification system is integrated into:
- User registration (welcome emails)
- Account deletion (confirmation emails)
- Project approval/rejection (admin workflow notifications)
- Competition winners (winner announcements)
- Winner reminders (cron job for badge reminders)

## 📁 Project Structure

```
ailaunchspace/
├── app/
│   ├── api/                 # Next.js API routes
│   │   ├── admin/          # Admin endpoints
│   │   ├── categories/     # Categories
│   │   ├── changelog/      # Changelog management
│   │   ├── competitions/   # Competitions
│   │   ├── cron/           # Automated cron jobs
│   │   │   ├── account-notifications/  # Welcome email catch-up
│   │   │   ├── competitions/           # Competition lifecycle
│   │   │   ├── competition-week-start/ # Competition week start notifications
│   │   │   ├── competition-week-end/   # Competition week end notifications
│   │   │   ├── winner-reminders/       # Winner badge reminders
│   │   │   └── winner-backlink-reminders/ # Winner backlink expiration reminders
│   │   ├── projects/       # Project CRUD
│   │   ├── newsletter/     # Newsletter subscriptions
│   │   ├── notifications/  # Email notifications
│   │   ├── user/           # User data
│   │   ├── vote/           # Voting system
│   │   └── webhooks/       # Payment webhooks
│   ├── components/         # UI components
│   │   ├── admin/         # Admin components
│   │   ├── SupabaseProvider.jsx  # Auth context
│   │   ├── Header.jsx     # Navigation
│   │   └── ...
│   ├── auth/              # Auth pages
│   │   ├── signin/        # Sign in page
│   │   └── callback/      # OAuth callback
│   ├── admin/             # Admin pages
│   ├── dashboard/         # User dashboard
│   ├── projects/          # Browse AI projects
│   ├── project/[slug]/    # AI project detail
│   ├── submit/            # Submit form
│   ├── hooks/             # React hooks
│   │   └── useUser.js     # Auth hook
│   ├── libs/              # Shared libraries
│   │   ├── supabase.js    # Supabase clients
│   │   ├── database.js    # DB utilities
│   │   ├── database-supabase.js  # Supabase manager
│   │   ├── auth.js        # Auth functions
│   │   ├── auth-helpers.js  # Server auth helpers
│   │   ├── email.js       # Email templates and sending
│   │   └── notification-service.js  # Notification management
│   ├── layout.js          # Root layout
│   └── page.js            # Homepage
├── supabase/              # Supabase files
│   ├── schema.sql         # Database schema
│   ├── setup_admin.sql    # Admin setup
│   ├── test_rls.sql       # RLS tests
│   └── verify_schema.sql  # Verification
├── scripts/               # Utility scripts
│   ├── test-connection.js # DB test
│   └── seed-sample-data.js  # Sample data
├── public/                # Static assets
├── .env.local            # Environment variables
├── package.json          # Dependencies
├── tailwind.config.js    # Tailwind config
└── next.config.js        # Next.js config
```

## 🔧 Development

### Development Setup

This section provides a complete guide for setting up the development environment.

#### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **pnpm** - `npm install -g pnpm` (recommended) or use npm
- **Git** - For version control
- **Supabase account** - [Sign up here](https://supabase.com) (free tier available)

#### Step-by-Step Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/SashaDiz/ailaunch-space.git
   cd ailaunch-space
   pnpm install
   ```

2. **Environment Configuration**
   ```bash
   # Copy the environment template
   cp .env.example .env.local
   ```
   
   Then edit `.env.local` with your configuration (see [Environment Variables](#environment-variables) below).

3. **Database Setup**
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Run the database schema from `supabase/schema.sql`
   - Get your API keys from Project Settings → API

4. **Start Development Server**
   ```bash
   pnpm dev
   ```
   
   Visit `http://localhost:3000` to see the application!

#### Environment Variables

Create a `.env.local` file with the following variables:

```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Supabase (Get from: https://app.supabase.com/project/_/settings/api)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_PROJECT_ID=your-project-id

# LemonSqueezy (Payment) - Optional for basic development
LEMONSQUEEZY_API_KEY=your_lemonsqueezy_api_key
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
LEMONSQUEEZY_PRODUCT_ID_PREMIUM=your_premium_product_id

# Email Notifications (Optional for basic development)
RESEND_API_KEY=your_resend_api_key

# Cron Job Security (Generate a random secret string)
CRON_SECRET=your_random_secret_string_here

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=your_google_analytics_id

# Supabase S3 Storage (for image uploads)
SUPABASE_S3_ENDPOINT=https://your-project.supabase.co/storage/v1/s3
SUPABASE_S3_REGION=us-east-1
SUPABASE_S3_ACCESS_KEY_ID=your_s3_access_key_id
SUPABASE_S3_SECRET_ACCESS_KEY=your_s3_secret_access_key
SUPABASE_S3_BUCKET=logos
```

**Note**: For basic development and testing, you only need the Supabase variables. Other services are optional.

### Available Scripts

```bash
# Development
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint

# Database
pnpm db:test      # Test Supabase connection
pnpm supabase:types  # Generate TypeScript types

# Payment Testing
pnpm test:lemonsqueezy  # Test LemonSqueezy connection and webhook setup
pnpm webhook:simulate   # Simulate webhook events for testing
```

### Development Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and test them:
   ```bash
   pnpm dev
   ```

3. **Run linting**:
   ```bash
   pnpm lint
   ```

4. **Test database connection**:
   ```bash
   pnpm db:test
   ```

5. **Commit and push**:
   ```bash
   git add .
   git commit -m 'Add: your feature description'
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** on GitHub

### Admin Features

#### Link Type Management
- Toggle dofollow/nofollow for any AI project
- View dofollow reason (winner/manual/premium)
- Track link type changes
- Bulk operations

#### Competition Management
- Complete weekly competitions
- Award dofollow to top 3 winners
- View competition statistics

#### Changelog Management
- Create and manage changelog entries
- Support for different entry types (feature, bugfix, improvement, breaking, announcement)
- Publish/unpublish entries
- Featured entry highlighting
- Version tracking
- Author attribution
- Public changelog page displays published entries

### Testing Authentication

1. Visit `http://localhost:3000`
2. Click "Sign in"
3. Try any authentication method:
   - **Email**: Enter email → Check inbox → Click magic link
   - **Google**: Click "Continue with Google"
   - **GitHub**: Click "Continue with GitHub"
4. Verify you're signed in (avatar appears in header)

### Testing Payments

**Test LemonSqueezy integration:**
```bash
# Test API connection and webhook setup
pnpm test:lemonsqueezy

# Simulate webhook events without real payment
pnpm webhook:simulate
```

**Test with real payment (Test Mode):**
1. Start dev server and ngrok: `pnpm dev` and `ngrok http 3000`
2. Update webhook URL in LemonSqueezy dashboard
3. Enable test mode in LemonSqueezy
4. Make a test payment using card: `4242 4242 4242 4242`
5. Watch console logs for webhook processing
6. Verify project upgraded in database

## 🚀 Deployment

### Vercel (Recommended)

#### Prerequisites
- Supabase project with schema deployed
- Lemon Squeezy account with products configured
- All environment variables ready

#### Quick Deploy Steps

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com
   - Import your repository
   - Vercel will auto-detect Next.js

3. **⚠️ CRITICAL: Add Environment Variables BEFORE deploying**
   
   In Vercel, go to Settings → Environment Variables and add:
   
   **Required Supabase Variables** (Get from: Supabase Dashboard → Settings → API):
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project-id.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` = Your service role key (⚠️ Keep secret!)
   
   **Required Lemon Squeezy Variables** (Get from: Lemon Squeezy → Settings → API):
   - `LEMONSQUEEZY_API_KEY` = Your API key
   - `LEMONSQUEEZY_STORE_ID` = Your store ID (numeric)
   - `LEMONSQUEEZY_WEBHOOK_SECRET` = Your webhook signing secret
   - `LEMONSQUEEZY_VARIANT_ID` = Your premium plan variant ID (numeric)
   
   **Required Email Variables** (Get from: Resend → API Keys):
   - `RESEND_API_KEY` = Your Resend API key for email notifications
   
   **Required Supabase S3 Variables** (Get from: Supabase → Settings → Storage):
   - `SUPABASE_S3_ENDPOINT` = Your S3 endpoint URL
   - `SUPABASE_S3_REGION` = Your S3 region (usually us-east-1)
   - `SUPABASE_S3_ACCESS_KEY_ID` = Your S3 access key ID
   - `SUPABASE_S3_SECRET_ACCESS_KEY` = Your S3 secret access key
   - `SUPABASE_S3_BUCKET` = Your storage bucket name (logos)
   
   **Required App Variables:**
   - `NEXT_PUBLIC_APP_URL` = `https://yourdomain.com`
   
   **IMPORTANT**: Set all variables for Production, Preview, AND Development environments!

4. **Deploy**
   - Vercel will automatically build and deploy
   - Build should complete without errors if all env vars are set

5. **Post-Deployment Configuration**
   
   **a) Update Supabase Authentication Settings:**
   
   Go to Supabase Dashboard → Authentication → URL Configuration:
   
   - **Site URL**: Set to `https://yourdomain.com`
   - **Redirect URLs**: Add these URLs (click "Add URL" for each):
     ```
     https://yourdomain.com/auth/callback
     https://yourdomain.com/auth/callback/**
     https://yourdomain.com/**
     ```
   - Click **Save** after adding each URL
   
   ⚠️ **CRITICAL**: This prevents authentication from redirecting to localhost in production!
   
   **b) Update Lemon Squeezy Webhook:**
   
   - Go to Lemon Squeezy → Settings → Webhooks
   - Update endpoint URL to: `https://yourdomain.com/api/webhooks/lemonsqueezy`
   
   **c) Update OAuth Apps (if using Google/GitHub):**
   
   For **Google OAuth**:
   - Go to Google Cloud Console → Credentials
   - Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
   
   For **GitHub OAuth**:
   - Go to GitHub → Settings → Developer Settings → OAuth Apps
   - Update callback URL: `https://yourdomain.com/auth/callback`

### Deployment Troubleshooting

**Build fails with "Missing Supabase environment variables":**
- ✅ Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Vercel
- ✅ Check variable names match exactly (case-sensitive)
- ✅ Ensure no extra spaces in values

**Auth redirects to localhost after production signin:**
- ✅ Verify production URL is in Supabase redirect URLs list
- ✅ Check `NEXT_PUBLIC_APP_URL` is set to production domain in Vercel
- ✅ Clear browser cache and test in incognito mode
- ✅ Redeploy after making Vercel environment variable changes

**Payment webhooks not working:**
- ✅ Update Lemon Squeezy webhook URL to production domain
- ✅ Verify `LEMONSQUEEZY_WEBHOOK_SECRET` matches Lemon Squeezy dashboard
- ✅ Check Vercel function logs for webhook errors

## 🎯 How It Works

### Standard Launch Flow
1. User submits AI project (chooses "Standard Launch")
2. Project created with `status: "pending"` and `scheduled_launch: true`
3. Competition slot count incremented immediately
4. Admin approves → Goes live with nofollow link
5. Lives on homepage for 7 days
6. Participates in weekly voting
7. **Top 3 winners** → Automatically get dofollow backlink + badge

### Premium Launch Flow
1. User fills out complete submission form (chooses "Premium Launch")
2. Project created as **draft** with `status: "draft"` and `scheduled_launch: false`
3. Draft does NOT count toward competition slots yet
4. User proceeds to payment ($15 via LemonSqueezy)
5. **If payment succeeds:**
   - Webhook updates project: `status: "pending"`, `scheduled_launch: true`, `payment_status: true`
   - Competition slot count incremented
   - Enters admin approval queue
   - Upon approval → **Guaranteed dofollow backlink by default**
6. **If payment fails/cancelled:**
   - Draft remains in user's dashboard
   - User can resume draft later, modify details, or switch to Standard plan
   - Can resubmit with same details (old draft auto-deleted)
7. Can still compete for top 3 ranking and earn badges

### Weekly Competition (Automated)
- **Automatically starts every Monday at 00:00 PST (08:00 UTC)**
- **Automatically ends the following Monday at 23:59:59 PST (07:59:59 UTC)**
- Top 3 submissions with most votes win (both Standard and Premium)
- Winners get dofollow backlinks + badges automatically
- System creates 8 weeks of competitions in advance
- Cron job runs every hour to:
  - Create upcoming competitions
  - Activate competitions when Monday arrives
  - Complete competitions when they end
  - Award winners automatically

### Auto User Creation
When users sign in for the first time:
- User record automatically created in `users` table
- Profile data synced from OAuth provider
- Stats initialized (submissions: 0, votes: 0)

## 🛡️ Security

### Row Level Security (RLS)
All tables have RLS policies enabled:
- Users can only modify their own data
- Admins have full access
- Public can read approved content

### Authentication
- Secure token-based authentication
- HTTP-only cookies
- Automatic token refresh
- Session management

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help makes AI Launch Space better for everyone.

### How to Contribute

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ailaunch-space.git
   cd ailaunch-space
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Set up development environment** (see [Development Setup](#-development-setup) below)
5. **Make your changes** and test them thoroughly
6. **Commit your changes**:
   ```bash
   git commit -m 'Add: your feature description'
   ```
7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Open a Pull Request** on GitHub

### What We're Looking For

- 🐛 **Bug fixes** - Help us squash bugs and improve stability
- ✨ **New features** - Add functionality that benefits the community
- 📚 **Documentation** - Improve setup guides, API docs, and code comments
- 🎨 **UI/UX improvements** - Make the platform more user-friendly
- ⚡ **Performance optimizations** - Help the platform run faster
- 🧪 **Tests** - Add test coverage for better reliability

### Development Guidelines

- **Code Style**: Follow existing patterns and use Prettier for formatting
- **Commits**: Use clear, descriptive commit messages
- **Testing**: Test your changes thoroughly before submitting
- **Documentation**: Update relevant documentation for new features
- **Breaking Changes**: Discuss major changes in an issue first

### Getting Help

- 💬 **Discussions**: Use GitHub Discussions for questions and ideas
- 🐛 **Issues**: Report bugs and request features via GitHub Issues
- 📧 **Contact**: Reach out to [@SashaDiz](https://github.com/SashaDiz) for direct questions

### Recognition

Contributors will be recognized in:
- 📝 **README Contributors section**
- 🏆 **Special contributor badges**
- 🎉 **Release notes** for significant contributions

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### What this means for you:

- ✅ **Commercial use** - Use this project in commercial applications
- ✅ **Modification** - Modify the code to fit your needs
- ✅ **Distribution** - Share and distribute the code
- ✅ **Private use** - Use the project privately
- ❌ **Liability** - No warranty or liability protection
- ❌ **Warranty** - No warranty provided

## 👥 Contributors

We appreciate all contributors who help make AI Launch Space better! 

### How to become a contributor:

1. **Star the repository** ⭐
2. **Fork and contribute** - Submit your first PR
3. **Report issues** - Help us find and fix bugs
4. **Share feedback** - Let us know how we can improve

### Recognition:

- 🏆 **Contributor badges** for active contributors
- 📝 **README mention** for significant contributions  
- 🎉 **Release notes** for major contributions
- 💬 **Community recognition** in discussions

---

**Made with ❤️ by the AI Launch Space community**

[![GitHub stars](https://img.shields.io/github/stars/SashaDiz/ailaunch-space?style=social)](https://github.com/SashaDiz/ailaunch-space)
[![GitHub forks](https://img.shields.io/github/forks/SashaDiz/ailaunch-space?style=social)](https://github.com/SashaDiz/ailaunch-space)
[![GitHub issues](https://img.shields.io/github/issues/SashaDiz/ailaunch-space)](https://github.com/SashaDiz/ailaunch-space/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/SashaDiz/ailaunch-space)](https://github.com/SashaDiz/ailaunch-space/pulls)

## 🆘 Troubleshooting

### Database Connection Issues

```bash
pnpm db:test
```

This will show detailed diagnostics and verify all tables are accessible.

### Authentication Issues

#### Email Magic Link Not Working

**Symptoms**: Email not arriving or link doesn't work
- ✅ Check spam/junk folder
- ✅ Verify "Email" provider is enabled in Supabase → Authentication → Providers
- ✅ Check email templates in Supabase (Authentication → Email Templates)
- ✅ Review Supabase Auth logs (Authentication → Logs) for errors
- ✅ Ensure Site URL is correctly set in Supabase

#### GitHub OAuth: "Unable to exchange external code"

**Symptoms**: Redirected back to main page without authentication

**Solutions**:
1. **Verify Callback URLs Match Exactly**:
   - GitHub OAuth App callback: `http://localhost:3000/auth/callback` (dev) or `https://yourdomain.com/auth/callback` (prod)
   - No trailing slashes
   - Case-sensitive match required

2. **Check Supabase URL Configuration** (⚠️ MOST COMMON ISSUE):
   - Site URL must be set to `http://localhost:3000` (dev) or `https://yourdomain.com` (prod)
   - All redirect URLs must be added to Supabase:
     - For development: `http://localhost:3000/auth/callback`
     - For production: `https://yourdomain.com/auth/callback`
   - Click **Save** after adding each URL

3. **Verify GitHub OAuth App Settings**:
   - Homepage URL: `http://localhost:3000` (dev) or `https://yourdomain.com` (prod)
   - Authorization callback URL: `http://localhost:3000/auth/callback` (dev) or `https://yourdomain.com/auth/callback` (prod)
   - Client ID and Secret correctly entered in Supabase Dashboard

4. **For Production Deployments**:
   - Create a **separate** GitHub OAuth App for production
   - Use different credentials for dev and prod environments
   - Ensure `NEXT_PUBLIC_APP_URL` environment variable is set to production domain in Vercel

5. **Clear Cache and Restart**:
   ```bash
   rm -rf .next
   pnpm dev
   ```

6. **Test in Incognito Mode**:
   - Clear browser cookies
   - Try in private/incognito window

#### Google OAuth: "redirect_uri_mismatch"

**Solutions**:
- Ensure authorized redirect URI in Google Console matches: `https://your-project.supabase.co/auth/v1/callback`
- Check that Supabase Site URL is correctly configured
- Verify Client ID and Secret are correct
- Google OAuth redirect uses Supabase URL, not your app URL

#### "Invalid state parameter" Error

**Solutions**:
- Clear browser cookies for localhost
- Restart development server
- Try in incognito/private window
- Check that NEXT_PUBLIC_APP_URL matches your current environment

#### OAuth Redirects to Localhost in Production

**Symptoms**: After signing in on production, you're redirected back to `localhost:3000` instead of your production domain.

**Root Cause**: Supabase rejects unauthorized redirect URLs and falls back to the first allowed URL (localhost).

**Solutions**:
1. **Configure Supabase Redirect URLs** (⚠️ CRITICAL FIX):
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Set **Site URL** to: `https://yourdomain.com`
   - Add these to **Redirect URLs**:
     - `https://yourdomain.com/auth/callback`
     - `https://yourdomain.com/auth/callback/**`
     - `https://yourdomain.com/**`
   - Click **Save**

2. **Verify Vercel Environment Variable**:
   - Go to Vercel → Settings → Environment Variables
   - Ensure `NEXT_PUBLIC_APP_URL` is set to `https://yourdomain.com` for Production
   - Redeploy after making changes

3. **Clear Cache**:
   - Wait 2-3 minutes after saving Supabase settings
   - Clear browser cache or use incognito mode
   - Test authentication flow again

#### OAuth Works in Dev but Not Production

**Solutions**:
- Create **separate** OAuth Apps for production (recommended)
- Use different Client ID and Secret for each environment
- Update Supabase redirect URLs to include production domain (see above)
- Set `NEXT_PUBLIC_APP_URL` to production domain in Vercel environment variables
- Verify production callback URLs in OAuth provider settings
- Ensure Supabase Site URL is set to production domain

### Debugging Tips

1. **Browser Console**: Check for detailed JavaScript errors (F12 → Console)
2. **Network Tab**: Inspect redirect URLs and API responses (F12 → Network)
3. **Server Logs**: Check terminal where `pnpm dev` is running
4. **Supabase Auth Logs**: Check Authentication → Logs in Supabase Dashboard
5. **Error Messages**: The sign-in page displays detailed error information

### Build Errors

```bash
rm -rf .next node_modules
pnpm install
pnpm build
```

### Common Issues

**Port 3000 already in use**:
```bash
lsof -ti:3000 | xargs kill -9
pnpm dev
```

**Environment variables not loading**:
- Restart development server after changing `.env.local`
- Verify variable names start with `NEXT_PUBLIC_` for client-side access
- Check for typos in variable names

**Supabase connection timeout**:
- Check if Supabase project is paused (free tier pauses after 1 week of inactivity)
- Verify SUPABASE_URL and keys are correct
- Check internet connection

## 📊 Database Schema Reference

For detailed schema information, see `supabase/schema.sql`

Key features:
- Timestamps (created_at, updated_at) auto-managed
- Indexes for performance
- Foreign key constraints
- RLS policies for security

---

Built with ❤️ using React 19, Next.js 15, Supabase, and PostgreSQL

**Status**: ✅ Fully Connected & Ready for Development
