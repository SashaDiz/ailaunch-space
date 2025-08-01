# Vercel Deployment Instructions

## Prerequisites

1. Make sure you have a Vercel account at https://vercel.com
2. Install Vercel CLI: `npm i -g vercel`
3. Ensure all your environment variables are set up

## Environment Variables Setup

In your Vercel dashboard, add these environment variables:

### Required Environment Variables:

- `NEXTAUTH_SECRET` - Your NextAuth secret (can use the one from .env.local)
- `NEXTAUTH_URL` - Set to `https://www.nomadlaunch.space`
- `MONGODB_URI` - Your MongoDB connection string
- `RESEND_API_KEY` - Your Resend API key for magic links
- `GOOGLE_CLIENT_ID` - Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth client secret
- `GITHUB_CLIENT_ID` - Your GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - Your GitHub OAuth client secret

## OAuth Setup

### Google OAuth:

1. Go to Google Cloud Console
2. Add `https://www.nomadlaunch.space` to authorized origins
3. Add `https://www.nomadlaunch.space/api/auth/callback/google` to authorized redirect URIs

### GitHub OAuth:

1. Go to GitHub Developer Settings
2. Update your OAuth app
3. Set Authorization callback URL to: `https://www.nomadlaunch.space/api/auth/callback/github`

### Resend (Magic Links):

1. Verify `nomadlaunch.space` domain in Resend dashboard
2. The `from` field is already set to use `noreply@nomadlaunch.space`

## Deployment Steps

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Set up environment variables in Vercel dashboard
4. Deploy!

Or use Vercel CLI:

```bash
vercel --prod
```

## Important Notes

- The authentication is now configured for serverless functions
- All API routes are handled by Vercel's serverless functions
- No Express server needed
- Environment variables are handled by Vercel's environment system
- Make sure to update OAuth redirect URLs to match your production domain

## Testing Authentication

1. Email Magic Links: Users enter email → receive magic link → click to sign in
2. Google OAuth: Users click Google button → redirected to Google → back to app
3. GitHub OAuth: Users click GitHub button → redirected to GitHub → back to app

## Files Structure for Vercel

```
/api/auth/[...nextauth].js - NextAuth serverless function
/src/contexts/SessionContext.jsx - Client-side session management
/src/pages/SignInPage.jsx - Sign in page with all auth methods
/src/pages/VerifyRequestPage.jsx - Magic link verification page
/vercel.json - Vercel configuration
```
