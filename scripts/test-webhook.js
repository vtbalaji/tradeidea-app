#!/usr/bin/env node

/**
 * Test Webhook Endpoint
 *
 * Usage: node scripts/test-webhook.js
 */

const crypto = require('crypto');

async function testWebhook() {
  const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/subscription/webhook';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('❌ Error: RAZORPAY_WEBHOOK_SECRET not set');
    console.log('Set it with: export RAZORPAY_WEBHOOK_SECRET=whsec_xxxxx');
    process.exit(1);
  }

  // Sample webhook payload
  const payload = JSON.stringify({
    entity: 'event',
    account_id: 'acc_test',
    event: 'payment.captured',
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: 'pay_test_123',
          entity: 'payment',
          amount: 299900,
          currency: 'INR',
          status: 'captured',
          order_id: 'order_test_123',
          method: 'card',
          captured: true,
          notes: {
            userId: 'test_user_123',
            planId: 'premium_yearly',
          },
        },
      },
    },
    created_at: Math.floor(Date.now() / 1000),
  });

  // Generate signature
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');

  console.log('🧪 Testing webhook...');
  console.log('📍 URL:', webhookUrl);
  console.log('🔑 Secret:', webhookSecret.substring(0, 10) + '...');
  console.log('');

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature,
      },
      body: payload,
    });

    const responseText = await response.text();

    if (response.ok) {
      console.log('✅ Webhook test successful!');
      console.log('Status:', response.status);
      console.log('Response:', responseText);
    } else {
      console.log('❌ Webhook test failed!');
      console.log('Status:', response.status);
      console.log('Response:', responseText);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('Make sure your dev server is running:');
    console.log('  npm run dev');
  }
}

testWebhook();
