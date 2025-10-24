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
    const description = `${idea.symbol} Trading Setup: Entry ₹${idea.entryPrice} | Target ₹${idea.target1} (+${target1Percent}%) | Stop Loss ₹${idea.stopLoss}. ${idea.riskLevel} risk, ${idea.timeframe} timeframe.`;

    // Create a shorter description for Twitter/WhatsApp
    const shortDescription = `${idea.symbol}: Entry ₹${idea.entryPrice} → Target ₹${idea.target1} (+${target1Percent}%). ${idea.riskLevel} risk.`;

    // Use logo as fallback OG image (you can create a dedicated og-image.png later)
    const imageUrl = `https://tradeidea.co.in/logo.png`;
    const shareUrl = `https://tradeidea.co.in/share/${id}`;

    return {
      title,
      description,
      metadataBase: new URL('https://tradeidea.co.in'),
      openGraph: {
        title,
        description: shortDescription,
        url: shareUrl,
        siteName: 'TradeIdea',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: `${idea.symbol} Investment Idea`,
            type: 'image/png',
          },
        ],
        locale: 'en_IN',
        type: 'article',
        countryName: 'India',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: shortDescription,
        images: [imageUrl],
        creator: '@tradeidea_in',
      },
      other: {
        // Additional meta tags for better WhatsApp/social compatibility
        'og:image': imageUrl,
        'og:image:width': '1200',
        'og:image:height': '630',
        'og:image:alt': `${idea.symbol} Investment Idea`,
        'article:author': idea?.userName || 'TradeIdea User',
        'article:published_time': idea?.createdAt?._seconds
          ? new Date(idea.createdAt._seconds * 1000).toISOString()
          : new Date().toISOString(),
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
      console.log(`[Share Page] Idea not found: ${id}`);
      notFound();
    }

    const ideaData = ideaDoc.data();
    const idea = {
      id: ideaDoc.id,
      ...ideaData,
      // Convert Firestore Timestamp to ISO string (serializable)
      createdAt: ideaData?.createdAt?._seconds
        ? new Date(ideaData.createdAt._seconds * 1000).toISOString()
        : null,
      updatedAt: ideaData?.updatedAt?._seconds
        ? new Date(ideaData.updatedAt._seconds * 1000).toISOString()
        : null,
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
        // Convert Firestore Timestamp to ISO string (serializable)
        createdAt: data?.createdAt?._seconds
          ? new Date(data.createdAt._seconds * 1000).toISOString()
          : null,
      };
    });

    console.log(`[Share Page] Successfully loaded idea: ${idea.symbol} with ${comments.length} comments`);
    return <SharePageClient idea={idea} comments={comments} />;
  } catch (error: any) {
    console.error('[Share Page] Error fetching idea:', {
      ideaId: id,
      error: error.message,
      stack: error.stack,
      name: error.name,
    });

    // Check if it's a Firebase Admin credentials error
    if (error.message?.includes('Firebase Admin credentials')) {
      console.error('[Share Page] CRITICAL: Firebase Admin SDK not configured. Please set environment variables on your hosting platform.');
    }

    notFound();
  }
}
