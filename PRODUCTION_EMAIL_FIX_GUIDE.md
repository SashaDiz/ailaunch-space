# Production Email Fix Guide

## Issue
Confirmation and verification emails aren't working in production (but work on localhost).

## Root Causes

### 1. Resend Domain Not Verified
Your app uses `noreply@ailaunch.space` in production, but this domain needs to be verified in Resend.

### 2. Supabase Email Templates
Supabase sends its own confirmation/verification emails (separate from your Resend emails).

## Solutions

### ✅ Step 1: Verify Your Domain in Resend

1. **Login to Resend Dashboard**: https://resend.com/domains
2. **Add Your Domain**:
   - Click "Add Domain"
   - Enter: `ailaunch.space`
   - Choose region: `us-east-1` (or your preferred region)

3. **Configure DNS Records**:
   Resend will provide DNS records. Add these to your domain registrar:
   
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:_spf.resend.dev ~all
   
   Type: CNAME
   Name: resend._domainkey
   Value: [provided by Resend]
   
   Type: MX (optional for receiving)
   Name: @
   Value: mx.resend.dev
   Priority: 10
   ```

4. **Verify Domain**:
   - Wait 5-10 minutes for DNS propagation
   - Click "Verify" in Resend dashboard
   - Status should change to "Verified"

### ✅ Step 2: Configure Supabase Email Settings

Supabase sends its own auth emails (magic links, confirmations). You have two options:

#### Option A: Use Supabase's Built-in Email (Recommended for Quick Fix)

1. **Go to Supabase Dashboard** → Your Project → Authentication → Email Templates

2. **Configure Email Templates**:
   - Verify email address confirmation
   - Reset password
   - Magic Link
   - Email change confirmation

3. **Update SMTP Settings** (in Authentication → Email):
   - Leave default Supabase SMTP
   - OR configure custom SMTP (see Option B)

4. **Set Site URL**:
   - Go to Authentication → URL Configuration
   - Site URL: `https://ailaunch.space` (your production URL)
   - Redirect URLs: Add `https://ailaunch.space/auth/callback`

#### Option B: Use Resend for Supabase Emails (Advanced)

Configure Supabase to send emails through Resend:

1. **Get Resend SMTP Credentials**:
   - Resend Dashboard → SMTP
   - Host: `smtp.resend.com`
   - Port: `465` (SSL) or `587` (TLS)
   - Username: `resend`
   - Password: Your Resend API key

2. **Update Supabase SMTP**:
   - Go to Supabase Project Settings → Auth
   - Enable Custom SMTP
   - Enter Resend SMTP details
   - Sender email: `noreply@ailaunch.space`
   - Sender name: `AI Launch Space`

### ✅ Step 3: Set Environment Variables in Production

Make sure these are set in Vercel (or your hosting platform):

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://ailaunch.space
```

**To set in Vercel**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `RESEND_API_KEY` with your Resend API key
3. Ensure `NEXT_PUBLIC_APP_URL` is set correctly
4. Redeploy your application

### ✅ Step 4: Test Email Sending

Use the diagnostic tool (see `app/api/test-email/route.js` created below).

## Quick Diagnostic Checklist

- [ ] Domain verified in Resend dashboard
- [ ] DNS records added and propagated (use https://mxtoolbox.com)
- [ ] RESEND_API_KEY set in Vercel environment variables
- [ ] Supabase Site URL set to production domain
- [ ] Supabase redirect URLs include production callback
- [ ] Supabase email templates configured
- [ ] Application redeployed after env var changes

## Testing

1. **Test Resend**: Visit `/api/test-email` on your production site
2. **Test Supabase Auth**: Try signing up with a new email address
3. **Check Supabase Logs**: Authentication → Logs for any errors
4. **Check Resend Logs**: Resend Dashboard → Emails for delivery status

## Common Issues

### "Domain not verified"
- DNS records not added or not propagated yet
- Wait 10-15 minutes and try again
- Use `nslookup` or MXToolbox to verify DNS

### "RESEND_API_KEY not configured"
- Environment variable not set in production
- Redeploy after adding the variable

### "Invalid redirect URL"
- Add production callback URL to Supabase
- Check Site URL matches production domain

### Emails go to spam
- Ensure SPF, DKIM records are properly configured
- Add DMARC record for better deliverability
- Warm up your domain by sending gradually increasing volumes

## Need Help?

1. Check Resend logs: https://resend.com/emails
2. Check Supabase auth logs: Project → Authentication → Logs
3. Check application logs in Vercel

