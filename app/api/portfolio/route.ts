import { NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyAuthToken, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { verifyCanCreatePosition } from '@/lib/subscriptionAuth';
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

    // Validate required fields before any DB calls
    if (!symbol || !direction || !quantity || !entryPrice || !entryDate) {
      return createErrorResponse('Missing required fields', 400);
    }

    // OPTIMIZATION: Parallelize independent DB reads
    const parallelOperations = [
      // 1. Fetch user data (for subscription check)
      db.collection('users').doc(userId).get(),
      // 2. Count open positions
      db.collection('portfolios')
        .where('userId', '==', userId)
        .where('status', '==', 'open')
        .get(),
      // 3. Verify account ownership if accountId provided
      accountId ? db.collection('accounts').doc(accountId).get() : Promise.resolve(null),
    ];

    const [userDoc, openPositionsSnapshot, accountDoc] = await Promise.all(parallelOperations);

    // Verify user exists
    if (!userDoc.exists) {
      return createErrorResponse('User not found', 404);
    }

    // Verify account belongs to user if accountId was provided
    if (accountId && accountDoc) {
      if (!accountDoc.exists || accountDoc.data()?.userId !== userId) {
        return createErrorResponse('Invalid account', 400);
      }
    }

    // Check subscription and position limits inline (avoid duplicate DB read)
    const userData = userDoc.data();
    const subscription = {
      subscriptionStatus: userData?.subscriptionStatus || 'free',
      subscriptionTier: userData?.subscriptionTier || 'free',
      subscriptionEndDate: userData?.subscriptionEndDate || null,
    };

    const { canCreatePosition } = await import('@/lib/featureGate');
    const currentOpenPositions = openPositionsSnapshot.size;
    const canCreate = canCreatePosition(subscription, currentOpenPositions);

    if (!canCreate.allowed) {
      return createErrorResponse(
        canCreate.reason || 'Cannot create position. Upgrade to Premium for unlimited positions.',
        403
      );
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
      // Default exit criteria: Stop Loss, Target, 200MA, and Weekly Supertrend enabled
      exitCriteria: {
        exitAtStopLoss: true,
        exitAtTarget: false,
        exitBelow50EMA: false,
        exitBelow100MA: false,
        exitBelow200MA: false,
        exitOnWeeklySupertrend: false,
        customNote: ''
      },
      // Smart SL - will be set to 'yes' by manage-portfolio-stoploss.py script
      smartSLTrigger: 'no',
      smartSLPhase: null,
      smartSLSource: null,
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
