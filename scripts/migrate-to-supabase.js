#!/usr/bin/env node

/**
 * Run Supabase Migration
 * Usage: pnpm db:migrate
 *
 * Applies the schema from supabase/schema.sql to your Supabase project.
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY) in .env.local.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function migrate() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Missing environment variables. See .env.example for reference.');
    process.exit(1);
  }

  const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');

  if (!fs.existsSync(schemaPath)) {
    console.error('Schema file not found at:', schemaPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf-8');
  console.log(`Read schema file (${sql.length} bytes)`);

  const supabase = createClient(url, key);

  try {
    const { error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      console.error('Migration failed:', error.message);
      console.log('\nNote: You may need to run the SQL manually in the Supabase SQL Editor.');
      console.log('  1. Go to your Supabase Dashboard > SQL Editor');
      console.log('  2. Paste the contents of supabase/schema.sql');
      console.log('  3. Click "Run"');
      process.exit(1);
    }

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration error:', err.message);
    console.log('\nTip: Run the SQL manually in the Supabase SQL Editor instead.');
    process.exit(1);
  }
}

migrate();
