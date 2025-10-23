import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { updateUserSubscription } from '@/lib/subscriptionAuth';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    // Get raw body and signature
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(body, signature);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Parse webhook payload
    const payload = JSON.parse(body);
    const event = payload.event;

    console.log('Razorpay webhook event:', event);

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;

      case 'subscription.charged':
        await handleSubscriptionCharged(payload);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload);
        break;

      case 'subscription.paused':
        await handleSubscriptionPaused(payload);
        break;

      default:
        console.log('Unhandled webhook event:', event);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payload: any) {
  const payment = payload.payload.payment.entity;
  const userId = payment.notes?.userId;

  if (!userId) {
    console.error('No userId in payment notes');
    return;
  }

  console.log(`Payment captured for user ${userId}`);

  // Additional handling if needed
  // The payment verification route already handles the initial subscription setup
}

async function handlePaymentFailed(payload: any) {
  const payment = payload.payload.payment.entity;
  const userId = payment.notes?.userId;

  if (!userId) {
    console.error('No userId in payment notes');
    return;
  }

  console.log(`Payment failed for user ${userId}`);

  // Log the failed payment
  const db = getAdminDb();
  await db.collection('subscriptions').add({
    userId,
    orderId: payment.order_id,
    paymentId: payment.id,
    amount: payment.amount / 100,
    currency: payment.currency,
    status: 'failed',
    planId: payment.notes?.planId || null,
    metadata: {
      errorCode: payment.error_code,
      errorDescription: payment.error_description,
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

async function handleSubscriptionCharged(payload: any) {
  const subscription = payload.payload.subscription.entity;
  const payment = payload.payload.payment.entity;
  const userId = subscription.notes?.userId;

  if (!userId) {
    console.error('No userId in subscription notes');
    return;
  }

  console.log(`Subscription charged for user ${userId}`);

  // Extend subscription period
  const now = Timestamp.now();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 365); // Yearly subscription

  await updateUserSubscription(userId, {
    subscriptionStatus: 'premium',
    lastPaymentDate: now,
    lastPaymentAmount: payment.amount / 100,
    subscriptionEndDate: Timestamp.fromDate(endDate),
  });
}

async function handleSubscriptionCancelled(payload: any) {
  const subscription = payload.payload.subscription.entity;
  const userId = subscription.notes?.userId;

  if (!userId) {
    console.error('No userId in subscription notes');
    return;
  }

  console.log(`Subscription cancelled for user ${userId}`);

  await updateUserSubscription(userId, {
    autoRenew: false,
    cancelledAt: Timestamp.now(),
  });
}

async function handleSubscriptionPaused(payload: any) {
  const subscription = payload.payload.subscription.entity;
  const userId = subscription.notes?.userId;

  if (!userId) {
    console.error('No userId in subscription notes');
    return;
  }

  console.log(`Subscription paused for user ${userId}`);

  // Optionally handle paused subscriptions
  // For now, we don't need special handling
}
