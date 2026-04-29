#!/usr/bin/env node

/**
 * CSV Data Import
 * Usage: pnpm migrate:csv
 *
 * Imports project data from CSV files into the Supabase database.
 * Place your CSV files in the project root or specify the path as an argument.
 *
 * Expected CSV columns: name, slug, description, website_url, categories, pricing
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  return lines.slice(1).map(line => {
    const values = line.match(/(".*?"|[^,]+)/g) || [];
    const row = {};
    headers.forEach((header, i) => {
      row[header] = (values[i] || '').trim().replace(/^"|"$/g, '');
    });
    return row;
  });
}

async function importCSV() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Missing environment variables. See .env.example for reference.');
    process.exit(1);
  }

  const csvPath = process.argv[2] || path.join(__dirname, '..', 'data.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    console.log('\nUsage: pnpm migrate:csv [path-to-csv]');
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(content);
  console.log(`Parsed ${rows.length} rows from CSV`);

  if (rows.length === 0) {
    console.log('No data to import.');
    return;
  }

  const supabase = createClient(url, key);
  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.name || !row.slug) {
      skipped++;
      continue;
    }

    try {
      const { error } = await supabase.from('apps').upsert(
        {
          name: row.name,
          slug: row.slug,
          description: row.description || '',
          website_url: row.website_url || '',
          categories: row.categories ? row.categories.split(';').map(c => c.trim()) : [],
          pricing: row.pricing || 'Free',
          status: 'pending',
          plan: 'standard',
        },
        { onConflict: 'slug' }
      );

      if (error) {
        console.error(`  Failed to import "${row.name}":`, error.message);
        skipped++;
      } else {
        imported++;
      }
    } catch (err) {
      console.error(`  Error importing "${row.name}":`, err.message);
      skipped++;
    }
  }

  console.log(`\nImport complete: ${imported} imported, ${skipped} skipped`);
}

importCSV();
