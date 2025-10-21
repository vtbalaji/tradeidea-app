import { Metadata } from 'next';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import SharePageClient from './SharePageClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Generate dynamic metadata for social media previews
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const ideaRef = doc(db, 'tradingIdeas', id);
    const ideaDoc = await getDoc(ideaRef);

    if (!ideaDoc.exists()) {
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
        'article:author': idea.userName || 'TradeIdea User',
        'article:published_time': idea.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
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
    // Fetch idea data
    const ideaRef = doc(db, 'tradingIdeas', id);
    const ideaDoc = await getDoc(ideaRef);

    if (!ideaDoc.exists()) {
      notFound();
    }

    const idea = {
      id: ideaDoc.id,
      ...ideaDoc.data()
    };

    // Fetch comments
    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef,
      where('ideaId', '==', id),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return <SharePageClient idea={idea} comments={comments} />;
  } catch (error) {
    console.error('Error fetching idea:', error);
    notFound();
  }
}
