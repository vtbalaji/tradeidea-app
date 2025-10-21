import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const adminDb = getAdminDb();
    const ideaDoc = await adminDb.collection('tradingIdeas').doc(id).get();

    if (!ideaDoc.exists) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    const idea = ideaDoc.data();
    const target1Percent = idea?.entryPrice
      ? (((idea.target1 - idea.entryPrice) / idea.entryPrice) * 100).toFixed(1)
      : 0;

    const title = `${idea?.symbol} - Investment Idea by ${idea?.userName || 'TradeIdea User'}`;
    const description = `🎯 ${idea?.symbol} Trading Setup: Entry ₹${idea?.entryPrice} | Target ₹${idea?.target1} (+${target1Percent}%) | Stop Loss ₹${idea?.stopLoss}. ${idea?.riskLevel} risk, ${idea?.timeframe} timeframe. Join TradeIdea to track this idea!`;

    return NextResponse.json({
      success: true,
      ideaId: id,
      ideaExists: true,
      metadata: {
        title,
        description,
        symbol: idea?.symbol,
        entryPrice: idea?.entryPrice,
        target1: idea?.target1,
        stopLoss: idea?.stopLoss,
        userName: idea?.userName,
        riskLevel: idea?.riskLevel,
        timeframe: idea?.timeframe,
        target1Percent,
      },
      ogImage: `/share/${id}/opengraph-image`,
    });
  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
        hasAdminCredentials: {
          hasServiceAccountKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
          hasClientEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          hasPrivateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY?.substring(0, 20),
          hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        },
      },
      { status: 500 }
    );
  }
}
