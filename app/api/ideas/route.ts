import { NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyAuthToken, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { verifyPremiumAccess } from '@/lib/subscriptionAuth';
import { FieldValue } from 'firebase-admin/firestore';

// GET /api/ideas - List all trading ideas
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuthToken(request);
    const db = getAdminDb();

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'following', 'trending', 'recent', 'all'
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status'); // Optional: filter by specific status

    // Build query - fetch all non-cancelled ideas unless specific status requested
    let query = db.collection('tradingIdeas').orderBy('createdAt', 'desc');

    // Only filter by status if specifically requested (not 'all' or undefined)
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    // Apply filters
    if (filter === 'following') {
      query = query.where('followers', 'array-contains', userId);
    }

    // Fetch ideas
    const snapshot = await query.limit(limit).get();

    let ideas = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
      }))
      // Filter out cancelled ideas unless specifically requested
      .filter((idea: any) => status === 'cancelled' || idea.status !== 'cancelled');

    // Sort for trending and recent on server-side
    if (filter === 'trending') {
      ideas = ideas.sort((a: any, b: any) => (b.likes || 0) - (a.likes || 0));
    } else if (filter === 'recent') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      ideas = ideas.filter((idea: any) => {
        const ideaDate = idea.createdAt ? new Date(idea.createdAt) : null;
        return ideaDate && ideaDate >= sevenDaysAgo;
      });
    }

    // Fetch symbol data for enrichment
    const symbols = [...new Set(ideas.map((idea: any) => idea.symbol))];
    const symbolsMap = new Map();

    // Firestore 'in' query has limit of 10, so batch fetch
    if (symbols.length > 0) {
      const batches = [];
      for (let i = 0; i < symbols.length; i += 10) {
        const batch = symbols.slice(i, i + 10);
        batches.push(batch);
      }

      for (const batch of batches) {
        try {
          const batchPromises = batch.map(symbol => {
            // Try with NS_ prefix first, then fallback to symbol without prefix
            const symbolWithPrefix = symbol.startsWith('NS_') ? symbol : `NS_${symbol}`;
            return db.collection('symbols').doc(symbolWithPrefix).get();
          });
          const batchDocs = await Promise.all(batchPromises);

          batchDocs.forEach((doc, index) => {
            if (doc.exists) {
              const originalSymbol = batch[index];
              symbolsMap.set(originalSymbol, {
                technical: doc.data()?.technical,
                fundamental: doc.data()?.fundamental,
              });
            }
          });
        } catch (error) {
          console.error('Error fetching symbols batch:', error);
        }
      }
    }

    // Enrich ideas with symbol data
    const enrichedIdeas = ideas.map((idea: any) => {
      const symbolData = symbolsMap.get(idea.symbol);
      return {
        ...idea,
        technicals: symbolData?.technical || null,
        fundamentals: symbolData?.fundamental || null,
      };
    });

    return createSuccessResponse({ ideas: enrichedIdeas });
  } catch (error: any) {
    console.error('Error fetching ideas:', error);
    console.error('Error stack:', error.stack);
    if (error.message.includes('Unauthorized')) {
      return createErrorResponse(error.message, 401);
    }
    return createErrorResponse(error.message || 'Failed to fetch ideas', 500);
  }
}

// POST /api/ideas - Create a new trading idea
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuthToken(request);
    const db = getAdminDb();

    // Parse body first for early validation (no DB calls needed)
    const body = await request.json();

    const {
      symbol,
      title,
      analysis,
      entryPrice,
      target1,
      target2,
      stopLoss,
      timeframe,
      riskLevel,
      analysisType,
      tradeType,
      tags,
    } = body;

    // Validate required fields before any DB calls
    if (!symbol || !title || !analysis || !entryPrice || !target1 || !stopLoss) {
      return createErrorResponse('Missing required fields', 400);
    }

    // OPTIMIZATION: Fetch user data once instead of twice
    // This single read replaces both verifyPremiumAccess() and separate user fetch
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return createErrorResponse('User not found', 404);
    }

    const userData = userDoc.data();

    // Check premium access inline (avoid duplicate DB read)
    const subscription = {
      subscriptionStatus: userData?.subscriptionStatus || 'free',
      subscriptionTier: userData?.subscriptionTier || 'free',
      subscriptionEndDate: userData?.subscriptionEndDate || null,
    };

    // Import isSubscriptionActive from featureGate for inline check
    const { isSubscriptionActive } = await import('@/lib/featureGate');
    const hasPremium = isSubscriptionActive(subscription);

    if (!hasPremium) {
      return createErrorResponse(
        'Creating trading ideas requires a premium subscription. Upgrade to Premium to share your ideas with the community.',
        403
      );
    }

    const ideaData = {
      userId,
      userName: userData?.displayName || 'Anonymous',
      userEmail: userData?.email || '',
      symbol: symbol.toUpperCase(),
      title,
      analysis,
      entryPrice: Number(entryPrice),
      target1: Number(target1),
      target2: target2 ? Number(target2) : null,
      stopLoss: Number(stopLoss),
      timeframe: timeframe || 'medium',
      riskLevel: riskLevel || 'medium',
      analysisType: analysisType || 'technical',
      tradeType: tradeType || 'Long',
      tags: tags || [],
      status: 'active',
      likes: 0,
      likedBy: [],
      followers: [],
      commentCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('tradingIdeas').add(ideaData);

    return createSuccessResponse({
      id: docRef.id,
      ...ideaData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, 201);
  } catch (error: any) {
    console.error('Error creating idea:', error);
    if (error.message.includes('Unauthorized')) {
      return createErrorResponse(error.message, 401);
    }
    return createErrorResponse('Failed to create idea', 500);
  }
}
