import { ImageResponse } from 'next/og';

// Multiple icon sizes
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ff8c42',
          borderRadius: '6px',
        }}
      >
        {/* Shield */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 32 10 L 50 17 L 50 32 Q 50 45, 32 54 Q 14 45, 14 32 L 14 17 Z"
            fill="white"
          />
          {/* Chart bars */}
          <rect x="20" y="33" width="4" height="13" fill="#ff8c42" rx="1" />
          <rect x="26" y="28" width="4" height="18" fill="#ff9a58" rx="1" />
          <rect x="32" y="23" width="4" height="23" fill="#ffa066" rx="1" />
          <rect x="38" y="18" width="4" height="28" fill="#ffb080" rx="1" />
          {/* Community dots */}
          <circle cx="28" cy="17" r="1.5" fill="#ff8c42" />
          <circle cx="32" cy="15" r="1.5" fill="#ff8c42" />
          <circle cx="36" cy="17" r="1.5" fill="#ff8c42" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
