/**
 * Script to fix competition submission counts based on actual app submissions
 * Run with: node scripts/fix-competition-counts.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixCompetitionCounts() {
  console.log('Starting competition counts fix...\n');

  // Get all competitions
  const { data: competitions, error: compError } = await supabase
    .from('competitions')
    .select('*')
    .order('start_date', { ascending: true });

  if (compError) {
    console.error('Error fetching competitions:', compError);
    process.exit(1);
  }

  console.log(`Found ${competitions.length} competitions\n`);

  // For each competition, count the actual submissions
  for (const competition of competitions) {
    console.log(`\nProcessing: ${competition.competition_id} (${competition.type})`);

    // Count apps for this competition
    const { data: apps, error: appsError } = await supabase
      .from('apps')
      .select('id, plan, launch_week')
      .eq('launch_week', competition.competition_id);

    if (appsError) {
      console.error(`  Error fetching apps:`, appsError);
      continue;
    }

    const totalSubmissions = apps.length;
    const standardSubmissions = apps.filter(app => app.plan === 'standard').length;
    const premiumSubmissions = apps.filter(app => app.plan === 'premium').length;

    console.log(`  Found ${totalSubmissions} total submissions`);
    console.log(`    - Standard: ${standardSubmissions}`);
    console.log(`    - Premium: ${premiumSubmissions}`);

    // Check if update is needed
    const needsUpdate = 
      competition.total_submissions !== totalSubmissions ||
      competition.standard_submissions !== standardSubmissions ||
      competition.premium_submissions !== premiumSubmissions;

    if (needsUpdate) {
      console.log(`  Current DB values:`, {
        total: competition.total_submissions,
        standard: competition.standard_submissions,
        premium: competition.premium_submissions
      });

      // Update the competition
      const { error: updateError } = await supabase
        .from('competitions')
        .update({
          total_submissions: totalSubmissions,
          standard_submissions: standardSubmissions,
          premium_submissions: premiumSubmissions
        })
        .eq('id', competition.id);

      if (updateError) {
        console.error(`  ❌ Update failed:`, updateError);
      } else {
        console.log(`  ✅ Updated successfully!`);
      }
    } else {
      console.log(`  ✓ Counts already correct`);
    }
  }

  console.log('\n\nFix complete!');
}

fixCompetitionCounts().catch(console.error);

