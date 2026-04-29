#!/usr/bin/env node

/**
 * Redistribute categories from "Other" sphere into appropriate spheres.
 * Usage: node scripts/redistribute-categories.js
 * Requires .env.local with Supabase credentials.
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load .env.local
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const SPHERE_MAP = {
  // Business (add to existing)
  'crm': 'Business',
  'sales': 'Business',
  'lead-generation': 'Business',
  'ecommerce': 'Business',
  'retail': 'Business',
  'fintech': 'Business',
  'payments': 'Business',
  'subscriptions': 'Business',

  // Creative (add to existing)
  'writing': 'Creative',
  'prototyping': 'Creative',
  'whiteboard': 'Creative',
  'visualization': 'Creative',
  'ux': 'Creative',
  'diagramming': 'Creative',

  // Development (new)
  'api': 'Development',
  'backend': 'Development',
  'database': 'Development',
  'devops': 'Development',
  'version-control': 'Development',
  'no-code': 'Development',
  'website-builder': 'Development',
  'automation': 'Development',
  'ai': 'Development',

  // Infrastructure (new)
  'cloud-storage': 'Infrastructure',
  'hosting': 'Infrastructure',
  'monitoring': 'Infrastructure',
  'security': 'Infrastructure',
  'identity': 'Infrastructure',
  'password-manager': 'Infrastructure',
  'apm': 'Infrastructure',
  'cdp': 'Infrastructure',
  'session-replay': 'Infrastructure',

  // Marketing & Growth (new)
  'content-marketing': 'Marketing & Growth',
  'email-marketing': 'Marketing & Growth',
  'email-delivery': 'Marketing & Growth',
  'growth': 'Marketing & Growth',
  'surveys': 'Marketing & Growth',
  'feedback': 'Marketing & Growth',
  'creators': 'Marketing & Growth',

  // Productivity (new)
  'project-management': 'Productivity',
  'collaboration': 'Productivity',
  'kanban': 'Productivity',
  'agile': 'Productivity',
  'scheduling': 'Productivity',
  'work-os': 'Productivity',
  'product': 'Productivity',
  'productivity': 'Productivity',
  'knowledge-base': 'Productivity',
  'forms': 'Productivity',
  'onboarding': 'Productivity',

  // Communication (new)
  'messaging': 'Communication',
  'video-conferencing': 'Communication',
  'async': 'Communication',
  'helpdesk': 'Communication',
  'meetings': 'Communication',
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  // Fetch all categories in "Other" sphere
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, slug, sphere')
    .eq('sphere', 'Other');

  if (error) {
    console.error('Failed to fetch categories:', error.message);
    process.exit(1);
  }

  console.log(`Found ${categories.length} categories in "Other" sphere\n`);

  let updated = 0;
  let skipped = 0;

  for (const cat of categories) {
    const newSphere = SPHERE_MAP[cat.slug];
    if (!newSphere) {
      console.log(`  SKIP: "${cat.name}" (slug: ${cat.slug}) — stays in Other`);
      skipped++;
      continue;
    }

    const { error: updateError } = await supabase
      .from('categories')
      .update({ sphere: newSphere })
      .eq('id', cat.id);

    if (updateError) {
      console.error(`  ERROR updating "${cat.name}": ${updateError.message}`);
    } else {
      console.log(`  ✓ "${cat.name}" → ${newSphere}`);
      updated++;
    }
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped (remain in Other)`);
}

main().catch(console.error);
