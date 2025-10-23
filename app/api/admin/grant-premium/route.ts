import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { verifyAdminAccess, grantPremiumAccess } from '@/lib/subscriptionAuth';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const adminUserId = await verifyAuthToken(request);

    // Verify admin access
    await verifyAdminAccess(adminUserId);

    const { userEmail, durationDays, reason, premiumType } = await request.json();

    // Validate inputs
    if (!userEmail || durationDays === undefined || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: userEmail, durationDays, reason' },
        { status: 400 }
      );
    }

    // Find user by email
    const db = getAdminDb();
    const usersSnapshot = await db
      .collection('users')
      .where('email', '==', userEmail)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    // Get admin email
    const adminDoc = await db.collection('users').doc(adminUserId).get();
    const adminEmail = adminDoc.data()?.email || adminUserId;

    // Grant premium access
    await grantPremiumAccess({
      userId,
      durationDays,
      reason,
      grantedBy: adminEmail,
      premiumType: premiumType || 'complimentary',
    });

    // Log admin action
    await db.collection('admin_logs').add({
      adminUserId,
      adminEmail,
      action: 'grant_premium',
      targetUserId: userId,
      targetUserEmail: userEmail,
      details: {
        durationDays,
        reason,
        premiumType: premiumType || 'complimentary',
      },
      createdAt: Timestamp.now(),
    });

    // Calculate expiry date
    const endDate = new Date();
    if (durationDays === -1) {
      endDate.setFullYear(endDate.getFullYear() + 100);
    } else {
      endDate.setDate(endDate.getDate() + durationDays);
    }

    return NextResponse.json({
      success: true,
      message: `Premium access granted to ${userEmail}`,
      expiresAt: endDate.toISOString(),
    });
  } catch (error: any) {
    console.error('Error granting premium:', error);

    if (error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to grant premium access' },
      { status: 500 }
    );
  }
}
