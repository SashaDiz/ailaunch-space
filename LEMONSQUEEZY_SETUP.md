# LemonSqueezy Integration Setup Guide

## Overview
This project integrates with LemonSqueezy for payment processing. This guide will help you verify and test the integration.

## Environment Variables

Make sure the following variables are set in your `.env.local` file:

```bash
# LemonSqueezy Configuration
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_VARIANT_ID=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_WEBHOOK_SECRET=
```

### Where to find these values:

1. **API Key**: LemonSqueezy Dashboard → Settings → API
   - Create a new API key with appropriate permissions
   
2. **Store ID**: LemonSqueezy Dashboard → Settings → Stores
   - Copy your store ID number

3. **Variant ID**: LemonSqueezy Dashboard → Products → Select your product → Variants
   - Copy the variant ID for your premium plan

4. **Webhook Secret**: LemonSqueezy Dashboard → Settings → Webhooks
   - Create a new webhook or view existing webhook details
   - The secret is shown when creating/editing a webhook

## Webhook Configuration

### Webhook URL
Your webhook is currently configured at:
```
https://68dd6ec87d78.ngrok-free.app/api/webhooks/lemonsqueezy
```

**Important**: This ngrok URL changes every time you restart ngrok. Make sure to:
1. Update the webhook URL in LemonSqueezy dashboard when ngrok restarts
2. Keep your ngrok tunnel running while testing
3. For production, use your actual domain URL

### Setting up the Webhook in LemonSqueezy

1. Go to LemonSqueezy Dashboard → Settings → Webhooks
2. Click "Create Webhook" or "Edit" existing webhook
3. Set the URL to: `https://your-ngrok-url.ngrok-free.app/api/webhooks/lemonsqueezy`
4. Select the following events:
   - ✅ `order_created`
   - ✅ `order_refunded`
   - ✅ `subscription_payment_success` (optional, for future use)
   - ✅ `subscription_payment_failed` (optional, for future use)
5. Generate or copy the **Signing Secret**
6. Add the signing secret to your `.env.local` as `LEMONSQUEEZY_WEBHOOK_SECRET`
7. Save the webhook

### Webhook Security

The webhook implementation follows LemonSqueezy's official security recommendations:

- ✅ **Signature Verification**: Every webhook request is verified using HMAC-SHA256
- ✅ **Timing-Safe Comparison**: Prevents timing attacks
- ✅ **Raw Body Parsing**: Signature is computed on the raw request body
- ✅ **Comprehensive Logging**: Detailed logs for debugging

## Testing the Integration

### Step 1: Run the Connection Test

```bash
pnpm test:lemonsqueezy
```

This script will:
1. ✅ Verify all environment variables are set
2. ✅ Test API connection to LemonSqueezy
3. ✅ Verify webhook signature generation/validation
4. ✅ Check if webhook endpoint is accessible

### Step 2: Start Your Dev Server

```bash
pnpm dev
```

### Step 3: Start ngrok (if testing locally)

```bash
ngrok http 3000
```

Copy the HTTPS URL and update your webhook URL in LemonSqueezy dashboard.

### Step 4: Test with a Real Payment

1. Go to your LemonSqueezy product page
2. Enable **Test Mode** in LemonSqueezy dashboard
3. Make a test purchase
4. Use test card: `4242 4242 4242 4242`
5. Watch your console logs for webhook events

## How the Integration Works

### Payment Flow

1. **User submits directory** → Creates checkout session
2. **Checkout created** → Redirects to LemonSqueezy checkout
3. **Payment successful** → LemonSqueezy sends `order_created` webhook
4. **Webhook received** → Verifies signature and updates database
5. **Directory upgraded** → Premium features activated

### Webhook Event Handling

The webhook handler (`/app/api/webhooks/lemonsqueezy/route.js`) processes:

- **`order_created`**: Payment successful
  - Updates directory with premium plan
  - Records payment in database
  - Activates premium features
  
- **`order_refunded`**: Payment refunded
  - Reverts directory to standard plan
  - Updates payment status
  - Removes premium features

- **Subscription events**: Reserved for future subscription features

### Custom Data Flow

