import { NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyAuthToken, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

// GET /api/portfolio - List all portfolio positions for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuthToken(request);
    const db = getAdminDb();

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    let query = db.collection('portfolios').where('userId', '==', userId);

    if (accountId) {
      query = query.where('accountId', '==', accountId);
    }

    const portfolioSnapshot = await query.get();

    const positions = portfolioSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return createSuccessResponse({ positions });
  } catch (error: any) {
    console.error('Error fetching portfolio:', error);
    if (error.message.includes('Unauthorized')) {
      return createErrorResponse(error.message, 401);
    }
    return createErrorResponse('Failed to fetch portfolio', 500);
  }
}

// POST /api/portfolio - Add a new position to portfolio
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuthToken(request);
    const db = getAdminDb();
    const body = await request.json();

    const {
      ideaId,
      accountId,
      symbol,
      direction,
      quantity,
      entryPrice,
      entryDate,
      stopLoss,
      target,
      notes,
    } = body;

    // Validate required fields
    if (!symbol || !direction || !quantity || !entryPrice || !entryDate) {
      return createErrorResponse('Missing required fields', 400);
    }

    // Verify account belongs to user if accountId is provided
    if (accountId) {
      const accountDoc = await db.collection('accounts').doc(accountId).get();
      if (!accountDoc.exists || accountDoc.data()?.userId !== userId) {
        return createErrorResponse('Invalid account', 400);
      }
    }

    const positionData = {
      userId,
      ideaId: ideaId || null,
      accountId: accountId || null,
      symbol,
      direction,
      quantity: Number(quantity),
      entryPrice: Number(entryPrice),
      entryDate,
      averagePrice: Number(entryPrice),
      currentPrice: Number(entryPrice),
      stopLoss: stopLoss ? Number(stopLoss) : null,
      target: target ? Number(target) : null,
      notes: notes || '',
      status: 'open',
      profitLoss: 0,
      profitLossPercentage: 0,
      transactions: [
        {
          type: 'buy',
          quantity: Number(quantity),
          price: Number(entryPrice),
          date: entryDate,
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('portfolios').add(positionData);

    return createSuccessResponse({
      id: docRef.id,
      ...positionData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, 201);
  } catch (error: any) {
    console.error('Error adding to portfolio:', error);
    if (error.message.includes('Unauthorized')) {
      return createErrorResponse(error.message, 401);
    }
    return createErrorResponse('Failed to add to portfolio', 500);
  }
}
