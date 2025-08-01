# Local Development Setup for Authentication

## Running Locally with Authentication

To test authentication on your local machine, follow these steps:

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Link your project to Vercel

```bash
vercel link
```

### 3. Pull environment variables from Vercel

```bash
vercel env pull .env.local
```

### 4. Run development server with Vercel

```bash
vercel dev
```

This will:

- Start a local server that mimics Vercel's serverless environment
- Make your authentication API routes work locally
- Use your production environment variables

### Alternative: Manual Local Setup

If you prefer to run with just Vite, ensure your `.env.local` has:

```bash
NEXTAUTH_URL=http://localhost:5174
NEXTAUTH_SECRET=your-secret-here
MONGODB_URI=your-mongodb-uri
RESEND_API_KEY=your-resend-key
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret
GITHUB_CLIENT_ID=your-github-id
GITHUB_CLIENT_SECRET=your-github-secret
```

### OAuth Redirect URLs for Local Testing

**Google OAuth:**

- Add `http://localhost:3000/api/auth/callback/google` (for vercel dev)
- Add `http://localhost:5174/api/auth/callback/google` (for vite dev)

**GitHub OAuth:**

- Add `http://localhost:3000/api/auth/callback/github` (for vercel dev)
- Add `http://localhost:5174/api/auth/callback/github` (for vite dev)

### Production OAuth Redirect URLs

**Google OAuth:**

- `https://www.nomadlaunch.space/api/auth/callback/google`

**GitHub OAuth:**

- `https://www.nomadlaunch.space/api/auth/callback/github`

### Recommended Development Workflow

1. Use `vercel dev` for testing authentication features
2. Use `pnpm dev` for general UI development
3. Test both flows before deploying to production

### Domain Setup for Resend

For magic links to work properly:

1. Verify `nomadlaunch.space` domain in Resend
2. Update the `from` field in your auth config to use `noreply@nomadlaunch.space`
