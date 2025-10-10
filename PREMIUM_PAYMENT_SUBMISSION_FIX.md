# Premium Payment Submission Fix

## Issue Description

When users tried to launch a product with a premium plan and the payment failed or was cancelled:
1. ❌ The product was still scheduled for launch (`scheduled_launch: true`)
2. ❌ Competition slot counts were incremented immediately
3. ❌ Users couldn't resubmit because the system said "project already submitted"
4. ❌ Unpaid premium submissions were blocking slots for paying users

## Root Cause

The submission flow was treating premium and standard plans identically:
- Both set `scheduled_launch: true` immediately upon submission
- Both incremented competition counts immediately
- No mechanism to revert changes if payment failed
- No cleanup of failed premium submissions

## Solution Implemented

### 1. Updated Submission Flow (`app/api/directories/route.js`)

**Standard Plans (Free):**
- ✅ Set `scheduled_launch: true` immediately (line 643)
- ✅ Increment competition counts immediately (lines 756-790)
- Works as before since it's free

**Premium Plans (Paid):**
- ✅ Set `scheduled_launch: false` initially (line 643)
- ✅ Don't increment competition counts until payment confirmed (lines 756-790)
- ✅ Save draft but don't block slots

### 2. Updated Webhook Handler (`app/api/webhooks/lemonsqueezy/route.js`)

After successful payment:
- ✅ Set `scheduled_launch: true` (line 251)
- ✅ Increment competition counts (lines 264-295)
  - Increment `total_submissions` by 1
  - Increment `premium_submissions` by 1
- ✅ Only now does the premium submission take a slot

### 3. Allow Resubmission for Failed Payments

**Slug Duplicate Check (lines 477-500):**
- If user tries to resubmit with same name
- AND it's their own unpaid premium submission
- ✅ Automatically delete the old unpaid submission
- ✅ Allow the new submission to proceed

**Website URL Duplicate Check (lines 532-555):**
- If user tries to resubmit with same website URL
- AND it's their own unpaid premium submission
- ✅ Automatically delete the old unpaid submission
- ✅ Allow the new submission to proceed

### 4. Database Cleanup

Cleaned up existing broken premium submissions:
- Found 2 unpaid premium submissions with `scheduled_launch: true`
  - "GSsd" (id: 5309c2a9-504b-48bc-a462-2b264b29925d)
  - "Gasdgas" (id: 803e25f7-b9db-4d7c-9d2d-4323b5242c77)
- ✅ Set `scheduled_launch: false` for both
- ✅ Decremented competition counts:
  - `total_submissions`: 5 → 3
  - `premium_submissions`: 2 → 0

## Current State

**Competition 2025-W42:**
- Total Submissions: 3 (all standard, all paid/free)
- Standard Submissions: 3
- Premium Submissions: 0
- Available Slots: 12 standard / 25 premium

**Apps Table:**
```
Premium (unpaid, not scheduled):
- GSsd: scheduled_launch=false, payment_status=false ✅
- Gasdgas: scheduled_launch=false, payment_status=false ✅

Standard (scheduled):
- fasd: scheduled_launch=true, payment_status=false ✅
- asd: scheduled_launch=true, payment_status=false ✅
- test: scheduled_launch=true, status=live ✅
```

## Testing the Fix

### Test Case 1: New Premium Submission
1. User submits premium project
2. Draft created with `scheduled_launch: false`
3. Payment page opens
4. If payment fails → draft remains, no slot taken
5. User can resubmit with same details

### Test Case 2: Premium Submission with Payment
1. User submits premium project
2. Draft created with `scheduled_launch: false`
3. User completes payment
4. Webhook fires → sets `scheduled_launch: true`
5. Competition counts incremented
6. Slot now taken

### Test Case 3: Resubmission After Failed Payment
1. User submitted premium, payment failed
2. User tries to resubmit with same name/URL
3. System finds unpaid premium submission
4. Automatically deletes old submission
5. New submission proceeds normally

## Benefits

✅ **Accurate slot management** - Only paid submissions take slots
✅ **User-friendly** - Users can retry failed payments
✅ **No orphaned data** - Failed payments auto-cleanup on resubmission
✅ **Fair competition** - Only confirmed submissions counted
✅ **Standard plans unchanged** - Free submissions work as before

## Files Modified

1. `/app/api/directories/route.js` - Submission logic
2. `/app/api/webhooks/lemonsqueezy/route.js` - Payment webhook handler
3. Database cleanup via Supabase SQL queries

## Migration Notes

- Existing unpaid premium submissions were cleaned up
- No schema changes required
- Backward compatible with existing standard submissions
- Premium submissions will now follow the new flow

## Future Considerations

1. Consider adding a timeout for unpaid premium submissions (e.g., auto-delete after 24 hours)
2. Add user notifications for failed/abandoned payments
3. Consider showing unpaid submissions in user dashboard with "Complete Payment" action
4. Add analytics to track payment abandonment rates

