import dotenv from 'dotenv';
import crypto from 'crypto';
import readline from 'readline';

// Load environment variables
dotenv.config({ path: '.env.local' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

console.log('🧪 LemonSqueezy Webhook Simulator\n');
console.log('This tool simulates webhook events to test your webhook handler\n');

// Check environment
const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
if (!webhookSecret) {
  console.error('❌ LEMONSQUEEZY_WEBHOOK_SECRET not set in .env.local');
  process.exit(1);
}

// Get webhook URL
const webhookUrl = await question('Enter webhook URL (default: http://localhost:3000/api/webhooks/lemonsqueezy): ');
const url = webhookUrl.trim() || 'http://localhost:3000/api/webhooks/lemonsqueezy';

// Get event type
console.log('\nSelect event type:');
console.log('1. order_created (payment successful)');
console.log('2. order_refunded (payment refunded)');
const eventChoice = await question('Enter choice (1-2): ');

let eventName = 'order_created';
if (eventChoice === '2') {
  eventName = 'order_refunded';
}

// Get user details
const userId = await question('\nEnter user_id: ');
const directoryName = await question('Enter directory name: ');
const directorySlug = await question('Enter directory slug: ');
const userEmail = await question('Enter customer email: ');

// Create test webhook payload
const webhookPayload = {
  meta: {
    event_name: eventName,
    custom_data: {
      user_id: userId,
      directory_name: directoryName,
      directory_slug: directorySlug,
      plan_type: 'premium'
    }
  },
  data: {
    type: 'orders',
    id: `test-${Date.now()}`,
    attributes: {
      store_id: parseInt(process.env.LEMONSQUEEZY_STORE_ID || '1'),
      identifier: `test-order-${Date.now()}`,
      order_number: Math.floor(Math.random() * 100000),
      user_name: directoryName,
      user_email: userEmail,
      currency: 'USD',
      currency_rate: '1.00000000',
      subtotal: 1500,
      discount_total: 0,
      tax: 0,
      total: 1500,
      subtotal_usd: 1500,
      discount_total_usd: 0,
      tax_usd: 0,
      total_usd: 1500,
      tax_name: '',
      tax_rate: '0.00',
      status: 'paid',
      status_formatted: 'Paid',
      refunded: eventName === 'order_refunded',
      refunded_at: eventName === 'order_refunded' ? new Date().toISOString() : null,
      subtotal_formatted: '$15.00',
      discount_total_formatted: '$0.00',
      tax_formatted: '$0.00',
      total_formatted: '$15.00',
      checkout_data: {
        custom: {
          user_id: userId,
          directory_name: directoryName,
          directory_slug: directorySlug,
          plan_type: 'premium'
        }
      },
      first_order_item: {
        id: 1,
        order_id: 1,
        product_id: 1,
        variant_id: parseInt(process.env.LEMONSQUEEZY_VARIANT_ID || '1'),
        product_name: 'Premium Directory Listing',
        variant_name: 'Premium Plan',
        price: 1500,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        test_mode: true
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      test_mode: true
    }
  }
};

const rawBody = JSON.stringify(webhookPayload);

// Generate signature
const hmac = crypto.createHmac('sha256', webhookSecret);
const signature = hmac.update(rawBody).digest('hex');

console.log('\n📦 Webhook Payload:');
console.log(JSON.stringify(webhookPayload, null, 2));
console.log('\n🔐 Signature:', signature);
console.log('\n📤 Sending webhook to:', url);

// Send webhook
try {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': signature,
      'X-Event-Name': eventName
    },
    body: rawBody
  });

  console.log('\n📨 Response Status:', response.status, response.statusText);
  
  const responseText = await response.text();
  let responseData;
  
  try {
    responseData = JSON.parse(responseText);
    console.log('📋 Response Body:', JSON.stringify(responseData, null, 2));
  } catch {
    console.log('📋 Response Body:', responseText);
  }

  if (response.ok) {
    console.log('\n✅ Webhook sent successfully!');
    console.log('\nNext steps:');
    console.log('1. Check your application logs for processing details');
    console.log('2. Verify the directory was updated in the database');
    console.log('3. Check the payments collection for the payment record');
  } else {
    console.log('\n❌ Webhook failed!');
    console.log('Check your application logs for error details');
  }

} catch (error) {
  console.error('\n❌ Error sending webhook:', error.message);
  console.log('\nMake sure:');
  console.log('1. Your dev server is running (pnpm dev)');
  console.log('2. The webhook URL is correct');
  console.log('3. No firewall is blocking the request');
}

rl.close();

