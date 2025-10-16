import { NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyAuthToken, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

// PATCH /api/portfolio/[positionId] - Update a portfolio position
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ positionId: string }> }
) {
  try {
    const userId = await verifyAuthToken(request);
    const db = getAdminDb();
    const { positionId } = await params;
    const body = await request.json();

    // Verify the position belongs to the user
    const positionDoc = await db.collection('portfolios').doc(positionId).get();

    if (!positionDoc.exists) {
      return createErrorResponse('Position not found', 404);
    }

    const positionData = positionDoc.data();
    if (positionData?.userId !== userId) {
      return createErrorResponse('Unauthorized: Position does not belong to user', 403);
    }

    const updates: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Allow updating specific fields
    if (body.stopLoss !== undefined) {
      updates.stopLoss = body.stopLoss ? Number(body.stopLoss) : null;
    }
    if (body.target !== undefined) {
      updates.target = body.target ? Number(body.target) : null;
    }
    if (body.notes !== undefined) {
      updates.notes = body.notes;
    }
    if (body.currentPrice !== undefined) {
      updates.currentPrice = Number(body.currentPrice);

      // Recalculate P&L
      const quantity = positionData.quantity || 0;
      const averagePrice = positionData.averagePrice || 0;
      const direction = positionData.direction;

      if (direction === 'long') {
        updates.profitLoss = (Number(body.currentPrice) - averagePrice) * quantity;
      } else {
        updates.profitLoss = (averagePrice - Number(body.currentPrice)) * quantity;
      }
      updates.profitLossPercentage = averagePrice > 0
        ? (updates.profitLoss / (averagePrice * quantity)) * 100
        : 0;
    }

    await db.collection('portfolios').doc(positionId).update(updates);

    return createSuccessResponse({
      id: positionId,
      ...positionData,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error updating position:', error);
    if (error.message.includes('Unauthorized')) {
      return createErrorResponse(error.message, 401);
    }
    return createErrorResponse('Failed to update position', 500);
  }
}

// DELETE /api/portfolio/[positionId] - Delete a portfolio position
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ positionId: string }> }
) {
  try {
    const userId = await verifyAuthToken(request);
    const db = getAdminDb();
    const { positionId } = await params;

    // Verify the position belongs to the user
    const positionDoc = await db.collection('portfolios').doc(positionId).get();

    if (!positionDoc.exists) {
      return createErrorResponse('Position not found', 404);
    }

    const positionData = positionDoc.data();
    if (positionData?.userId !== userId) {
      return createErrorResponse('Unauthorized: Position does not belong to user', 403);
    }

    await db.collection('portfolios').doc(positionId).delete();

    return createSuccessResponse({ message: 'Position deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting position:', error);
    if (error.message.includes('Unauthorized')) {
      return createErrorResponse(error.message, 401);
    }
    return createErrorResponse('Failed to delete position', 500);
  }
}
