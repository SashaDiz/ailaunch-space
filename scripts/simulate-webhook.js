#!/usr/bin/env node

/**
 * Simulate a Dodo Payments Webhook
 * Usage: pnpm webhook:simulate
 *
 * Sends a signed `payment.succeeded` event to your local dev server to verify
 * the Dodo webhook handler (app/api/webhooks/dodo/route.ts) is working.
 *
 * Dodo uses the Standard Webhooks scheme (webhook-id / webhook-signature /
 * webhook-timestamp headers). This script signs the payload with
 * DODO_PAYMENTS_WEBHOOK_KEY the same way Dodo does.
 *
 * Make sure your dev server is running: pnpm dev
 *
 * Optional env:
 *   SIMULATE_PROJECT_ID  — real premium app id to flip to paid
 *   SIMULATE_USER_ID     — user id to attach to the payment record
 */

require('dotenv/config');
const { Webhook } = require('standardwebhooks');

const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/dodo`
  : 'http://localhost:3000/api/webhooks/dodo';

const WEBHOOK_KEY = process.env.DODO_PAYMENTS_WEBHOOK_KEY;

async function simulateWebhook() {
  if (!WEBHOOK_KEY) {
    console.error('DODO_PAYMENTS_WEBHOOK_KEY is not set in environment.');
    console.warn('Set it in .env.local to sign the test webhook. Without it the');
    console.warn('handler will reject the request with a 403 (invalid signature).');
    return;
  }

  const webhookId = `msg_test_${Date.now()}`;
  const timestamp = new Date();

  const testEvent = {
    business_id: 'bus_test',
    type: 'payment.succeeded',
    timestamp: timestamp.toISOString(),
    data: {
      payload_type: 'Payment',
      payment_id: `pay_test_${Date.now()}`,
      subscription_id: null,
      status: 'succeeded',
      currency: 'USD',
      total_amount: 499,
      customer: {
        customer_id: 'cus_test',
        email: 'test@example.com',
        name: 'Test User',
      },
      metadata: {
        type: 'premium_submission',
        userId: process.env.SIMULATE_USER_ID || 'test-user-id',
        projectId: process.env.SIMULATE_PROJECT_ID || 'test-project-id',
        planType: 'premium',
      },
      created_at: timestamp.toISOString(),
    },
  };

  const payload = JSON.stringify(testEvent);

  // Standard Webhooks: the secret is base64-encoded (Dodo secrets are provided
  // ready to pass to the Webhook constructor).
  const wh = new Webhook(WEBHOOK_KEY);
  const signature = wh.sign(webhookId, timestamp, payload);

  const headers = {
    'Content-Type': 'application/json',
    'webhook-id': webhookId,
    'webhook-timestamp': Math.floor(timestamp.getTime() / 1000).toString(),
    'webhook-signature': signature,
  };

  console.warn(`Sending test webhook to: ${WEBHOOK_URL}`);
  console.warn(`Event type: ${testEvent.type}`);
  console.warn(`Webhook ID: ${webhookId}\n`);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: payload,
    });

    const data = await response.json().catch(() => response.text());
    console.warn(`Response status: ${response.status}`);
    console.warn('Response body:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.warn('\nWebhook processed successfully!');
    } else {
      console.warn('\nWebhook returned an error (this may be expected for test data).');
    }
  } catch (err) {
    console.error('Failed to send webhook:', err.message);
    console.warn('\nMake sure your dev server is running: pnpm dev');
  }
}

simulateWebhook();
