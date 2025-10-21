import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAdminDb } from '@/lib/firebaseAdmin';
import SharePageClient from './SharePageClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Generate dynamic metadata for social media previews
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const adminDb = getAdminDb();
    const ideaDoc = await adminDb.collection('tradingIdeas').doc(id).get();

    if (!ideaDoc.exists) {
      return {
        title: 'Idea Not Found - TradeIdea',
        description: 'This trading idea does not exist or has been removed.',
      };
    }

    const idea = ideaDoc.data();
    const target1Percent = idea.entryPrice
      ? (((idea.target1 - idea.entryPrice) / idea.entryPrice) * 100).toFixed(1)
      : 0;

    const title = `${idea.symbol} - Investment Idea by ${idea.userName || 'TradeIdea User'}`;
    const description = `🎯 ${idea.symbol} Trading Setup: Entry ₹${idea.entryPrice} | Target ₹${idea.target1} (+${target1Percent}%) | Stop Loss ₹${idea.stopLoss}. ${idea.riskLevel} risk, ${idea.timeframe} timeframe. Join TradeIdea to track this idea!`;

    // Create a shorter description for Twitter
    const twitterDescription = `🎯 ${idea.symbol}: Entry ₹${idea.entryPrice} → Target ₹${idea.target1} (+${target1Percent}%). ${idea.riskLevel} risk. Join TradeIdea for more ideas!`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://tradeidea.co.in/share/${id}`,
        siteName: 'TradeIdea',
        images: [
          {
            url: '/opengraph-image',
            width: 1200,
            height: 630,
            alt: `TradeIdea - ${idea.symbol} Investment Idea`,
          },
        ],
        locale: 'en_IN',
        type: 'article',
        countryName: 'India',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: twitterDescription,
        images: ['/twitter-image'],
        creator: '@tradeidea_in',
      },
      other: {
        'article:author': idea?.userName || 'TradeIdea User',
        'article:published_time': idea?.createdAt?._seconds ? new Date(idea.createdAt._seconds * 1000).toISOString() : new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Investment Ideas - TradeIdea',
      description: 'Discover investment ideas and trade setups on TradeIdea',
    };
  }
}

export default async function PublicIdeaSharePage({ params }: PageProps) {
  const { id } = await params;

  try {
    // Fetch idea data using Admin SDK
    const adminDb = getAdminDb();
    const ideaDoc = await adminDb.collection('tradingIdeas').doc(id).get();

    if (!ideaDoc.exists) {
      notFound();
    }

    const ideaData = ideaDoc.data();
    const idea = {
      id: ideaDoc.id,
      ...ideaData,
      // Convert Firestore Timestamp to serializable format
      createdAt: ideaData?.createdAt?._seconds ? {
        toDate: () => new Date(ideaData.createdAt._seconds * 1000)
      } : null,
    };

    // Fetch comments using Admin SDK
    const commentsSnapshot = await adminDb
      .collection('comments')
      .where('ideaId', '==', id)
      .orderBy('createdAt', 'desc')
      .get();

    const comments = commentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamp to serializable format
        createdAt: data?.createdAt?._seconds ? {
          toDate: () => new Date(data.createdAt._seconds * 1000)
        } : null,
      };
    });

    return <SharePageClient idea={idea} comments={comments} />;
  } catch (error) {
    console.error('Error fetching idea:', error);
    notFound();
  }
}
