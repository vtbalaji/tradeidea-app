import { NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyAuthToken, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

// POST /api/portfolio/[positionId]/close - Close a position
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ positionId: string }> }
) {
  try {
    const userId = await verifyAuthToken(request);
    const db = getAdminDb();
    const { positionId } = await params;
    const body = await request.json();

    const { exitPrice, exitDate, exitReason } = body;

    // Validate required fields
    if (!exitPrice || !exitDate) {
      return createErrorResponse('Missing required fields: exitPrice, exitDate', 400);
    }

    // Verify the position belongs to the user
    const positionDoc = await db.collection('portfolios').doc(positionId).get();

    if (!positionDoc.exists) {
      return createErrorResponse('Position not found', 404);
    }

    const positionData = positionDoc.data();
    if (positionData?.userId !== userId) {
      return createErrorResponse('Unauthorized: Position does not belong to user', 403);
    }

    if (positionData.status === 'closed') {
      return createErrorResponse('Position is already closed', 400);
    }

    const quantity = positionData.quantity || 0;
    const averagePrice = positionData.averagePrice || 0;
    const direction = positionData.direction;

    // Calculate final P&L
    let profitLoss = 0;
    if (direction === 'long') {
      profitLoss = (Number(exitPrice) - averagePrice) * quantity;
    } else {
      profitLoss = (averagePrice - Number(exitPrice)) * quantity;
    }

    const profitLossPercentage = averagePrice > 0
      ? (profitLoss / (averagePrice * quantity)) * 100
      : 0;

    // Add exit transaction
    const exitTransaction = {
      type: 'sell',
      quantity,
      price: Number(exitPrice),
      date: exitDate,
      timestamp: new Date().toISOString(),
    };

    const updates = {
      status: 'closed',
      exitPrice: Number(exitPrice),
      exitDate,
      exitReason: exitReason || '',
      currentPrice: Number(exitPrice),
      profitLoss,
      profitLossPercentage,
      quantity: 0,
      transactions: FieldValue.arrayUnion(exitTransaction),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await db.collection('portfolios').doc(positionId).update(updates);

    return createSuccessResponse({
      id: positionId,
      ...positionData,
      ...updates,
      transactions: [...(positionData.transactions || []), exitTransaction],
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error closing position:', error);
    if (error.message.includes('Unauthorized')) {
      return createErrorResponse(error.message, 401);
    }
    return createErrorResponse('Failed to close position', 500);
  }
}
