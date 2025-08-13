# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands

```bash
# Development server (Next.js)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

### Database Commands

```bash
# Initialize database with indexes and collections
pnpm run db:init

# Add sample data for testing
pnpm run db:seed
```

## Architecture Overview

### Technology Stack

- **Framework**: Next.js 15 with App Router (migrated from Vite + React Router)
- **UI Library**: daisyUI 5 with Tailwind CSS 3.4 (migrated from Radix UI)
- **Authentication**: Auth.js (NextAuth) with MongoDB adapter (migrated from Clerk)
- **Database**: MongoDB 6 with native driver
- **Validation**: Zod schemas for runtime type checking
- **Package Manager**: pnpm

### Project Structure

```
directoryhunt/
├── app/                    # Next.js App Router structure
│   ├── api/               # Next.js API routes
│   ├── components/        # React components (Header, Footer, etc.)
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # User dashboard
│   ├── directories/      # Directory listings
│   ├── directory/        # Individual directory pages
│   ├── faq/             # FAQ page
│   ├── past-launches/   # Past launches page
│   ├── pricing/         # Pricing page
│   ├── profile/         # User profile
│   ├── submit/          # Directory submission
│   ├── terms/           # Terms page
│   ├── admin/           # Admin pages
│   ├── libs/            # Database utilities and models
│   │   ├── database.js  # DatabaseManager singleton
│   │   ├── mongodb.js   # MongoDB connection
│   │   ├── auth.js      # NextAuth configuration
│   │   └── models/      # Schemas, repositories, services
│   ├── layout.js        # Root layout
│   ├── page.js         # Homepage
│   └── globals.css     # Global styles
├── libs/                # Legacy libraries (being consolidated)
├── scripts/             # Database and utility scripts
├── public/              # Static assets
└── CLAUDE.md           # This file - Claude Code instructions
```

### Database Architecture

- **Collections**: users, directories, categories, competitions, votes, analytics, payments, newsletters
- **Connection**: DatabaseManager singleton in `app/libs/database.js`
- **Validation**: Zod schemas in `app/libs/models/schemas.js`
- **Services**: Business logic in `app/libs/models/services.js`
- **Repositories**: Data access patterns in `app/libs/models/repositories.js`

### Authentication Flow

- Auth.js handles OAuth providers (Google, GitHub)
- Sessions stored in MongoDB via `@auth/mongodb-adapter`
- Protected routes use `getServerSession(req, res, authOptions)`
- User data synced between Auth.js and custom user collection

### API Structure

- **Next.js API Routes**: All API endpoints in `app/api/`
- **Validation**: All endpoints use Zod schemas for input validation
- **Error Handling**: Consistent error responses with HTTP status codes
- **Key Endpoints**: 
  - `/api/directories` - Directory CRUD operations
  - `/api/vote` - Voting system
  - `/api/user` - User management
  - `/api/auth/[...nextauth]` - Authentication
  - `/api/admin` - Administrative functions

### Frontend Components

- **daisyUI Classes**: All components use semantic daisyUI classes
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Component Examples**:
  ```jsx
  <button className="btn btn-primary">Submit Directory</button>
  <div className="card bg-base-100 shadow-xl">
    <div className="card-body">
      <h2 className="card-title">Directory Name</h2>
    </div>
  </div>
  ```

### Key Business Logic

- **Directory Submissions**: Multi-step form with plan selection (standard/premium/support)
- **Voting System**: Authenticated users can upvote/downvote directories
- **Competitions**: Directories organized by weekly/monthly competitions
- **Rankings**: Weekly and monthly leaderboards based on votes
- **Payment Plans**: Standard (free), Premium ($19), Support ($99) with different features

## Migration Context

This project was recently migrated from:

- Vite → Next.js 15
- React Router → Next.js App Router
- Radix UI → daisyUI
- Clerk → Auth.js
- Custom CSS → Utility-first with daisyUI

Key migration artifacts:

- `MIGRATION_SUMMARY.md` - Complete migration details
- `PROJECT_COMPLETION.md` - Feature completion status
- Duplicate `libs/` directories (being consolidated)

## Environment Variables

Required for development:

```env
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/directoryhunt
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Development Notes

- Use `pnpm` as the package manager
- Database operations should use the DatabaseManager singleton
- All new components should use daisyUI classes
- API endpoints should validate input with Zod schemas
- Follow existing patterns in `app/` directory structure
- Test API endpoints with curl commands provided in docs
- Check git status for current migration state - many files were deleted/moved during framework migration

## Testing

- Manual testing via browser at http://localhost:3000
- API testing via curl commands documented in DEVELOPMENT.md
- Database testing via MongoDB shell or GUI tools
- No automated test suite currently configured
