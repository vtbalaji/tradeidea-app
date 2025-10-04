import React from 'react';

interface ChartIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const ChartIcon: React.FC<ChartIconProps> = ({
  size = 64,
  color = '#ff8c42',
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Dark circle background */}
      <circle cx="32" cy="32" r="32" fill="#1c2128" />

      {/* Bar chart bars */}
      {/* Bar 1 - shortest */}
      <rect
        x="18"
        y="36"
        width="6"
        height="10"
        rx="1"
        fill={color}
      />

      {/* Bar 2 - medium */}
      <rect
        x="26"
        y="28"
        width="6"
        height="18"
        rx="1"
        fill={color}
      />

      {/* Bar 3 - tallest */}
      <rect
        x="34"
        y="20"
        width="6"
        height="26"
        rx="1"
        fill={color}
      />

      {/* Bar 4 - medium-short */}
      <rect
        x="42"
        y="32"
        width="6"
        height="14"
        rx="1"
        fill={color}
      />
    </svg>
  );
};

export default ChartIcon;
