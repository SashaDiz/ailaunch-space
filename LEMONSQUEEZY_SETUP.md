# LemonSqueezy Confirmation Modal Setup

## Configuration Settings

### 1. Title
```
Payment Successful! 🎉
```

### 2. Message
```
Thank you for your premium submission! Your payment has been confirmed.

IMPORTANT: Click the button below to return to AI Launch Space and complete your project submission. Your project will be scheduled for launch after you complete this step.
```

### 3. Button Text
```
Complete My Submission →
```

### 4. Button Link
```
https://ailaunch.space/submit?payment=success
```

**For testing (localhost):**
```
http://localhost:3000/submit?payment=success
```

---

## How It Works

1. **Customer pays** → LemonSqueezy processes payment
2. **Webhook fires** → Your server records payment in database
3. **Modal appears** → Customer sees confirmation with button
4. **Customer clicks button** → Redirects to your platform
5. **Your platform detects payment** → Shows success message and completes submission

---

## Important Notes

⚠️ **Limitation**: The Button Link in Product Settings is STATIC (same for all orders). It cannot include dynamic parameters like `directoryId`.

✅ **Solution**: When creating checkouts via API (which you're doing), the `product_options.redirect_url` we set in the code OVERRIDES this static button link and can include dynamic parameters.

So your current code implementation is already handling this correctly!

---

## What Each Field Does

- **Title**: First thing customers see after payment
- **Message**: Explains what happened and what to do next
- **Button Text**: Call-to-action text (keep it clear and actionable)
- **Button Link**: Where the button takes them (overridden by API when using `product_options.redirect_url`)

---

## Testing Checklist

After configuring:

1. ✅ Make a test purchase
2. ✅ Verify modal appears with correct text
3. ✅ Click the button and confirm redirect works
4. ✅ Check that payment is recorded in database
5. ✅ Verify submission completes successfully

