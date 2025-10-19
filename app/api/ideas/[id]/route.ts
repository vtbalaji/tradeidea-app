import { NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyAuthToken, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

// GET /api/ideas/[id] - Get a specific idea
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await verifyAuthToken(request);
    const db = getAdminDb();
    const { id } = params;

    const ideaDoc = await db.collection('tradingIdeas').doc(id).get();

    if (!ideaDoc.exists) {
      return createErrorResponse('Idea not found', 404);
    }

    const ideaData = ideaDoc.data();

    // Fetch symbol data
    const symbolDoc = await db.collection('symbols').doc(ideaData?.symbol).get();
    const symbolData = symbolDoc.exists ? symbolDoc.data() : null;

    return createSuccessResponse({
      id: ideaDoc.id,
      ...ideaData,
      technicals: symbolData?.technical || null,
      fundamentals: symbolData?.fundamental || null,
      createdAt: ideaData?.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: ideaData?.updatedAt?.toDate?.()?.toISOString() || null,
    });
  } catch (error: any) {
    console.error('Error fetching idea:', error);
    if (error.message.includes('Unauthorized')) {
      return createErrorResponse(error.message, 401);
    }
    return createErrorResponse('Failed to fetch idea', 500);
  }
}

// PATCH /api/ideas/[id] - Update an idea
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifyAuthToken(request);
    const db = getAdminDb();
    const { id } = params;
    const body = await request.json();

    // Get the idea to verify ownership
    const ideaDoc = await db.collection('tradingIdeas').doc(id).get();

    if (!ideaDoc.exists) {
      return createErrorResponse('Idea not found', 404);
    }

    const ideaData = ideaDoc.data();

    // Only the owner can update the idea details (not likes/follows)
    if (ideaData?.userId !== userId && !body.like && !body.follow) {
      return createErrorResponse('You can only update your own ideas', 403);
    }

    const updates: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Handle regular updates (only owner)
    if (ideaData?.userId === userId) {
      if (body.title !== undefined) updates.title = body.title;
      if (body.analysis !== undefined) updates.analysis = body.analysis;
      if (body.entryPrice !== undefined) updates.entryPrice = Number(body.entryPrice);
      if (body.target1 !== undefined) updates.target1 = Number(body.target1);
      if (body.target2 !== undefined) updates.target2 = body.target2 ? Number(body.target2) : null;
      if (body.stopLoss !== undefined) updates.stopLoss = Number(body.stopLoss);
      if (body.status !== undefined) updates.status = body.status;
      if (body.timeframe !== undefined) updates.timeframe = body.timeframe;
      if (body.riskLevel !== undefined) updates.riskLevel = body.riskLevel;
      if (body.analysisType !== undefined) updates.analysisType = body.analysisType;
    }

    // Handle like/unlike
    if (body.like !== undefined) {
      if (body.like) {
        // Add like
        updates.likes = FieldValue.increment(1);
        updates.likedBy = FieldValue.arrayUnion(userId);
      } else {
        // Remove like
        updates.likes = FieldValue.increment(-1);
        updates.likedBy = FieldValue.arrayRemove(userId);
      }
    }

    // Handle follow/unfollow
    if (body.follow !== undefined) {
      if (body.follow) {
        updates.followers = FieldValue.arrayUnion(userId);
      } else {
        updates.followers = FieldValue.arrayRemove(userId);
      }
    }

    await db.collection('tradingIdeas').doc(id).update(updates);

    // Fetch updated document
    const updatedDoc = await db.collection('tradingIdeas').doc(id).get();
    const updatedData = updatedDoc.data();

    return createSuccessResponse({
      id: updatedDoc.id,
      ...updatedData,
      createdAt: updatedData?.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: updatedData?.updatedAt?.toDate?.()?.toISOString() || null,
    });
  } catch (error: any) {
    console.error('Error updating idea:', error);
    if (error.message.includes('Unauthorized')) {
      return createErrorResponse(error.message, 401);
    }
    return createErrorResponse('Failed to update idea', 500);
  }
}

// DELETE /api/ideas/[id] - Delete an idea (set status to cancelled)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifyAuthToken(request);
    const db = getAdminDb();
    const { id } = params;

    // Get the idea to verify ownership
    const ideaDoc = await db.collection('tradingIdeas').doc(id).get();

    if (!ideaDoc.exists) {
      return createErrorResponse('Idea not found', 404);
    }

    const ideaData = ideaDoc.data();

    if (ideaData?.userId !== userId) {
      return createErrorResponse('You can only delete your own ideas', 403);
    }

    // Soft delete by setting status to 'cancelled'
    await db.collection('tradingIdeas').doc(id).update({
      status: 'cancelled',
      updatedAt: FieldValue.serverTimestamp(),
    });

    return createSuccessResponse({ message: 'Idea deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting idea:', error);
    if (error.message.includes('Unauthorized')) {
      return createErrorResponse(error.message, 401);
    }
    return createErrorResponse('Failed to delete idea', 500);
  }
}
