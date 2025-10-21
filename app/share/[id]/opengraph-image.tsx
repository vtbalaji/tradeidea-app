import { ImageResponse } from 'next/og';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Image metadata
export const alt = 'TradeIdea - Investment Idea';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    // Fetch idea data
    const ideaRef = doc(db, 'tradingIdeas', id);
    const ideaDoc = await getDoc(ideaRef);

    if (!ideaDoc.exists()) {
      // Return a default image if idea not found
      return new ImageResponse(
        (
          <div
            style={{
              fontSize: 60,
              background: 'linear-gradient(135deg, #ff8c42 0%, #ff9a58 100%)',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ color: 'white', fontWeight: 'bold' }}>TradeIdea</div>
          </div>
        ),
        { ...size }
      );
    }

    const idea = ideaDoc.data();
    const target1Percent = idea.entryPrice
      ? (((idea.target1 - idea.entryPrice) / idea.entryPrice) * 100).toFixed(1)
      : 0;

    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #1a1d23 0%, #0f1419 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '60px',
            position: 'relative',
          }}
        >
          {/* Header with Logo and Brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '40px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {/* Logo */}
              <svg
                width="60"
                height="60"
                viewBox="0 0 64 64"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="32" cy="32" r="32" fill="white" />
                <path
                  d="M 32 10 L 50 17 L 50 32 Q 50 45, 32 54 Q 14 45, 14 32 L 14 17 Z"
                  fill="#ff8c42"
                />
                <rect x="20" y="33" width="4" height="13" fill="white" rx="1" />
                <rect x="26" y="28" width="4" height="18" fill="white" rx="1" />
                <rect x="32" y="23" width="4" height="23" fill="white" rx="1" />
                <rect x="38" y="18" width="4" height="28" fill="white" rx="1" />
              </svg>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 'bold',
                    color: 'white',
                  }}
                >
                  TradeIdea
                </div>
                <div
                  style={{
                    fontSize: 18,
                    color: '#8b949e',
                  }}
                >
                  Investment Ideas Hub
                </div>
              </div>
            </div>

            {/* Badge */}
            <div
              style={{
                display: 'flex',
                padding: '8px 16px',
                background: 'rgba(255, 140, 66, 0.2)',
                borderRadius: '8px',
                color: '#ff8c42',
                fontSize: 18,
                fontWeight: 'bold',
              }}
            >
              {idea.riskLevel} RISK
            </div>
          </div>

          {/* Main Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
            }}
          >
            {/* Symbol */}
            <div
              style={{
                fontSize: 80,
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '20px',
              }}
            >
              {idea.symbol}
            </div>

            {/* Trade Details */}
            <div
              style={{
                display: 'flex',
                gap: '40px',
                marginBottom: '30px',
              }}
            >
              {/* Entry */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 20, color: '#8b949e', marginBottom: '8px' }}>
                  Entry Price
                </div>
                <div style={{ fontSize: 48, fontWeight: 'bold', color: '#3b82f6' }}>
                  ₹{idea.entryPrice}
                </div>
              </div>

              {/* Target */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 20, color: '#8b949e', marginBottom: '8px' }}>
                  Target
                </div>
                <div style={{ fontSize: 48, fontWeight: 'bold', color: '#10b981' }}>
                  ₹{idea.target1}
                </div>
                <div style={{ fontSize: 24, color: '#10b981' }}>
                  +{target1Percent}%
                </div>
              </div>

              {/* Stop Loss */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 20, color: '#8b949e', marginBottom: '8px' }}>
                  Stop Loss
                </div>
                <div style={{ fontSize: 48, fontWeight: 'bold', color: '#ef4444' }}>
                  ₹{idea.stopLoss}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', gap: '15px' }}>
              <div
                style={{
                  padding: '8px 16px',
                  background: 'rgba(139, 148, 158, 0.2)',
                  borderRadius: '20px',
                  color: '#8b949e',
                  fontSize: 18,
                }}
              >
                {idea.timeframe}
              </div>
              <div
                style={{
                  padding: '8px 16px',
                  background: 'rgba(139, 148, 158, 0.2)',
                  borderRadius: '20px',
                  color: '#8b949e',
                  fontSize: 18,
                }}
              >
                {idea.analysisType} Analysis
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '30px',
              paddingTop: '30px',
              borderTop: '2px solid #30363d',
            }}
          >
            <div
              style={{
                fontSize: 20,
                color: '#8b949e',
              }}
            >
              Shared by {idea.userName || 'TradeIdea User'}
            </div>
            <div
              style={{
                fontSize: 24,
                color: '#ff8c42',
                fontWeight: 'bold',
              }}
            >
              tradeidea.co.in
            </div>
          </div>
        </div>
      ),
      {
        ...size,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);

    // Return a fallback image on error
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 60,
            background: 'linear-gradient(135deg, #ff8c42 0%, #ff9a58 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ color: 'white', fontWeight: 'bold' }}>TradeIdea</div>
        </div>
      ),
      { ...size }
    );
  }
}
