# 🚀 Deployment Guide for DirectoryHunt

This guide will help you deploy your application to Vercel without encountering build errors.

## 📋 Prerequisites

Before deploying, ensure you have:
- A [Vercel](https://vercel.com) account
- A [Supabase](https://supabase.com) project
- A [Lemon Squeezy](https://lemonsqueezy.com) account (for payments)
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

---

## 🔧 Step 1: Set Up Supabase

### 1.1 Create a Supabase Project
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details and create the project
4. Wait for the database to be provisioned

### 1.2 Get Supabase Credentials
Navigate to **Settings > API** in your Supabase dashboard and copy:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **Anon/Public Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

### 1.3 Set Up Database Schema
Run the SQL schema from `supabase/schema.sql` in your Supabase SQL Editor:
1. Go to **SQL Editor** in Supabase dashboard
2. Click "New Query"
3. Paste the contents of `supabase/schema.sql`
4. Click "Run"

---

## 💳 Step 2: Set Up Lemon Squeezy

### 2.1 Create Lemon Squeezy Account
1. Sign up at [Lemon Squeezy](https://lemonsqueezy.com)
2. Complete your store setup
3. Create your products/variants

### 2.2 Get Lemon Squeezy API Credentials
Navigate to **Settings > API** and create an API key:

- **API Key** → `LEMONSQUEEZY_API_KEY`
- **Store ID** → `LEMONSQUEEZY_STORE_ID` (found in your store settings)

### 2.3 Create Product Variant
1. Create a product for your premium plan
2. Create a variant for the product
3. Copy the **Variant ID** → `LEMONSQUEEZY_VARIANT_ID`

### 2.4 Set Up Webhook
1. Go to **Settings > Webhooks**
2. Create a new webhook
3. Set the endpoint to: `https://yourdomain.com/api/webhooks/lemonsqueezy`
4. Select events: `order_created`, `subscription_created`, `subscription_updated`
5. Copy the **Webhook Secret** → `LEMONSQUEEZY_WEBHOOK_SECRET`

---

## 🌐 Step 3: Deploy to Vercel

### 3.1 Import Project to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your Git repository
4. Select the repository containing your code

### 3.2 Configure Project Settings
- **Framework Preset**: Next.js
- **Root Directory**: `./` (or leave default)
- **Build Command**: `pnpm build` (auto-detected)
- **Install Command**: `pnpm install` (auto-detected)

### 3.3 Add Environment Variables

⚠️ **CRITICAL**: Add these environment variables in Vercel **BEFORE** deploying:

Click on "Environment Variables" and add the following:

#### Required Supabase Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Required Lemon Squeezy Variables
```bash
LEMONSQUEEZY_API_KEY=your-api-key
LEMONSQUEEZY_STORE_ID=12345
LEMONSQUEEZY_WEBHOOK_SECRET=your-webhook-secret
LEMONSQUEEZY_VARIANT_ID=67890
```

#### Required App Configuration
```bash
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

#### Optional Email Variables (if using Resend)
```bash
RESEND_API_KEY=re_your_api_key
```

**Important**: 
- ✅ Set all variables for **Production**, **Preview**, and **Development** environments
- ✅ Click "Add" after entering each variable
- ✅ Double-check all values are correct

### 3.4 Deploy
1. Click "Deploy"
2. Wait for the build to complete (typically 2-5 minutes)
3. Vercel will provide you with a deployment URL

---

## ✅ Step 4: Post-Deployment Verification

### 4.1 Update Lemon Squeezy Webhook URL
1. Go back to Lemon Squeezy webhook settings
2. Update the endpoint URL with your Vercel deployment URL:
   ```
   https://your-actual-domain.vercel.app/api/webhooks/lemonsqueezy
   ```

### 4.2 Update App URL
1. Go to Vercel project settings → Environment Variables
2. Update `NEXT_PUBLIC_APP_URL` with your actual deployment URL
3. Redeploy the project for the change to take effect

### 4.3 Test Core Functionality
- ✅ Homepage loads correctly
- ✅ User authentication works (sign up/sign in)
- ✅ Supabase connection is working
- ✅ Payment flow initiates correctly
- ✅ Webhook endpoint is accessible

---

## 🔍 Troubleshooting

### Build Error: "Missing Supabase environment variables"
**Solution**: Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Vercel environment variables **before** deploying.

### Build Error: "Missing required LEMONSQUEEZY env variables"
**Solution**: This is now a **warning** during build and won't fail the build. However, payments won't work without these variables. Add them in Vercel and redeploy.

### Runtime Error: "Lemon Squeezy is not configured"
**Solution**: Add all required Lemon Squeezy environment variables in Vercel and redeploy.

### Webhook Not Receiving Events
**Solution**: 
1. Verify the webhook URL in Lemon Squeezy matches your deployment URL
2. Check that `LEMONSQUEEZY_WEBHOOK_SECRET` matches the secret in Lemon Squeezy
3. Test the endpoint: `curl https://your-domain.com/api/webhooks/lemonsqueezy`

### Edge Runtime Warnings About Node.js APIs
**Solution**: These warnings are expected for Supabase packages. They don't affect functionality since Supabase client code only runs where Node.js APIs are available.

---

## 🔄 Continuous Deployment

After initial setup, Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: When you create a pull request

To manually redeploy:
1. Go to Vercel dashboard
2. Select your project
3. Go to "Deployments"
4. Click "..." on the latest deployment
5. Click "Redeploy"

---

## 📚 Environment Variables Reference

### Required for Build
- `NEXT_PUBLIC_SUPABASE_URL` - Required for build to succeed
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Required for build to succeed

### Required for Runtime
- `SUPABASE_SERVICE_ROLE_KEY` - For server-side database operations
- `LEMONSQUEEZY_API_KEY` - For payment processing
- `LEMONSQUEEZY_STORE_ID` - For payment processing
- `LEMONSQUEEZY_WEBHOOK_SECRET` - For webhook verification
- `LEMONSQUEEZY_VARIANT_ID` - For premium plan checkout
- `NEXT_PUBLIC_APP_URL` - For correct URL generation

### Optional
- `RESEND_API_KEY` - For transactional emails
- Analytics and monitoring keys

---

## 🛡️ Security Best Practices

1. ✅ **Never** commit `.env.local` or `.env` files to Git
2. ✅ Use different Supabase projects for development and production
3. ✅ Rotate your `SUPABASE_SERVICE_ROLE_KEY` regularly
4. ✅ Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code
5. ✅ Use Vercel's environment variable encryption
6. ✅ Enable Row Level Security (RLS) in Supabase

---

## 📞 Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Lemon Squeezy Docs**: https://docs.lemonsqueezy.com
- **Next.js Docs**: https://nextjs.org/docs

---

## ✨ Quick Deployment Checklist

Before deploying, ensure:

- [ ] Code is pushed to Git repository
- [ ] Supabase project is created and schema is deployed
- [ ] All Supabase credentials are copied
- [ ] Lemon Squeezy store is set up with products
- [ ] Lemon Squeezy API key and credentials are ready
- [ ] Webhook is configured in Lemon Squeezy
- [ ] All environment variables are added in Vercel
- [ ] You've reviewed the `.env.example` file
- [ ] Database tables have proper RLS policies
- [ ] You've tested locally with production-like environment

**You're now ready to deploy! 🎉**

