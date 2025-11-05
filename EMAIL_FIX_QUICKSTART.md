# 🚀 Quick Fix: Production Emails Not Working

## What's the Problem?

Your confirmation and verification emails work on localhost but not in production. This is typically caused by:

1. ❌ Domain not verified in Resend
2. ❌ RESEND_API_KEY not set in production
3. ❌ Supabase email configuration missing

## 🎯 Quick Fix (5 minutes)

### Step 1: Verify Domain in Resend

1. **Login to Resend**: https://resend.com/login
2. **Go to Domains**: https://resend.com/domains
3. **Add Domain**: Click "Add Domain" → Enter `ailaunch.space`
4. **Copy DNS Records**: Resend will show 2-3 DNS records
5. **Add to DNS Provider** (wherever you bought ailaunch.space):
   
   ```
   Record Type: TXT
   Name: @
   Value: v=spf1 include:_spf.resend.dev ~all
   
   Record Type: CNAME  
   Name: resend._domainkey
   Value: [copy from Resend dashboard]
   ```

6. **Wait 5-10 minutes**, then click "Verify" in Resend

### Step 2: Set Environment Variables in Vercel

1. **Go to Vercel Dashboard**: https://vercel.com
2. **Select your project** → Settings → Environment Variables
3. **Add/Verify these variables**:

   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxx  # Get from resend.com/api-keys
   NEXT_PUBLIC_APP_URL=https://ailaunch.space
   ```

4. **Redeploy your application**

### Step 3: Configure Supabase Email Settings

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project** → Authentication → URL Configuration
3. **Set these values**:
   
   - **Site URL**: `https://ailaunch.space`
   - **Redirect URLs**: Add `https://ailaunch.space/auth/callback`

4. **Go to** Authentication → Email Templates
5. **Review all templates** (Confirm signup, Reset password, etc.)
6. **Click Save** on each template

## ✅ Test the Fix

### Test 1: Run Email Config Checker (Local)

```bash
pnpm email:check
```

This will check your configuration and try to send a test email.

### Test 2: Test Production Email API

Once deployed, visit:

```
https://ailaunch.space/api/test-email?to=your@email.com&secret=YOUR_SECRET
```

(Set `TEST_EMAIL_SECRET` in Vercel environment variables first)

### Test 3: Test Real User Flow

1. Open incognito window
2. Try to sign up with a new email
3. Check inbox for confirmation email
4. Check spam folder if not in inbox

## 🔍 Troubleshooting

### Still not working?

1. **Check Resend Dashboard**: https://resend.com/emails
   - Are emails being sent?
   - Any error messages?

2. **Check Supabase Auth Logs**: Project → Authentication → Logs
   - Any auth errors?

3. **Check Vercel Logs**: Project → Deployments → View Function Logs
   - Any email send errors?

4. **Common Issues**:
   
   | Issue | Solution |
   |-------|----------|
   | "Domain not verified" | Wait for DNS propagation (up to 24h) |
   | "API key invalid" | Check RESEND_API_KEY is correct |
   | "Unauthorized" | Verify API key has sending permissions |
   | Emails in spam | Wait 24-48h for domain reputation to build |

## 📚 Need More Help?

- **Full Guide**: See `PRODUCTION_EMAIL_FIX_GUIDE.md`
- **Email Config Checker**: Run `pnpm email:check`
- **Resend Docs**: https://resend.com/docs
- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth

## 🎓 Understanding the Issue

Your app sends 2 types of emails:

1. **Supabase Emails** (auth confirmations, password resets)
   - Sent by Supabase
   - Configured in Supabase Dashboard
   - Uses Supabase's SMTP or your custom SMTP

2. **Application Emails** (project approvals, notifications)
   - Sent by your app via Resend
   - Configured via RESEND_API_KEY
   - Uses noreply@ailaunch.space

Both need to be configured separately!

## ✨ After Fix is Working

- [ ] Test all email flows (signup, password reset, notifications)
- [ ] Monitor email deliverability in Resend dashboard
- [ ] Add emails to your email provider's safe sender list
- [ ] Consider adding DMARC record for better deliverability
- [ ] Set up email monitoring/alerting

---

**Questions?** Check the detailed guide in `PRODUCTION_EMAIL_FIX_GUIDE.md`

