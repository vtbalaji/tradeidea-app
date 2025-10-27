import { NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyAuthToken, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

// GET /api/ideas/[id]/comments - Get all comments for an idea
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAuthToken(request);
    const db = getAdminDb();
    const { id } = await params;

    // Verify idea exists
    const ideaDoc = await db.collection('tradingIdeas').doc(id).get();
    if (!ideaDoc.exists) {
      return createErrorResponse('Idea not found', 404);
    }

    // Fetch comments
    const commentsSnapshot = await db.collection('comments')
      .where('ideaId', '==', id)
      .orderBy('createdAt', 'desc')
      .get();

    const comments = commentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
    }));

    return createSuccessResponse({ comments });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    if (error.message.includes('Unauthorized')) {
      return createErrorResponse(error.message, 401);
    }
    return createErrorResponse('Failed to fetch comments', 500);
  }
}

// POST /api/ideas/[id]/comments - Add a comment to an idea
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAuthToken(request);
    const db = getAdminDb();
    const { id } = await params;
    const body = await request.json();

    const { text } = body;

    if (!text || text.trim().length === 0) {
      return createErrorResponse('Comment text is required', 400);
    }

    // Verify idea exists
    const ideaDoc = await db.collection('tradingIdeas').doc(id).get();
    if (!ideaDoc.exists) {
      return createErrorResponse('Idea not found', 404);
    }

    // Get user info
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    const commentData = {
      ideaId: id,
      userId,
      userName: userData?.displayName || 'Anonymous',
      userEmail: userData?.email || '',
      text: text.trim(),
      createdAt: FieldValue.serverTimestamp(),
    };

    // Add comment
    const commentRef = await db.collection('comments').add(commentData);

    // Increment comment count on the idea
    await db.collection('tradingIdeas').doc(id).update({
      commentCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Create notification for idea owner (if not commenting on own idea)
    const ideaData = ideaDoc.data();
    if (ideaData?.userId && ideaData.userId !== userId) {
      await db.collection('notifications').add({
        userId: ideaData.userId,
        type: 'comment',
        ideaId: id,
        ideaTitle: ideaData.title || '',
        fromUserId: userId,
        fromUserName: userData?.displayName || 'Anonymous',
        commentText: text.trim().substring(0, 100), // First 100 chars
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return createSuccessResponse({
      id: commentRef.id,
      ...commentData,
      createdAt: new Date().toISOString(),
    }, 201);
  } catch (error: any) {
    console.error('Error creating comment:', error);
    if (error.message.includes('Unauthorized')) {
      return createErrorResponse(error.message, 401);
    }
    return createErrorResponse('Failed to create comment', 500);
  }
}
