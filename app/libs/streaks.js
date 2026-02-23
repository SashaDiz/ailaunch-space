import { db } from './database.js';
import { createStreakDiscountCode, createFreePremiumCoupon } from './stripe.js';
import { TZDate } from '@date-fns/tz';
import { format, subDays } from 'date-fns';

/**
 * Reward tiers configuration
 * Based on cumulative total days voted (non-expiring streaks)
 */
export const REWARD_TIERS = [
  {
    tier: 5,
    type: 'power_up',
    description: 'Vote multiplier x2',
    rewardData: { multiplier: 2 },
  },
  {
    tier: 25,
    type: 'discount',
    description: '25% off Premium listing',
    rewardData: { percentOff: 25 },
  },
  {
    tier: 50,
    type: 'discount',
    description: '50% off Premium listing',
    rewardData: { percentOff: 50 },
  },
  {
    tier: 100,
    type: 'power_up',
    description: 'Vote multiplier x3 + First avatar border',
    rewardData: { multiplier: 3, avatarBorder: 1 },
  },
  {
    tier: 150,
    type: 'free_premium',
    description: 'Free Premium listing',
    rewardData: {},
  },
  {
    tier: 300,
    type: 'power_up',
    description: 'Vote multiplier x4 + Free Premium listing',
    rewardData: { multiplier: 4 },
  },
  {
    tier: 500,
    type: 'power_up',
    description: 'Second avatar border + 50% off advertising',
    rewardData: { avatarBorder: 2 },
  },
  {
    tier: 1000,
    type: 'power_up',
    description: 'Vote multiplier x5',
    rewardData: { multiplier: 5 },
  },
];

/**
 * Get today's date in user's timezone
 * @param {string} timezone - IANA timezone identifier (e.g., 'America/New_York')
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function getTodayInTimezone(timezone = 'UTC') {
  try {
    // Create a TZDate for the current moment in the user's timezone
    const now = TZDate.tz(timezone);
    // Format as YYYY-MM-DD in the user's timezone
    return format(now, 'yyyy-MM-dd');
  } catch (error) {
    console.error(`Invalid timezone "${timezone}", falling back to UTC:`, error);
    // Fallback to UTC if timezone is invalid
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Update user streak - non-expiring cumulative total days voted
 * @param {string} userId - User ID
 * @param {string} userTimezone - Optional IANA timezone identifier. If not provided, uses user's stored timezone or UTC
 * @returns {Promise<{incremented: boolean, newStreak: number}>}
 */
