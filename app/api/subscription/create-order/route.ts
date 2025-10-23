import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { createRazorpayOrder } from '@/lib/razorpay';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const userId = await verifyAuthToken(request);

    const { planId } = await request.json();

    // Validate plan
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const amount = plan.price * 100; // Convert to paise
    // Receipt must be max 40 chars - use short userId + timestamp
    const shortUserId = userId.substring(0, 8);
    const receipt = `sub_${shortUserId}_${Date.now()}`;

    const order = await createRazorpayOrder({
      amount,
      currency: plan.currency,
      receipt,
      notes: {
        userId,
        planId: plan.id,
        planName: plan.name,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planId: plan.id,
      planName: plan.name,
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
