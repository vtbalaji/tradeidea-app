import { ImageResponse } from 'next/og';

// Image metadata
export const alt = 'TradeIdea - Smart Portfolio Management';
export const size = {
  width: 1200,
  height: 600,
};

export const contentType = 'image/png';

// Image generation
export default async function Image() {
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
          flexDirection: 'column',
          padding: '60px',
        }}
      >
        {/* Logo Shield */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '30px',
          }}
        >
          <svg
            width="150"
            height="150"
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
            <circle cx="28" cy="17" r="1.5" fill="#ff8c42" />
            <circle cx="32" cy="15" r="1.5" fill="#ff8c42" />
            <circle cx="36" cy="17" r="1.5" fill="#ff8c42" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: 64,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '15px',
            textAlign: 'center',
          }}
        >
          TradeIdea
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            color: 'rgba(255, 255, 255, 0.95)',
            textAlign: 'center',
            maxWidth: '800px',
          }}
        >
          Smart Portfolio Management • Community Investment
        </div>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            fontSize: 20,
            color: 'rgba(255, 255, 255, 0.85)',
            marginTop: '25px',
            gap: '30px',
          }}
        >
          <span>📊 Analysis</span>
          <span>🔔 Alerts</span>
          <span>📈 Tracking</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
