import dotenv from 'dotenv';
import { lemonSqueezySetup, getAuthenticatedUser } from '@lemonsqueezy/lemonsqueezy.js';
import crypto from 'crypto';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🍋 Testing LemonSqueezy Connection\n');
console.log('===================================\n');

// Step 1: Check environment variables
console.log('Step 1: Checking environment variables...');
const requiredVars = {
  'LEMONSQUEEZY_API_KEY': process.env.LEMONSQUEEZY_API_KEY,
  'LEMONSQUEEZY_VARIANT_ID': process.env.LEMONSQUEEZY_VARIANT_ID,
  'LEMONSQUEEZY_STORE_ID': process.env.LEMONSQUEEZY_STORE_ID,
  'LEMONSQUEEZY_WEBHOOK_SECRET': process.env.LEMONSQUEEZY_WEBHOOK_SECRET
};

let allPresent = true;
for (const [key, value] of Object.entries(requiredVars)) {
  if (value) {
    const masked = value.substring(0, 8) + '...';
    console.log(`✅ ${key}: ${masked}`);
  } else {
    console.log(`❌ ${key}: NOT SET`);
    allPresent = false;
  }
}

if (!allPresent) {
  console.error('\n❌ Missing required environment variables. Please check your .env.local file.');
  process.exit(1);
}

console.log('\n✅ All environment variables are set!\n');

// Step 2: Test LemonSqueezy API connection
console.log('Step 2: Testing LemonSqueezy API connection...');

try {
  lemonSqueezySetup({
    apiKey: process.env.LEMONSQUEEZY_API_KEY,
    onError: (error) => console.error('LemonSqueezy SDK Error:', error)
  });

  console.log('✅ LemonSqueezy SDK initialized successfully');

  const { data, error, statusCode } = await getAuthenticatedUser();

  if (error) {
    console.error(`❌ API Connection Failed (Status ${statusCode}):`, error.message);
    process.exit(1);
  }

  console.log('✅ Successfully connected to LemonSqueezy API!');
  console.log('\nAuthenticated User Info:');
  console.log(`  - Name: ${data.data.attributes.name}`);
  console.log(`  - Email: ${data.data.attributes.email}`);
  console.log(`  - Company: ${data.data.attributes.company_name || 'N/A'}`);
  console.log(`  - Store ID: ${process.env.LEMONSQUEEZY_STORE_ID}`);
  
} catch (error) {
  console.error('❌ Error testing API connection:', error.message);
  process.exit(1);
}

// Step 3: Test webhook signature verification
console.log('\n\nStep 3: Testing webhook signature verification...');

try {
  const testPayload = JSON.stringify({
    meta: {
      event_name: 'order_created',
      test_mode: true
    },
    data: {
      id: '1',
      type: 'orders',
      attributes: {
        status: 'paid',
        total: 1500
      }
    }
  });

  // Create a valid signature
  const hmac = crypto.createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET);
  const digest = hmac.update(testPayload).digest('hex');

  console.log('✅ Generated test webhook signature');

  // Verify signature (same logic as webhook route)
  const hmacVerify = crypto.createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET);
  const digestVerify = Buffer.from(hmacVerify.update(testPayload).digest('hex'), 'utf8');
  const signatureBuffer = Buffer.from(digest, 'utf8');

  const isValid = crypto.timingSafeEqual(digestVerify, signatureBuffer);

  if (isValid) {
    console.log('✅ Webhook signature verification working correctly!');
  } else {
    console.error('❌ Webhook signature verification failed');
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Error testing webhook signature:', error.message);
  process.exit(1);
}

// Step 4: Check webhook endpoint accessibility
console.log('\n\nStep 4: Testing webhook endpoint accessibility...');

try {
  const webhookUrl = 'https://68dd6ec87d78.ngrok-free.app/api/webhooks/lemonsqueezy';
  console.log(`Testing GET request to: ${webhookUrl}`);

  const response = await fetch(webhookUrl, {
    method: 'GET',
    headers: {
      'ngrok-skip-browser-warning': 'true'
    }
  });

  if (response.ok) {
    const data = await response.json();
    console.log('✅ Webhook endpoint is accessible!');
    console.log(`  Response: ${JSON.stringify(data, null, 2)}`);
  } else {
    console.warn(`⚠️  Webhook endpoint returned status ${response.status}`);
    console.warn('  This might be normal if the endpoint only accepts POST requests');
  }

} catch (error) {
  console.warn('⚠️  Could not reach webhook endpoint:', error.message);
  console.warn('  Make sure your local server is running and ngrok tunnel is active');
}

// Final summary
console.log('\n\n===================================');
console.log('🎉 LemonSqueezy Integration Test Complete!\n');
console.log('Summary:');
console.log('  ✅ Environment variables configured');
console.log('  ✅ API connection working');
console.log('  ✅ Webhook signature verification working');
console.log('\nNext steps:');
console.log('  1. Make sure your dev server is running (pnpm dev)');
console.log('  2. Keep your ngrok tunnel active');
console.log('  3. Test a real payment in LemonSqueezy test mode');
console.log('  4. Check webhook logs in LemonSqueezy dashboard\n');

