#!/usr/bin/env node

/**
 * Test Supabase Connection
 * Usage: pnpm db:test
 *
 * Verifies that the Supabase environment variables are set
 * and the connection to the database is working.
 */

const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Missing environment variables:');
    if (!url) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    if (!key) console.error('  - SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY)');
    console.error('\nMake sure .env.local is configured. See .env.example for reference.');
    process.exit(1);
  }

  console.log('Connecting to Supabase...');
  console.log(`  URL: ${url.substring(0, 30)}...`);

  const supabase = createClient(url, key);

  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);

    if (error) {
      console.error('Connection failed:', error.message);
      process.exit(1);
    }

    console.log('Connection successful!');
    console.log(`  Found ${data.length} user(s) in the users table.`);
  } catch (err) {
    console.error('Connection error:', err.message);
    process.exit(1);
  }
}

testConnection();
