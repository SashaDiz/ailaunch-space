# Draft System Implementation

## Overview
This document outlines the implementation of a draft system for failed or abandoned submissions in DirectoryHunt. Users can now save incomplete submissions as drafts, resume them later, and convert between plan types before final submission.

## Features Implemented

### 1. Database Schema Updates
**File:** `supabase/migrations/20250110_add_draft_status.sql`

- Added `draft` status to the `apps` table status check constraint
- Added `is_draft` boolean field for easier querying
- Created indexes for efficient draft queries
- Added RLS policies for draft access (users can view, update, and delete their own drafts)
- Existing unpaid premium submissions are automatically converted to drafts

### 2. API Route Modifications
**File:** `app/api/directories/route.js`

#### Draft Creation & Updates
- Premium submissions are automatically saved as drafts until payment is confirmed
- When a user tries to submit with an existing draft (same name or URL), the system updates the existing draft instead of creating a duplicate
- Draft data includes all submission information, preserving user work

#### Draft Properties
```javascript
{
  status: "draft",           // For premium plans
  is_draft: true,           // Flag for easier filtering
  payment_status: false,    // Not yet paid
  scheduled_launch: false   // Not scheduled until payment
}
```

#### Standard vs Premium Flow
- **Standard Plan:** Direct submission with `status: "pending"`, `is_draft: false`
- **Premium Plan:** Draft creation with `status: "draft"`, `is_draft: true` until payment is confirmed

### 3. Dashboard Updates
**File:** `app/dashboard/page.js`

#### Draft Display
- Drafts are displayed alongside other submissions with a "Draft" badge
- Special visual indicator (amber alert box) showing draft status
- Clear call-to-action buttons: "Resume Draft" and "Delete"

#### Draft Actions
1. **Resume Draft:** 
   - Stores draft data in sessionStorage
   - Redirects to submit page with `?draft=ID` parameter
   - Allows full editing including plan change

2. **Delete Draft:**
   - Calls DELETE endpoint with confirmation
   - Only allows deletion of drafts (not submitted projects)
   - Refreshes dashboard after deletion

3. **Edit Restrictions:**
   - Regular submissions: Can only edit if status is "scheduled"
   - Drafts: Can always edit and resubmit

### 4. Submit Page Enhancements
**File:** `app/submit/page.js`

#### Draft Loading
- Detects `?draft=ID` query parameter
- Loads draft data from sessionStorage or API
- Populates all form fields with saved data
- Starts at Step 1 (Plan Selection) to allow plan changes

#### Plan Conversion
- Users can change between Standard and Premium plans
- Shows helpful message: "You're editing a draft. You can change your plan before submitting."
- Form submission updates the existing draft record

### 5. Payment Webhook Integration
**File:** `app/api/webhooks/lemonsqueezy/route.js`

When payment is successfully received:
```javascript
{
  payment_status: true,
  status: "pending",        // Moved from "draft"
  is_draft: false,         // No longer a draft
  scheduled_launch: true   // Now scheduled for launch
}
```

### 6. Individual Directory Endpoint
**File:** `app/api/directories/[id]/route.js`

- GET endpoint for fetching single directory by ID
- Used when loading draft from API (fallback to sessionStorage)
- Enforces access control (users can only access their own drafts)

## User Flow Examples

### Scenario 1: Premium Submission with Payment Abandonment
1. User fills out premium submission form
2. System saves as draft (status: "draft", is_draft: true)
3. User opens payment page but closes it without paying
4. Draft appears in dashboard with "Resume Draft" option
5. User can return later, change to standard plan if desired, and submit

### Scenario 2: Converting Premium Draft to Standard
1. User has a premium draft in dashboard
2. Clicks "Resume Draft"
3. Redirected to submit page with draft data pre-filled
4. At Step 1, changes plan from Premium to Standard
5. Completes form and submits as free standard submission
6. Draft is updated to standard submission with pending status

### Scenario 3: Completing Premium Payment
1. User has a premium draft
2. Clicks "Resume Draft"
3. Completes form and proceeds to payment
4. Successfully completes payment
5. Webhook updates draft: status → "pending", is_draft → false
6. Submission enters approval queue

