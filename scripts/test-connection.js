#!/usr/bin/env node
/**
 * Test Supabase Database Connection
 * 
 * This script verifies that:
 * 1. Environment variables are set correctly
 * 2. Supabase client can be initialized
 * 3. Database connection is working
 * 4. Tables exist and are accessible
 */

import { config } from 'dotenv';
import { getSupabaseAdmin } from '../app/libs/supabase.js';
import { db } from '../app/libs/database.js';

// Load environment variables
config({ path: '.env.local' });

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

async function testConnection() {
  try {
    logSection('SUPABASE CONNECTION TEST');

    // Test 1: Check Environment Variables
    logSection('1. Checking Environment Variables');
    
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];

    let envVarsOk = true;
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        logSuccess(`${envVar} is set`);
      } else {
        logError(`${envVar} is missing`);
        envVarsOk = false;
      }
    }

    if (!envVarsOk) {
      logError('\nPlease add the missing environment variables to your .env.local file');
      logInfo('See ENV_SUPABASE_TEMPLATE.md for the template');
      process.exit(1);
    }

    // Test 2: Initialize Supabase Client
    logSection('2. Initializing Supabase Client');
    
    let supabase;
    try {
      supabase = getSupabaseAdmin();
      logSuccess('Supabase admin client initialized');
    } catch (error) {
      logError(`Failed to initialize Supabase client: ${error.message}`);
      process.exit(1);
    }

    // Test 3: Test Database Connection
    logSection('3. Testing Database Connection');
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        logError(`Database connection failed: ${error.message}`);
        logInfo('Make sure you have run the schema.sql in your Supabase SQL Editor');
        process.exit(1);
      }

      logSuccess('Database connection successful');
    } catch (error) {
      logError(`Database connection error: ${error.message}`);
      process.exit(1);
    }

    // Test 4: Check Tables Exist
    logSection('4. Checking Database Tables');
    
    const tables = [
      'users',
      'apps',
      'categories',
      'competitions',
      'votes',
      'payments',
      'newsletter',
      'sidebar_content',
      'backlinks',
      'analytics',
      'external_webhooks',
    ];

    const tableResults = [];
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('count')
          .limit(0);

        if (error) {
          if (error.code === '42P01') {
            logError(`Table "${table}" does not exist`);
            tableResults.push({ table, exists: false });
          } else {
            logWarning(`Table "${table}": ${error.message}`);
            tableResults.push({ table, exists: true, warning: error.message });
          }
        } else {
          logSuccess(`Table "${table}" exists and is accessible`);
          tableResults.push({ table, exists: true });
        }
      } catch (error) {
        logError(`Error checking table "${table}": ${error.message}`);
        tableResults.push({ table, exists: false, error: error.message });
      }
    }

    // Test 5: Check Database Manager
    logSection('5. Testing Database Manager');
    
    try {
      const count = await db.count('users');
      logSuccess(`Database Manager working - Found ${count} users`);
    } catch (error) {
      logError(`Database Manager error: ${error.message}`);
    }

    // Test 6: Check Row Level Security
    logSection('6. Checking Row Level Security (RLS)');
    
    try {
      const { data, error } = await supabase
        .from('apps')
        .select('id, name, status')
        .limit(5);

      if (error) {
        logWarning(`RLS check: ${error.message}`);
        logInfo('This might be expected if RLS policies are strict');
      } else {
        logSuccess(`RLS check passed - Can query apps table (${data.length} rows)`);
      }
    } catch (error) {
      logWarning(`RLS check error: ${error.message}`);
    }

    // Final Summary
    logSection('CONNECTION TEST SUMMARY');
    
    const missingTables = tableResults.filter(t => !t.exists);
    if (missingTables.length === 0) {
      logSuccess('All tables exist and are accessible! ✨');
      logSuccess('Your database is ready to use!');
      logInfo('\nNext steps:');
      logInfo('1. Run: pnpm dev');
      logInfo('2. Visit: http://localhost:3000');
    } else {
      logError(`Missing ${missingTables.length} table(s):`);
      missingTables.forEach(t => logError(`  - ${t.table}`));
      logInfo('\nTo fix this:');
      logInfo('1. Go to your Supabase Dashboard → SQL Editor');
      logInfo('2. Run the schema from: supabase/schema.sql');
    }

    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    logError(`\nUnexpected error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testConnection();