export async function updateUserStreak(userId, userTimezone = null) {
  const user = await db.findOne('users', { id: userId });

  if (!user) {
    console.error(`User not found: ${userId}`);
    return { incremented: false, newStreak: 0 };
  }

  // Get user's timezone (from parameter, stored value, or default to UTC)
  const timezone = userTimezone || user.timezone || 'UTC';
  
  // Get today's date in the user's timezone
  // This ensures each user's "day" starts based on their local timezone
  const today = getTodayInTimezone(timezone);

  // Check if user already voted today
  let todayVote;
  try {
    todayVote = await db.findOne('daily_votes', {
      user_id: userId,
      vote_date: today,
    });
  } catch (error) {
    console.error('Error checking daily_votes:', {
      userId,
      today,
      error: error.message,
      stack: error.stack
    });
    // If table doesn't exist or query fails, try to continue
    // This allows the system to work even if the table hasn't been created yet
    todayVote = null;
  }

  if (todayVote) {
    // Already voted today - increment vote count but don't add to streak
    await db.updateOne(
      'daily_votes',
      { id: todayVote.id },
      {
        $set: {
          vote_count: (todayVote.vote_count || 1) + 1,
          updated_at: new Date(),
        },
      }
    );
    return { incremented: false, newStreak: user.current_streak || 0 };
  }

  // First vote today - add to streak
  try {
    await db.insertOne('daily_votes', {
      user_id: userId,
      vote_date: today,
      vote_count: 1,
    });
  } catch (error) {
    console.error('Error inserting daily_vote:', {
      userId,
      today,
      error: error.message,
      stack: error.stack
    });
    // If insert fails (e.g., table doesn't exist), we should still try to update the streak
    // This is a fallback for when the table hasn't been created yet
  }

  // Increment cumulative streak (never resets)
  const currentStreak = user.current_streak || 0;
  const newStreak = currentStreak + 1;

  // Update longest consecutive streak (optional, for stats)
  // This tracks the longest period of consecutive voting
  let longestStreak = user.longest_streak || 0;
  const lastVoteDate = user.last_vote_date ? new Date(user.last_vote_date) : null;

  if (lastVoteDate) {
    // Calculate yesterday in the same timezone
    const now = TZDate.tz(timezone);
    const yesterday = subDays(now, 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
    const lastVoteStr = lastVoteDate.toISOString().split('T')[0];

    // If last vote was yesterday, we could track consecutive streak here
    // But rewards are based on cumulative total, not consecutive
    if (lastVoteStr === yesterdayStr) {
      // Consecutive day - longest streak could be incremented if tracking consecutive
      // For now, we just track cumulative total
    }
  }

  // Update user streak (cumulative, never resets)
  await db.updateOne(
    'users',
    { id: userId },
    {
      $set: {
        current_streak: newStreak, // Total days voted
        longest_streak: Math.max(longestStreak, newStreak), // Optional: track highest total
        last_vote_date: today,
        updated_at: new Date(),
      },
    }
  );

  return { incremented: true, newStreak };
}

/**
 * Check if user reached reward tiers and unlock rewards
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of unlocked rewards
 */
export async function checkAndUnlockRewards(userId) {
  const user = await db.findOne('users', { id: userId });
  if (!user) {
    console.error(`User not found: ${userId}`);
    return [];
  }

  const currentStreak = user.current_streak || 0;
  const unlockedRewards = [];

  // Check each reward tier
  for (const rewardConfig of REWARD_TIERS) {
    // Skip if user hasn't reached this tier yet
    if (currentStreak < rewardConfig.tier) {
      continue;
    }

    // Check if user already has this reward
    const existingReward = await db.findOne('user_rewards', {
      user_id: userId,
      reward_tier: rewardConfig.tier,
    });

    if (existingReward) {
      // Reward already unlocked
      continue;
    }

    // Unlock the reward
    try {
      let rewardData = {
        user_id: userId,
        reward_type: rewardConfig.type,
        reward_tier: rewardConfig.tier,
        metadata: {
          description: rewardConfig.description,
          ...rewardConfig.rewardData,
        },
      };

      // Create Stripe coupon/promotion code for discount and free_premium rewards
      if (rewardConfig.type === 'discount' && rewardConfig.rewardData.percentOff) {
        try {
          const stripeCode = await createStreakDiscountCode(
            rewardConfig.rewardData.percentOff,
            userId,
            rewardConfig.tier
          );
          rewardData.stripe_coupon_id = stripeCode.couponId;
          rewardData.stripe_promotion_code_id = stripeCode.promotionCodeId;
          rewardData.discount_code = stripeCode.code;
        } catch (stripeError) {
          console.error(`Failed to create Stripe discount code for tier ${rewardConfig.tier}:`, stripeError);
          // Continue without Stripe code - reward will still be stored
        }
      } else if (rewardConfig.type === 'free_premium') {
        try {
          const stripeCode = await createFreePremiumCoupon(userId, rewardConfig.tier);
          rewardData.stripe_coupon_id = stripeCode.couponId;
          rewardData.stripe_promotion_code_id = stripeCode.promotionCodeId;
          rewardData.discount_code = stripeCode.code;
        } catch (stripeError) {
          console.error(`Failed to create Stripe free premium code for tier ${rewardConfig.tier}:`, stripeError);
          // Continue without Stripe code - reward will still be stored
        }
      }

      // For power_up rewards, apply immediately
      if (rewardConfig.type === 'power_up') {
        const updates = {};
        
        if (rewardConfig.rewardData.multiplier) {
          // Update vote multiplier (use the highest multiplier)
          const currentMultiplier = user.vote_multiplier || 1;
          updates.vote_multiplier = Math.max(currentMultiplier, rewardConfig.rewardData.multiplier);
        }
        
        if (rewardConfig.rewardData.avatarBorder) {
          // Update avatar border level (use the highest level)
          const currentBorder = user.avatar_border_level || 0;
          updates.avatar_border_level = Math.max(currentBorder, rewardConfig.rewardData.avatarBorder);
        }
        
        if (Object.keys(updates).length > 0) {
          await db.updateOne('users', { id: userId }, { $set: updates });
        }
      }

      // Store reward in database
      await db.insertOne('user_rewards', rewardData);
      unlockedRewards.push({
        tier: rewardConfig.tier,
        type: rewardConfig.type,
        description: rewardConfig.description,
        discountCode: rewardData.discount_code,
      });
    } catch (error) {
      console.error(`Failed to unlock reward tier ${rewardConfig.tier}:`, error);
      // Continue with other rewards
    }
  }

  return unlockedRewards;
}

/**
 * Get next reward tier for user
 * @param {number} currentStreak - Current streak count
 * @returns {Object|null} Next reward tier config or null
 */
export function getNextRewardTier(currentStreak) {
  for (const tier of REWARD_TIERS) {
    if (currentStreak < tier.tier) {
      return tier;
    }
  }
  return null;
}

/**
 * Get progress to next reward
 * @param {number} currentStreak - Current streak count
 * @returns {Object} Progress info (percentage, daysRemaining, nextTier)
 */
export function getProgressToNextReward(currentStreak) {
  const nextTier = getNextRewardTier(currentStreak);
  
  if (!nextTier) {
    return {
      percentage: 100,
      daysRemaining: 0,
      nextTier: null,
      description: 'All rewards unlocked!',
    };
  }

  const previousTier = REWARD_TIERS.find((t) => t.tier < nextTier.tier);
  const startStreak = previousTier ? previousTier.tier : 0;
  const endStreak = nextTier.tier;
  const progress = currentStreak - startStreak;
  const total = endStreak - startStreak;
  const percentage = Math.min(100, Math.round((progress / total) * 100));
  const daysRemaining = endStreak - currentStreak;

  return {
    percentage,
    daysRemaining,
    nextTier: {
      tier: nextTier.tier,
      description: nextTier.description,
    },
    description: nextTier.description,
  };
}