### Scenario 4: Deleting Unwanted Draft
1. User sees old draft in dashboard
2. Clicks dropdown menu → "Delete Draft"
3. Confirms deletion
4. Draft is permanently removed

## Technical Details

### Draft Detection Logic
```javascript
const isDraft = (directory) => {
  return directory.is_draft || 
         directory.status === "draft" ||
         (directory.plan === "premium" && directory.payment_status === false);
};
```

### Updating vs Creating
```javascript
const isUpdatingDraft = existingDraft && 
                       (existingDraft.is_draft || 
                        (existingDraft.plan === "premium" && existingDraft.payment_status === false)) &&
                       existingDraft.submitted_by === user.id;
```

### Competition Slot Counting
- Standard submissions increment slot count immediately
- Premium drafts don't count toward slots until payment confirmed
- Prevents slot reservation without payment

## Database Schema Changes

```sql
-- Status constraint update
ALTER TABLE public.apps DROP CONSTRAINT IF EXISTS apps_status_check;
ALTER TABLE public.apps ADD CONSTRAINT apps_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'live', 'archived', 'scheduled', 'draft'));

-- New field
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_apps_is_draft ON public.apps(is_draft);
```

## UI Components

### Draft Badge
```javascript
<span className="badge badge-ghost badge-sm">Draft</span>
```

### Draft Alert
- Amber background with warning icon
- Contextual message based on plan type
- Primary action buttons for resume/delete

### Dashboard Filtering
Drafts are included in the main directories query but displayed with special styling and actions.

## Error Handling

### Draft Not Found
- If draft ID in URL doesn't exist or doesn't belong to user
- Shows error toast and redirects to dashboard

### Payment Failure
- Draft remains in draft status
- User can retry payment or change to standard plan
- No data loss

### Validation Errors
- Draft is saved even if validation fails
- User can fix errors on next visit

## Security Considerations

1. **Row Level Security (RLS):**
   - Users can only view/edit/delete their own drafts
   - Public cannot see drafts
   - Admins can view all submissions including drafts

2. **API Access Control:**
   - Authentication required for all draft operations
   - User ID verification on all mutations
   - No draft data exposed in public endpoints

3. **Payment Verification:**
   - Only webhook with valid signature can convert draft to submission
   - Double-checks payment status before scheduling launch

## Benefits

1. **User Experience:**
   - No loss of work if payment fails
   - Flexibility to change plans
   - Clear visibility of incomplete submissions

2. **Conversion Optimization:**
   - Users can complete submission later
   - Reduces friction in premium conversion
   - Easier to downgrade to standard if price is concern

3. **Data Integrity:**
   - No duplicate submissions
   - Clean separation between drafts and live submissions
   - Consistent slot counting

## Future Enhancements

Potential improvements:
1. Auto-save drafts as user types
2. Email reminders for abandoned drafts
3. Draft expiration (auto-delete after X days)
4. Bulk draft operations (delete all, export, etc.)
5. Draft templates for common project types
6. Collaborative drafts (multiple users)

## Testing Checklist

- [ ] Create premium draft without payment
- [ ] Resume premium draft and complete payment
- [ ] Resume premium draft and switch to standard
- [ ] Delete draft from dashboard
- [ ] Create standard submission (should not be draft)
- [ ] Verify draft doesn't count toward competition slots
- [ ] Test payment webhook updates draft correctly
- [ ] Test RLS policies (user can only access own drafts)
- [ ] Test duplicate name/URL with existing draft
- [ ] Test loading draft from sessionStorage
- [ ] Test loading draft from API fallback

## Deployment Notes

1. **Run Migration:**
   ```bash
   # Apply the migration to add draft status and fields
   psql -U postgres -d your_database -f supabase/migrations/20250110_add_draft_status.sql
   ```

2. **Clear Existing Cache:**
   - Clear any API response caches
   - Refresh dashboard to show new draft UI

3. **Monitor:**
   - Watch for draft creation patterns
   - Track conversion rate from draft to paid submission
   - Monitor draft abandonment rate

4. **Rollback Plan:**
   - Drafts can be bulk-converted to pending if needed
   - Migration can be reversed by removing draft status and is_draft field

