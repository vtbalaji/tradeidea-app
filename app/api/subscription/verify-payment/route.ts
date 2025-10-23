import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { updateUserSubscription } from '@/lib/subscriptionAuth';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const userId = await verifyAuthToken(request);

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
    } = await request.json();

    // Validate inputs
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
      return NextResponse.json(
        { error: 'Missing required payment details' },
        { status: 400 }
      );
    }

    // Verify payment signature
    const isValid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Get plan details
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Calculate subscription dates
    const now = Timestamp.now();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration);

    // Update user subscription
    await updateUserSubscription(userId, {
      subscriptionStatus: 'premium',
      subscriptionTier: 'premium',
      subscriptionStartDate: now,
      subscriptionEndDate: Timestamp.fromDate(endDate),
      paymentProvider: 'razorpay',
      lastPaymentDate: now,
      lastPaymentAmount: plan.price,
      premiumType: 'paid',
      autoRenew: false,
      manuallyGranted: false,
    });

    // Create subscription transaction record
    const db = getAdminDb();
    await db.collection('subscriptions').add({
      userId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      subscriptionId: null,
      amount: plan.price,
      currency: plan.currency,
      status: 'paid',
      planId: plan.id,
      validFrom: now,
      validUntil: Timestamp.fromDate(endDate),
      razorpaySignature: razorpay_signature,
      metadata: {
        planName: plan.name,
        duration: plan.duration,
      },
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and subscription activated',
      subscription: {
        status: 'premium',
        validUntil: endDate.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
