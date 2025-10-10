# 🍋 LemonSqueezy Quick Start Guide

## ⚡ Quick Commands

```bash
# Test connection
pnpm test:lemonsqueezy

# Simulate webhook
pnpm webhook:simulate

# Start dev server
pnpm dev
```

## ✅ Current Status

- **API Connection:** ✅ Working
- **Webhook Endpoint:** ✅ Accessible  
- **Signature Verification:** ✅ Working
- **Webhook URL:** `https://68dd6ec87d78.ngrok-free.app/api/webhooks/lemonsqueezy`

## 🔑 Environment Variables

All set in `.env.local`:
- ✅ `LEMONSQUEEZY_API_KEY`
- ✅ `LEMONSQUEEZY_VARIANT_ID` (1032348)
- ✅ `LEMONSQUEEZY_STORE_ID` (212773)
- ✅ `LEMONSQUEEZY_WEBHOOK_SECRET`

## 🧪 Testing Workflow

### Test Without Real Payment

1. **Start dev server:**
   ```bash
   pnpm dev
   ```

2. **Simulate webhook:**
   ```bash
   pnpm webhook:simulate
   ```
   
3. **Check logs** for payment processing

### Test With Real Payment (Test Mode)

1. **Keep dev server running**
2. **Keep ngrok active:** `ngrok http 3000`
3. **Go to LemonSqueezy dashboard** → Enable test mode
4. **Make test payment** using: `4242 4242 4242 4242`
5. **Watch console logs** for webhook processing
6. **Verify in database** that directory was upgraded

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Invalid signature | Check `LEMONSQUEEZY_WEBHOOK_SECRET` matches dashboard |
| Webhook not received | Verify ngrok URL in LemonSqueezy dashboard |
| Directory not found | Run `pnpm webhook:simulate` to test with known data |
| Connection failed | Run `pnpm test:lemonsqueezy` to diagnose |

## 📊 What Happens When Payment is Made

1. User completes payment on LemonSqueezy
2. LemonSqueezy sends webhook to your endpoint
3. Webhook handler verifies signature ✅
4. Finds directory by slug/name
5. Updates directory plan to "premium"
6. Records payment in database
7. Returns success to LemonSqueezy

## 🔍 Check if Everything Works

```bash
# Run this command - should see all ✅
pnpm test:lemonsqueezy
```

Expected output:
```
✅ All environment variables are set!
✅ Successfully connected to LemonSqueezy API!
✅ Webhook signature verification working correctly!
✅ Webhook endpoint is accessible!
🎉 LemonSqueezy Integration Test Complete!
```

## 🚨 Important Notes

- **Ngrok URL changes** every restart - update in LemonSqueezy dashboard
- **Test mode payments** are free - use test card `4242 4242 4242 4242`
- **Webhook logs** show in your console when payment is received
- **Database updates** happen automatically on successful payment

## 📚 Full Documentation

- **Setup Guide:** `LEMONSQUEEZY_SETUP.md`
- **Verification Results:** `LEMONSQUEEZY_VERIFICATION_RESULTS.md`

## ✨ You're Ready!

Everything is configured and tested. Next step:
1. Make a test payment in LemonSqueezy test mode
2. Watch your console for webhook processing logs
3. Verify directory upgraded in database

Questions? Check `LEMONSQUEEZY_SETUP.md` for detailed troubleshooting.

