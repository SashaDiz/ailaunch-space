#!/usr/bin/env node

/**
 * Email Configuration Checker
 * 
 * Run this script to check your email configuration before deploying to production.
 * 
 * Usage:
 *   node scripts/check-email-config.js
 */

import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dns from 'dns';
import { promisify } from 'util';

const resolveTxt = promisify(dns.resolveTxt);
const resolveCname = promisify(dns.resolveCname);

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

console.log('🔍 AI Launch Space - Email Configuration Checker\n');
console.log('='.repeat(60));

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function pass(check) {
  results.passed.push(check);
  console.log(`✅ ${check}`);
}

function fail(check, details) {
  results.failed.push({ check, details });
  console.log(`❌ ${check}`);
  if (details) console.log(`   ${details}`);
}

function warn(check, details) {
  results.warnings.push({ check, details });
  console.log(`⚠️  ${check}`);
  if (details) console.log(`   ${details}`);
}

// Check 1: Environment Variables
console.log('\n📋 Checking Environment Variables...\n');

const resendApiKey = process.env.RESEND_API_KEY;
if (resendApiKey) {
  pass('RESEND_API_KEY is set');
  if (resendApiKey.startsWith('re_')) {
    pass('RESEND_API_KEY has correct format');
  } else {
    warn('RESEND_API_KEY may be invalid', 'Should start with "re_"');
  }
} else {
  fail('RESEND_API_KEY is not set', 'Add RESEND_API_KEY to your .env.local file');
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL;
if (appUrl) {
  pass(`NEXT_PUBLIC_APP_URL is set: ${appUrl}`);
} else {
  warn('NEXT_PUBLIC_APP_URL is not set', 'Set this for production deployments');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl) {
  pass('NEXT_PUBLIC_SUPABASE_URL is set');
} else {
  fail('NEXT_PUBLIC_SUPABASE_URL is not set', 'Required for authentication');
}

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (supabaseAnonKey) {
  pass('NEXT_PUBLIC_SUPABASE_ANON_KEY is set');
} else {
  fail('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set', 'Required for authentication');
}

// Check 2: Resend Configuration
if (resendApiKey && resendApiKey.startsWith('re_')) {
  console.log('\n📧 Checking Resend Configuration...\n');
  
  try {
    const resend = new Resend(resendApiKey);

    // Check domains
    const { data: domains, error: domainsError } = await resend.domains.list();

    if (domainsError) {
      fail('Failed to fetch domains from Resend', domainsError.message);
    } else {
      pass(`Successfully connected to Resend (${domains.data.length} domains found)`);

      if (domains.data.length === 0) {
        warn('No domains configured in Resend', 'Add ailaunch.space to Resend dashboard');
      } else {
        console.log('\n   Domains:');
        domains.data.forEach(domain => {
          const statusIcon = domain.status === 'verified' ? '✅' : '⏳';
          console.log(`   ${statusIcon} ${domain.name} - ${domain.status} (${domain.region})`);
        });

        const ailaunchDomain = domains.data.find(d => d.name === 'ailaunch.space');
        if (ailaunchDomain) {
          if (ailaunchDomain.status === 'verified') {
            pass('ailaunch.space domain is verified');
          } else {
            fail('ailaunch.space domain is not verified', 
              `Status: ${ailaunchDomain.status}. Verify DNS records in Resend dashboard.`);
          }
        } else {
          warn('ailaunch.space domain not found in Resend', 
            'Add it at https://resend.com/domains');
        }
      }

      // Try to send a test email (to yourself)
      console.log('\n📤 Testing email send...\n');
      const testEmail = process.env.TEST_EMAIL || 'test@example.com';
      
      if (testEmail === 'test@example.com') {
        warn('TEST_EMAIL not set', 'Set TEST_EMAIL in .env.local to send a test email');
      } else {
        const fromAddress = process.env.NODE_ENV === 'production' 
          ? 'noreply@ailaunch.space'
          : 'onboarding@resend.dev';

        try {
          const { data: emailData, error: emailError } = await resend.emails.send({
            from: `AI Launch Space <${fromAddress}>`,
            to: testEmail,
            subject: 'Test Email - Configuration Check',
            html: '<h1>Test Successful!</h1><p>Your email configuration is working correctly.</p>',
          });

          if (emailError) {
            fail('Failed to send test email', emailError.message);
          } else {
            pass(`Test email sent successfully to ${testEmail}`);
            console.log(`   Email ID: ${emailData.id}`);
            console.log(`   View in Resend: https://resend.com/emails/${emailData.id}`);
          }
        } catch (sendError) {
          fail('Error sending test email', sendError.message);
        }
      }
    }
  } catch (error) {
    fail('Error connecting to Resend', error.message);
  }
}

// Check 3: DNS Records (for production)
console.log('\n🌐 Checking DNS Records for ailaunch.space...\n');

try {
  // Check SPF record
  const txtRecords = await resolveTxt('ailaunch.space');
  const spfRecord = txtRecords.find(record => 
    record.join('').includes('v=spf1')
  );

  if (spfRecord) {
    const includesResend = spfRecord.join('').includes('_spf.resend.dev');
    if (includesResend) {
      pass('SPF record includes Resend');
    } else {
      warn('SPF record exists but may not include Resend', 
        'Ensure it includes: include:_spf.resend.dev');
    }
  } else {
    warn('SPF record not found', 'Add SPF record for better email deliverability');
  }

  // Check DKIM record
  try {
    const dkimRecords = await resolveCname('resend._domainkey.ailaunch.space');
    pass('DKIM record configured');
  } catch (error) {
    warn('DKIM record not found', 'Add DKIM CNAME record from Resend dashboard');
  }

} catch (error) {
  warn('Could not check DNS records', 'This is normal for local development');
}

// Check 4: Supabase Configuration
console.log('\n🔐 Supabase Email Configuration...\n');
console.log('   ⚠️  Manual checks required:');
console.log('   1. Go to Supabase Dashboard → Authentication → Email Templates');
console.log('   2. Ensure all templates are configured');
console.log('   3. Check Authentication → URL Configuration:');
console.log('      - Site URL: https://ailaunch.space');
console.log('      - Redirect URLs: https://ailaunch.space/auth/callback');
console.log('   4. Optional: Configure Custom SMTP with Resend credentials');

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Summary\n');
console.log(`✅ Passed: ${results.passed.length}`);
console.log(`⚠️  Warnings: ${results.warnings.length}`);
console.log(`❌ Failed: ${results.failed.length}`);

if (results.failed.length > 0) {
  console.log('\n❌ Failed Checks:\n');
  results.failed.forEach(({ check, details }) => {
    console.log(`   • ${check}`);
    if (details) console.log(`     ${details}`);
  });
}

if (results.warnings.length > 0) {
  console.log('\n⚠️  Warnings:\n');
  results.warnings.forEach(({ check, details }) => {
    console.log(`   • ${check}`);
    if (details) console.log(`     ${details}`);
  });
}

console.log('\n📚 Next Steps:\n');
if (results.failed.length > 0) {
  console.log('   1. Fix the failed checks above');
  console.log('   2. Rerun this script to verify');
} else {
  console.log('   1. Review the PRODUCTION_EMAIL_FIX_GUIDE.md');
  console.log('   2. Deploy to production with updated environment variables');
  console.log('   3. Test with: https://your-domain.com/api/test-email?to=your@email.com&secret=YOUR_SECRET');
  console.log('   4. Test actual user sign-up flow');
}

console.log('\n' + '='.repeat(60));

// Exit with error code if there are failures
process.exit(results.failed.length > 0 ? 1 : 0);

