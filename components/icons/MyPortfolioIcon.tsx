import React from 'react';

interface MyPortfolioIconProps {
  size?: number;
  className?: string;
  color?: string;
}

export function MyPortfolioIcon({
  size = 64,
  className = '',
  color = '#ff8c42'
}: MyPortfolioIconProps) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Dark circle background */}
        <circle
          cx="32"
          cy="32"
          r="30"
          fill="#1c2128"
          stroke="#30363d"
          strokeWidth="1"
        />

        {/* Portfolio/Briefcase icon */}
        <rect
          x="18"
          y="26"
          width="28"
          height="18"
          rx="2"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Handle on top */}
        <path
          d="M 26 26 L 26 22 C 26 20.5 27 20 28 20 L 36 20 C 37 20 38 20.5 38 22 L 38 26"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Lock/clasp in middle */}
        <rect
          x="30"
          y="32"
          width="4"
          height="4"
          rx="1"
          fill={color}
        />
      </svg>
    </div>
  );
}
