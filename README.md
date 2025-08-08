# DirectoryHunt 🚀

A modern web application for discovering and launching digital products, similar to Product Hunt. Built with React, Vite, and MongoDB, featuring user authentication, product submissions, voting, and launch scheduling.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Support](#support)

## 🎯 Overview

DirectoryHunt is a platform where users can:

- Discover new digital products and tools
- Submit their own products for launch
- Vote and engage with community submissions
- Schedule launches for specific weeks
- Manage their profile and submissions
- Access premium features through subscriptions

## ✨ Features

### Core Features

- **Product Discovery**: Browse and search through submitted applications
- **Launch Scheduling**: Products are organized by launch weeks
- **Voting System**: Community-driven upvoting and engagement
- **User Profiles**: Comprehensive user profiles with social links
- **Authentication**: Secure authentication via Clerk (Google, GitHub OAuth)
- **Responsive Design**: Mobile-first responsive UI with Tailwind CSS

### Premium Features

- **Priority Listing**: Premium submissions get featured placement
- **Enhanced Analytics**: Detailed metrics and insights
- **Backlink Support**: SEO boost through backlinks
- **Extended Descriptions**: More detailed product descriptions

### Admin Features

- **Content Moderation**: Approve/reject submissions
- **Analytics Dashboard**: Platform-wide metrics and insights
- **User Management**: Manage user accounts and subscriptions

## 🛠 Tech Stack

### Frontend

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

### Backend

- **Node.js** - Runtime environment
- **MongoDB** - NoSQL database
- **Vercel Functions** - Serverless API endpoints

### Authentication & Services

- **Clerk** - Authentication and user management
- **Resend** - Email service
- **Vercel** - Hosting and deployment

### Development Tools

- **ESLint** - Code linting
- **Zod** - Schema validation
- **React Hook Form** - Form handling
- **Date-fns** - Date utilities

## 📋 Prerequisites

- Node.js 18+
- MongoDB (local or cloud instance)
- pnpm (recommended) or npm
- Clerk account for authentication
- Resend account for emails (optional)

## 🚀 Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd directoryhunt
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize the database**

   ```bash
   npm run db:init
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## � Documentation

Our comprehensive documentation is organized as follows:

### 📖 **Core Guides**

- **[Development Guide](docs/DEVELOPMENT.md)** - Setup, coding standards, and workflow
- **[API Reference](docs/API.md)** - Complete API documentation with examples
- **[Database Schema](docs/DATABASE.md)** - Database structure and operations
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Deploy to various platforms

### 🛠 **Practical Resources**

- **[Code Examples](docs/EXAMPLES.md)** - Implementation patterns and snippets
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[FAQ](docs/FAQ.md)** - Frequently asked questions
- **[Architecture Decisions](docs/ARCHITECTURE.md)** - Technical decision records

### 🤝 **Contributing**

- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to the project
- **[Documentation Index](docs/README.md)** - Complete documentation overview

### 🤖 **For AI Assistants**

- **[AI Context](.ai-context.md)** - Structured project context
- **[Project Summary](.ai-project-summary.json)** - Machine-readable metadata

> **Quick Tip**: Start with the [Documentation Index](docs/README.md) to find exactly what you need!

### Getting API Keys

1. **Clerk**: Sign up at [clerk.com](https://clerk.com) and create a new application
2. **MongoDB**: Use MongoDB Atlas or local installation
3. **Resend**: Sign up at [resend.com](https://resend.com) for email services
4. **OAuth**: Configure in Google Cloud Console and GitHub Developer Settings

## 🗃 Database Setup

The application uses MongoDB with the following collections:

- **users** - User profiles and authentication data
- **apps** - Product/application submissions
- **categories** - Product categories
- **launch_weeks** - Launch week scheduling
- **votes** - User voting data

### Initialize Database

```bash
# Initialize database with indexes and seed data
npm run db:init

# Alternative: Use the database setup script
npm run db:setup
```

### Database Schema

Key models include:

- **User**: Clerk-synced user profiles with social links and subscription data
- **App**: Product submissions with metadata, launch scheduling, and engagement metrics
- **LaunchWeek**: Weekly launch periods with app organization
- **Category**: Product categorization system

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Database
npm run db:init      # Initialize database
npm run db:seed      # Seed database with sample data
npm run db:setup     # Full database setup
```

### Development Workflow

1. **Start the development server**

   ```bash
   npm run dev
   ```

2. **Make your changes**

   - Frontend code in `src/`
   - API endpoints in `api/`
   - Database models in `libs/models/`

3. **Test your changes**
   - Manual testing via the browser
   - API testing via the `/webhook-test` endpoint

## 📡 API Documentation

### Authentication

All protected endpoints require Clerk authentication. The user ID is passed via the `x-clerk-user-id` header.

### Core Endpoints

#### Apps

- `GET /api/apps` - List all approved apps
- `GET /api/apps/[id]` - Get specific app details
- `POST /api/submit-directory` - Submit new app
- `POST /api/apps/[id]/vote` - Vote on an app

#### User Management

- `GET /api/user/me` - Get current user profile
- `PUT /api/profile/sync` - Sync user profile with Clerk
- `GET /api/profile/[userId]` - Get user profile by ID

#### Categories & Launch Weeks

- `GET /api/categories` - List all categories
- `GET /api/weeks` - List launch weeks

#### Dashboard (Protected)

- `GET /api/dashboard` - Get user dashboard data

#### Webhooks

- `POST /api/webhooks/clerk` - Clerk user sync webhook

### Request/Response Examples

#### Submit App

```javascript
POST /api/submit-directory
Content-Type: multipart/form-data

{
  "name": "My Awesome App",
  "short_description": "A brief description",
  "full_description": "Detailed description...",
  "website_url": "https://myapp.com",
  "categories": ["productivity", "ai"],
  "pricing": "Freemium",
  "contact_email": "contact@myapp.com",
  "plan": "standard"
}
```

#### Vote on App

```javascript
POST /api/apps/123/vote
{
  "type": "upvote" // or "downvote"
}
```

## 📁 Project Structure

```
directoryhunt/
├── api/                    # Serverless API functions
│   ├── apps/              # App-related endpoints
│   ├── categories/        # Category management
│   ├── dashboard/         # Dashboard data
│   ├── profile/           # User profile management
│   ├── submit-directory/  # App submission
│   ├── user/             # User data
│   ├── webhooks/         # External service webhooks
│   └── weeks/            # Launch week management
├── libs/                  # Shared libraries
│   ├── models/           # Database models and schemas
│   ├── database.js       # Database utilities
│   └── mongodb.js        # MongoDB connection
├── public/               # Static assets
├── scripts/              # Database and utility scripts
├── src/                  # Frontend React application
│   ├── components/       # Reusable UI components
│   │   ├── auth/        # Authentication components
│   │   └── ui/          # Base UI components
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Frontend utilities
│   ├── pages/           # Page components
│   └── assets/          # Images and icons
├── .env                 # Environment variables
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # Tailwind CSS configuration
├── vite.config.js       # Vite configuration
└── vercel.json         # Vercel deployment configuration
```

### Key Directories

- **`src/components/ui/`** - Reusable UI components built with Radix UI
- **`src/pages/`** - Main application pages (Home, Profile, Submit, etc.)
- **`api/`** - Serverless functions for backend functionality
- **`libs/models/`** - Database schemas and business logic
- **`scripts/`** - Database initialization and utility scripts

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy**
   ```bash
   vercel --prod
   ```

### Environment Variables for Production

Ensure all environment variables are set in your deployment platform:

- Database connection strings
- Authentication keys
- API keys for external services

### Build Configuration

The project includes:

- `vercel.json` for Vercel-specific configuration
- Build optimization for production
- Static asset caching headers

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed
- Ensure responsive design compatibility

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the FAQ page in the application
- Review the API documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added premium features and enhanced UI
- **v1.2.0** - Improved analytics and user dashboard

---

Built with ❤️ using React, Vite, and MongoDB
