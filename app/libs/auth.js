// ============================================================================
// SUPABASE AUTH
// ============================================================================
// This file has been migrated from NextAuth to Supabase Auth
// For server-side auth helpers, see auth-helpers.js

import { getSupabaseAdmin } from './supabase.js';
import { db } from './database.js';

/**
 * Get or create user in our database when they sign in
 * This is called automatically by Supabase auth webhooks/triggers
 */
export async function getOrCreateUser(supabaseUser) {
  try {
    if (!supabaseUser?.id || !supabaseUser?.email) {
      console.error('Invalid user object provided to getOrCreateUser');
      return null;
    }

    // Find user in our database by Supabase auth ID
    let dbUser = await db.findOne('users', { id: supabaseUser.id });

    if (!dbUser) {
      // Create new user record
      const newUser = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || '',
        avatar_url: supabaseUser.user_metadata?.avatar_url || '',
        role: 'user', // Default role is 'user', can be 'admin' or 'moderator'
        is_active: true,
        total_submissions: 0,
        total_votes: 0,
        weekly_votes: 0,
        monthly_votes: 0,
        joined_at: new Date(),
        last_login_at: new Date(),
      };

      const result = await db.insertOne('users', newUser);
      dbUser = { ...newUser, id: result.id };
      
      console.log('Created new user:', dbUser.email);
    } else {
      // Update last login and profile info
      await db.updateOne(
        'users',
        { id: supabaseUser.id },
        {
          $set: {
            last_login_at: new Date(),
            name: supabaseUser.user_metadata?.full_name || dbUser.name,
            avatar_url: supabaseUser.user_metadata?.avatar_url || dbUser.avatar_url,
          },
        }
      );
      
      console.log('Updated user login:', dbUser.email);
    }

    return dbUser;
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    return null;
  }
}

/**
 * Check if user has admin privileges
 */
export async function checkIsAdmin(userId) {
  try {
    const user = await db.findOne('users', { id: userId });
    // Check both is_admin (legacy) and role fields for compatibility
    return user?.is_admin === true || user?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, updates) {
  try {
    await db.updateOne(
      'users',
      { id: userId },
      {
        $set: {
          ...updates,
          updated_at: new Date(),
        },
      }
    );
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(userId) {
  try {
    const user = await db.findOne('users', { id: userId });
    
    if (!user) {
      return {
        totalSubmissions: 0,
        totalVotes: 0,
        weeklyVotes: 0,
        monthlyVotes: 0,
      };
    }

    return {
      totalSubmissions: user.total_submissions || 0,
      totalVotes: user.total_votes || 0,
      weeklyVotes: user.weekly_votes || 0,
      monthlyVotes: user.monthly_votes || 0,
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      totalSubmissions: 0,
      totalVotes: 0,
      weeklyVotes: 0,
      monthlyVotes: 0,
    };
  }
}

// Legacy exports for compatibility (no-ops)
export const authOptions = {};
export const auth = async () => null;
export const signIn = async () => {};
export const signOut = async () => {};