Custom data (user_id, directory_slug, plan_type) is:
1. Sent during checkout creation in `checkout_data.custom`
2. Received in webhook at `order.checkout_data.custom`
3. Used to match payment with the correct directory
4. Stored in payments collection for reference

## Troubleshooting

### Issue: "Invalid signature" error

**Solutions:**
1. Verify `LEMONSQUEEZY_WEBHOOK_SECRET` in `.env.local` matches LemonSqueezy dashboard
2. Make sure you're using the raw webhook secret (not encoded)
3. Check that no middleware is modifying the request body
4. Confirm webhook URL in LemonSqueezy matches your actual endpoint

### Issue: Webhook not received

**Solutions:**
1. Verify ngrok tunnel is running (`ngrok http 3000`)
2. Check webhook URL in LemonSqueezy dashboard is correct
3. Look for webhook delivery logs in LemonSqueezy dashboard
4. Test endpoint accessibility: `curl -X GET https://your-url/api/webhooks/lemonsqueezy`

### Issue: "No user ID in webhook custom data"

**Solutions:**
1. Verify custom data is being sent in checkout creation
2. Check `createCheckoutSession` parameters
3. Look for custom data in webhook payload logs
4. Ensure `checkout_data` is included in webhook event

### Issue: API connection fails

**Solutions:**
1. Verify `LEMONSQUEEZY_API_KEY` is correct
2. Check API key permissions in LemonSqueezy dashboard
3. Ensure API key hasn't expired
4. Test with the connection script: `pnpm test:lemonsqueezy`

## Monitoring Webhooks

### In LemonSqueezy Dashboard

1. Go to Settings → Webhooks
2. Click on your webhook
3. View "Recent deliveries" tab
4. Check delivery status and response codes
5. Retry failed deliveries if needed

### In Your Application Logs

Watch for these log messages:
- ✅ `Webhook signature verified successfully`
- ✅ `Lemonsqueezy payment successful for directory...`
- ❌ `Invalid webhook signature`
- ❌ `No user ID in webhook custom data`

## Production Checklist

Before going to production:

- [ ] Replace ngrok URL with actual domain
- [ ] Update webhook URL in LemonSqueezy dashboard
- [ ] Verify all environment variables in production
- [ ] Test with real (non-test) payment
- [ ] Set up webhook failure alerts
- [ ] Enable production logging/monitoring
- [ ] Test refund flow
- [ ] Document payment support process

## API Reference

### LemonSqueezy SDK Methods

```javascript
import { 
  lemonSqueezySetup,
  createCheckout,
  getCheckout,
  getOrder
} from '@lemonsqueezy/lemonsqueezy.js';

// Initialize SDK
lemonSqueezySetup({ apiKey: 'your-api-key' });

// Create checkout
const checkout = await createCheckout(storeId, variantId, attributes);

// Verify payment
const checkoutData = await getCheckout(checkoutId);

// Get order details
const orderData = await getOrder(orderId);
```

### Custom Functions

```javascript
import { 
  createCheckoutSession,
  verifyPaymentSession,
  verifyWebhookSignature 
} from '@/app/libs/lemonsqueezy.js';

// Create checkout with custom data
const { checkoutId, url } = await createCheckoutSession({
  planType: 'premium',
  customerEmail: 'user@example.com',
  directoryData: { name: 'My Directory', slug: 'my-directory' },
  successUrl: 'https://...',
  cancelUrl: 'https://...',
  userId: 'user-id'
});

// Verify webhook signature
const isValid = verifyWebhookSignature(rawBody, signature, secret);
```

## Support

If you encounter issues:
1. Run the test script: `pnpm test:lemonsqueezy`
2. Check webhook delivery logs in LemonSqueezy dashboard
3. Review application logs for error messages
4. Verify all environment variables are correct
5. Test in LemonSqueezy test mode first

## Resources

- [LemonSqueezy Documentation](https://docs.lemonsqueezy.com)
- [LemonSqueezy.js SDK](https://github.com/lmsqueezy/lemonsqueezy.js)
- [Webhook Guide](https://docs.lemonsqueezy.com/help/webhooks)
- [API Reference](https://docs.lemonsqueezy.com/api)

