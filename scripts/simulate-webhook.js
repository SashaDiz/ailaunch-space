#!/usr/bin/env node

/**
 * Simulate Stripe Webhook
 * Usage: pnpm webhook:simulate
 *
 * Sends a test webhook event to your local development server
 * to verify the Stripe webhook handler is working correctly.
 *
 * Make sure your dev server is running: pnpm dev
 */

const crypto = require('crypto');

const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/stripe`
  : 'http://localhost:3000/api/webhooks/stripe';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function createSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

async function simulateWebhook() {
  if (!WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not set in environment.');
    console.log('Set it in .env.local to test webhook signature verification.');
    console.log('\nSending without signature (will fail signature check)...\n');
  }

  const testEvent = {
    id: 'evt_test_' + Date.now(),
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_' + Date.now(),
        payment_status: 'paid',
        amount_total: 4900,
        currency: 'usd',
        payment_intent: 'pi_test_' + Date.now(),
        customer_details: {
          email: 'test@example.com',
        },
        metadata: {
          userId: 'test-user-id',
          projectId: 'test-project-id',
          planType: 'premium',
        },
        livemode: false,
      },
    },
  };

  const payload = JSON.stringify(testEvent);
  const headers = {
    'Content-Type': 'application/json',
  };

  if (WEBHOOK_SECRET) {
    headers['stripe-signature'] = createSignature(payload, WEBHOOK_SECRET);
  }

  console.log(`Sending test webhook to: ${WEBHOOK_URL}`);
  console.log(`Event type: ${testEvent.type}`);
  console.log(`Event ID: ${testEvent.id}\n`);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: payload,
    });

    const data = await response.json().catch(() => response.text());
    console.log(`Response status: ${response.status}`);
    console.log('Response body:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\nWebhook processed successfully!');
    } else {
      console.log('\nWebhook returned an error (this may be expected for test data).');
    }
  } catch (err) {
    console.error('Failed to send webhook:', err.message);
    console.log('\nMake sure your dev server is running: pnpm dev');
  }
}

simulateWebhook();
