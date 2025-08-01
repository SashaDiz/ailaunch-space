# 🚀 Complete Setup Guide for nomadlaunch.space

## 🎯 Quick Start Summary

Your authentication system is now configured for:

- **Domain**: `https://www.nomadlaunch.space`
- **Local Testing**: `http://localhost:3000` (Vercel dev) or `http://localhost:5174` (Vite dev)
- **Authentication Methods**: Magic Links (Resend), Google OAuth, GitHub OAuth

## 📋 Prerequisites Checklist

### ✅ Already Done:

- [x] NextAuth.js configured for Vercel serverless
- [x] MongoDB adapter set up
- [x] All authentication providers configured
- [x] Vercel CLI installed
- [x] Environment variables in `.env.local`

### 🔧 Next Steps You Need to Complete:

## 1. 🔐 OAuth Apps Configuration

### Google OAuth Setup:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Go to **Credentials** → **OAuth 2.0 Client IDs**
4. Add these **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/google
   https://www.nomadlaunch.space/api/auth/callback/google
   ```
5. Add these **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://www.nomadlaunch.space
   ```

### GitHub OAuth Setup:

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Select your OAuth App (or create one)
3. Set **Authorization callback URL** to:
   ```
   For Local: http://localhost:3000/api/auth/callback/github
   For Production: https://www.nomadlaunch.space/api/auth/callback/github
   ```

### Resend Domain Setup:

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add and verify domain: `nomadlaunch.space`
3. The email sender is already configured as `noreply@nomadlaunch.space`

## 2. 🧪 Local Testing

### Option A: Test with Authentication (Recommended)

```bash
# Login to Vercel first (one-time setup)
vercel login

# Run with authentication support
pnpm run dev:auth
```

This starts server at `http://localhost:3000` with full auth support.

### Option B: UI Development Only

```bash
# For UI work without auth
pnpm dev
```

This starts server at `http://localhost:5174` (auth won't work).

## 3. 🌐 Production Deployment

### Step 1: Deploy to Vercel

```bash
# Login to Vercel (if not done already)
vercel login

# Link project to Vercel
vercel link

# Deploy
vercel --prod
```

### Step 2: Set Environment Variables in Vercel

In your Vercel dashboard, add these environment variables:

- `NEXTAUTH_SECRET`: `052b4143375c4b43b66c299392bdd4b21c13e9d08067535b7eead8311ba5ac86`
- `NEXTAUTH_URL`: `https://www.nomadlaunch.space`
- `MONGODB_URI`: `mongodb+srv://sashaexactdirectoryhunt:UJjCrFkyvbGHkVHt@cluster0.ymsflq6.mongodb.net/dev`
- `RESEND_API_KEY`: `re_96LzcjqZ_GpphgjS4RBdGCzbTFxtJUByd`
- `GOOGLE_CLIENT_ID`: `721554596866-qrvafvn74e9h63dhvdq7hk5o5a49lk49.apps.googleusercontent.com`
- `GOOGLE_CLIENT_SECRET`: `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`
- `GITHUB_CLIENT_ID`: `Ov23liR0395RKzupxH2Q`
- `GITHUB_CLIENT_SECRET`: `a1c2fe68d31910e14f33e2a5f7cfa6231d2096cb`

### Step 3: Configure Custom Domain in Vercel

1. In Vercel dashboard → Project Settings → Domains
2. Add `www.nomadlaunch.space`
3. Follow Vercel's DNS configuration instructions

## 4. 🧪 Testing Authentication

### Test Flow:

1. **Magic Link**: Enter email → Check inbox → Click link → Signed in
2. **Google OAuth**: Click Google button → OAuth flow → Signed in
3. **GitHub OAuth**: Click GitHub button → OAuth flow → Signed in

### Test URLs:

- **Local**: `http://localhost:3000/signin`
- **Production**: `https://www.nomadlaunch.space/signin`

## 🚨 Important Notes

- **For Local Testing**: Use `pnpm run dev:auth` to test authentication features
- **For UI Development**: Use `pnpm dev` for faster development
- **OAuth Redirects**: Make sure to configure both localhost:3000 and production URLs
- **Domain Verification**: Verify `nomadlaunch.space` in Resend for magic links to work

## 🔧 Available Commands

```bash
pnpm dev          # Vite dev server (UI only) - localhost:5174
pnpm run dev:auth # Vercel dev server (with auth) - localhost:3000
pnpm build        # Build for production
vercel --prod     # Deploy to production
```

## 🎉 You're Ready!

Your authentication system is fully configured for both local development and production deployment to `https://www.nomadlaunch.space`!
