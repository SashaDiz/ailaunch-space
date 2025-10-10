// ============================================================================
// SUPABASE DATABASE CONNECTION
// ============================================================================
// This file now uses Supabase instead of MongoDB
// The interface remains the same to minimize code changes

import { db as supabaseDb } from './database-supabase.js';

// Re-export the Supabase database manager as the main db
export const db = supabaseDb;

// Re-export the class for compatibility
export { SupabaseDatabaseManager as DatabaseManager } from './database-supabase.js';
