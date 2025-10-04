import React from 'react';

interface TrendingIconProps {
  size?: number;
  className?: string;
  color?: string;
}

export function TrendingIcon({
  size = 64,
  className = '',
  color = '#ff8c42'
}: TrendingIconProps) {
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

        {/* Trending up arrow/line */}
        <path
          d="M 20 38 L 26 32 L 32 36 L 38 28 L 44 22"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Arrow head */}
        <path
          d="M 39 22 L 44 22 L 44 27"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}
