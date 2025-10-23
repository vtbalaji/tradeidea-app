import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { getUserSubscription } from '@/lib/subscriptionAuth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const userId = await verifyAuthToken(request);

    // Get subscription data
    const subscription = await getUserSubscription(userId);

    return NextResponse.json({
      subscription,
    });
  } catch (error: any) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}
