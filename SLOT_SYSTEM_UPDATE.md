# Slot System Update - January 9, 2025

## Overview
Updated the launch slot system to implement shared slots between Standard and Premium plans, with Premium getting additional exclusive slots.

## Previous System
- **Standard Plan**: 15 separate slots per week
- **Premium Plan**: 10 separate slots per week (unlimited in some implementations)
- Both plans had independent slot pools

## New System
- **Standard Plan**: 15 shared slots per week
- **Premium Plan**: 25 total slots per week (15 shared + 10 premium-only)
- Both plans share the first 15 slots; Premium gets 10 additional slots after the shared slots are filled

## Changes Made

### 1. Backend API Updates

#### `/app/api/competitions/route.js`
- Updated `available=true` endpoint to filter weeks based on plan type
- Standard plan: Shows weeks with `total_submissions < 15`
- Premium plan: Shows weeks with `total_submissions < 25`
- Updated `createUpcomingWeeks()` to set `max_premium_slots` to 25 instead of 999

#### `/app/api/directories/route.js`
- Updated slot availability checking logic in POST endpoint
- Standard submissions: Rejected if `total_submissions >= 15`
- Premium submissions: Rejected if `total_submissions >= 25`
- Updated error messages to explain the slot system

### 2. Frontend Updates

#### `/app/submit/page.js`
- Updated `getAvailabilityText()` to show correct slot availability
  - Shows total slots used out of plan-specific limits
  - Indicates when premium-only slots are available
  - Shows helpful message for standard plans when shared slots are full
- Updated `isWeekAvailable()` to check against correct limits
- Updated plan descriptions to reflect new slot system:
  - Standard: "15 shared weekly slots"
  - Premium: "25 total slots (15 shared + 10 premium-only)"
- Updated week selection header text

### 3. Database Schema

#### `/supabase/schema.sql`
- Added comprehensive comments explaining the slot system
- Documented that `standard_submissions` and `premium_submissions` are for analytics only
- Clarified that `total_submissions` is the source of truth for slot availability

#### `/supabase/migrations/20250109_update_competition_slots.sql`
- Created migration to update existing competitions
- Updates `max_premium_slots` from 999 to 25
- Adds column comments for clarity

## How It Works

### Slot Allocation
1. **Slots 1-15**: Shared between Standard and Premium
2. **Slots 16-25**: Premium-only

### Submission Logic
```javascript
// Standard Plan
if (total_submissions < 15) {
  // Can submit
} else {
  // Week is full - suggest Premium upgrade
}

// Premium Plan
if (total_submissions < 25) {
  // Can submit
} else {
  // Week is full
}
```

### Display Logic (Frontend)
```javascript
// Standard Plan
- Shows: "X/15 spots (shared)"
- When full: "Full (upgrade to Premium for 10 extra slots)"

// Premium Plan
- Before slot 15: "X/25 spots (Y shared + 10 premium)"
- After slot 15: "X/25 spots (premium only)"
```

## Migration Steps

### For Development
1. Code changes are already applied ✓
2. Run the migration:
   ```bash
   # Using Supabase CLI
   supabase db push

   # Or manually in Supabase SQL Editor
   # Copy contents from supabase/migrations/20250109_update_competition_slots.sql
   ```

### For Production
1. Deploy code changes
2. Run migration in Supabase dashboard SQL Editor
3. Verify existing competitions have `max_premium_slots = 25`

## Bug Fix: Available Weeks Not Showing

### Issue
The week selection was showing "No launch weeks available" even though competitions existed in the database.

### Root Cause
The API was filtering competitions by `start_date >= getNextMondayStart()`, which only showed weeks that **hadn't started yet**. This excluded the current active week.

### Fix
Changed the filter from:
```javascript
start_date: { $gte: getNextMondayStart() } // Only future weeks
```

To:
```javascript
end_date: { $gt: now } // Week hasn't ended yet
```

Now users can submit to:
- ✅ Current active week (if not ended)
- ✅ All upcoming weeks
- ❌ Past completed weeks (correctly excluded)

## Testing Checklist

- [ ] Standard plan shows available weeks correctly
- [ ] Premium plan shows available weeks correctly  
- [ ] Current active week appears in the list
- [ ] Standard submissions blocked when `total_submissions >= 15`
- [ ] Premium submissions blocked when `total_submissions >= 25`
- [ ] Week selection shows correct slot counts
- [ ] Premium can submit when slots 16-25 are available (standard slots full)
- [ ] Error messages are clear and helpful

## Benefits

1. **Clearer Value Proposition**: Premium users get clear additional value (10 extra slots)
2. **Better Resource Utilization**: Shared slots prevent waste when one plan has low demand
3. **Upsell Opportunity**: Standard users see Premium value when shared slots fill up
4. **Analytics Maintained**: Still tracking plan-specific submissions for analytics

## Notes

- All new competitions created will automatically use the new slot limits
- Existing competitions need the migration applied
- No changes to vote counting or winner selection logic
- Plan pricing and other features remain unchanged

