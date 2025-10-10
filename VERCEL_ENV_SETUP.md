# 🔐 Vercel Environment Variables Setup

Copy and paste these environment variables into your Vercel project settings.

## 📍 Where to Add These

1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables" in the left sidebar
4. Add each variable below

⚠️ **IMPORTANT**: Add these variables to ALL environments (Production, Preview, Development)

---

## ✅ Required Supabase Variables

Get these from: [Supabase Dashboard](https://app.supabase.com) → Your Project → Settings → API

```
NEXT_PUBLIC_SUPABASE_URL
```
**Value**: `https://your-project-id.supabase.co`
**Environments**: ☑️ Production ☑️ Preview ☑️ Development

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
**Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your anon/public key)
**Environments**: ☑️ Production ☑️ Preview ☑️ Development

```
SUPABASE_SERVICE_ROLE_KEY
```
**Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your service role key)
**Environments**: ☑️ Production ☑️ Preview ☑️ Development
**⚠️ CRITICAL**: This is a SECRET key - never expose in client code!

---

## 💳 Required Lemon Squeezy Variables

Get these from: [Lemon Squeezy](https://app.lemonsqueezy.com) → Settings → API

```
LEMONSQUEEZY_API_KEY
```
**Value**: Your Lemon Squeezy API key
**Environments**: ☑️ Production ☑️ Preview ☑️ Development

```
LEMONSQUEEZY_STORE_ID
```
**Value**: Your store ID (numeric)
**Environments**: ☑️ Production ☑️ Preview ☑️ Development

```
LEMONSQUEEZY_WEBHOOK_SECRET
```
**Value**: Your webhook signing secret
**Environments**: ☑️ Production ☑️ Preview ☑️ Development

```
LEMONSQUEEZY_VARIANT_ID
```
**Value**: Your premium plan variant ID (numeric)
**Environments**: ☑️ Production ☑️ Preview ☑️ Development

---

## 🌐 Required Application Variables

```
NEXT_PUBLIC_APP_URL
```
**Value for Production**: `https://ailaunch.space`
**Value for Preview**: `https://your-project.vercel.app` (or leave empty to use Vercel URL)
**Value for Development**: `http://localhost:3000`
**Environments**: ☑️ Production ☑️ Preview ☑️ Development

⚠️ **Note**: The platform uses `https://ailaunch.space` (without www). Both `www.ailaunch.space` and `ailaunch.space` will work, as www redirects to non-www automatically.

---

## 📧 Optional: Email Configuration (Resend)

Only add these if you're using Resend for transactional emails.

Get from: [Resend Dashboard](https://resend.com/api-keys)

```
RESEND_API_KEY
```
**Value**: `re_...` (your Resend API key)
**Environments**: ☑️ Production ☑️ Preview ☑️ Development

---

## 🎯 Quick Copy-Paste Format for Vercel

Use this format when adding variables one by one in Vercel:

### Variable 1
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: [paste your value]
Environments: Production, Preview, Development
```

### Variable 2
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [paste your value]
Environments: Production, Preview, Development
```

### Variable 3
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: [paste your value]
Environments: Production, Preview, Development
```

### Variable 4
```
Name: LEMONSQUEEZY_API_KEY
Value: [paste your value]
Environments: Production, Preview, Development
```

### Variable 5
```
Name: LEMONSQUEEZY_STORE_ID
Value: [paste your value]
Environments: Production, Preview, Development
```

### Variable 6
```
Name: LEMONSQUEEZY_WEBHOOK_SECRET
Value: [paste your value]
Environments: Production, Preview, Development
```

### Variable 7
```
Name: LEMONSQUEEZY_VARIANT_ID
Value: [paste your value]
Environments: Production, Preview, Development
```

### Variable 8
```
Name: NEXT_PUBLIC_APP_URL
Value: https://ailaunch.space
Environments: Production, Preview, Development
```

---

## ✅ Verification Checklist

After adding all variables:

- [ ] All 8 required variables are added
- [ ] Each variable is checked for all 3 environments (Production, Preview, Development)
- [ ] No typos in variable names (they're case-sensitive!)
- [ ] No extra spaces in values
- [ ] URLs start with `https://` (not `http://`)
- [ ] Supabase URL ends with `.supabase.co`
- [ ] Keys look correct (JWT tokens start with `eyJ...`)

---

## 🚀 After Adding Variables

1. Click "Save" or "Add" for each variable
2. **Redeploy** your application (Vercel → Deployments → Redeploy)
3. Check deployment logs to ensure no environment variable errors
4. Test your deployed application

---

## 🔍 Troubleshooting

### "Build failed: Missing Supabase environment variables"
✅ Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

### "Lemon Squeezy configuration failed"
✅ Make sure all 4 Lemon Squeezy variables are set with correct values

### "Cannot read properties of undefined"
✅ Check for typos in environment variable names (they must match exactly)

### Variables not updating
✅ After changing variables, you must redeploy for changes to take effect

---

## 📝 Notes

- **NEXT_PUBLIC_** prefix makes variables available in the browser
- Variables without this prefix are only available server-side
- Never use `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- Vercel automatically injects these variables during build and runtime
- Environment variables are encrypted at rest in Vercel

---

**Ready to deploy? Follow the complete guide in `DEPLOYMENT.md`**

