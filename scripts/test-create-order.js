#!/usr/bin/env node

/**
 * Test Create Order API
 *
 * Usage: node scripts/test-create-order.js
 */

require('dotenv').config({ path: '.env.local' });

async function testCreateOrder() {
  console.log('🧪 Testing Create Order API...\n');

  // Check environment variables
  console.log('Environment Variables:');
  console.log('✓ NEXT_PUBLIC_RAZORPAY_KEY_ID:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? '✅ Set' : '❌ Missing');
  console.log('✓ RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '✅ Set' : '❌ Missing');
  console.log('');

  if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('❌ Error: Razorpay credentials not set in .env.local');
    console.log('\nAdd these to .env.local:');
    console.log('NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx');
    console.log('RAZORPAY_KEY_SECRET=xxxxx');
    process.exit(1);
  }

  // Test Razorpay initialization
  try {
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    console.log('✅ Razorpay SDK initialized successfully\n');

    // Try creating a test order
    console.log('Creating test order...');
    const order = await razorpay.orders.create({
      amount: 36500, // ₹365 in paise (Introductory Offer)
      currency: 'INR',
      receipt: `test_${Date.now()}`,
      notes: {
        test: 'true',
      },
    });

    console.log('✅ Order created successfully!');
    console.log('\nOrder Details:');
    console.log('Order ID:', order.id);
    console.log('Amount:', order.amount / 100, 'INR');
    console.log('Status:', order.status);
    console.log('');
    console.log('🎉 Everything is working! Your API should work now.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.statusCode === 401) {
      console.log('\n⚠️ Authentication failed. Check your Razorpay keys:');
      console.log('1. Make sure you copied the correct Key ID and Secret');
      console.log('2. Make sure you\'re using Test Mode keys (rzp_test_xxx)');
      console.log('3. Check for extra spaces in .env.local');
    }
  }
}

testCreateOrder();
