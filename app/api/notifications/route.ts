import { NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyAuthToken, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

// GET /api/notifications - Get all notifications for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuthToken(request);
    const db = getAdminDb();

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = db.collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc');

    if (unreadOnly) {
      query = query.where('read', '==', false);
    }

    const notificationsSnapshot = await query.limit(limit).get();

    const notifications = notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
    }));

    return createSuccessResponse({ notifications });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    if (error.message.includes('Unauthorized')) {
      return createErrorResponse(error.message, 401);
    }
    return createErrorResponse('Failed to fetch notifications', 500);
  }
}

// PATCH /api/notifications/[id] - Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const userId = await verifyAuthToken(request);
    const db = getAdminDb();
    const body = await request.json();

    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all notifications as read
      const notificationsSnapshot = await db.collection('notifications')
        .where('userId', '==', userId)
        .where('read', '==', false)
        .get();

      const batch = db.batch();
      notificationsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();

      return createSuccessResponse({
        message: 'All notifications marked as read',
        count: notificationsSnapshot.size
      });
    }

    if (!notificationId) {
      return createErrorResponse('Notification ID is required', 400);
    }

    // Mark single notification as read
    const notificationDoc = await db.collection('notifications').doc(notificationId).get();

    if (!notificationDoc.exists) {
      return createErrorResponse('Notification not found', 404);
    }

    const notificationData = notificationDoc.data();

    if (notificationData?.userId !== userId) {
      return createErrorResponse('Unauthorized', 403);
    }

    await db.collection('notifications').doc(notificationId).update({
      read: true,
    });

    return createSuccessResponse({ message: 'Notification marked as read' });
  } catch (error: any) {
    console.error('Error updating notification:', error);
    if (error.message.includes('Unauthorized')) {
      return createErrorResponse(error.message, 401);
    }
    return createErrorResponse('Failed to update notification', 500);
  }
}
